import { ethers } from "hardhat";

async function main() {
  // TODO: Replace with your actual values
  const name = "ThesisNFT";
  const symbol = "TNFT";
  const maxSupply = 200;
  const minSupply = 100;
  const price = ethers.parseEther("0.1");
  const ownerAddress = "0xB490Ea033524c85c2740e6dDF6A30c75bbff1A8F";
  const stakingContractAddress = "0xYourStakingContractAddress";
  const baseTokenURI = "ipfs://Qm.../";

  const ThesisNFT = await ethers.getContractFactory("ThesisNFT");
  const thesisNFT = await ThesisNFT.deploy(
    name,
    symbol,
    maxSupply,
    minSupply,
    price,
    ownerAddress,
    stakingContractAddress,
    baseTokenURI
  );
  await thesisNFT.waitForDeployment();

  console.log("ThesisNFT contract deployed to:", await thesisNFT.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
