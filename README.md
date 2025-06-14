
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

## Usage

1. **Connect Wallet**: Click "Connect to CORE Testnet" to link your MetaMask wallet
2. **Post Thesis**: Upload your academic thesis and mint it as an NFT
3. **Browse & Mint**: Explore available theses and mint copies
4. **Stake & Earn**: Participate in the staking mechanism
5. **Profile**: View your portfolio and transaction history

## Development

### Project Structure

```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── utils/              # Utility functions
└── lib/                # Library configurations
```

### Key Components

- `WalletConnect`: MetaMask integration and network management
- `ThesisPosting`: Thesis upload and minting interface
- `UserProfile`: Portfolio and user data management
- `MintingSection`: NFT minting functionality

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.


Network Name: Core Blockchain TestNet
New RPC URL: https://rpc.test2.btcs.network
Chain ID: 1114
Currency Symbol: tCORE2
Block Explorer URL: https://scan.test2.btcs.network
Faucet: https://scan.test2.btcs.network/faucet
Staking Website: https://stake.test2.btcs.network/