import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying ThesisAuction contract with the account:", deployer.address);

  // Hardcoded ThesisNFT contract address to avoid environment variable error
  const thesisNFTAddress = "0x84ac88b00dc5255F70077f824d2fF103B454C68A";

  const initialPrice = ethers.parseEther("0.1");
  const nftOwner = deployer.address;
  const platformWallet = deployer.address;

  const ThesisAuction = await ethers.getContractFactory("ThesisAuction");
  const thesisAuction = await ThesisAuction.deploy(
    thesisNFTAddress,
    initialPrice,
    nftOwner,
    platformWallet
  );

  await thesisAuction.waitForDeployment();

  console.log("ThesisAuction deployed to:", await thesisAuction.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 