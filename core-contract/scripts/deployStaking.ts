import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Staking contract with the account:", deployer.address);

  const Staking = await ethers.getContractFactory("Staking");

  // Deploying with deployer as initial admin (tCORE2 is native token)
  const staking = await Staking.deploy(deployer.address);

  await staking.waitForDeployment();

  console.log("Staking contract deployed to:", await staking.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 