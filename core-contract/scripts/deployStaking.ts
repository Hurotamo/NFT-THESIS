import { ethers } from "hardhat";

async function main() {
  // TODO: Replace with your actual CoreToken address and owner address
  const coreTokenAddress = "0xB490Ea033524c85c2740e6dDF6A30c75bbff1A8F";
  const ownerAddress = "0xB490Ea033524c85c2740e6dDF6A30c75bbff1A8F";

  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(coreTokenAddress, ownerAddress);
  await staking.waitForDeployment();

  console.log("Staking contract deployed to:", await staking.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
