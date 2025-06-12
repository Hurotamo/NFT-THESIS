import { expect } from "chai";
import { ethers } from "hardhat";
import { ThesisNFT__factory } from "../typechain-types";

describe("ThesisAuction Contract", function () {
  let thesisNFT: any;
  let thesisAuction: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  const name = "ThesisNFT";
  const symbol = "TNFT";
  const maxSupply = 200;
  const minSupply = 100;
  const price = ethers.parseEther("0.1");
  const auctionPrice = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy ThesisNFT contract
    const ThesisNFTFactory = await ethers.getContractFactory("ThesisNFT") as ThesisNFT__factory;
    thesisNFT = await ThesisNFTFactory.deploy(
      "Thesis NFT",
      "TNFT",
      maxSupply,
      minSupply,
      price,
      owner.address,
      "0x0000000000000000000000000000000000000001", // Placeholder for stakingContractAddress
      "ipfs://Qm.../" // Placeholder for baseTokenURI
    );
    await thesisNFT.waitForDeployment();

    // Deploy ThesisAuction contract
    const ThesisAuctionFactory = await ethers.getContractFactory("ThesisAuction");
    thesisAuction = await ThesisAuctionFactory.deploy(thesisNFT.target, auctionPrice, owner.address);
    await thesisAuction.waitForDeployment();

    // Mint some NFTs to owner for testing deposit
    const mintAmount = 5;
    const totalPrice = price * BigInt(mintAmount);
    await thesisNFT.mint(mintAmount, { value: totalPrice });
  });

  it("Should set initial state correctly", async function () {
    expect(await thesisAuction.auctionPrice()).to.equal(auctionPrice);
    expect(await thesisAuction.auctionActive()).to.equal(false);
    expect(await thesisAuction.owner()).to.equal(owner.address);
  });

  it("Should allow owner to deposit NFT", async function () {
    // Approve auction contract to transfer NFT
    await thesisNFT.approve(thesisAuction.target, 1);

    await expect(thesisAuction.depositNFT(1))
      .to.emit(thesisAuction, "NFTDeposited")
      .withArgs(1);

    expect(await thesisNFT.ownerOf(1)).to.equal(thesisAuction.target);
  });

  it("Should not allow non-owner to deposit NFT", async function () {
    await thesisNFT.approve(thesisAuction.target, 2);

    await expect(
      thesisAuction.connect(addr1).depositNFT(2)
    ).to.be.reverted;
  });

  it("Should start auction only if auctionStarted in ThesisNFT is true", async function () {
    // Initially auctionStarted is false
    expect(await thesisNFT.auctionStarted()).to.equal(false);

    await expect(thesisAuction.startAuction()).to.be.revertedWith(
      "Auction has not started in NFT contract"
    );

    // Mint maxSupply to start auction in ThesisNFT
    const totalPrice = price * BigInt(maxSupply);
    // Mint maxSupply only once per test suite, so check if already minted
    const currentSupply = await thesisNFT.totalSupply();
    if (Number(currentSupply) < maxSupply) {
      await thesisNFT.mint(maxSupply - Number(currentSupply), { value: price * BigInt(maxSupply - Number(currentSupply)) });
    }

    expect(await thesisNFT.auctionStarted()).to.equal(true);

    await expect(thesisAuction.startAuction())
      .to.emit(thesisAuction, "AuctionStarted")
      .withArgs(auctionPrice);

    expect(await thesisAuction.auctionActive()).to.equal(true);
  });

  it("Should not start auction if already active", async function () {
    // Mint maxSupply to start auction in ThesisNFT
    const currentSupply = await thesisNFT.totalSupply();
    if (Number(currentSupply) < maxSupply) {
      await thesisNFT.mint(maxSupply - Number(currentSupply), { value: price * BigInt(maxSupply - Number(currentSupply)) });
    }

    await thesisAuction.startAuction();

    await expect(thesisAuction.startAuction()).to.be.revertedWith(
      "Auction already active"
    );
  });

  it("Should stop auction only when active", async function () {
    const currentSupply = await thesisNFT.totalSupply();
    if (Number(currentSupply) < maxSupply) {
      await thesisNFT.mint(maxSupply - Number(currentSupply), { value: price * BigInt(maxSupply - Number(currentSupply)) });
    }

    await thesisAuction.startAuction();

    await expect(thesisAuction.stopAuction())
      .to.emit(thesisAuction, "AuctionStopped");

    expect(await thesisAuction.auctionActive()).to.equal(false);

    await expect(thesisAuction.stopAuction()).to.be.revertedWith(
      "Auction is not active"
    );
  });

  it("Should allow owner to set auction price when active", async function () {
    const currentSupply = await thesisNFT.totalSupply();
    if (Number(currentSupply) < maxSupply) {
      await thesisNFT.mint(maxSupply - Number(currentSupply), { value: price * BigInt(maxSupply - Number(currentSupply)) });
    }

    await thesisAuction.startAuction();

    const newPrice = ethers.parseEther("2");

    await expect(thesisAuction.setAuctionPrice(newPrice))
      .to.emit(thesisAuction, "AuctionPriceChanged")
      .withArgs(newPrice);

    expect(await thesisAuction.auctionPrice()).to.equal(newPrice);
  });

  it("Should not allow setting auction price when not active", async function () {
    const newPrice = ethers.parseEther("2");

    await expect(thesisAuction.setAuctionPrice(newPrice)).to.be.revertedWith(
      "Auction is not active"
    );
  });

  it("Should not allow setting auction price to zero", async function () {
    const currentSupply = await thesisNFT.totalSupply();
    if (Number(currentSupply) < maxSupply) {
      await thesisNFT.mint(maxSupply - Number(currentSupply), { value: price * BigInt(maxSupply - Number(currentSupply)) });
    }

    await thesisAuction.startAuction();

    await expect(thesisAuction.setAuctionPrice(0)).to.be.revertedWith(
      "Price must be greater than zero"
    );
  });

  it("Should allow buying NFT with sufficient ETH", async function () {
    const currentSupply = await thesisNFT.totalSupply();
    if (Number(currentSupply) < maxSupply) {
      await thesisNFT.mint(maxSupply - Number(currentSupply), { value: price * BigInt(maxSupply - Number(currentSupply)) });
    }

    await thesisNFT.approve(thesisAuction.target, 1);
    await thesisAuction.depositNFT(1);

    await thesisAuction.startAuction();

    const buyerInitialBalance = BigInt(await ethers.provider.getBalance(addr1.address));
    const ownerInitialBalance = BigInt(await ethers.provider.getBalance(owner.address));

    const tx = await thesisAuction.connect(addr1).buyNFT(1, { value: auctionPrice });
    const receipt = await tx.wait();

    expect(await thesisNFT.ownerOf(1)).to.equal(addr1.address);

    const buyerFinalBalance = BigInt(await ethers.provider.getBalance(addr1.address));
    const ownerFinalBalance = BigInt(await ethers.provider.getBalance(owner.address));
 
    expect(buyerFinalBalance).to.be.lt(buyerInitialBalance - auctionPrice);

    expect(ownerFinalBalance).to.equal(ownerInitialBalance + auctionPrice);
  });

  it("Should refund excess ETH when buying NFT", async function () {
    const currentSupply = await thesisNFT.totalSupply();
    if (Number(currentSupply) < maxSupply) {
      await thesisNFT.mint(maxSupply - Number(currentSupply), { value: price * BigInt(maxSupply - Number(currentSupply)) });
    }

    await thesisNFT.approve(thesisAuction.target, 1);
    await thesisAuction.depositNFT(1);

    await thesisAuction.startAuction();

    const excessAmount = ethers.parseEther("0.5");
    const totalSent = auctionPrice + excessAmount;

    const buyerInitialBalance = BigInt(await ethers.provider.getBalance(addr1.address));
    const tx = await thesisAuction.connect(addr1).buyNFT(1, { value: totalSent });
    await tx.wait();

    const buyerFinalBalance = BigInt(await ethers.provider.getBalance(addr1.address));
    expect(buyerFinalBalance).to.be.lt(buyerInitialBalance - auctionPrice);
    expect(buyerFinalBalance).to.be.gt(buyerInitialBalance - totalSent);
  });

  it("Should not allow buying NFT with insufficient ETH", async function () {
    const currentSupply = await thesisNFT.totalSupply();
    if (Number(currentSupply) < maxSupply) {
      await thesisNFT.mint(maxSupply - Number(currentSupply), { value: price * BigInt(maxSupply - Number(currentSupply)) });
    }

    await thesisNFT.approve(thesisAuction.target, 1);
    await thesisAuction.depositNFT(1);

    await thesisAuction.startAuction();

    await expect(
      thesisAuction.connect(addr1).buyNFT(1, { value: ethers.parseEther("0.5") })
    ).to.be.revertedWith("Insufficient ETH sent");
  });

  it("Should not allow buying NFT not owned by auction contract", async function () {
    const currentSupply = await thesisNFT.totalSupply();
    if (Number(currentSupply) < maxSupply) {
      await thesisNFT.mint(maxSupply - Number(currentSupply), { value: price * BigInt(maxSupply - Number(currentSupply)) });
    }

    await thesisAuction.startAuction();

    await expect(
      thesisAuction.connect(addr1).buyNFT(1, { value: auctionPrice })
    ).to.be.revertedWith("NFT not owned by auction contract");
  });
});
