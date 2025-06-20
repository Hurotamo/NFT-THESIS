import { ethers } from "hardhat";

async function main() {
  const FileRegistry = await ethers.getContractFactory("FileRegistry");
  const fileRegistry = await FileRegistry.deploy();
  // In ethers v6, deploy() waits for deployment, no .deployed() needed
  console.log("FileRegistry deployed to:", fileRegistry.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 