# Service Layer Documentation

This directory contains service modules for interacting with deployed smart contracts from the frontend. Each service abstracts contract logic and provides clean methods for use in React components and hooks.

## Existing Services
- `auctionService.ts`: Auction creation, bidding, and management
- `fileRegistryService.ts`: File registration and lookup
- `governanceService.ts`: Governance proposals and voting
- `ipfsService.ts`: IPFS upload and retrieval
- `nftContractService.ts`: NFT minting and management
- `stakingService.ts`: Token staking and rewards

## Usage
Import the relevant service in your component or hook:
```ts
import { mintNFT } from './nftContractService';
```

## Adding a New Service
1. Create a new file (e.g., `myService.ts`) in this directory.
2. Export functions that encapsulate contract or API logic.
3. Document each function with JSDoc comments.
4. Update this README with a description of the new service.

## Best Practices
- Keep service functions pure and reusable.
- Handle errors and return useful error messages.
- Use the service layer in hooks/components for all contract interactions. 