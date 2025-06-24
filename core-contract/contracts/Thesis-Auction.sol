// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/// @title Thesis Auction 
/// @author rjay solamo
/// @notice This contract manages auctions for thesis NFTs with comprehensive security measures.
/// @dev Implements advanced security protections and emergency controls with gas optimizations.
interface IThesisNFT is IERC721 {
    function totalSupply() external view returns (uint256);
    function maxSupply() external view returns (uint256);
    function auctionStarted() external view returns (bool);
    function revealFile(uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function hasMinted(address user) external view returns (bool);
    function getMinter(uint256 tokenId) external view returns (address);
    function isEligibleForAuction(address user) external view returns (bool);
    function getMinterTokenCount(address user) external view returns (uint256);
    function getUploadedFileInfo(address uploader) external view returns (
        string memory ipfsHash,
        uint256 fileSize,
        address uploaderAddr,
        uint256 uploadTime,
        bool isValid,
        uint256 nftSupply,
        string memory ticker,
        string memory fileName,
        bool auctionEligible
    );
    function hasMintedTicker(address user, string memory ticker) external view returns (bool);
    function setAuctionWinner(uint256 tokenId, address winner) external;
    function getFullFileHash(uint256 tokenId) external view returns (string memory);
}

contract ThesisAuction is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using Address for address payable;

    // ============ SECURITY CONSTANTS ============
    uint256 public constant MAX_PLATFORM_FEE = 10; // Maximum 10% platform fee
    uint256 public constant MAX_BID_AMOUNT = 500000 ether; // Changed to 500,000 tCORE2
    uint256 public constant MIN_BID_INCREMENT = 0.01 ether;
    uint256 public constant AUCTION_DURATION = 7 days; // Fixed 7-day auction
    uint256 public constant MAX_AUCTIONS = 100;
    uint256 public constant EMERGENCY_WITHDRAWAL_DELAY = 24 hours;
    uint256 public constant BID_COOLDOWN = 30 seconds;
    uint256 public constant COMMIT_REVEAL_DELAY = 1 minutes;
    uint256 public constant CANCEL_DELAY = 5 minutes;
    uint256 public constant PLATFORM_FEE_AMOUNT = 0.02 ether; // 0.02 tCORE2 platform fee per bid
    
    // ============ STARTING BID CONSTANTS ============
    uint256 public constant MIN_STARTING_BID = 0.1 ether; // Minimum 0.1 tCORE2 starting bid
    uint256 public constant MAX_STARTING_BID = 2000 ether; // Maximum 2,000 tCORE2 starting bid

    // ============ SECURITY: EMERGENCY CONTROLS ============
    uint256 public constant TIMELOCK_DELAY = 24 hours;
    mapping(bytes32 => uint256) public timelockExecutionTime;

    // ============ STATE VARIABLES ============
    IThesisNFT public thesisNFT;
    address payable public platformWallet;
    address public nftOwner;
    uint256 public platformFeePercent; // No percentage platform fees
    uint256 public maxBidAmount;
    address public auctionContract;
    uint256 public bidIncrement;
    uint256 public auctionPrice;
    uint256 public auctionCount;
    bool public emergencyMode;

    // ============ ESCROW AND STARTING BID VARIABLES ============
    mapping(uint256 => uint256) public startingBids; // Token ID => Starting bid amount
    mapping(uint256 => address) public fileOwners; // Token ID => File uploader/owner
    mapping(uint256 => bool) public escrowReleased; // Token ID => Whether escrow is released
    mapping(uint256 => bool) public fileAccessGranted; // Token ID => Whether winner got file access

    // ============ SECURITY: EMERGENCY CONTROLS ============
    uint256 public emergencyWithdrawalRequestTime;
    address public emergencyWithdrawalRequestor;

    // ============ STRUCTS ============
    struct Bid {
        address bidder;
        uint256 amount;
        uint64 timestamp;
        bool isActive;
    }

    struct OptimizedAuctionInfo {
        uint96 highestBid;
        uint64 endTime;
        uint64 startTime;
        address highestBidder;
        bool claimed;
        bool active;
    }

    struct AuctionInfo {
        uint256 endTime;
        uint256 highestBid;
        address highestBidder;
        bool claimed;
        bool active;
        uint256 lastModified;
        uint256 startTime;
        bool isCancelled;
        address minter; // NFT minter address
        bool notificationSent; // Track if notification was sent
        string ticker; // Store the ticker for this auction
    }

    // ============ MAPPINGS ============
    mapping(uint256 => bool) public isAuctioned;
    mapping(uint256 => bool) public isSold;
    mapping(uint256 => address) public tokenWinners;
    mapping(uint256 => AuctionInfo) public auctionInfo;
    mapping(uint256 => Bid[]) private _bidHistory;
    mapping(uint256 => mapping(address => uint256)) public userBidTotals;
    mapping(address => uint256) public withdrawable;
    mapping(address => bool) public blacklistedAddresses;
    mapping(address => uint256) public lastBidTime;
    mapping(bytes32 => bool) public committedBids;
    mapping(bytes32 => uint256) public commitTimestamps;
    mapping(address => bool) public notifiedMinters; // Track notified minters
    mapping(bytes32 => mapping(address => bool)) public confirmations;
    uint256 public requiredConfirmations;

