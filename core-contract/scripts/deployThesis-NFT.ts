// Usage: MAX_SUPPLY=80 MIN_SUPPLY=40 npx hardhat run scripts/deployThesis-NFT.ts --network <network>
// Example: MAX_SUPPLY=80 MIN_SUPPLY=40 npx hardhat run scripts/deployThesis-NFT.ts --network core_testnet

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying ThesisNFT contract with the account:", deployer.address);

  // Hardcoded Staking contract address to avoid environment variable error
  const stakingContractAddress = "0xca05Bf772568282BE1d917Ac0F1208a9FcDB6114";

  const name = "Thesis NFT";
  const symbol = "TNFT";

  // Accept maxSupply and minSupply from environment variables
  const maxSupply = Number(process.env.MAX_SUPPLY) || 100;
  const minSupply = Number(process.env.MIN_SUPPLY) || 40;

  const price = ethers.parseEther("0.1");
  const baseTokenURI = "ipfs://your_metadata_hash/"; // Replace with your actual metadata hash

  console.log(`Using maxSupply: ${maxSupply}, minSupply: ${minSupply}`);

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