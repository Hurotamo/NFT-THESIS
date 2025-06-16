import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";
import type { ThesisNFT, ThesisAuction, StakingMock } from "../typechain-types";
import { ThesisNFT__factory, ThesisAuction__factory, StakingMock__factory } from "../typechain-types";

describe("ThesisAuction Contract", function () {
  let thesisNFT: ThesisNFT;
  let thesisAuction: ThesisAuction;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let platformWallet: Signer;
  let stakingContract: StakingMock;
  let minters: Signer[] = [];

  const maxSupply = 100;
  const minSupply = 40;
  const price = ethers.parseEther("0.1");
  const auctionPrice = ethers.parseEther("1");
  const auctionDuration = 60 * 60; // 1 hour

  beforeEach(async function () {
    [owner, addr1, addr2, platformWallet] = await ethers.getSigners();
    minters = [];

    const StakingMockFactory = (await ethers.getContractFactory("StakingMock")) as StakingMock__factory;
    stakingContract = await StakingMockFactory.deploy();
    await stakingContract.waitForDeployment();

    // Deploy ThesisNFT contract
    const ThesisNFTFactory = (await ethers.getContractFactory("ThesisNFT")) as ThesisNFT__factory;
    thesisNFT = await ThesisNFTFactory.deploy(
      "Thesis NFT",
      "TNFT",
      maxSupply,
      minSupply,
      price,
      await owner.getAddress(),
      await stakingContract.getAddress(), // Placeholder for stakingContractAddress
      "ipfs://Qm.../" // Placeholder for baseTokenURI
    );
    await thesisNFT.waitForDeployment();

    // Deploy ThesisAuction contract
    const ThesisAuctionFactory = (await ethers.getContractFactory("ThesisAuction")) as ThesisAuction__factory;
    thesisAuction = await ThesisAuctionFactory.deploy(
      await thesisNFT.getAddress(),
      auctionPrice,
      await owner.getAddress(),
      await platformWallet.getAddress()
    );
    await thesisAuction.waitForDeployment();

    // Mint some NFTs to different wallets for testing deposit
    const platformFee = (price * 20n) / 100n;
    const totalPrice = price + platformFee;

    // Mint just enough to meet minSupply and trigger auction
    for (let i = 0; i < minSupply; i++) {
        const minter = ethers.Wallet.createRandom().connect(ethers.provider);
        await owner.sendTransaction({ to: minter.address, value: ethers.parseEther("1") });
        await thesisNFT.connect(minter).mint(1, { value: totalPrice });
        if (i < 5) { // Only authorize the first 5 for deposit tests
            minters.push(minter);
            await thesisAuction.setAuthorizedDepositor(minter.address, true);
        }
    }
  });

  it("Should allow owner to deposit NFT via onERC721Received", async function () {
    // Approve auction contract to transfer NFT
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);

    // Transfer NFT to auction contract (calls onERC721Received)
    await expect(thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0))
      .to.emit(thesisAuction, "NFTDeposited")
      .withArgs(0);

    expect(await thesisNFT.ownerOf(0)).to.equal(await thesisAuction.getAddress());
  });

  it("Should not allow non-owner to deposit NFT", async function () {
    await expect(
      thesisNFT.connect(addr1)["safeTransferFrom(address,address,uint256)"](await addr1.getAddress(), await thesisAuction.getAddress(), 1)
    ).to.be.reverted;
  });

  it("Should start auction for deposited NFT with valid duration", async function () {
    // Deposit NFT first
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);
    await thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0);

    // Start auction
    await expect(thesisAuction.connect(owner).startAuction(0, auctionDuration))
      .to.emit(thesisAuction, "AuctionStarted")
      .withArgs(0, auctionPrice);

    const auctionInfo = await thesisAuction.auctionInfo(0);
    expect(auctionInfo.active).to.equal(true);
  });

  it("Should not start auction if already active", async function () {
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);
    await thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0);

    await thesisAuction.connect(owner).startAuction(0, auctionDuration);

    await expect(thesisAuction.connect(owner).startAuction(0, auctionDuration)).to.be.revertedWith("Auction already started");
  });

  it("Should place valid bids and extend auction if near end", async function () {
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);
    await thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0);

    await thesisAuction.connect(owner).startAuction(0, 60); // 60 seconds duration

    // Place first bid
    await expect(thesisAuction.connect(addr1).placeBid(0, { value: auctionPrice }))
      .to.emit(thesisAuction, "BidPlaced")
      .withArgs(0, await addr1.getAddress(), auctionPrice);

    // Place second bid with increment
    const higherBid = auctionPrice + ethers.parseEther("0.02");
    await expect(thesisAuction.connect(addr2).placeBid(0, { value: higherBid }))
      .to.emit(thesisAuction, "BidPlaced")
      .withArgs(0, await addr2.getAddress(), higherBid);

    // Check withdrawable balance for addr1 (refund)
    const withdrawable = await thesisAuction.withdrawable(await addr1.getAddress());
    expect(withdrawable).to.equal(auctionPrice);
  });

  it("Should not place bid lower than minimum increment", async function () {
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);
    await thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0);

    await thesisAuction.connect(owner).startAuction(0, auctionDuration);

    await thesisAuction.connect(addr1).placeBid(0, { value: auctionPrice });

    const lowBid = auctionPrice + ethers.parseEther("0.001"); // less than bidIncrement 0.01 ether

    await expect(thesisAuction.connect(addr2).placeBid(0, { value: lowBid })).to.be.revertedWith("Bid too low");
  });

  it("Should end auction and set winner", async function () {
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);
    await thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0);

    await thesisAuction.connect(owner).startAuction(0, 60); // 60 seconds duration

    await thesisAuction.connect(addr1).placeBid(0, { value: auctionPrice });

    // Wait for auction to end, including possible extensions
    await ethers.provider.send("evm_increaseTime", [60 * 15]); // 15 minutes
    await ethers.provider.send("evm_mine", []);

    await expect(thesisAuction.connect(owner).endAuction(0))
      .to.emit(thesisAuction, "AuctionEnded")
      .withArgs(0, await addr1.getAddress(), auctionPrice);

    const auctionInfo = await thesisAuction.auctionInfo(0);
    expect(auctionInfo.active).to.equal(false);
  });

  it("Should allow winner to claim NFT and distribute fees", async function () {
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);
    await thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0);

    await thesisAuction.connect(owner).startAuction(0, 60);

    await thesisAuction.connect(addr1).placeBid(0, { value: auctionPrice });

    // Wait for auction to end, including possible extensions
    await ethers.provider.send("evm_increaseTime", [60 * 15]); // 15 minutes
    await ethers.provider.send("evm_mine", []);

    await thesisAuction.connect(owner).endAuction(0);

    const nftOwnerBefore = await thesisNFT.ownerOf(0);
    expect(nftOwnerBefore).to.equal(await thesisAuction.getAddress());

    await expect(thesisAuction.connect(addr1).claimNFT(0))
      .to.emit(thesisAuction, "Claimed")
      .withArgs(await addr1.getAddress(), 0);

    const nftOwnerAfter = await thesisNFT.ownerOf(0);
    expect(nftOwnerAfter).to.equal(await addr1.getAddress());

    // Check withdrawable balances for owner and platformWallet
    const nftOwnerBalance = await thesisAuction.withdrawable(await owner.getAddress());
    const platformBalance = await thesisAuction.withdrawable(await platformWallet.getAddress());
    expect(nftOwnerBalance).to.be.gt(0);
    expect(platformBalance).to.be.gt(0);
  });

  it("Should allow owner to cancel auction after delay and refund highest bidder", async function () {
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);
    await thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0);

    await thesisAuction.connect(owner).startAuction(0, auctionDuration);

    await thesisAuction.connect(addr1).placeBid(0, { value: auctionPrice });

    // Wait for cancel delay (5 minutes) - simulate by increasing evm time
    await ethers.provider.send("evm_increaseTime", [5 * 60 + 1]);
    await ethers.provider.send("evm_mine", []);

    await expect(thesisAuction.connect(owner).cancelAuction(0))
      .to.emit(thesisAuction, "AuctionCancelled");

    const withdrawable = await thesisAuction.withdrawable(await addr1.getAddress());
    expect(withdrawable).to.equal(auctionPrice);
  });

  it("Should allow nftOwner to reclaim NFT if auction inactive and unsold", async function () {
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);
    await thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0);

    // Auction not started, so inactive and unsold
    await expect(thesisAuction.connect(minters[0]).reclaimNFT(0))
      .to.emit(thesisAuction, "NFTReclaimed");

    expect(await thesisNFT.ownerOf(0)).to.equal(await minters[0].getAddress());
  });

  it("Should allow users to withdraw refundable balances", async function () {
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);
    await thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0);

    await thesisAuction.connect(owner).startAuction(0, auctionDuration);

    await thesisAuction.connect(addr1).placeBid(0, { value: auctionPrice });

    // Outbid addr1, making their bid refundable
    await thesisAuction.connect(addr2).placeBid(0, { value: auctionPrice + ethers.parseEther("0.1")});

    const initialBalance = await ethers.provider.getBalance(await addr1.getAddress());

    const tx = await thesisAuction.connect(addr1).withdrawFunds();
    const receipt = await tx.wait();

    const finalBalance = await ethers.provider.getBalance(await addr1.getAddress());

    expect(finalBalance).to.be.gt(initialBalance);
  });

  it("Should allow owner to emergency withdraw platform fees when paused", async function () {
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);
    await thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0);

    await thesisAuction.connect(owner).startAuction(0, auctionDuration);

    await thesisAuction.connect(addr1).placeBid(0, { value: auctionPrice });

    // Wait for auction to end
    await ethers.provider.send("evm_increaseTime", [auctionDuration + 1]);
    await ethers.provider.send("evm_mine", []);

    await thesisAuction.connect(owner).endAuction(0);

    // Winner claims NFT, which distributes funds to platform wallet
    await thesisAuction.connect(addr1).claimNFT(0);

    await thesisAuction.pause();

    const platformBalanceBefore = await thesisAuction.withdrawable(await platformWallet.getAddress());
    expect(platformBalanceBefore).to.be.gt(0);

    await expect(thesisAuction.emergencyWithdraw())
      .to.emit(thesisAuction, "EmergencyWithdrawal");

    const platformBalanceAfter = await thesisAuction.withdrawable(await platformWallet.getAddress());
    expect(platformBalanceAfter).to.equal(0);
  });

  it("Should pause and unpause contract", async function () {
    await thesisAuction.pause();
    expect(await thesisAuction.paused()).to.equal(true);

    await thesisAuction.unpause();
    expect(await thesisAuction.paused()).to.equal(false);
  });

  it("Should return correct bid history", async function () {
    await thesisNFT.connect(minters[0]).approve(await thesisAuction.getAddress(), 0);
    await thesisNFT.connect(minters[0])["safeTransferFrom(address,address,uint256)"](await minters[0].getAddress(), await thesisAuction.getAddress(), 0);

    await thesisAuction.connect(owner).startAuction(0, auctionDuration);

    await thesisAuction.connect(addr1).placeBid(0, { value: auctionPrice });
    await thesisAuction.connect(addr2).placeBid(0, { value: auctionPrice + ethers.parseEther("0.01") });

    const bidHistory = await thesisAuction.getBidHistory(0);
    expect(bidHistory.length).to.equal(2);
    expect(bidHistory[0].bidder).to.equal(await addr1.getAddress());
    expect(bidHistory[1].bidder).to.equal(await addr2.getAddress());
  });
});