    // ============ EVENTS ============
    event AuctionStarted(uint256 tokenId, uint256 price, uint256 duration, address minter);
    event AuctionEnded(uint256 tokenId, address winner, uint256 amount);
    event Claimed(address claimer, uint256 tokenId);
    event PlatformFeeUpdated(uint256 newFeePercent);
    event PlatformFeeCollected(uint256 tokenId, address bidder, uint256 feeAmount);
    event AuctionCancelled(uint256 tokenId, address cancelledBy);
    event EmergencyWithdrawal(address owner, uint256 amount);
    event RefundIssued(address bidder, uint256 amount);
    event BidPlaced(uint256 tokenId, address bidder, uint256 amount);
    event RefundWithdrawn(address user, uint256 amount);
    event RevealFileFailed(uint256 tokenId);
    event NFTReclaimed(uint256 tokenId);
    event EmergencyModeActivated(address indexed by);
    event EmergencyModeDeactivated(address indexed by);
    event AddressBlacklisted(address indexed user);
    event AddressUnblacklisted(address indexed user);
    event BidCommitted(bytes32 indexed commitHash, address indexed bidder, uint256 tokenId);
    event BidRevealed(address indexed bidder, uint256 tokenId, uint256 amount);
    event RateLimitExceeded(address indexed user);
    event MinterNotified(address indexed minter, uint256 tokenId, string message);
    event AuctionEligibilityChecked(address indexed bidder, bool eligible);
    event StartingBidSet(uint256 indexed tokenId, uint256 startingBid, address fileOwner);
    event EscrowReleased(uint256 indexed tokenId, address indexed fileOwner, uint256 amount);
    event FileAccessGranted(uint256 indexed tokenId, address indexed winner, string fullFileHash);
    event GovernanceContractSet(address indexed governance);
    event SecurityParametersUpdated(
        uint256 newBidIncrement,
        uint256 newMaxBidAmount,
        address indexed updatedBy
    );
    event BidIncrementUpdated(uint256 newIncrement);
    event PlatformWalletUpdated(address indexed newWallet);

    // ============ MODIFIERS ============
    modifier whenNotEmergency() {
        require(!emergencyMode, "Contract is in emergency mode");
        _;
    }

    modifier onlyAfterDelay(uint256 delay) {
        require(block.timestamp >= emergencyWithdrawalRequestTime + delay, "Delay not met");
        _;
    }

    modifier onlyMinter(uint256 tokenId) {
        require(msg.sender == auctionInfo[tokenId].minter, "Only NFT minter can auction");
        _;
    }

    modifier auctionExists(uint256 tokenId) {
        require(isAuctioned[tokenId], "NFT not auctioned");
        _;
    }

    modifier onlyAfterCancelDelay(uint256 tokenId) {
        require(block.timestamp > auctionInfo[tokenId].lastModified + CANCEL_DELAY, "Must wait");
        _;
    }

    modifier notBlacklisted(address user) {
        require(!blacklistedAddresses[user], "Address is blacklisted");
        _;
    }

    modifier onlyEligibleMinter() {
        require(thesisNFT.isEligibleForAuction(msg.sender), "Only eligible minters can participate");
        _;
    }

    modifier onlyEligibleMinterWithTicker(uint256 tokenId) {
        require(thesisNFT.isEligibleForAuction(msg.sender), "Only eligible minters can participate");
        
        // Get the ticker for this auction
        string memory auctionTicker = auctionInfo[tokenId].ticker;
        require(bytes(auctionTicker).length > 0, "Auction ticker not set");
        
        // Check if user has minted this specific ticker
        require(thesisNFT.hasMintedTicker(msg.sender, auctionTicker), "Must have minted this ticker to participate");
        _;
    }

    modifier onlyFileOwner(uint256 tokenId) {
        require(fileOwners[tokenId] == msg.sender, "Only file owner can perform this action");
        _;
    }

    modifier rateLimited() {
        require(
            block.timestamp >= lastBidTime[msg.sender] + BID_COOLDOWN, 
            "Rate limit: wait before next bid"
        );
        _;
    }

    modifier validCommit(bytes32 commitHash) {
        require(committedBids[commitHash], "Bid not committed");
        require(
            block.timestamp >= commitTimestamps[commitHash] + COMMIT_REVEAL_DELAY,
            "Commit reveal delay not met"
        );
        _;
    }

    modifier onlyGovernance {
        require(msg.sender == governanceContract, "Only governance");
        _;
    }

