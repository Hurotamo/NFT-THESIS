import { expect } from "chai";
import { ethers } from "hardhat";

describe("ThesisNFT Contract", function () {
  let thesisNFT: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  const name = "ThesisNFT";
  const symbol = "TNFT";
  const maxSupply = 200;
  const minSupply = 100;
  const price = ethers.utils.parseEther("0.1");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const ThesisNFTFactory = await ethers.getContractFactory("ThesisNFT");
    thesisNFT = await ThesisNFTFactory.deploy(
      name,
      symbol,
      maxSupply,
      minSupply,
      price
    );
    await thesisNFT.deployed();
  });

  it("Should set initial state correctly", async function () {
    expect(await thesisNFT.name()).to.equal(name);
    expect(await thesisNFT.symbol()).to.equal(symbol);
    expect(await thesisNFT.maxSupply()).to.equal(maxSupply);
    expect(await thesisNFT.minSupply()).to.equal(minSupply);
    expect(await thesisNFT.price()).to.equal(price);
    expect(await thesisNFT.totalSupply()).to.equal(0);
    expect(await thesisNFT.auctionStarted()).to.equal(false);
  });

  it("Should allow minting tokens with sufficient payment", async function () {
    const mintAmount = 5;
    const totalPrice = price.mul(mintAmount);

    await expect(
      thesisNFT.connect(addr1).mint(mintAmount, { value: totalPrice })
    )
      .to.emit(thesisNFT, "Transfer")
      .withArgs(ethers.constants.AddressZero, addr1.address, 1);

    expect(await thesisNFT.totalSupply()).to.equal(mintAmount);
    expect(await thesisNFT.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("Should fail minting if auction started", async function () {
    // Mint maxSupply tokens to start auction
    const totalPrice = price.mul(maxSupply);
    await thesisNFT.connect(addr1).mint(maxSupply, { value: totalPrice });

    expect(await thesisNFT.auctionStarted()).to.equal(true);

    await expect(
      thesisNFT.connect(addr2).mint(1, { value: price })
    ).to.be.revertedWith("Minting is closed, auction started");
  });

  it("Should fail minting if insufficient payment", async function () {
    await expect(
      thesisNFT.connect(addr1).mint(1, { value: ethers.BigNumber.from(price).sub(1) })
    ).to.be.revertedWith("Insufficient ETH sent");
  });

  it("Should fail minting if exceeding max supply", async function () {
    const mintAmount = maxSupply + 1;
    const totalPrice = price.mul(mintAmount);

    await expect(
      thesisNFT.connect(addr1).mint(mintAmount, { value: totalPrice })
    ).to.be.revertedWith("Exceeds max supply");
  });

  it("Should allow owner to set price before auction", async function () {
    const newPrice = ethers.utils.parseEther("0.2");
    await thesisNFT.connect(owner).setPrice(newPrice);
    expect(await thesisNFT.price()).to.equal(newPrice);
  });

  it("Should not allow owner to set price after auction started", async function () {
    const totalPrice = price.mul(maxSupply);
    await thesisNFT.connect(addr1).mint(maxSupply, { value: totalPrice });

    await expect(
      thesisNFT.connect(owner).setPrice(price)
    ).to.be.revertedWith("Cannot change price after auction started");
  });

  it("Should allow owner to withdraw funds", async function () {
    const mintAmount = 3;
    const totalPrice = price.mul(mintAmount);

    await thesisNFT.connect(addr1).mint(mintAmount, { value: totalPrice });

    const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

    const tx = await thesisNFT.connect(owner).withdraw();
    const receipt = await tx.wait();

    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

    expect(finalOwnerBalance).to.equal(initialOwnerBalance.add(totalPrice).sub(gasUsed));
  });

  it("Should correctly report ownsNFT", async function () {
    expect(await thesisNFT.ownsNFT(addr1.address)).to.equal(false);

    const mintAmount = 1;
    const totalPrice = price.mul(mintAmount);
    await thesisNFT.connect(addr1).mint(mintAmount, { value: totalPrice });

    expect(await thesisNFT.ownsNFT(addr1.address)).to.equal(true);
  });
});
