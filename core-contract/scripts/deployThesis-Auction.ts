import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying ThesisAuction contract with the account:", deployer.address);

  const THESIS_NFT_ADDRESS = "0x128181A367C4FfB49F03A3619bF024C544026303";
  const initialPrice = ethers.parseEther(process.env.AUCTION_INITIAL_PRICE || "0.1");
  const nftOwner = process.env.AUCTION_NFT_OWNER || deployer.address;
  const platformWallet = process.env.AUCTION_PLATFORM_WALLET || deployer.address;

  const ThesisAuction = await ethers.getContractFactory("ThesisAuction");
  const thesisAuction = await upgrades.deployProxy(
    ThesisAuction,
    [THESIS_NFT_ADDRESS, initialPrice, nftOwner, platformWallet],
    { initializer: "initialize" }
  );

  await thesisAuction.waitForDeployment();

  console.log("ThesisAuction (proxy) deployed to:", await thesisAuction.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 