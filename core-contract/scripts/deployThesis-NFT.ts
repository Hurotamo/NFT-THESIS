import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying ThesisNFT contract with the account:", deployer.address);

  const stakingContractAddress = process.env.STAKING_CONTRACT_ADDRESS;
  if (!stakingContractAddress) {
    console.error("Please provide the STAKING_CONTRACT_ADDRESS as an environment variable.");
    process.exit(1);
  }

  const name = "Thesis NFT";
  const symbol = "TNFT";
  const maxSupply = 100;
  const minSupply = 40;
  const price = ethers.parseEther("0.1");
  const baseTokenURI = "ipfs://your_metadata_hash/"; // Replace with your actual metadata hash

  const ThesisNFT = await ethers.getContractFactory("ThesisNFT");
  const thesisNFT = await ThesisNFT.deploy(
    name,
    symbol,
    maxSupply,
    minSupply,
    price,
    deployer.address,
    stakingContractAddress,
    baseTokenURI
  );

  await thesisNFT.waitForDeployment();

  console.log("ThesisNFT deployed to:", await thesisNFT.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 