import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import dotenv from "dotenv";
dotenv.config();

export class GovernanceContract {
  contract: Contract;

  constructor(contract: Contract) {
    this.contract = contract;
  }

  static async deploy(initialOwner: string) {
    const Governance = await ethers.getContractFactory("Governance");
    const governance = await upgrades.deployProxy(
      Governance,
      [initialOwner],
      { initializer: "initialize" }
    );
    await governance.waitForDeployment();
    return new GovernanceContract(governance as unknown as Contract);
  }

  static async at(address: string) {
    const Governance = await ethers.getContractFactory("Governance");
    const contract = Governance.attach(address) as Contract;
    return new GovernanceContract(contract);
  }

  async getAddress() {
    return await this.contract.getAddress();
  }

  // Add more interaction methods as needed
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const initialOwner = process.env.OWNER1 || deployer.address;
  console.log("Deploying Governance contract with the account:", deployer.address);

  const Governance = await ethers.getContractFactory("Governance");
  const governance = await upgrades.deployProxy(
    Governance,
    [initialOwner],
    { initializer: "initialize" }
  );
  await governance.waitForDeployment();
  console.log("Governance contract (proxy) deployed to:", await governance.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 