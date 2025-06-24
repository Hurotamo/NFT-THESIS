// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface IAuctionManager {
    function startAuction(uint256 tokenId) external;
    function setAuctionWinner(uint256 tokenId, address winner) external;
    function isAuctionWinner(uint256 tokenId, address user) external view returns (bool);
    function setEligible(address user, bool eligible) external;
    function isEligible(address user) external view returns (bool);
    function canAccessFullFile(uint256 tokenId, address user) external view returns (bool);
}

contract AuctionManager is Initializable, OwnableUpgradeable, IAuctionManager {
    address public thesisNFT;
    mapping(uint256 => address) public auctionWinners;
    mapping(uint256 => bool) public auctionStarted;
    mapping(address => bool) public eligibleMinters;

    event AuctionStarted(uint256 indexed tokenId);
    event AuctionWinnerSet(uint256 indexed tokenId, address indexed winner);
    event EligibleMinterSet(address indexed user, bool eligible);

    /// @notice Initializes the contract and sets the NFT contract and owner
    /// @param _thesisNFT The address of the NFT contract
    /// @param initialOwner The address of the contract owner
    function initialize(address _thesisNFT, address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        thesisNFT = _thesisNFT;
    }

    /// @notice Set eligibility for a batch of users
    /// @param users Array of user addresses
    /// @param eligibles Array of eligibility statuses
    function batchSetEligible(address[] calldata users, bool[] calldata eligibles) external onlyThesisNFT {
        require(users.length == eligibles.length, "Array length mismatch");
        for (uint256 i = 0; i < users.length; i++) {
            eligibleMinters[users[i]] = eligibles[i];
            emit EligibleMinterSet(users[i], eligibles[i]);
        }
    }

    /// @notice Batch start auctions for multiple tokenIds
    /// @param tokenIds Array of token IDs
    function batchStartAuction(uint256[] calldata tokenIds) external onlyThesisNFT {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            auctionStarted[tokenIds[i]] = true;
            emit AuctionStarted(tokenIds[i]);
        }
    }

    /// @notice Batch set auction winners for multiple tokenIds
    /// @param tokenIds Array of token IDs
    /// @param winners Array of winner addresses
    function batchSetAuctionWinners(uint256[] calldata tokenIds, address[] calldata winners) external onlyThesisNFT {
        require(tokenIds.length == winners.length, "Array length mismatch");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            auctionWinners[tokenIds[i]] = winners[i];
            emit AuctionWinnerSet(tokenIds[i], winners[i]);
        }
    }

    /// @notice Set eligibility for a user
    /// @param user The user address
    /// @param eligible Eligibility status
    function setEligible(address user, bool eligible) external override onlyThesisNFT {
        eligibleMinters[user] = eligible;
        emit EligibleMinterSet(user, eligible);
    }

    /// @notice Check if a user is eligible
    /// @param user The user address
    function isEligible(address user) external view override returns (bool) {
        return eligibleMinters[user];
    }

    /// @notice Start an auction for a tokenId
    /// @param tokenId The token ID
    function startAuction(uint256 tokenId) external override onlyThesisNFT {
        auctionStarted[tokenId] = true;
        emit AuctionStarted(tokenId);
    }

    /// @notice Set the auction winner for a tokenId
    /// @param tokenId The token ID
    /// @param winner The winner address
    function setAuctionWinner(uint256 tokenId, address winner) external override onlyThesisNFT {
        auctionWinners[tokenId] = winner;
        emit AuctionWinnerSet(tokenId, winner);
    }

    /// @notice Check if a user is the auction winner for a tokenId
    /// @param tokenId The token ID
    /// @param user The user address
    function isAuctionWinner(uint256 tokenId, address user) external view override returns (bool) {
        return auctionWinners[tokenId] == user;
    }

    /// @notice Check if a user can access the full file for a tokenId
    /// @param tokenId The token ID
    /// @param user The user address
    function canAccessFullFile(uint256 tokenId, address user) external view override returns (bool) {
        return auctionWinners[tokenId] == user;
    }

    /// @notice Set the NFT contract address
    /// @param _thesisNFT The address of the NFT contract
    function setThesisNFT(address _thesisNFT) external onlyOwner {
        require(_thesisNFT != address(0), "Invalid address");
        thesisNFT = _thesisNFT;
    }

    /// @notice Get the number of eligible minters
    function getEligibleMintersCount() external pure returns (uint256) {
        revert("Not implemented: use off-chain analytics");
    }

    /// @notice Get the number of started auctions
    function getStartedAuctionsCount(uint256 maxTokenId) external view returns (uint256 count) {
        for (uint256 i = 0; i < maxTokenId; i++) {
            if (auctionStarted[i]) {
                count++;
            }
        }
    }

    /// @notice Get the number of auctions with winners
    function getAuctionsWithWinnersCount(uint256 maxTokenId) external view returns (uint256 count) {
        for (uint256 i = 0; i < maxTokenId; i++) {
            if (auctionWinners[i] != address(0)) {
                count++;
            }
        }
    }

    modifier onlyThesisNFT() {
        require(msg.sender == thesisNFT, "NOT_NFT");
        _;
    }

    // For upgradability, add a reserved storage gap
    uint256[50] private __gap;
} 