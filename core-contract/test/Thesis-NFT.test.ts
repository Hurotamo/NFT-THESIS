import { expect } from "chai";
import { ethers } from "hardhat";

describe("ThesisNFT Contract", function () {
  let thesisNFT: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let stakingContract: any;

  const name = "ThesisNFT";
  const symbol = "TNFT";
  const maxSupply = 100;
  const minSupply = 40;
  const price = ethers.parseEther("0.1");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy a mock staking contract
    const StakingMockFactory = await ethers.getContractFactory("StakingMock");
    stakingContract = await StakingMockFactory.deploy();
    await stakingContract.deploymentTransaction()?.wait();

    const ThesisNFTFactory = await ethers.getContractFactory("ThesisNFT");
    thesisNFT = await ThesisNFTFactory.deploy(
      name,
      symbol,
      maxSupply,
      minSupply,
      price,
      owner.address,
      stakingContract.target,
      "ipfs://Qm.../"
    );
    await thesisNFT.waitForDeployment();
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

  it("Should allow minting tokens with sufficient payment and discount", async function () {
    // Set discount percent to 20%
    await stakingContract.setDiscountPercent(20);
    // Set user to have discount
    await stakingContract.setHasDiscount(addr1.address, true);

    const mintAmount = 1;
    const discountedPrice = price - (price * 20n) / 100n;
    const platformFee = (discountedPrice * 20n) / 100n;
    const totalPrice = discountedPrice + platformFee;

    await thesisNFT.connect(addr1).mint(mintAmount, { value: totalPrice });

    expect(await thesisNFT.totalSupply()).to.equal(mintAmount);
    expect(await thesisNFT.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("Should fail minting if auction started", async function () {
    // Mint up to maxSupply to start auction
    for (let i = 0; i < maxSupply; i++) {
      await thesisNFT.connect(addr1).mint(1, { value: price });
    }
    // Verify auction started
    expect(await thesisNFT.auctionStarted()).to.be.true;
    // Should revert when trying to mint after auction started
    await expect(thesisNFT.connect(addr1).mint(1, { value: price }))
      .to.be.revertedWith("Minting is closed, auction started");
  });

  it("Should fail minting if insufficient payment", async function () {
    const insufficientValue = price - BigInt(1);
    await expect(
      thesisNFT.connect(addr1).mint(1, { value: insufficientValue })
    ).to.be.reverted;
  });

  it("Should fail minting if exceeding max supply", async function () {
    const mintAmount = maxSupply + 1;
    const totalPrice = price * BigInt(mintAmount);

    await expect(
      thesisNFT.connect(addr1).mint(mintAmount, { value: totalPrice })
    ).to.be.revertedWith("Exceeds max supply");
  });

  it("Should allow owner to set price before auction", async function () {
    const newPrice = ethers.parseEther("0.2");
    await expect(thesisNFT.connect(owner).setPrice(newPrice))
      .to.emit(thesisNFT, "PriceUpdated")
      .withArgs(newPrice);
    expect(await thesisNFT.price()).to.equal(newPrice);
  });

  it("Should not allow owner to set price after auction started", async function () {
    // Mint up to maxSupply to start auction
    for (let i = 0; i < maxSupply; i++) {
      await thesisNFT.connect(addr1).mint(1, { value: price });
    }
    // Verify auction started
    expect(await thesisNFT.auctionStarted()).to.be.true;
    // Should revert when trying to set price after auction started
    await expect(thesisNFT.connect(owner).setPrice(ethers.parseEther("0.2")))
      .to.be.revertedWith("Cannot change price after auction started");
  });

  it("Should allow owner to withdraw funds", async function () {
    const mintAmount = 1;
    const discountedPrice = price - (price * 20n) / 100n;
    const platformFee = (discountedPrice * 20n) / 100n;
    const totalPrice = discountedPrice + platformFee;

    // Set discount percent to 20%
    await stakingContract.setDiscountPercent(20);
    // Set user to have discount
    await stakingContract.setHasDiscount(addr1.address, true);

    await thesisNFT.connect(addr1).mint(mintAmount, { value: totalPrice });

    const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

    const tx = await thesisNFT.connect(owner).withdraw();
    const receipt = await tx.wait();

    const gasPrice = receipt.effectiveGasPrice ?? receipt.gasPrice;
    const gasUsed = BigInt(receipt.gasUsed) * BigInt(gasPrice);
    const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

    const expectedBalance = initialOwnerBalance + totalPrice - gasUsed;
    const tolerance = 100000000000000n;
    const finalBal = BigInt(finalOwnerBalance);
    const expectedBal = BigInt(expectedBalance);
    const diff = finalBal > expectedBal ? finalBal - expectedBal : expectedBal - finalBal;
    expect(Number(diff)).to.be.lessThan(Number(tolerance));
  });

  it("Should correctly report ownsNFT", async function () {
    expect(await thesisNFT.ownsNFT(addr1.address)).to.equal(false);

    const mintAmount = 1;
    const discountedPrice = price - (price * 20n) / 100n;
    const platformFee = (discountedPrice * 20n) / 100n;
    const totalPrice = discountedPrice + platformFee;

    // Set discount percent to 20%
    await stakingContract.setDiscountPercent(20);
    // Set user to have discount
    await stakingContract.setHasDiscount(addr1.address, true);

    await thesisNFT.connect(addr1).mint(mintAmount, { value: totalPrice });

    expect(await thesisNFT.ownsNFT(addr1.address)).to.equal(true);
  });

  it("Should allow owner to set base URI and tokenURI returns correct URI", async function () {
    const newBaseURI = "ipfs://newBaseURI/";
    await thesisNFT.setBaseURI(newBaseURI);

    const mintAmount = 1;
    const discountedPrice = price - (price * 20n) / 100n;
    const platformFee = (discountedPrice * 20n) / 100n;
    const totalPrice = discountedPrice + platformFee;

    // Set discount percent to 20%
    await stakingContract.setDiscountPercent(20);
    // Set user to have discount
    await stakingContract.setHasDiscount(addr1.address, true);

    await thesisNFT.connect(addr1).mint(mintAmount, { value: totalPrice });

    const tokenURI = await thesisNFT.tokenURI(0);
    expect(tokenURI).to.equal(newBaseURI + "0.json");
  });

  it("Should allow owner to set IPFS hash", async function () {
    const newIpfsHash = "QmNewIpfsHash";
    await thesisNFT.setIpfsHash(newIpfsHash);

    expect(await thesisNFT.ipfsHash()).to.equal(newIpfsHash);
  });
});
