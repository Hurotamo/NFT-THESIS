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
  const STAKING_ADDRESS = "0x827079c34F584d750eDbB1bFf3e633586BfCBe5D";
  const GOVERNANCE_ADDRESS = "0xaC0C3fC3487a219325b47De41341A0667257dA77";
  const FILEREGISTRY_ADDRESS = "0x1681bDB124Bd82726A3BbD81f9259C46B056512b";

  // NFT parameters
  const name = process.env.NFT_NAME || "Thesis NFT";
  const symbol = process.env.NFT_SYMBOL || "TNFT";
  const maxSupply = parseInt(process.env.NFT_MAX_SUPPLY || "5", 10);
  const minSupply = parseInt(process.env.NFT_MIN_SUPPLY || "1", 10);
  const price = ethers.parseEther(process.env.NFT_PRICE || "0.1");
  const baseTokenURI = process.env.NFT_BASE_URI || "ipfs://your_metadata_hash/";

  // 1. Deploy AuctionManager with placeholder address
  const AuctionManager = await ethers.getContractFactory("AuctionManager");
  const auctionManager = await upgrades.deployProxy(
    AuctionManager,
    [ethers.ZeroAddress, deployer.address], // Placeholder for ThesisNFT address, deployer as owner
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
      deployer.address,
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