require('dotenv').config({ path: '../.env' }); // Make sure to load the .env file from the root
const { ethers } = require('ethers');

async function main() {
    // --- IMPORTANT: CONFIGURE THESE VALUES ---
    const newOwnerAddress = "0x01ffcfd0afc24a42014edce646d6725cda93c02e"; // <-- 🚨 PASTE YOUR NEW SECURE ADDRESS HERE
    const contractAddress = process.env.THESIS_AUCTION_ADDRESS; // Your deployed ThesisAuction contract address
    // --- END OF CONFIGURATION ---

    if (!newOwnerAddress || newOwnerAddress === "0xYOUR_NEW_SECURE_WALLET_ADDRESS") {
        console.error("🚨 Please open the script file (core-contract/scripts/transferAuctionOwnership.js) and replace '0xYOUR_NEW_SECURE_WALLET_ADDRESS' with the actual address you want to be the new owner.");
        return;
    }

    if (!contractAddress) {
        console.error("🚨 THESIS_AUCTION_ADDRESS is not set in your .env file.");
        return;
    }

    // Set up the provider and wallet using your environment variables
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.CONTRACT_PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
        console.error("🚨 Please make sure RPC_URL and CONTRACT_PRIVATE_KEY are set in your .env file.");
        return;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const currentOwnerWallet = new ethers.Wallet(privateKey, provider);

    // Get the contract ABI
    const contractArtifact = require('../artifacts/contracts/Thesis-Auction.sol/ThesisAuction.json');
    const contractAbi = contractArtifact.abi;

    // Create a contract instance
    const thesisAuctionContract = new ethers.Contract(contractAddress, contractAbi, currentOwnerWallet);

    console.log(`✅ Auction contract loaded at address: ${contractAddress}`);
    console.log(`🔑 Current owner (from private key): ${currentOwnerWallet.address}`);
    console.log(`⏳ Attempting to transfer ownership to: ${newOwnerAddress}...`);

    try {
        // Call the transferOwnership function
        const tx = await thesisAuctionContract.transferOwnership(newOwnerAddress);

        console.log(`Transaction sent! Hash: ${tx.hash}`);
        console.log("Waiting for transaction to be mined...");

        // Wait for the transaction to be confirmed
        await tx.wait();

        console.log("🎉 Ownership successfully transferred!");
        console.log(`The new owner of the contract is now: ${newOwnerAddress}`);

        // Verify the new owner
        const actualNewOwner = await thesisAuctionContract.owner();
        console.log(`✅ Verification successful. Auction contract owner is: ${actualNewOwner}`);

    } catch (error) {
        console.error("❌ An error occurred during the ownership transfer:");
        console.error(error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 