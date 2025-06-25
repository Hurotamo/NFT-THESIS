import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

// IMPORTANT: Set OWNER1, OWNER2, OWNER3, OWNER4, OWNER5 in your .env file before running this script.

async function main() {
  const [deployer] = await ethers.getSigners();
  const STAKING_ADDRESS = "0xaBEEEc6e6c1f6bfDE1d05db74B28847Ba5b44EAF";
  const initialOwner = process.env.OWNER1 || deployer.address;

  if (!STAKING_ADDRESS) throw new Error("STAKING_CONTRACT_ADDRESS not set in .env");

  const FileRegistry = await ethers.getContractFactory("FileRegistry");
  const fileRegistry = await upgrades.deployProxy(
    FileRegistry,
    [initialOwner, STAKING_ADDRESS],
    { initializer: "initialize" }
  );
  await fileRegistry.waitForDeployment();
  console.log("FileRegistry (proxy) deployed to:", await fileRegistry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 