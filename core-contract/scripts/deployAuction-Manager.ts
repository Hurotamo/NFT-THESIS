import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const thesisNFTAddress = process.env.THESIS_NFT_ADDRESS;
  if (!thesisNFTAddress) throw new Error("THESIS_NFT_ADDRESS not set in .env");

  const [deployer] = await ethers.getSigners();
  const AuctionManager = await ethers.getContractFactory("AuctionManager");
  const auctionManager = await upgrades.deployProxy(
    AuctionManager,
    [thesisNFTAddress, deployer.address],
    { initializer: "initialize" }
  );
  await auctionManager.waitForDeployment();

  console.log("AuctionManager (proxy) deployed to:", await auctionManager.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 