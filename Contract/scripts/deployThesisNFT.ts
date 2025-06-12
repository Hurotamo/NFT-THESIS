import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const initialOwner = deployer.address;

  // Use existing CoreToken address on Core testnet
  const coreTokenAddress = "0xB490Ea033524c85c2740e6dDF6A30c75bbff1A8F";

  // Deploy Staking contract
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(coreTokenAddress, initialOwner);
  await staking.waitForDeployment();
  console.log("Staking deployed to:", await staking.getAddress());

  // Deploy ThesisNFT contract with staking contract address
  const ThesisNFT = await ethers.getContractFactory("ThesisNFT");
  const name = "ThesisNFT";
  const symbol = "TNFT";
  const maxSupply = 300;
  const minSupply = 100;
  const price = ethers.parseEther("0.01"); // 0.01 ETH per NFT
  const stakingAddress = await staking.getAddress();

  const thesisNFT = await ThesisNFT.deploy(
    name,
    symbol,
    maxSupply,
    minSupply,
    price,
    initialOwner,
    stakingAddress
  );
  await thesisNFT.waitForDeployment();

  const baseTokenURI = "ipfs://your-ipfs-base-uri/"; // Replace with actual IPFS base URI
  const tx = await (thesisNFT as any).setBaseURI(baseTokenURI);
  await tx.wait();

  console.log("ThesisNFT deployed to:", await thesisNFT.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

