import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const STAKING_ADDRESS = "0x827079c34F584d750eDbB1bFf3e633586BfCBe5D";
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