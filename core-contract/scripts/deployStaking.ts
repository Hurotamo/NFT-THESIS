import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

// IMPORTANT: Set OWNER1, OWNER2, OWNER3, OWNER4, OWNER5 in your .env file before running this script.

async function main() {
  const [deployer] = await ethers.getSigners();
  const initialOwner = process.env.OWNER1 || deployer.address;

  console.log("Deploying Staking contract with the account:", deployer.address);

  const Staking = await ethers.getContractFactory("Staking");

  const staking = await upgrades.deployProxy(
    Staking,
    [initialOwner],
    { initializer: "initialize", kind: "uups" }
  );

  await staking.waitForDeployment();

  console.log("Staking contract (proxy) deployed to:", await staking.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 