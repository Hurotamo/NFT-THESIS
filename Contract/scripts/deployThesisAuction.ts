import { ethers } from "hardhat";

async function main() {
  // Get the Contract Factory
  const ThesisAuction = await ethers.getContractFactory("ThesisAuction");

  // Get deployer address to use as initialOwner
  const [deployer] = await ethers.getSigners();

  // Deploy the contract with constructor arguments
  // Replace with actual ThesisNFT address after deploying ThesisNFT
  const thesisNFTAddress = "0x851Dc0f5A506f9336195d07bfA2deB0cb2E435e9"; 
  const initialPrice = ethers.parseEther("0.1"); // 0.1 ETH as initial price
  const thesisAuction = await ThesisAuction.deploy(thesisNFTAddress, initialPrice, deployer.address);

  // Wait for deployment to complete
  const deployedContract = await thesisAuction.waitForDeployment();

  // Get the deployed contract address
  const contractAddress = await deployedContract.getAddress();
  console.log("ThesisAuction deployed to:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 