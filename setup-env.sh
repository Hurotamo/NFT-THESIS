#!/bin/bash

# Setup script for NFT Thesis project environment variables
echo "Setting up environment variables for NFT Thesis project..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env
else
    echo ".env file already exists. Updating it..."
fi

# Add environment variables
echo "Adding environment variables to .env file..."

# MongoDB configuration
echo "MONGO_URI=mongodb://localhost:27017" >> .env
echo "DB_NAME=nft_thesis" >> .env

# Pinata IPFS configuration (user needs to fill these)
echo "PINATA_API_KEY=your_pinata_api_key_here" >> .env
echo "PINATA_SECRET_API_KEY=your_pinata_secret_key_here" >> .env

# Blockchain configuration
echo "RPC_URL=https://rpc.testnet.core.org" >> .env
echo "CONTRACT_PRIVATE_KEY=your_contract_private_key_here" >> .env

# Contract addresses (user needs to update these after deployment)
echo "FILEREGISTRY_ADDRESS=0x3A53Fb7531e16E22e6338EE703C674e9Ef958ab1" >> .env
echo "THESIS_NFT_ADDRESS=0x84ac88b00dc5255F70077f824d2fF103B454C68A" >> .env

# Port configuration
echo "PORT=4000" >> .env

echo ""
echo "Environment variables have been added to .env file."
echo ""
echo "IMPORTANT: Please update the following values in .env:"
echo "1. PINATA_API_KEY and PINATA_SECRET_API_KEY - Get from https://app.pinata.cloud/"
echo "2. CONTRACT_PRIVATE_KEY - Your wallet private key for contract interactions"
echo "3. FILEREGISTRY_ADDRESS - Deploy FileRegistry contract and update this address"
echo ""
echo "The THESIS_NFT_ADDRESS is already set to the deployed contract address."
echo ""
echo "After updating the .env file, restart your backend server."

sed -i '' 's/^THESIS_NFT_ADDRESS=.*/THESIS_NFT_ADDRESS=0x84ac88b00dc5255F70077f824d2fF103B454C68A/' .env
sed -i '' 's/^FILEREGISTRY_ADDRESS=.*/FILEREGISTRY_ADDRESS=0x3A53Fb7531e16E22e6338EE703C674e9Ef958ab1/' .env 