# Thesis Vault Protocol

A decentralized platform for academic thesis minting and trading on CORE Blockchain Testnet.

## Features

- Connect to CORE Blockchain Testnet via MetaMask
- Upload and mint academic theses as NFTs
- Stake tokens and participate in governance
- Real-time updates and live data
- Responsive design with modern UI

## Technologies Used

- React with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Framer Motion for animations
- Web3 integration for blockchain connectivity
- CORE Blockchain Testnet

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd thesis-vault-protocol
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:8080`

### MetaMask Setup

The application will automatically prompt you to:
1. Install MetaMask (if not already installed)
2. Add CORE Blockchain Testnet to your wallet
3. Connect your wallet to the platform

### Network Configuration

- **Network Name**: Core Blockchain Testnet
- **Chain ID**: 1111 (0x457)
- **Currency**: tCORE
- **RPC URL**: https://rpc.test.btcs.network
- **Block Explorer**: https://scan.test.btcs.network

- **Network Name**: Core Blockchain TestNet
- **New RPC URL**: https://rpc.test2.btcs.network
- **Chain ID**: 1114
- **Currency Symbol**: tCORE2
- **Block Explorer URL**: https://scan.test2.btcs.network
- **Faucet**: https://scan.test2.btcs.network/faucet
- **Staking Website**: https://stake.test2.btcs.network/

# NFT Thesis Project

This project contains a set of smart contracts for an NFT project, including an NFT, staking, and auction contract.

## Prerequisites

- Node.js and npm installed
- A Core Testnet account with some tCORE for gas fees
- A `.env` file in the `core-contract` directory with your private key:

```
PRIVATE_KEY=your_private_key_here
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
cd core-contract
npm install
```

## Deployment

To deploy the contracts to the Core Testnet, run the following command from the root directory:

```bash
npm run deploy:contracts
```

This will run the deployment scripts in the following order:

1.  `deployStaking.ts`
2.  `deployThesis-NFT.ts`
3.  `deployThesis-Auction.ts`

**Important:** The deployment scripts currently use placeholder addresses for contract dependencies. You will need to update the scripts in `core-contract/scripts` with the actual addresses of the deployed contracts as you deploy them. For example, after deploying the `Staking` contract, you will need to update `deployThesis-NFT.ts` with the new staking contract address.

## Running Tests

To run the smart contract tests, run the following command:

```bash
cd core-contract
npx hardhat test
