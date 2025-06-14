import { expect } from "chai";
import { ethers as hardhatEthers } from "hardhat";
import type { Signer, ContractTransaction, Contract } from "ethers";
import { parseEther } from "ethers";
import type { BigNumberish } from "ethers";

// Minimal interface for ERC20Mock contract
interface ERC20Mock {
  approve(spender: string, amount: BigNumberish): Promise<ContractTransaction>;
  transfer(to: string, amount: BigNumberish): Promise<ContractTransaction>;
  balanceOf(account: string): Promise<BigNumberish>;
  connect(signer: Signer): ERC20Mock;
}

// Minimal interface for Staking contract
interface Staking {
  coreToken(): Promise<string>;
  owner(): Promise<string>;
  minimumStake(): Promise<BigNumberish>;
  discountPercent(): Promise<number>;
  stakes(account: string): Promise<BigNumberish>;
  hasDiscount(account: string): Promise<boolean>;
  stake(amount: BigNumberish): Promise<ContractTransaction>;
  unstake(amount: BigNumberish): Promise<ContractTransaction>;
  setMinimumStake(amount: BigNumberish): Promise<ContractTransaction>;
  setDiscountPercent(percent: number): Promise<ContractTransaction>;
  connect(signer: Signer): Staking;
}

describe("Staking Contract", function () {
  let staking: Staking;
  let coreToken: ERC20Mock;
  let coreTokenDeployment: any;
  let stakingDeployment: any;
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

  beforeEach(async function () {
    [owner, user1, user2] = await hardhatEthers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    // Deploy a minimal ERC20Mock contract for testing
    const ERC20MockFactory = await hardhatEthers.getContractFactory("ERC20Mock");
    coreTokenDeployment = await ERC20MockFactory.deploy("Core Token", "CORE", ownerAddress, initialSupply);
    coreToken = coreTokenDeployment as any as ERC20Mock;
    await coreTokenDeployment.waitForDeployment();

    // Deploy the Staking contract
    const StakingFactory = await hardhatEthers.getContractFactory("Staking");
    stakingDeployment = await StakingFactory.deploy((await coreTokenDeployment.getAddress()), ownerAddress);
    staking = stakingDeployment as any as Staking;
    await stakingDeployment.waitForDeployment();

    // Transfer some tokens to user1 and user2 for staking
    await coreToken.transfer(user1Address, stakeAmount);
    await coreToken.transfer(user2Address, stakeAmount);
  });

  describe("Deployment", function () {
    it("Should set the correct core token address", async function () {
      expect(await staking.coreToken()).to.equal(await coreTokenDeployment.getAddress());
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
      await coreToken.connect(user1).approve(await stakingDeployment.getAddress(), stakeAmount);
      await expect(staking.connect(user1).stake(stakeAmount))
        .to.emit(staking, "Staked")
        .withArgs(user1Address, stakeAmount);

      expect(await staking.stakes(user1Address)).to.equal(stakeAmount);
      expect(await coreToken.balanceOf(await stakingDeployment.getAddress())).to.equal(stakeAmount);
    });

    it("Should fail if amount is zero", async function () {
      await coreToken.connect(user1).approve(await stakingDeployment.getAddress(), 0);
      await expect(staking.connect(user1).stake(0)).to.be.revertedWith("Amount must be > 0");
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      await coreToken.connect(user1).approve(await stakingDeployment.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);
    });

    it("Should allow user to unstake tokens", async function () {
      await expect(staking.connect(user1).unstake(unstakeAmount))
        .to.emit(staking, "Unstaked")
        .withArgs(user1Address, unstakeAmount);

      expect(await staking.stakes(user1Address)).to.equal(parseEther("200") - parseEther("50"));
      expect(await coreToken.balanceOf(user1Address)).to.equal(parseEther("50"));
    });

    it("Should fail if amount is zero", async function () {
      await expect(staking.connect(user1).unstake(0)).to.be.revertedWith("Amount must be > 0");
    });

    it("Should fail if unstake amount is greater than stake", async function () {
      await expect(staking.connect(user1).unstake(parseEther("200") + parseEther("1"))).to.be.revertedWith("Insufficient stake");
    });
  });

  describe("Discount", function () {
    it("Should return true if user has minimum stake", async function () {
      await coreToken.connect(user1).approve(await stakingDeployment.getAddress(), minimumStake);
      await staking.connect(user1).stake(minimumStake);
      expect(await staking.hasDiscount(user1Address)).to.equal(true);
    });

    it("Should return false if user has less than minimum stake", async function () {
      await coreToken.connect(user1).approve(await stakingDeployment.getAddress(), parseEther("99") - parseEther("1"));
      await staking.connect(user1).stake(parseEther("99") - parseEther("1"));
      expect(await staking.hasDiscount(user1Address)).to.equal(false);
    });
  });

  describe("Owner functions", function () {
    it("Should allow owner to set minimum stake", async function () {
      const newMinimum = parseEther("50");
      await staking.connect(owner).setMinimumStake(newMinimum);
      expect(await staking.minimumStake()).to.equal(newMinimum);
    });

    it("Should not allow non-owner to set minimum stake", async function () {
      const newMinimum = parseEther("50");
      await expect(staking.connect(user1).setMinimumStake(newMinimum)).to.be.reverted;
    });

    it("Should allow owner to set discount percent", async function () {
      const newPercent = 30;
      await staking.connect(owner).setDiscountPercent(newPercent);
      expect(await staking.discountPercent()).to.equal(newPercent);
    });

    it("Should not allow non-owner to set discount percent", async function () {
      const newPercent = 30;
      await expect(staking.connect(user1).setDiscountPercent(newPercent)).to.be.reverted;
    });

    it("Should fail if discount percent is greater than 100", async function () {
      const invalidPercent = 101;
      await expect(staking.connect(owner).setDiscountPercent(invalidPercent)).to.be.revertedWith("Invalid discount percent");
    });
  });
});
