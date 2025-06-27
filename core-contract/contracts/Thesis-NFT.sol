// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IAuctionManager } from "./AuctionManager.sol";
import { ThesisFileManager } from "./ThesisFileManager.sol";

/// @title Thesis NFT 
/// @author rjay solamo
/// @notice This contract manages the minting and distribution of thesis NFTs with enhanced security measures.
/// @dev Implements ERC721 standard with comprehensive security protections and gas optimizations.
interface IStaking {
    function getDiscountPercentage(address user) external view returns (uint256);
}

interface IGovernance {
    function emergencyMode() external view returns (bool);
}

contract ThesisNFT is Initializable, UUPSUpgradeable, ERC721Upgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using Address for address payable;
    using Strings for uint256;

    // ============ SECURITY CONSTANTS ============
    uint256 public constant MAX_SUPPLY = 5; // Maximum supply per thesis
    uint256 public constant MIN_SUPPLY = 1; // Minimum supply per thesis
    uint256 public constant MAX_MINT_PRICE = 3 ether; // Maximum 3 tCORE2
    uint256 public constant MIN_MINT_PRICE = 1 ether; // Minimum 1 tCORE2
    uint256 public constant PLATFORM_FEE_PERCENT = 20;
    uint256 public constant MAX_PLATFORM_FEE = 30; // Maximum 30% platform fee
    uint256 public constant EMERGENCY_WITHDRAWAL_DELAY = 24 hours;
    uint256 public constant MINT_COOLDOWN = 1 minutes;
    uint256 public constant SIGNATURE_VALIDITY_PERIOD = 1 hours;
    uint256 public constant UPLOAD_COOLDOWN = 5 minutes;
    uint256 public constant TIMELOCK_DELAY = 24 hours;

    // ============ STATE VARIABLES ============
    uint256 public maxSupply;
    uint256 public minSupply;
    uint256 public price;
    uint256 private _tokenIdCounter;
    IAuctionManager public auctionManager;
    IGovernance public governance;

    // ============ CONTRACT REFERENCES ============
    IStaking public stakingContract;
    address public auctionContract; // Add auction contract reference
    address public governanceContract;

    // ============ METADATA ============
    string private _baseTokenURI;
    ThesisFileManager public fileManager;

    // ============ MAPPINGS ============
    mapping(address => bool) private _hasMinted;
    mapping(uint256 => bool) private _revealedTokens;
    mapping(bytes32 => bool) public usedSignatures;
    mapping(uint256 => address) public tokenMinters; // Track who minted each token
    mapping(address => uint256) public minterTokenCount; // Track how many NFTs each minter has
    mapping(address => mapping(string => bool)) public userMintedTickers; // Track which tickers user has minted
    mapping(address => uint256) public userMintNonce;
    mapping(bytes32 => uint256) public timelockExecutionTime;
    mapping(uint256 => string) private _tokenURIs;

    // ============ EVENTS ============
    event Minted(address indexed to, uint256 amount, uint256 startTokenId);
    event FileRevealed(uint256 tokenId);
    event GovernanceContractSet(address indexed governance);
    event SecurityParametersUpdated(
        uint256 newMaxSupply,
        uint256 newPrice,
        address indexed updatedBy
    );
    event OperationProposed(bytes32 indexed operationHash, address indexed proposer, string operationType);
    event OperationConfirmed(bytes32 indexed operationHash, address indexed confirmer);
    event OperationExecuted(bytes32 indexed operationHash);

    // ============ Multi-signature Support ============
    uint256 public requiredConfirmations;

    // ============ CONSTRUCTOR ============
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 minSupply_,
        uint256 price_,
        address initialOwner,
        address stakingContractAddress,
        string memory baseTokenURI_,
        address auctionManager_,
        address governance_
    ) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        require(minSupply_ >= MIN_SUPPLY, "MIN_SUP");
        require(maxSupply_ <= MAX_SUPPLY, "MAX_SUP");
        require(minSupply_ <= maxSupply_, "MIN>MAX");
        require(stakingContractAddress != address(0), "INV_STAKE");
        require(initialOwner != address(0), "INV_OWNER");
        require(auctionManager_ != address(0), "NO_AUCTION_ADDR");
        require(governance_ != address(0), "NO_GOV_ADDR");
        maxSupply = maxSupply_;
        minSupply = minSupply_;
        price = price_;
        _tokenIdCounter = 0;
        auctionManager = IAuctionManager(auctionManager_);
        governance = IGovernance(governance_);
        _baseTokenURI = baseTokenURI_;
        stakingContract = IStaking(stakingContractAddress);
        requiredConfirmations = 2;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ CORE FUNCTIONS ============
    
    /// @dev Secure minting function with comprehensive checks and gas optimization
    function mint(address uploader, uint256 amount) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(amount == 1, "ONE_NFT");
        require(totalSupply() + amount <= maxSupply, "MAX_SUP");
        require(uploader != address(0), "INV_UPLOADER");
        
        uint256 uploaderMintPrice = fileManager.getMintPrice(uploader);
        require(uploaderMintPrice > 0, "NO_PRICE");
        ThesisFileManager.UploadedFile memory file = fileManager.getUploadedFile(uploader);
        require(file.isValid, "INV_FILE");

        // Check if user has already minted this specific ticker
        string memory ticker = file.ticker;
        require(!userMintedTickers[msg.sender][ticker], "ALREADY");

        // Gas optimization: Calculate all fees in one go
        uint256 effectivePrice = uploaderMintPrice;
        uint256 discountPercent = stakingContract.getDiscountPercentage(msg.sender);
        
        if (discountPercent > 0) {
            uint256 discount = (uploaderMintPrice * discountPercent) / 100;
            effectivePrice = uploaderMintPrice - discount;
        }

        uint256 platformFee = (effectivePrice * PLATFORM_FEE_PERCENT) / 100;
        
        require(msg.value >= platformFee, "NO_ETH");
        require(msg.value <= platformFee + 0.1 ether, "EXCESS_ETH"); // Prevent overpayment

        uint256 startTokenId = _tokenIdCounter;
        
        // Gas optimization: Single loop for minting
        for (uint256 i = 0; i < amount; i++) {
            _mint(msg.sender, _tokenIdCounter);
            tokenMinters[_tokenIdCounter] = msg.sender; // Record minter
            _tokenIdCounter++;
        }
        
        // Mark this ticker as minted by this user
        userMintedTickers[msg.sender][ticker] = true;
        minterTokenCount[msg.sender]++;
        emit Minted(msg.sender, amount, startTokenId);

        // Set eligibility in AuctionManager
        auctionManager.setEligible(msg.sender, true);

        // Refund excess ETH only if needed
        uint256 excess = msg.value - platformFee;
        if (excess > 0) {
            (bool sent, ) = payable(msg.sender).call{value: excess}("");
            require(sent, "REFUND");
        }

        // Check if uploader's selected supply is reached
        if (totalSupply() >= file.nftSupply) {
            auctionManager.startAuction(startTokenId);
        }
    }

    /// @dev Secure minting with signature verification and gas optimization
    function mintWithSignature(
        address uploader, 
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        whenNotEmergency 
    {
        require(amount == 1, "ONE_NFT");
        require(totalSupply() + amount <= maxSupply, "MAX_SUP");
        require(uploader != address(0), "INV_UPLOADER");
        require(nonce == userMintNonce[msg.sender], "INV_NONCE");
        
        // Gas optimization: Verify signature first to fail fast
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, uploader, amount, nonce));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        require(signer == owner(), "INV_SIG");
        
        // Check signature validity period
        require(block.timestamp <= nonce + SIGNATURE_VALIDITY_PERIOD, "SIG_EXP");
        
        // Check if signature already used
        bytes32 signatureHash = keccak256(signature);
        require(!usedSignatures[signatureHash], "SIG_USED");
        usedSignatures[signatureHash] = true;
        
        uint256 uploaderMintPrice = fileManager.getMintPrice(uploader);
        require(uploaderMintPrice > 0, "NO_PRICE");
        ThesisFileManager.UploadedFile memory file = fileManager.getUploadedFile(uploader);
        require(file.isValid, "INV_FILE");

        // Check if user has already minted this specific ticker
        string memory ticker = file.ticker;
        require(!userMintedTickers[msg.sender][ticker], "ALREADY");

        // Gas optimization: Calculate all fees in one go
        uint256 effectivePrice = uploaderMintPrice;
        uint256 discountPercent = stakingContract.getDiscountPercentage(msg.sender);
        
        if (discountPercent > 0) {
            uint256 discount = (uploaderMintPrice * discountPercent) / 100;
            effectivePrice = uploaderMintPrice - discount;
        }

        uint256 platformFee = (effectivePrice * PLATFORM_FEE_PERCENT) / 100;
        
        require(msg.value >= platformFee, "NO_ETH");
        require(msg.value <= platformFee + 0.1 ether, "EXCESS_ETH");

        uint256 startTokenId = _tokenIdCounter;
        
        // Gas optimization: Single loop for minting
        for (uint256 i = 0; i < amount; i++) {
            _mint(msg.sender, _tokenIdCounter);
            tokenMinters[_tokenIdCounter] = msg.sender; // Record minter
            _tokenIdCounter++;
        }
        
        // Mark this ticker as minted by this user
        userMintedTickers[msg.sender][ticker] = true;
        minterTokenCount[msg.sender]++; // Increment token count
        
        emit Minted(msg.sender, amount, startTokenId);

        // Gas optimization: Refund excess ETH only if needed
        uint256 excess = msg.value - platformFee;
        if (excess > 0) {
            (bool sent, ) = payable(msg.sender).call{value: excess}("");
            require(sent, "REFUND");
        }

        // Check if uploader's selected supply is reached
        if (totalSupply() >= file.nftSupply) {
            if (auctionContract != address(0)) {
                auctionManager.startAuction(startTokenId);
            }
        }

        userMintNonce[msg.sender]++;
    }

    // ============ ADMIN FUNCTIONS ============
    
    /// @dev Set auction contract address
    function setAuctionContract(address _auctionContract) external onlyOwner {
        require(_auctionContract != address(0), "NO_AUCTION_ADDR");
        auctionContract = _auctionContract;
    }
    
    /// @dev Set base URI with validation
    function setBaseURI(string memory baseURI) external onlyOwner {
        require(bytes(baseURI).length > 0, "EMPTY_URI");
        _baseTokenURI = baseURI;
    }

    /// @dev Set governance contract address
    function setGovernanceContract(address _gov) external onlyOwner {
        require(_gov != address(0), "INV_GOV");
        governanceContract = _gov;
        emit GovernanceContractSet(_gov);
    }

    function initiateOwnershipTransfer(address newOwner) external onlyOwner {
        bytes32 operationHash = keccak256(abi.encodePacked("TRANSFER_OWNERSHIP", newOwner));
        timelockExecutionTime[operationHash] = block.timestamp + TIMELOCK_DELAY;
    }

    /// @notice Batch mint NFTs for multiple users (admin only)
    /// @param uploaders Array of uploader addresses
    /// @param amounts Array of amounts (should be 1 for each)
    function batchMint(address[] calldata uploaders, uint256[] calldata amounts) external onlyOwner whenNotPaused {
        require(uploaders.length == amounts.length, "Array length mismatch");
        for (uint256 i = 0; i < uploaders.length; i++) {
            address uploader = uploaders[i];
            uint256 amount = amounts[i];
            require(amount == 1, "ONE_NFT");
            require(totalSupply() + amount <= maxSupply, "MAX_SUP");
            require(uploader != address(0), "INV_UPLOADER");
            uint256 uploaderMintPrice = fileManager.getMintPrice(uploader);
            require(uploaderMintPrice > 0, "NO_PRICE");
            ThesisFileManager.UploadedFile memory file = fileManager.getUploadedFile(uploader);
            require(file.isValid, "INV_FILE");
            string memory ticker = file.ticker;
            require(!userMintedTickers[uploader][ticker], "ALREADY");
            uint256 effectivePrice = uploaderMintPrice;
            uint256 discountPercent = stakingContract.getDiscountPercentage(uploader);
            if (discountPercent > 0) {
                uint256 discount = (uploaderMintPrice * discountPercent) / 100;
                effectivePrice = uploaderMintPrice - discount;
            }
            uint256 startTokenId = _tokenIdCounter;
            for (uint256 j = 0; j < amount; j++) {
                _mint(uploader, _tokenIdCounter);
                tokenMinters[_tokenIdCounter] = uploader;
                _tokenIdCounter++;
            }
            userMintedTickers[uploader][ticker] = true;
            minterTokenCount[uploader]++;
            emit Minted(uploader, amount, startTokenId);
            auctionManager.setEligible(uploader, true);
            if (totalSupply() >= file.nftSupply) {
                auctionManager.startAuction(startTokenId);
            }
        }
    }

    // ============ USER FUNCTIONS ============
    
    /// @dev Reveal file with validation - only for auction winners
    function revealFile(uint256 tokenId) external whenNotPaused whenNotEmergency {
        require(_ownerOf(tokenId) != address(0), "NO_TOKEN");
        require(!_revealedTokens[tokenId], "REVEALED");
        require(ownerOf(tokenId) == msg.sender, "NOT_OWNER");
        
        _revealedTokens[tokenId] = true;
        emit FileRevealed(tokenId);
    }

    // ============ VIEW FUNCTIONS ============
    
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    function ownsNFT(address user) external view returns (bool) {
        return balanceOf(user) > 0;
    }

    function hasMinted(address user) external view returns (bool) {
        return _hasMinted[user];
    }

    function getMinterTokenCount(address user) external view returns (uint256) {
        return minterTokenCount[user];
    }

    /// @dev Get ticker for a specific token by finding the uploader
    function getTokenTicker(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "NO_TOKEN");
        address minter = tokenMinters[tokenId];
        ThesisFileManager.UploadedFile memory file = fileManager.getUploadedFile(minter);
        return file.ticker;
    }

    /// @dev Check if user has minted a specific ticker
    function hasMintedTicker(address user, string memory ticker) external view returns (bool) {
        return userMintedTickers[user][ticker];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");
        string memory _uri = _tokenURIs[tokenId];
        return bytes(_uri).length > 0 ? _uri : string(abi.encodePacked(_baseURI(), tokenId.toString(), ".json"));
    }

    function getMinter(uint256 tokenId) external view returns (address) {
        require(_ownerOf(tokenId) != address(0), "NO_TOKEN");
        return tokenMinters[tokenId];
    }

    function isFileRevealed(uint256 tokenId) external view returns (bool) {
        return _revealedTokens[tokenId];
    }

    /// @notice Get the total number of minters
    function getTotalMinters() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /// @notice Get the number of tokens minted by a user
    /// @param user The address of the user
    function getUserMintedCount(address user) external view returns (uint256) {
        return minterTokenCount[user];
    }

    /// @notice Get the number of revealed tokens
    function getRevealedTokensCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (_revealedTokens[i]) {
                count++;
            }
        }
        return count;
    }

    /// @notice Get the number of tokens with a specific ticker minted by a user
    /// @param user The address of the user
    /// @param ticker The ticker string
    function getUserMintedTickerCount(address user, string memory ticker) external view returns (bool) {
        return userMintedTickers[user][ticker];
    }

    // ============ INTERNAL FUNCTIONS ============
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /// @dev Split signature into r, s, v components - gas optimized
    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "SIG_LEN");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    // ============ SECURITY: RECEIVE FUNCTION ============
    
    /// @dev Reject direct ETH transfers
    receive() external payable {
        revert("NO_DIRECT_ETH");
    }

    /// @dev Reject fallback calls
    fallback() external payable {
        revert("INV_CALL");
    }

    // ============ OVERRIDE TRANSFER FUNCTIONS ============
    
    /// @dev Override transfer function to prevent trading before auction phase
    function transferFrom(address from, address to, uint256 tokenId) public override {
        super.transferFrom(from, to, tokenId);
    }
    
    /// @dev Override safeTransferFrom function to prevent trading before auction phase
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        super.safeTransferFrom(from, to, tokenId, data);
    }
    
    /// @dev Override approve function to prevent trading before auction phase
    function approve(address to, uint256 tokenId) public override {
        super.approve(to, tokenId);
    }
    
    /// @dev Override setApprovalForAll function to prevent trading before auction phase
    function setApprovalForAll(address operator, bool approved) public override {
        super.setApprovalForAll(operator, approved);
    }

    // ============ FILE ACCESS MANAGEMENT ============
    
    /// @dev Get file information for public display
    function getFileInfo(address uploader) external view returns (
        string memory fileName,
        string memory ticker,
        string memory fileDescription,
        uint256 previewPages,
        uint256 totalPages,
        uint256 nftSupply,
        uint256 mintedCount,
        string memory publicPreviewHashParam
    ) {
        ThesisFileManager.UploadedFile memory file = fileManager.getUploadedFile(uploader);
        return (
            file.fileName,
            file.ticker,
            file.fileDescription,
            file.previewPages,
            file.totalPages,
            file.nftSupply,
            totalSupply(),
            file.publicPreviewHash
        );
    }

    modifier whenNotEmergency() {
        require(!governance.emergencyMode(), "EMERGENCY");
        _;
    }

    // Add new events for multi-sig operations
    event BaseURIUpdated(string newBaseURI);
    event PriceUpdated(uint256 newPrice);
    event MaxSupplyUpdated(uint256 newMaxSupply);

    // Add operation types enum
    enum OperationType {
        TransferOwnership,
        UpdateBaseURI,
        UpdatePrice,
        UpdateMaxSupply,
        EmergencyAction
    }

    // Add operation struct
    struct Operation {
        OperationType operationType;
        address target;
        uint256 value;
        string stringValue;
        bool executed;
        uint256 numConfirmations;
        uint256 proposedTime;
    }

    // Add operations mapping
    mapping(bytes32 => Operation) public operations;
    mapping(bytes32 => mapping(address => bool)) public hasConfirmed;

    // Modify existing functions to use multi-sig
    function proposeOperation(
        OperationType operationType,
        address target,
        uint256 value,
        string memory stringValue
    ) external onlyOwner {
        bytes32 operationHash = keccak256(abi.encodePacked(
            operationType, 
            target, 
            value, 
            stringValue, 
            block.timestamp
        ));
        require(operations[operationHash].proposedTime == 0, "Operation already exists");
        
        operations[operationHash] = Operation({
            operationType: operationType,
            target: target,
            value: value,
            stringValue: stringValue,
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
        } else if (operation.operationType == OperationType.UpdateBaseURI) {
            _setBaseURI(operation.stringValue);
        } else if (operation.operationType == OperationType.UpdatePrice) {
            _updatePrice(operation.value);
        } else if (operation.operationType == OperationType.UpdateMaxSupply) {
            _updateMaxSupply(operation.value);
        } else if (operation.operationType == OperationType.EmergencyAction) {
            _handleEmergencyAction(operation.value == 1);
        }

        emit OperationExecuted(operationHash);
    }

    // Helper function to get operation type string
    function getOperationTypeString(OperationType operationType) internal pure returns (string memory) {
        if (operationType == OperationType.TransferOwnership) return "TransferOwnership";
        if (operationType == OperationType.UpdateBaseURI) return "UpdateBaseURI";
        if (operationType == OperationType.UpdatePrice) return "UpdatePrice";
        if (operationType == OperationType.UpdateMaxSupply) return "UpdateMaxSupply";
        if (operationType == OperationType.EmergencyAction) return "EmergencyAction";
        return "Unknown";
    }

    // Internal functions for operations
    function _setBaseURI(string memory newBaseURI) internal {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function _updatePrice(uint256 newPrice) internal {
        require(newPrice >= MIN_MINT_PRICE && newPrice <= MAX_MINT_PRICE, "Invalid price");
        price = newPrice;
        emit PriceUpdated(newPrice);
    }

    function _updateMaxSupply(uint256 newMaxSupply) internal {
        require(newMaxSupply <= MAX_SUPPLY && newMaxSupply >= minSupply, "Invalid supply");
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    function _handleEmergencyAction(bool activate) internal {
        if (activate) {
            _pause();
        } else {
            _unpause();
        }
    }

    // Add internal setter for per-token URI
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        _tokenURIs[tokenId] = _tokenURI;
    }

    function setFileManager(address _fileManager) external onlyOwner {
        fileManager = ThesisFileManager(_fileManager);
    }
} 