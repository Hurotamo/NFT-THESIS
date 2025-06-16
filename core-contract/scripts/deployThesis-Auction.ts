import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying ThesisAuction contract with the account:", deployer.address);

  const thesisNFTAddress = process.env.THESIS_NFT_ADDRESS;
  if (!thesisNFTAddress) {
    console.error("Please provide the THESIS_NFT_ADDRESS as an environment variable.");
    process.exit(1);
  }

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