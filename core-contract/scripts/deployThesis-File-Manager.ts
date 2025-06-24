import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

const FILEREGISTRY_ADDRESS = "0x1681bDB124Bd82726A3BbD81f9259C46B056512b";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ThesisFileManager contract with the account:", deployer.address);

  const ThesisFileManager = await ethers.getContractFactory("ThesisFileManager");
  const thesisFileManager = await upgrades.deployProxy(
    ThesisFileManager,
    [deployer.address],
    { initializer: "initialize" }
  );
  await thesisFileManager.waitForDeployment();
  console.log("ThesisFileManager (proxy) deployed to:", await thesisFileManager.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 