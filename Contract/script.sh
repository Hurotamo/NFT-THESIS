Sepolia_Eth
npx hardhat run scripts/deployThesisAuction.ts --network sepolia

npx hardhat run scripts/deployStaking.ts --network sepolia

npx hardhat run scripts/deployThesisNFT.ts --network sepolia




core_testnet
 npx hardhat run scripts/deployThesisAuction.ts --network core_testnet

 npx hardhat run scripts/deployStaking.ts --network core_testnet

 npx hardhat run scripts/deployThesisNFT.ts --network core_testnet



test script 

npx jest Contract/tests/Staking.test.ts

npx jest Contract/tests/Thesis-Auction.test.ts

npx jest Contract/tests/Thesis-NFT.test.ts

cd Contract
npx jest tests/Staking.test.ts
