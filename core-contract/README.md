# Deployment Flow for Core Contracts

To ensure all contract dependencies are satisfied, deploy the contracts in the following order using the provided scripts in `core-contract/scripts/`.

---

## Deployment Summary Table

| Step | Contract         | Script                    | Depends On                |
|------|------------------|---------------------------|---------------------------|
| 1    | Staking          | deployStaking.ts          | None                      |
| 2    | FileRegistry     | deployFileRegistry.ts     | Staking                   |
| 3    | Governance       | deployGovernance.ts       | None                      |
| 4    | AuctionManager   | deployAuction-Manager.ts  | ThesisNFT (alt flow only) |
| 4    | ThesisNFT        | deployThesis-NFT.ts       | Staking, Governance, AuctionManager |
| 5    | ThesisAuction    | deployThesis-Auction.ts   | ThesisNFT                 |

---

## Step-by-Step Deployment Flow

### 1. Deploy Staking (First)
- **Why first?** Other contracts (FileRegistry, ThesisNFT) require its address.
- **Script:** `deployStaking.ts`
- **Output:** Staking contract address

### 2. Deploy FileRegistry
- **Script:** `deployFileRegistry.ts`
- **Input:** Staking contract address

### 3. Deploy Governance
- **Script:** `deployGovernance.ts`
- **Output:** Governance contract address

### 4. Deploy AuctionManager & ThesisNFT
There are two supported deployment flows:

#### A. Recommended (Automated Linking)
- **Script:** `deployThesis-NFT.ts`
- **Order:**
  1. Deploy AuctionManager with a placeholder address (e.g., `ethers.ZeroAddress`).
  2. Deploy ThesisNFT with the AuctionManager address.
  3. Call `setThesisNFT` on AuctionManager to set the real ThesisNFT address.
- **Note:** This script handles both deployments and linking automatically.

#### B. Alternative (Manual Linking)
- **Scripts:** `deployThesis-NFT.ts` and `deployAuction-Manager.ts`
- **Order:**
  1. Deploy ThesisNFT first and note its address.
  2. Deploy AuctionManager using the ThesisNFT address and the deployer address.
- **Note:** Only use this flow if you need to deploy AuctionManager separately. You must update the AuctionManager script with the actual ThesisNFT address before deploying.

### 5. Deploy ThesisAuction (Last)
- **Script:** `deployThesis-Auction.ts`
- **Input:** ThesisNFT contract address

---

## Important Notes
- **Always update the addresses in each script** with the actual deployed addresses from previous steps before running the next script.
- If a script deploys a dependency (e.g., AuctionManager in ThesisNFT), use the address output from the script for subsequent deployments.
- If you use the placeholder pattern, remember to call `setThesisNFT` on AuctionManager after both contracts are deployed.
- The first contract to deploy is always **Staking**.
