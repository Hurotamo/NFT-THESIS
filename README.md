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

- **Staking Contract**: `0x827079c34F584d750eDbB1bFf3e633586BfCBe5D`
- **FileRegistry Contract**: `0x1681bDB124Bd82726A3BbD81f9259C46B056512b`
- **Governance Contract**: `0xaC0C3fC3487a219325b47De41341A0667257dA77`
- **AuctionManager Contract**: `0x9eFeE607a910Ae030076A3edB909E5b8d5ea4eE2`
- **ThesisNFT Contract**: `0x128181A367C4FfB49F03A3619bF024C544026303`
- **ThesisAuction Contract**: `0xB2b0d83fb7A182200C4B3ef757D5E3Fb69aA40ec`

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

## Backend: Smart Contract Development & Deployment

The smart contracts are located in the `core-contract/` directory. To develop or deploy contracts:

### Prerequisites
- Node.js (v16 or higher)
- Install dependencies in `core-contract/`:
  ```bash
  cd core-contract
  npm install
  ```
- [Hardhat](https://hardhat.org/) is used for contract deployment and testing.

### Deployment Flow
Deploy contracts in the following order (see `core-contract/README.md` for details):

1. **Staking**: `npx hardhat run scripts/deployStaking.ts --network <network>`
2. **FileRegistry**: `npx hardhat run scripts/deployFileRegistry.ts --network <network>`
3. **Governance**: `npx hardhat run scripts/deployGovernance.ts --network <network>`
4. **AuctionManager & ThesisNFT**: Use `deployThesis-NFT.ts` for automated linking, or deploy manually as needed.
5. **ThesisAuction**: `npx hardhat run scripts/deployThesis-Auction.ts --network <network>`

- Always update addresses in scripts as you deploy each contract.
- See `core-contract/README.md` for full step-by-step instructions.

### Running Tests
From `core-contract/`:
```bash
npm test
```

---

## Quick Links
- **CORE Testnet Faucet:** [https://faucet.btcs.network/](https://faucet.btcs.network/)
- **CORE Testnet Block Explorer:** [https://scan.test.btcs.network/](https://scan.test.btcs.network/)

---

## Contributing

- Follow the existing project structure for frontend and backend code.
- Use feature branches and submit Pull Requests for review.
- Write clear commit messages and document major changes in the README or relevant files.
- For contract changes, update both the contract and its deployment/test scripts.
- Run tests before submitting changes.
- For questions, open an issue or contact the project maintainer.
