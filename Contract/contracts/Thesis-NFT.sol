// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// This contract is intended for deployment on SepoliaETH (chainId: 11155111) and tCORE2 (chainId: 1114) testnets as configured in hardhat.config.ts

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

interface IStaking {
    function hasDiscount(address user) external view returns (bool);
    function discountPercent() external view returns (uint256);
}

contract ThesisNFT is ERC721, Ownable {
    uint256 public maxSupply;
    uint256 public minSupply;
    uint256 public price;
    uint256 private _tokenIdCounter;
    bool public auctionStarted;

    IStaking public stakingContract;

    string private _baseTokenURI;

    event AuctionStarted();
    event PriceUpdated(uint256 newPrice);
    event Minted(address indexed to, uint256 amount, uint256 startTokenId);
    event DebugMintStep(string step, uint256 value);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 minSupply_,
        uint256 price_,
        address initialOwner,
        address stakingContractAddress,
        string memory baseTokenURI_
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        require(minSupply_ >= 100, "Minimum supply must be at least 100");
        require(maxSupply_ <= 300, "Maximum supply must be at most 300");
        require(minSupply_ <= maxSupply_, "Min supply must be <= max supply");

        maxSupply = maxSupply_;
        minSupply = minSupply_;
        price = price_;
        _tokenIdCounter = 0; // Start token IDs at 0 to match standard ERC721 behavior
        auctionStarted = false;
        stakingContract = IStaking(stakingContractAddress);
        _baseTokenURI = baseTokenURI_;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    function mint(uint256 amount) external payable {
        require(!auctionStarted, "Minting is closed, auction started");
        require(amount > 0, "Must mint at least one token");
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");

        emit DebugMintStep("After initial checks", amount);
        console.log("After initial checks, amount:", amount);

        uint256 effectivePrice = price;
        // Temporarily bypass staking contract interaction to debug error
        // if (stakingContract.hasDiscount(msg.sender)) {
        //     uint256 discount = (price * stakingContract.discountPercent()) / 100;
        //     effectivePrice = price - discount;
        // }

        emit DebugMintStep("After discount calculation", effectivePrice);
        console.log("After discount calculation, effectivePrice:", effectivePrice);

        require(msg.value >= effectivePrice * amount, "Insufficient ETH sent");

        emit DebugMintStep("After payment check", msg.value);
        console.log("After payment check, msg.value:", msg.value);

        uint256 startTokenId = _tokenIdCounter;
        for (uint256 i = 0; i < amount; i++) {
            emit DebugMintStep("Before minting token", _tokenIdCounter);
            console.log("Before minting token, tokenId:", _tokenIdCounter);
            _mint(msg.sender, _tokenIdCounter);
            emit DebugMintStep("After minting token", _tokenIdCounter);
            console.log("After minting token, tokenId:", _tokenIdCounter);
            _tokenIdCounter++;
        }

        emit DebugMintStep("After minting loop", _tokenIdCounter);
        console.log("After minting loop, final tokenId:", _tokenIdCounter);

        emit Minted(msg.sender, amount, startTokenId);

        // If max supply reached, start auction
        if (totalSupply() == maxSupply) {
            auctionStarted = true;
            emit AuctionStarted();
        }
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        require(!auctionStarted, "Cannot change price after auction started");
        price = newPrice;
        emit PriceUpdated(newPrice);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Check if an address owns at least one NFT
    function ownsNFT(address user) external view returns (bool) {
        return balanceOf(user) > 0;
    }

    // Override tokenURI to return IPFS metadata URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");
        return string(abi.encodePacked(_baseTokenURI, Strings.toString(tokenId), ".json"));
    }

    // Allow owner to set base URI
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    // Override _baseURI to return _baseTokenURI
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}

