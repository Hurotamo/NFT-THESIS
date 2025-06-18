# Thesis Vault Protocol

A decentralized platform for academic thesis minting and trading on CORE Blockchain Testnet.

## Features

- Connect to CORE Blockchain Testnet via MetaMask
- Upload and mint academic theses as NFTs
- Stake tokens and participate in governance
- Real-time updates and live data
- Responsive design with modern UI
- **Full blockchain integration with deployed smart contracts**

## Smart Contracts

The platform is fully integrated with deployed smart contracts on CORE Blockchain Testnet:

- **Staking Contract**: `0xec3E4D8430797665E217530fEE485925d9cf3285`
- **ThesisNFT Contract**: `0x6DE1bC8eCe7009Dc97fD41591408A8777bd2f116`
- **ThesisAuction Contract**: `0x01f28178E6ad6D10B97BC9FDd9588A7DA1a950BE`

### Contract Features

#### Staking Contract
- Stake CORE tokens for rewards
- Earn 20% discount on NFT minting when staking 100+ CORE
- Multiple lock periods available
- Automatic reward calculation

#### ThesisNFT Contract
- Mint thesis NFTs with metadata
- Automatic fee distribution (platform fee + author royalty)
- NFT blurring/unblurring functionality
- One NFT per wallet per thesis limit

#### ThesisAuction Contract
- Create and participate in NFT auctions
- Escrow-enabled bidding system
- Minter-only auction participation
- Automatic NFT transfer to winners

## Technologies Used

- React with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Framer Motion for animations
- Web3.js for blockchain connectivity
- CORE Blockchain Testnet
- MetaMask wallet integration

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- CORE Testnet tokens (tCORE) for gas fees

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

### Getting Testnet Tokens

To get tCORE tokens for testing:
1. Visit the CORE Testnet Faucet
2. Connect your wallet
3. Request test tokens

## Usage

### 1. Connect Wallet
- Click "Connect Wallet" on the homepage
- MetaMask will prompt you to connect to CORE Testnet
- Approve the connection

### 2. Stake Tokens (Optional)
- Navigate to the "Stake" section
- Stake 100+ CORE tokens to earn 20% discount on NFT minting
- Choose your preferred lock period

### 3. Post Thesis
- Go to "Post Thesis" section
- Upload your academic thesis with metadata
- Set minting parameters (price, supply, etc.)

### 4. Mint NFTs
- Browse available theses in the "Mint NFTs" section
- Select a thesis to mint
- Pay the minting fee (discounted if you're staking)
- Receive a blurred NFT certificate

### 5. Participate in Auctions
- List your NFTs for auction
- Bid on other users' NFTs (if you're a minter)
- Win auctions to unblur NFT content

## Contract Integration

The UI is fully integrated with the deployed smart contracts:

### Web3 Context
- Centralized Web3 state management
- Automatic contract initialization
- Network detection and switching
- Wallet connection handling

### Service Layer
- `NFTContractService`: Handles NFT minting and management
- `StakingService`: Manages token staking operations
- `AuctionService`: Handles auction creation and bidding

### Hook Integration
- `useContracts`: Provides clean interface for contract interactions
- `useWeb3`: Manages Web3 state and wallet connections
- Real-time updates and error handling

## Development

### Project Structure
```
src/
├── components/          # React components
├── contexts/           # React contexts (Web3, etc.)
├── hooks/              # Custom hooks
├── services/           # Contract service layer
├── config/             # Configuration files
└── abis/               # Contract ABIs
```

### Key Files
- `src/contexts/Web3Context.tsx`: Web3 state management
- `src/hooks/useContracts.ts`: Contract interaction hooks
- `src/services/*.ts`: Contract service implementations
- `src/config/contractAddresses.ts`: Deployed contract addresses

### Adding New Features
1. Update the appropriate service file
2. Add new methods to `useContracts` hook
3. Update UI components to use the new functionality
4. Test with MetaMask on CORE Testnet

## Testing

### Local Development
1. Start the development server: `npm run dev`
2. Connect MetaMask to CORE Testnet
3. Test all contract interactions
4. Verify transaction confirmations

### Contract Testing
- All contracts are deployed and verified on CORE Testnet
- Test transactions are visible on the block explorer
- Use testnet tokens for all operations

## Troubleshooting

### Common Issues

1. **MetaMask not connecting**
   - Ensure MetaMask is installed and unlocked
   - Check that you're connected to CORE Testnet
   - Try refreshing the page

2. **Transaction failures**
   - Ensure you have sufficient tCORE for gas fees
   - Check that you're on the correct network
   - Verify contract addresses are correct

3. **Network switching issues**
   - The app will automatically add CORE Testnet to MetaMask
   - If issues persist, manually add the network configuration

### Support
For technical support or questions about the contracts, please refer to the project documentation or create an issue in the repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
