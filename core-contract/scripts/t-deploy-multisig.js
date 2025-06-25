// IMPORTANT: Set OWNER1, OWNER2, OWNER3, OWNER4, OWNER5 in your .env file before running this script.
require('dotenv').config();
const { ethers } = require("hardhat");

async function main() {
  // Read owners from .env
  const owners = [
    process.env.OWNER1,
    process.env.OWNER2,
    process.env.OWNER3,
    process.env.OWNER4,
    process.env.OWNER5
  ];
  const requiredConfirmations = parseInt(process.env.REQUIRED_CONFIRMATIONS, 10);

  // Deploy your contract (replace 'YourMultiSigContract' with your actual contract name, e.g., 'MultiSigWallet')
  const MultiSig = await ethers.getContractFactory("MultiSigWallet");
  const multisig = await MultiSig.deploy();

  // Wait for deployment
  await multisig.deployed();
  console.log("MultiSig deployed to:", multisig.address);

  // Initialize with owners and required confirmations
  const tx = await multisig.initialize(owners, requiredConfirmations);
  await tx.wait();
  console.log("MultiSig initialized with owners and confirmations.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});