    // ============ CONSTRUCTOR ============
    function initialize(address thesisNFTAddress, uint256 initialPrice, address _nftOwner, address payable _platformWallet) public initializer {
        __Ownable_init(_nftOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        require(thesisNFTAddress != address(0), "Invalid NFT address");
        require(_nftOwner != address(0), "Invalid owner");
        require(_platformWallet != address(0), "Invalid wallet");
        require(initialPrice > 0, "Initial price must be positive");
        thesisNFT = IThesisNFT(thesisNFTAddress);
        auctionPrice = initialPrice;
        nftOwner = _nftOwner;
        platformWallet = _platformWallet;
        bidIncrement = MIN_BID_INCREMENT;
        platformFeePercent = 0;
        maxBidAmount = MAX_BID_AMOUNT;
        requiredConfirmations = 2;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ SECURITY: EMERGENCY FUNCTIONS ============
    
    /// @dev Activate emergency mode - only owner
    function activateEmergencyMode() external onlyOwner {
        emergencyMode = true;
        emit EmergencyModeActivated(msg.sender);
    }

    /// @dev Deactivate emergency mode - only owner
    function deactivateEmergencyMode() external onlyOwner {
        emergencyMode = false;
        emit EmergencyModeDeactivated(msg.sender);
    }

    /// @dev Request emergency withdrawal with delay
    function requestEmergencyWithdrawal() external onlyOwner {
        emergencyWithdrawalRequestTime = block.timestamp;
        emergencyWithdrawalRequestor = msg.sender;
    }

    /// @dev Execute emergency withdrawal after delay
    function executeEmergencyWithdrawal() external onlyGovernance onlyAfterDelay(EMERGENCY_WITHDRAWAL_DELAY) {
        require(emergencyWithdrawalRequestor != address(0), "No requestor");
        require(emergencyMode, "Not in emergency mode");
        uint256 amount = withdrawable[platformWallet];
        require(amount > 0, "No funds to withdraw");
        withdrawable[platformWallet] = 0;
        emergencyWithdrawalRequestTime = 0;
        emergencyWithdrawalRequestor = address(0);
        (bool sent, ) = payable(governanceContract).call{value: amount}("");
        require(sent, "Emergency withdrawal failed");
        emit EmergencyWithdrawal(msg.sender, amount);
    }

    // ============ ADMIN FUNCTIONS ============
    
    /// @dev Pause contract
    function pause() external onlyOwner {
        _pause();
    }

    /// @dev Unpause contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @dev Set platform fee with validation (kept for compatibility but set to 0)
    function setPlatformFeePercent(uint256 newFee) external onlyOwner whenNotPaused {
        require(newFee <= MAX_PLATFORM_FEE, "Fee too high");
        platformFeePercent = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    /// @dev Set maximum bid amount with validation
    function setMaxBidAmount(uint256 newMaxBid) external onlyOwner whenNotPaused {
        require(newMaxBid >= auctionPrice, "Invalid max bid");
        require(newMaxBid <= MAX_BID_AMOUNT, "Max bid too high");
        maxBidAmount = newMaxBid;
    }

    /// @dev Blacklist address for security
    function blacklistAddress(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        require(user != owner(), "Cannot blacklist owner");
        blacklistedAddresses[user] = true;
        emit AddressBlacklisted(user);
    }

    /// @dev Remove address from blacklist
    function unblacklistAddress(address user) external onlyOwner {
        blacklistedAddresses[user] = false;
        emit AddressUnblacklisted(user);
    }

    // ============ CORE AUCTION FUNCTIONS ============
    
    /// @dev Start auction automatically when NFT is minted - only minter can call
    function startAuction(uint256 tokenId) 
        external 
        whenNotPaused 
        whenNotEmergency 
    {
        require(!isAuctioned[tokenId], "Auction already started");
        require(thesisNFT.auctionStarted(), "Auction not ready");
        require(thesisNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(thesisNFT.hasMinted(msg.sender), "Only minters can auction");
        require(auctionCount < MAX_AUCTIONS, "Max auctions reached");

        // Gas optimization: Get minter address once
        address minter = thesisNFT.getMinter(tokenId);
        require(minter == msg.sender, "Only NFT minter can auction");

        // Get the ticker and file owner for this auction
        (
            , // ipfsHash
            , // fileSize
            address uploaderAddr,
            , // uploadTime
            , // isValid
            , // nftSupply
            string memory ticker,
            , // fileName
            // auctionEligible
        ) = thesisNFT.getUploadedFileInfo(minter);

        // Set file owner for escrow functionality
        fileOwners[tokenId] = uploaderAddr;

        // Transfer NFT to auction contract
        thesisNFT.safeTransferFrom(msg.sender, address(this), tokenId);

        isAuctioned[tokenId] = true;
        auctionCount++;

        // Gas optimization: Single storage operation
        auctionInfo[tokenId] = AuctionInfo({
            endTime: block.timestamp + AUCTION_DURATION,
            highestBid: 0,
            highestBidder: address(0),
            claimed: false,
            active: true,
            lastModified: block.timestamp,
            startTime: block.timestamp,
            isCancelled: false,
            minter: minter,
            notificationSent: false,
            ticker: ticker
        });

        emit AuctionStarted(tokenId, auctionPrice, AUCTION_DURATION, minter);
    }

    /// @dev Set starting bid for auction - only file owner can call
    function setStartingBid(uint256 tokenId, uint256 startingBid) 
        external 
        whenNotPaused 
        whenNotEmergency 
        auctionExists(tokenId)
        onlyFileOwner(tokenId)
    {
        require(startingBid >= MIN_STARTING_BID, "Starting bid too low");
        require(startingBid <= MAX_STARTING_BID, "Starting bid too high");
        require(auctionInfo[tokenId].highestBid == 0, "Auction already has bids");
        
        startingBids[tokenId] = startingBid;
        emit StartingBidSet(tokenId, startingBid, msg.sender);
    }

    /// @dev Place bid with comprehensive security checks and gas optimization - ONLY ELIGIBLE MINTERS WITH CORRECT TICKER
    function placeBid(uint256 tokenId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        whenNotEmergency 
        auctionExists(tokenId) 
        notBlacklisted(msg.sender) 
        onlyEligibleMinterWithTicker(tokenId)
    {
        // Double-check eligibility
        require(thesisNFT.isEligibleForAuction(msg.sender), "Only eligible minters can bid");
        emit AuctionEligibilityChecked(msg.sender, true);
        
        AuctionInfo storage auction = auctionInfo[tokenId];
        require(auction.active, "Auction is not active");
        require(!auction.isCancelled, "Auction was cancelled");
        require(block.timestamp < auction.endTime, "Auction has ended");
        require(msg.value > PLATFORM_FEE_AMOUNT, "Bid must be greater than platform fee");
        
        // Calculate minimum bid
        uint256 customStartingBid = startingBids[tokenId];
        uint256 minBid = auction.highestBid == 0 ? 
            (customStartingBid > 0 ? customStartingBid : MIN_STARTING_BID) : 
            auction.highestBid + bidIncrement;
        require(msg.value - PLATFORM_FEE_AMOUNT >= minBid, "Bid too low");
        require(msg.value - PLATFORM_FEE_AMOUNT <= maxBidAmount, "Bid too high");

        // Collect platform fee
        platformWallet.transfer(PLATFORM_FEE_AMOUNT);
        emit PlatformFeeCollected(tokenId, msg.sender, PLATFORM_FEE_AMOUNT);

        // Refund previous highest bidder if exists
        address previousBidder = auction.highestBidder;
        uint256 previousBid = auction.highestBid;
        if (previousBidder != address(0)) {
            withdrawable[previousBidder] += previousBid;
            emit RefundIssued(previousBidder, previousBid);
        }

        // Update auction state
        auction.highestBid = msg.value - PLATFORM_FEE_AMOUNT;
        auction.highestBidder = msg.sender;
        auction.lastModified = block.timestamp;

        // Update bid tracking
        userBidTotals[tokenId][msg.sender] += msg.value - PLATFORM_FEE_AMOUNT;
        _bidHistory[tokenId].push(Bid({
            bidder: msg.sender,
            amount: msg.value - PLATFORM_FEE_AMOUNT,
            timestamp: uint64(block.timestamp),
            isActive: true
        }));

        emit BidPlaced(tokenId, msg.sender, msg.value - PLATFORM_FEE_AMOUNT);
    }

    /// @dev Commit bid hash for commit-reveal scheme - ONLY ELIGIBLE MINTERS WITH CORRECT TICKER
    function commitBid(uint256 tokenId, bytes32 commitHash) 
        external 
        whenNotPaused 
        whenNotEmergency 
        auctionExists(tokenId) 
        notBlacklisted(msg.sender) 
        onlyEligibleMinterWithTicker(tokenId)
    {
        require(!committedBids[commitHash], "Bid already committed");
        require(commitHash != bytes32(0), "Invalid commit hash");
        
        committedBids[commitHash] = true;
        commitTimestamps[commitHash] = block.timestamp;
        
        emit BidCommitted(commitHash, msg.sender, tokenId);
    }

    /// @dev Reveal committed bid with gas optimization - ONLY ELIGIBLE MINTERS WITH CORRECT TICKER
    function revealBid(
        uint256 tokenId, 
        uint256 bidAmount, 
        bytes32 nonce, 
        bytes32 commitHash
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        whenNotEmergency 
        auctionExists(tokenId) 
        notBlacklisted(msg.sender) 
        onlyEligibleMinterWithTicker(tokenId)
        validCommit(commitHash) 
    {
        // Verify commit hash first
        bytes32 expectedHash = keccak256(abi.encodePacked(msg.sender, tokenId, bidAmount, nonce));
        require(commitHash == expectedHash, "Invalid commit hash");
        require(msg.value == bidAmount + PLATFORM_FEE_AMOUNT, "Incorrect ETH sent for bid and platform fee");
        
        AuctionInfo storage auction = auctionInfo[tokenId];
        require(auction.active, "Auction is not active");
        require(!auction.isCancelled, "Auction was cancelled");
        require(block.timestamp < auction.endTime, "Auction has ended");
        
        // Calculate minimum bid
        uint256 customStartingBid = startingBids[tokenId];
        uint256 minBid = auction.highestBid == 0 ? 
            (customStartingBid > 0 ? customStartingBid : MIN_STARTING_BID) : 
            auction.highestBid + bidIncrement;
        require(bidAmount >= minBid, "Bid too low");
        require(bidAmount <= maxBidAmount, "Bid too high");

        // Collect platform fee
        platformWallet.transfer(PLATFORM_FEE_AMOUNT);
        emit PlatformFeeCollected(tokenId, msg.sender, PLATFORM_FEE_AMOUNT);

        // Clear commit
        delete committedBids[commitHash];
        delete commitTimestamps[commitHash];

        // Refund previous highest bidder if exists
        address previousBidder = auction.highestBidder;
        uint256 previousBid = auction.highestBid;
        if (previousBidder != address(0)) {
            withdrawable[previousBidder] += previousBid;
            emit RefundIssued(previousBidder, previousBid);
        }

        // Update auction state
        auction.highestBid = bidAmount;
        auction.highestBidder = msg.sender;
        auction.lastModified = block.timestamp;

        // Update bid tracking
        userBidTotals[tokenId][msg.sender] += bidAmount;
        _bidHistory[tokenId].push(Bid({
            bidder: msg.sender,
            amount: bidAmount,
            timestamp: uint64(block.timestamp),
            isActive: true
        }));

        emit BidRevealed(msg.sender, tokenId, bidAmount);
    }

    /// @dev End auction with validation
    function endAuction(uint256 tokenId) 
        external 
        whenNotPaused 
        auctionExists(tokenId) 
    {
        require(msg.sender == owner() || msg.sender == auctionInfo[tokenId].minter, "Unauthorized");
        
        AuctionInfo storage auction = auctionInfo[tokenId];
        require(auction.active, "Auction inactive");
        require(block.timestamp >= auction.endTime, "Auction not over");

        auction.active = false;
        isSold[tokenId] = true;
        
        // Set auction winner in NFT contract for full file access
        if (auction.highestBidder != address(0)) {
            thesisNFT.setAuctionWinner(tokenId, auction.highestBidder);
            tokenWinners[tokenId] = auction.highestBidder;
        }
        
        emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
    }

    /// @dev Claim NFT with comprehensive checks and gas optimization - funds held in escrow
    function claimNFT(uint256 tokenId) 
        external 
        nonReentrant 
        auctionExists(tokenId) 
        whenNotPaused 
        whenNotEmergency 
    {
        AuctionInfo storage auction = auctionInfo[tokenId];
        require(isSold[tokenId], "NFT not sold");
        require(!auction.claimed, "Already claimed");
        require(msg.sender == auction.highestBidder, "Not winner");
        require(thesisNFT.ownerOf(tokenId) == address(this), "NFT not owned");

        auction.claimed = true;

        // Funds are held in escrow - file owner must claim them separately
        // No immediate transfer to minter - escrow mechanism

        // Gas optimization: Try to reveal file with limited gas
        try thesisNFT.revealFile{gas: 100_000}(tokenId) {
        } catch {
            emit RevealFileFailed(tokenId);
        }

        // Transfer NFT to winner
        thesisNFT.safeTransferFrom(address(this), msg.sender, tokenId);

        // Automatically grant file access to winner
        fileAccessGranted[tokenId] = true;
        
        // Get the full file hash for the winner
        string memory fullFileHash = thesisNFT.getFullFileHash(tokenId);
        
        emit Claimed(msg.sender, tokenId);
        emit FileAccessGranted(tokenId, msg.sender, fullFileHash);
    }

    /// @dev Cancel auction with delay
    function cancelAuction(uint256 tokenId) 
        external 
        onlyOwner 
        auctionExists(tokenId) 
        onlyAfterCancelDelay(tokenId) 
        nonReentrant 
    {
        AuctionInfo storage auction = auctionInfo[tokenId];
        require(auction.active, "Not active");
        
        auction.active = false;
        auction.isCancelled = true;

        // Gas optimization: Refund highest bidder if exists
        if (auction.highestBidder != address(0)) {
            withdrawable[auction.highestBidder] += auction.highestBid;
            emit RefundIssued(auction.highestBidder, auction.highestBid);
        }

        emit AuctionCancelled(tokenId, msg.sender);
    }

    /// @dev Reclaim NFT by minter if auction fails
    function reclaimNFT(uint256 tokenId) 
        external 
        auctionExists(tokenId) 
        whenNotPaused 
    {
        require(msg.sender == auctionInfo[tokenId].minter, "Not NFT minter");
        
        AuctionInfo storage auction = auctionInfo[tokenId];
        require(!auction.active && !isSold[tokenId], "Cannot reclaim active or sold NFT");

        thesisNFT.safeTransferFrom(address(this), auction.minter, tokenId);
        isAuctioned[tokenId] = false;
        auctionCount--;
        
        emit NFTReclaimed(tokenId);
    }

    /// @dev Withdraw funds
    function withdrawFunds() external nonReentrant whenNotPaused {
        uint256 amount = withdrawable[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        
        withdrawable[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Refund failed");
        
        emit RefundWithdrawn(msg.sender, amount);
    }

    // ============ NOTIFICATION FUNCTIONS ============
    
    /// @dev Send notification to eligible minters when auction starts
    function notifyEligibleMinters(uint256 tokenId) external onlyOwner {
        require(isAuctioned[tokenId], "Auction not started");
        require(!notifiedMinters[msg.sender], "Already notified");
        
        string memory message = "Auction Started! You are eligible to participate and place your bid for full file access.";
        
        notifiedMinters[msg.sender] = true;
        emit MinterNotified(msg.sender, tokenId, message);
    }

    /// @dev Check if user is eligible for auction participation
    function checkAuctionEligibility(address user) external view returns (bool) {
        return thesisNFT.isEligibleForAuction(user);
    }

    /// @dev Get user's minted token count
    function getUserMintedTokenCount(address user) external view returns (uint256) {
        return thesisNFT.getMinterTokenCount(user);
    }

    /// @dev Get IPFS hash for auction winner - only accessible by winner
    function getWinnerIpfsHash(uint256 tokenId) external view returns (string memory) {
        require(isSold[tokenId], "Auction not completed");
        require(msg.sender == tokenWinners[tokenId], "Only auction winner can access IPFS hash");
        
        // Get the uploader from the auction info
        address minter = auctionInfo[tokenId].minter;
        
        // Get the IPFS hash from the Thesis-NFT contract
        (
            string memory ipfsHash,
            , // fileSize
            , // uploaderAddr
            , // uploadTime
            , // isValid
            , // nftSupply
            , // ticker
            , // fileName
            // auctionEligible
        ) = thesisNFT.getUploadedFileInfo(minter);
        
        return ipfsHash;
    }

    /// @dev Check if user is auction winner for a specific token
    function isAuctionWinner(address user, uint256 tokenId) external view returns (bool) {
        return isSold[tokenId] && tokenWinners[tokenId] == user;
    }

    // ============ NFT RECEIVING ============
    
    /// @dev Handle NFT receipt
    function onERC721Received(
        address /*operator*/,
        address from,
        uint256 tokenId,
        bytes calldata /*data*/
    ) external view returns (bytes4) {
        require(msg.sender == address(thesisNFT), "Unrecognized NFT");
        require(!isAuctioned[tokenId], "Already auctioned");
        require(thesisNFT.hasMinted(from), "Only minters can transfer to auction");
        return this.onERC721Received.selector;
    }

    // ============ VIEW FUNCTIONS ============
    
    /// @dev Get bid history
    function getBidHistory(uint256 tokenId) external view returns (Bid[] memory) {
        return _bidHistory[tokenId];
    }

    /// @dev Get bid history slice for pagination - gas optimized
    function getBidHistorySlice(uint256 tokenId, uint256 start, uint256 count) 
        external 
        view 
        returns (Bid[] memory) 
    {
        Bid[] storage history = _bidHistory[tokenId];
        require(start < history.length, "Invalid start");
        
        uint256 end = start + count > history.length ? history.length : start + count;
        Bid[] memory slice = new Bid[](end - start);
        
        // Gas optimization: Use unchecked for loop counter
        unchecked {
            for (uint256 i = start; i < end; i++) {
                slice[i - start] = history[i];
            }
        }
        return slice;
    }

    /// @dev Get auction info
    function getAuctionInfo(uint256 tokenId) external view returns (
        uint256 endTime,
        uint256 highestBid,
        address highestBidder,
        bool claimed,
        bool active,
        uint256 lastModified,
        uint256 startTime,
        bool isCancelled,
        address minter,
        bool notificationSent,
        string memory ticker
    ) {
        AuctionInfo storage auction = auctionInfo[tokenId];
        return (
            auction.endTime,
            auction.highestBid,
            auction.highestBidder,
            auction.claimed,
            auction.active,
            auction.lastModified,
            auction.startTime,
            auction.isCancelled,
            auction.minter,
            auction.notificationSent,
            auction.ticker
        );
    }

    /// @dev Get contract statistics
    function getContractStats() external view returns (
        uint256 totalAuctions,
        uint256 platformFeePercent_,
        uint256 maxBidAmount_,
        bool isEmergencyMode
    ) {
        return (
            auctionCount,
            platformFeePercent,
            maxBidAmount,
            emergencyMode
        );
    }

    /// @dev Get auction constants for transparency
    function getAuctionConstants() external pure returns (
        uint256 minStartingBid,
        uint256 maxStartingBid,
        uint256 maxBidAmount_,
        uint256 minBidIncrement,
        uint256 auctionDuration,
        uint256 platformFeeAmount
    ) {
        return (
            MIN_STARTING_BID,
            MAX_STARTING_BID,
            MAX_BID_AMOUNT,
            MIN_BID_INCREMENT,
            AUCTION_DURATION,
            PLATFORM_FEE_AMOUNT
        );
    }

    // ============ ESCROW AND FILE ACCESS FUNCTIONS ============
    
    /// @dev File owner can claim auction proceeds from escrow
    function claimAuctionProceeds(uint256 tokenId) 
        external 
        nonReentrant 
        whenNotPaused 
        whenNotEmergency
        auctionExists(tokenId)
        onlyFileOwner(tokenId)
    {
        require(isSold[tokenId], "Auction not completed");
        require(!escrowReleased[tokenId], "Escrow already released");
        
        AuctionInfo storage auction = auctionInfo[tokenId];
        require(auction.highestBid > 0, "No winning bid");
        
        uint256 proceeds = auction.highestBid;
        escrowReleased[tokenId] = true;
        
        // Transfer proceeds to file owner
        payable(msg.sender).sendValue(proceeds);
        
        emit EscrowReleased(tokenId, msg.sender, proceeds);
    }
    
    /// @dev Check if escrow is released for a token
    function isEscrowReleased(uint256 tokenId) external view returns (bool) {
        return escrowReleased[tokenId];
    }
    
    /// @dev Check if file access is granted for a token
    function isFileAccessGranted(uint256 tokenId) external view returns (bool) {
        return fileAccessGranted[tokenId];
    }
    
    /// @dev Get starting bid for a token
    function getStartingBid(uint256 tokenId) external view returns (uint256) {
        return startingBids[tokenId];
    }
    
    /// @dev Get file owner for a token
    function getFileOwner(uint256 tokenId) external view returns (address) {
        return fileOwners[tokenId];
    }

    // ============ SECURITY: RECEIVE FUNCTION ============
    
    /// @dev Reject direct ETH transfers
    receive() external payable {
        revert("Send ETH via bid only");
    }

    /// @dev Reject fallback calls
    fallback() external payable {
        revert("Invalid fallback call");
    }

    /// @dev Set auction contract address
    function setAuctionContract(address _auctionContract) external onlyOwner {
        require(_auctionContract != address(0), "Auction contract address cannot be zero");
        auctionContract = _auctionContract;
    }

    address public governanceContract;
    function setGovernanceContract(address _gov) external onlyOwner {
        require(_gov != address(0), "Invalid governance contract");
        governanceContract = _gov;
        emit GovernanceContractSet(_gov);
    }

    // Add new events for multi-sig operations
    event OperationProposed(bytes32 indexed operationHash, address indexed proposer, string operationType);
    event OperationConfirmed(bytes32 indexed operationHash, address indexed confirmer);
    event OperationExecuted(bytes32 indexed operationHash);

    // Add operation types enum
    enum OperationType {
        TransferOwnership,
        UpdatePlatformFee,
        UpdateBidIncrement,
        EmergencyAction,
        UpdatePlatformWallet
    }

    // Add operation struct
    struct Operation {
        OperationType operationType;
        address target;
        uint256 value;
        bool executed;
        uint256 numConfirmations;
        uint256 proposedTime;
    }

    // Add operations mapping
    mapping(bytes32 => Operation) public operations;
    mapping(bytes32 => mapping(address => bool)) public hasConfirmed;

    // Replace AuctionInfo with OptimizedAuctionInfo for new auctions
    mapping(uint256 => OptimizedAuctionInfo) public optimizedAuctionInfo;

    // Modify existing functions to use multi-sig
    function proposeOperation(
        OperationType operationType,
        address target,
        uint256 value
    ) external onlyOwner {
        bytes32 operationHash = keccak256(abi.encodePacked(operationType, target, value, block.timestamp));
        require(operations[operationHash].proposedTime == 0, "Operation already exists");
        
        operations[operationHash] = Operation({
            operationType: operationType,
            target: target,
            value: value,
            executed: false,
            numConfirmations: 1,
            proposedTime: block.timestamp
        });
        
        hasConfirmed[operationHash][msg.sender] = true;
        emit OperationProposed(operationHash, msg.sender, getOperationTypeString(operationType));
    }

    function confirmOperation(bytes32 operationHash) external onlyOwner {
        Operation storage operation = operations[operationHash];
        require(operation.proposedTime > 0, "Operation does not exist");
        require(!operation.executed, "Operation already executed");
        require(!hasConfirmed[operationHash][msg.sender], "Already confirmed");
        require(block.timestamp <= operation.proposedTime + TIMELOCK_DELAY, "Operation expired");

        operation.numConfirmations += 1;
        hasConfirmed[operationHash][msg.sender] = true;
        
        emit OperationConfirmed(operationHash, msg.sender);

        if (operation.numConfirmations >= requiredConfirmations) {
            executeOperation(operationHash);
        }
    }

    function executeOperation(bytes32 operationHash) internal {
        Operation storage operation = operations[operationHash];
        require(!operation.executed, "Already executed");
        require(operation.numConfirmations >= requiredConfirmations, "Not enough confirmations");

        operation.executed = true;

        if (operation.operationType == OperationType.TransferOwnership) {
            _transferOwnership(operation.target);
        } else if (operation.operationType == OperationType.UpdatePlatformFee) {
            _updatePlatformFee(operation.value);
        } else if (operation.operationType == OperationType.UpdateBidIncrement) {
            _updateBidIncrement(operation.value);
        } else if (operation.operationType == OperationType.EmergencyAction) {
            _handleEmergencyAction(operation.value == 1);
        } else if (operation.operationType == OperationType.UpdatePlatformWallet) {
            _updatePlatformWallet(payable(operation.target));
        }

        emit OperationExecuted(operationHash);
    }

    // Helper function to get operation type string
    function getOperationTypeString(OperationType operationType) internal pure returns (string memory) {
        if (operationType == OperationType.TransferOwnership) return "TransferOwnership";
        if (operationType == OperationType.UpdatePlatformFee) return "UpdatePlatformFee";
        if (operationType == OperationType.UpdateBidIncrement) return "UpdateBidIncrement";
        if (operationType == OperationType.EmergencyAction) return "EmergencyAction";
        if (operationType == OperationType.UpdatePlatformWallet) return "UpdatePlatformWallet";
        return "Unknown";
    }

    // Internal functions for operations
    function _updatePlatformFee(uint256 newFee) internal {
        require(newFee <= MAX_PLATFORM_FEE, "Fee too high");
        platformFeePercent = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    function _updateBidIncrement(uint256 newIncrement) internal {
        require(newIncrement >= MIN_BID_INCREMENT, "Increment too low");
        bidIncrement = newIncrement;
        emit BidIncrementUpdated(newIncrement);
    }

    function _handleEmergencyAction(bool activate) internal {
        if (activate) {
            emergencyMode = true;
            emit EmergencyModeActivated(msg.sender);
        } else {
            emergencyMode = false;
            emit EmergencyModeDeactivated(msg.sender);
        }
    }

    function _updatePlatformWallet(address payable newWallet) internal {
        require(newWallet != address(0), "Invalid wallet");
        platformWallet = newWallet;
        emit PlatformWalletUpdated(newWallet);
    }

    /// @notice Batch start auctions for multiple tokenIds (admin only)
    /// @param tokenIds Array of token IDs to start auctions for
    function batchStartAuction(uint256[] calldata tokenIds) external onlyOwner whenNotPaused whenNotEmergency {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (!isAuctioned[tokenIds[i]]) {
                // Only start if not already started
                this.startAuction(tokenIds[i]);
            }
        }
    }

    /// @notice Batch end auctions for multiple tokenIds (admin only)
    /// @param tokenIds Array of token IDs to end auctions for
    function batchEndAuction(uint256[] calldata tokenIds) external onlyOwner whenNotPaused {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (isAuctioned[tokenIds[i]]) {
                this.endAuction(tokenIds[i]);
            }
        }
    }

    /// @notice Get the total number of auctions
    function getTotalAuctions() external view returns (uint256) {
        return auctionCount;
    }

    /// @notice Get the number of active auctions
    function getActiveAuctionsCount() external view returns (uint256) {
        uint256 active = 0;
        for (uint256 i = 0; i < MAX_AUCTIONS; i++) {
            if (auctionInfo[i].active) {
                active++;
            }
        }
        return active;
    }

    /// @notice Get the number of completed auctions
    function getCompletedAuctionsCount() external view returns (uint256) {
        uint256 completed = 0;
        for (uint256 i = 0; i < MAX_AUCTIONS; i++) {
            if (isSold[i]) {
                completed++;
            }
        }
        return completed;
    }

    /// @notice Get the number of cancelled auctions
    function getCancelledAuctionsCount() external view returns (uint256) {
        uint256 cancelled = 0;
        for (uint256 i = 0; i < MAX_AUCTIONS; i++) {
            if (auctionInfo[i].isCancelled) {
                cancelled++;
            }
        }
        return cancelled;
    }

    // For large sets, use off-chain indexing for queries.
} 