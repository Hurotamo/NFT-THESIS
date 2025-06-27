import { ethers } from "hardhat";

async function main() {
  const CollaborativeNFT = await ethers.getContractFactory("CollaborativeNFT");
  const collaborativeNFT = await CollaborativeNFT.deploy();
  await collaborativeNFT.deployed();
  console.log("CollaborativeNFT deployed to:", collaborativeNFT.address);
  // If you want to verify the contract, use: npx hardhat verify <address>
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 