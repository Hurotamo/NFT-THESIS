// IMPORTANT: Set OWNER1, OWNER2, OWNER3, OWNER4, OWNER5 in your .env file before running this script.
// Usage: MAX_SUPPLY=80 MIN_SUPPLY=40 npx hardhat run scripts/deployThesis-NFT.ts --network <network>
// Example: MAX_SUPPLY=80 MIN_SUPPLY=40 npx hardhat run scripts/deployThesis-NFT.ts --network core_testnet

import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
dotenv.config();
import { AuctionManager__factory } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying AuctionManager contract with the account:", deployer.address);

  // Hardcoded addresses for dependencies
  const STAKING_ADDRESS = "0xaBEEEc6e6c1f6bfDE1d05db74B28847Ba5b44EAF";
  const GOVERNANCE_ADDRESS = "0x1b383702AC139AE9E72936AAA8edbfe8F30e34D1";
  const FILEREGISTRY_ADDRESS = "0xFE42508065bAF091AaB7285C10a09daD5B075dE6";

  // NFT parameters
  const name = process.env.NFT_NAME || "Thesis NFT";
  const symbol = process.env.NFT_SYMBOL || "TNFT";
  const maxSupply = parseInt(process.env.NFT_MAX_SUPPLY || "5", 10);
  const minSupply = parseInt(process.env.NFT_MIN_SUPPLY || "1", 10);
  const price = ethers.parseEther(process.env.NFT_PRICE || "0.1");
  const baseTokenURI = process.env.NFT_BASE_URI || "ipfs://your_metadata_hash/";

  // 1. Deploy AuctionManager with placeholder address
  const AuctionManager = await ethers.getContractFactory("AuctionManager");
  const initialOwner = process.env.OWNER1 || deployer.address;
  const auctionManager = await upgrades.deployProxy(
    AuctionManager,
    [ethers.ZeroAddress, initialOwner], // Placeholder for ThesisNFT address, OWNER1 as owner
    { initializer: "initialize" }
  );
  await auctionManager.waitForDeployment();
  const auctionManagerAddress = await auctionManager.getAddress();
  console.log("AuctionManager (proxy) deployed to:", auctionManagerAddress);

  // 2. Deploy ThesisNFT with the AuctionManager address
  const ThesisNFT = await ethers.getContractFactory("ThesisNFT");
  const thesisNFT = await upgrades.deployProxy(
    ThesisNFT,
    [
      name,
      symbol,
      maxSupply,
      minSupply,
      price,
      initialOwner,
      STAKING_ADDRESS,
      baseTokenURI,
      auctionManagerAddress,
      GOVERNANCE_ADDRESS
    ],
    { initializer: "initialize" }
  );
  await thesisNFT.waitForDeployment();
  const thesisNFTAddress = await thesisNFT.getAddress();
  console.log("ThesisNFT (proxy) deployed to:", thesisNFTAddress);

  // 3. Call setThesisNFT on AuctionManager to set the real ThesisNFT address
  const auctionManagerTyped = AuctionManager__factory.connect(auctionManagerAddress, deployer);
  const tx = await auctionManagerTyped.setThesisNFT(thesisNFTAddress);
  await tx.wait();
  console.log("Linked ThesisNFT to AuctionManager via setThesisNFT.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 