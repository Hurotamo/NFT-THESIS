// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract ThesisNFT is ERC721, Ownable {
    uint256 public maxSupply;
    uint256 public minSupply;
    uint256 public price;
    uint256 private _tokenIdCounter;
    bool public auctionStarted;

    event AuctionStarted();

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 minSupply_,
        uint256 price_
    ) ERC721(name_, symbol_) {
        require(minSupply_ >= 100, "Minimum supply must be at least 100");
        require(maxSupply_ <= 300, "Maximum supply must be at most 300");
        require(minSupply_ <= maxSupply_, "Min supply must be <= max supply");

        maxSupply = maxSupply_;
        minSupply = minSupply_;
        price = price_;
        _tokenIdCounter = 1; // Start token IDs at 1
        auctionStarted = false;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    function mint(uint256 amount) external payable {
        require(!auctionStarted, "Minting is closed, auction started");
        require(amount > 0, "Must mint at least one token");
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        require(msg.value >= price * amount, "Insufficient ETH sent");

        for (uint256 i = 0; i < amount; i++) {
            _safeMint(msg.sender, _tokenIdCounter);
            _tokenIdCounter++;
        }

        // If max supply reached, start auction
        if (totalSupply() == maxSupply) {
            auctionStarted = true;
            emit AuctionStarted();
        }
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        require(!auctionStarted, "Cannot change price after auction started");
        price = newPrice;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Check if an address owns at least one NFT
    function ownsNFT(address user) external view returns (bool) {
        return balanceOf(user) > 0;
    }
}
