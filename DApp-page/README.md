# THESIS-NFT DApp

## Overview
THESIS-NFT is a decentralized application (dapp) designed to support innovation by enabling users to invest in groundbreaking student research. The platform allows users to mint thesis projects as NFTs, thereby funding the next generation of innovators on the blockchain. The dapp is branded under the name "THESIS-NFT" with a mission to "Support Innovation. Mint the Future."

## Features
- **Landing Page**: The main entry point of the dapp, providing an introduction and navigation options.
- **Minting Page**: Allows users to mint thesis projects as NFTs, facilitating investment in student research.
- **Investor Dashboard**: Provides investors with a dashboard to track their investments and view relevant data.

## Technical Details
- **Framework**: Built with React and Next.js for server-side rendering and optimized performance.
- **State Management**: Utilizes React Context API with `WalletProvider` and `ThesisProvider` to manage wallet connections and thesis-related data.
- **Animations**: Uses `framer-motion` for smooth animated transitions between pages.
- **Web3 Integration**: Includes web3-specific meta tags and context to support blockchain interactions.
- **Styling**: Employs Tailwind CSS for utility-first styling and responsive design.

## Usage
- Users start at the Landing Page, where they can navigate to either the Minting Page or the Investor Dashboard.
- Navigation between pages is animated for a seamless user experience.
- Wallet connection and thesis data are managed globally via context providers to ensure consistent state across the app.
- Notifications and user feedback are handled through a Toaster component.

## Metadata and SEO
The dapp includes comprehensive metadata for SEO and social media sharing, including:
- Title: "THESIS-NFT - Support Innovation. Mint the Future."
- Description: "Invest in groundbreaking student research by minting thesis projects as NFTs."
- Keywords: NFT, Web3, Education, Thesis, Investment, Blockchain, Ethereum
- Open Graph and Twitter card metadata for rich link previews.
- Web3 and dapp-specific meta tags to enhance blockchain app integration.

---

This documentation provides a professional overview of the THESIS-NFT dapp, its structure, features, and technical foundation. For further details, refer to the source code and component documentation.

## Running Locally

To run the THESIS-NFT dapp locally, follow these steps:

1. **Clone the repository**  
   ```bash
   git clone https://github.com/ThesisNFT/NFT-THESIS
   cd NFT-THESIS/DApp-page
   ```

2. **Install dependencies**  
   Ensure you have [Node.js](https://nodejs.org/) installed (recommended version 16 or higher).  
   Then run:  
   ```bash
   npm install
   ```  
   or if you use pnpm:  
   ```bash
   pnpm install
   ```

3. **Start the development server**  
   Run the following command to start the Next.js development server:  
   ```bash
   npm run dev
   ```  
   or with pnpm:  
   ```bash
   pnpm dev
   ```

4. **Open the dapp in your browser**  
   Navigate to [http://localhost:3000](http://localhost:3000) to view the dapp.

5. **Connect your wallet**  
   Use the wallet connection feature in the dapp to connect your Ethereum wallet and interact with the platform.

---

For any issues or further setup instructions, please refer to the project documentation or contact the THESIS-NFT team.
