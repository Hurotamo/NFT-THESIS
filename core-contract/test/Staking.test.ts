import { expect } from "chai";
import { ethers as hardhatEthers } from "hardhat";
import type { Signer } from "ethers";
import { parseEther, ZeroAddress } from "ethers";
import type { BigNumberish } from "ethers";
import type { Staking, ERC20Mock } from "../typechain-types";
import { Staking__factory, ERC20Mock__factory } from "../typechain-types";

describe("Staking Contract", function () {
  let staking: Staking;
  let coreToken: ERC20Mock;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;

  const initialSupply: BigNumberish = parseEther("1000000");
  const minimumStake: BigNumberish = parseEther("100");
  const stakeAmount: BigNumberish = parseEther("200");
  const unstakeAmount: BigNumberish = parseEther("50");
  const discountPercent = 20;

  const emptyPermit: Staking.PermitStruct = {
    deadline: 0,
    v: 0,
    r: "0x0000000000000000000000000000000000000000000000000000000000000000",
    s: "0x0000000000000000000000000000000000000000000000000000000000000000",
  };

  beforeEach(async function () {
    [owner, user1, user2] = await hardhatEthers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    const ERC20MockFactory = (await hardhatEthers.getContractFactory("ERC20Mock")) as ERC20Mock__factory;
    coreToken = await ERC20MockFactory.deploy("Core Token", "CORE", ownerAddress, initialSupply);
    await coreToken.waitForDeployment();

    const StakingFactory = (await hardhatEthers.getContractFactory("Staking")) as Staking__factory;
    staking = await StakingFactory.deploy(await coreToken.getAddress(), ownerAddress);
    await staking.waitForDeployment();

    await coreToken.transfer(user1Address, stakeAmount);
    await coreToken.transfer(user2Address, stakeAmount);
  });

  describe("Deployment", function () {
    it("Should set the correct core token address", async function () {
      expect(await staking.coreToken()).to.equal(await coreToken.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await staking.owner()).to.equal(ownerAddress);
    });

    it("Should set the default minimum stake", async function () {
      expect(await staking.minimumStake()).to.equal(minimumStake);
    });

    it("Should set the default discount percent", async function () {
      expect(await staking.discountPercent()).to.equal(discountPercent);
    });
  });

  describe("Staking", function () {
    it("Should allow user to stake tokens", async function () {
      await coreToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await expect(staking.connect(user1).stake(stakeAmount, emptyPermit))
        .to.emit(staking, "Staked")
        .withArgs(user1Address, stakeAmount);

      const stakeInfo = await staking.stakes(user1Address);
      const latestStake = await staking.userStakeHistoryLatest(user1Address);
      expect(latestStake).to.equal(stakeAmount);
      expect(await coreToken.balanceOf(await staking.getAddress())).to.equal(stakeAmount);
    });

    it("Should fail if amount is zero", async function () {
      await coreToken.connect(user1).approve(await staking.getAddress(), 0);
      await expect(staking.connect(user1).stake(0, emptyPermit)).to.be.revertedWith("Amount must be > 0");
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      await coreToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount, emptyPermit);
      // Increase block number to pass stake lock
      await hardhatEthers.provider.send("evm_mine", []);
      await hardhatEthers.provider.send("evm_mine", []);
    });

    it("Should allow user to unstake tokens", async function () {
      await expect(staking.connect(user1).unstake(unstakeAmount))
        .to.emit(staking, "Unstaked")
        .withArgs(user1Address, unstakeAmount);
      const expectedStake = BigInt(stakeAmount) - BigInt(unstakeAmount);
      const latestStake = await staking.userStakeHistoryLatest(user1Address);
      expect(latestStake).to.equal(expectedStake);
      expect(await coreToken.balanceOf(user1Address)).to.equal(unstakeAmount);
    });

    it("Should fail if amount is zero", async function () {
      await expect(staking.connect(user1).unstake(0)).to.be.revertedWith("Amount must be > 0");
    });

    it("Should fail if unstake amount is greater than stake", async function () {
      const oversizedUnstake = BigInt(stakeAmount) + BigInt(1);
      await expect(staking.connect(user1).unstake(oversizedUnstake)).to.be.revertedWith("Insufficient stake");
    });
  });

  describe("Discount", function () {
    beforeEach(async function () {
      await coreToken.connect(user1).approve(await staking.getAddress(), minimumStake);
      await staking.connect(user1).stake(minimumStake, emptyPermit);
    });
    it("Should return correct discount percentage", async function () {
      expect(await staking.getDiscountPercentage(user1Address)).to.equal(discountPercent);
    });

    it("Should return 0 discount if stake is less than minimum", async function () {
      await hardhatEthers.provider.send("evm_mine", []);
      await hardhatEthers.provider.send("evm_mine", []);
      await staking.connect(user1).unstake(1);
      expect(await staking.getDiscountPercentage(user1Address)).to.equal(0);
    });
  });

  describe("Owner functions", function () {
    it("Should allow owner to queue and execute minimum stake change", async function () {
      const newMinimum = parseEther("50");
      await staking.connect(owner).queueMinimumStake(newMinimum);
      await hardhatEthers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]); // 2 days
      await staking.connect(owner).executeQueuedChanges();
      expect(await staking.minimumStake()).to.equal(newMinimum);
    });

    it("Should not allow non-owner to queue minimum stake change", async function () {
       const newMinimum = parseEther("50");
      await expect(staking.connect(user1).queueMinimumStake(newMinimum)).to.be.reverted;
    });

    it("Should allow owner to queue and execute discount percent change", async function () {
      const newPercent = 30;
       await staking.connect(owner).queueDiscountPercent(newPercent);
       await hardhatEthers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]); // 2 days
       await staking.connect(owner).executeQueuedChanges();
      expect(await staking.discountPercent()).to.equal(newPercent);
    });

    it("Should not allow non-owner to queue discount percent change", async function () {
      const newPercent = 30;
      await expect(staking.connect(user1).queueDiscountPercent(newPercent)).to.be.reverted;
    });

    it("Should fail if discount percent is greater than 100", async function () {
      const invalidPercent = 101;
      await expect(staking.connect(owner).queueDiscountPercent(invalidPercent)).to.be.revertedWith("Invalid discount");
    });
  });
});
