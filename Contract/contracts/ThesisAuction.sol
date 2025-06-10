// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IThesisNFT is IERC721 {
    function totalSupply() external view returns (uint256);
    function maxSupply() external view returns (uint256);
    function auctionStarted() external view returns (bool);
    // Removed owner() function to avoid conflict with Ownable
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract ThesisAuction is Ownable {
    IThesisNFT public thesisNFT;
    uint256 public auctionPrice;
    bool public auctionActive;

    event AuctionStarted(uint256 price);
    event AuctionStopped();
    event AuctionPriceChanged(uint256 newPrice);
    event NFTSold(address buyer, uint256 price);
    event NFTDeposited(uint256 tokenId);

    constructor(address thesisNFTAddress, uint256 initialPrice) Ownable(msg.sender) {
        thesisNFT = IThesisNFT(thesisNFTAddress);
        auctionPrice = initialPrice;
        auctionActive = false;
    }

    modifier onlyWhenAuctionActive() {
        require(auctionActive, "Auction is not active");
        _;
    }

    // Owner deposits NFT to auction contract for sale
    function depositNFT(uint256 tokenId) external onlyOwner {
        // Transfer NFT from owner to this contract
        thesisNFT.transferFrom(msg.sender, address(this), tokenId);
        emit NFTDeposited(tokenId);
    }

    function startAuction() external onlyOwner {
        require(thesisNFT.auctionStarted(), "Auction has not started in NFT contract");
        require(!auctionActive, "Auction already active");
        auctionActive = true;
        emit AuctionStarted(auctionPrice);
    }

    function stopAuction() external onlyOwner onlyWhenAuctionActive {
        auctionActive = false;
        emit AuctionStopped();
    }

    function setAuctionPrice(uint256 newPrice) external onlyOwner onlyWhenAuctionActive {
        require(newPrice > 0, "Price must be greater than zero");
        auctionPrice = newPrice;
        emit AuctionPriceChanged(newPrice);
    }

    // Buy NFT from auction
    function buyNFT(uint256 tokenId) external payable onlyWhenAuctionActive {
        require(msg.value >= auctionPrice, "Insufficient ETH sent");
        // Check that the contract owns the NFT
        require(thesisNFT.ownerOf(tokenId) == address(this), "NFT not owned by auction contract");
        // Transfer NFT from auction contract to buyer
        thesisNFT.transferFrom(address(this), msg.sender, tokenId);
        // Transfer funds to owner
        payable(owner()).transfer(msg.value);
        emit NFTSold(msg.sender, msg.value);
    }

    // Fallback function to receive ETH
    receive() external payable {}
}
