// IMPORTANT: Set OWNER1, OWNER2, OWNER3, OWNER4, OWNER5 in your .env file before running this script.
import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const thesisNFTAddress = "0x481e774222E07309773cf5c4D063A15Ed23a0238";
  if (!thesisNFTAddress) throw new Error("THESIS_NFT_ADDRESS not set in .env");

  const [deployer] = await ethers.getSigners();
  const AuctionManager = await ethers.getContractFactory("AuctionManager");
  const initialOwner = process.env.OWNER1 || deployer.address;
  const auctionManager = await upgrades.deployProxy(
    AuctionManager,
    [thesisNFTAddress, initialOwner],
    { initializer: "initialize" }
  );
  await auctionManager.waitForDeployment();

  console.log("AuctionManager (proxy) deployed to:", await auctionManager.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 