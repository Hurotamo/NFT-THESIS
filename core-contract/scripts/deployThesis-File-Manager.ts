// IMPORTANT: Set OWNER1, OWNER2, OWNER3, OWNER4, OWNER5 in your .env file before running this script.
import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

const FILEREGISTRY_ADDRESS = "0xFE42508065bAF091AaB7285C10a09daD5B075dE6";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ThesisFileManager contract with the account:", deployer.address);

  const ThesisFileManager = await ethers.getContractFactory("ThesisFileManager");
  const initialOwner = process.env.OWNER1 || deployer.address;
  const thesisFileManager = await upgrades.deployProxy(
    ThesisFileManager,
    [initialOwner],
    { initializer: "initialize" }
  );
  await thesisFileManager.waitForDeployment();
  console.log("ThesisFileManager (proxy) deployed to:", await thesisFileManager.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 