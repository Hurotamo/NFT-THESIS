// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// This contract is intended for deployment on SepoliaETH (chainId: 11155111) and tCORE2 (chainId: 1114) testnets as configured in hardhat.config.ts

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IThesisNFT is IERC721 {
    function totalSupply() external view returns (uint256);
    function maxSupply() external view returns (uint256);
    function auctionStarted() external view returns (bool);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function revealFile(uint256 tokenId) external;
}

contract ThesisAuction is Ownable {
    IThesisNFT public thesisNFT;
    uint256 public auctionPrice;
    bool public auctionActive;
    bool private _locked;
    address payable public platformWallet = payable(0xB490Ea033524c85c2740e6dDF6A30c75bbff1A8F);

    mapping(address => bool) private _minters;
    mapping(address => uint256) private _pendingReturns;
    address[] private _bidders;

    event AuctionStarted(uint256 price);
    event AuctionStopped();
    event AuctionPriceChanged(uint256 newPrice);
    event NFTSold(address buyer, uint256 price);
    event NFTDeposited(uint256 tokenId);
    event AuctionEnded(address winner, uint256 amount);

    constructor(address thesisNFTAddress, uint256 initialPrice, address initialOwner) Ownable(initialOwner) {
        thesisNFT = IThesisNFT(thesisNFTAddress);
        auctionPrice = initialPrice;
        auctionActive = false;
        _locked = false;
    }

    modifier onlyWhenAuctionActive() {
        require(auctionActive, "Auction is not active");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    modifier onlyNftOwner() {
        require(msg.sender == Ownable(address(thesisNFT)).owner(), "Caller is not NFT owner");
        _;
    }

    // Owner deposits NFT to auction contract for sale
    function depositNFT(uint256 tokenId) external onlyOwner {
        // Transfer NFT from owner to this contract
        thesisNFT.transferFrom(msg.sender, address(this), tokenId);
        emit NFTDeposited(tokenId);
    }

    function startAuction() external onlyNftOwner {
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

    // Buy NFT from auction - only minters can join
    function buyNFT(uint256 tokenId) external payable onlyWhenAuctionActive nonReentrant {
        require(_minters[msg.sender], "Only minters can join the auction");
        require(msg.value >= auctionPrice, "Insufficient ETH sent");
        // Check that the contract owns the NFT
        require(thesisNFT.ownerOf(tokenId) == address(this), "NFT not owned by auction contract");

        // Record bidder and pending return
        if (!_minters[msg.sender]) {
            _minters[msg.sender] = true;
            _bidders.push(msg.sender);
        }
        _pendingReturns[msg.sender] += msg.value;

        // Transfer NFT from auction contract to buyer
        thesisNFT.transferFrom(address(this), msg.sender, tokenId);
        // Transfer funds to owner
        payable(owner()).transfer(auctionPrice);
        // Refund excess ETH if any
        if (msg.value > auctionPrice) {
            payable(msg.sender).transfer(msg.value - auctionPrice);
            _pendingReturns[msg.sender] -= (msg.value - auctionPrice);
        }
        emit NFTSold(msg.sender, auctionPrice);
    }

    function endAuction(uint256 tokenId) external onlyOwner nonReentrant {
        auctionActive = false;
        thesisNFT.transferFrom(owner(), msg.sender, tokenId);
        // Assuming revealFile is implemented in ThesisNFT to reveal the file
        thesisNFT.revealFile(tokenId);
        emit AuctionEnded(msg.sender, auctionPrice);

        // Refund all non-winners
        for (uint i = 0; i < _bidders.length; i++) {
            address bidder = _bidders[i];
            if (bidder != msg.sender) {
                uint256 amount = _pendingReturns[bidder];
                if (amount > 0) {
                    _pendingReturns[bidder] = 0;
                    payable(bidder).transfer(amount);
                }
            }
        }
    }

    receive() external payable {}
}
