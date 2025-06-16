 Example User Flow
User uploads file → dApp uploads both full and blurred versions to IPFS.
dApp calculates fee based on file size.
User mints NFT (pays fee, gets 1 NFT, only 1 per wallet).
Once min supply is reached, auction starts.
Only minters can bid in the auction.
Auction winner can claim the NFT; dApp/auction contract calls revealFile.
Winner sees full file; others see intro/blurred version.


Example: Setting IPFS Hashes
As the contract owner, you should set the intro and full IPFS hashes:
Apply to userflow.sh
collection
await nftContract.setIntroIpfsHash(introHash); // Only once per collection
await nftContract.setIpfsHash(fullHash);       // Only once per collection 
If you want per-token hashes, you’ll need to extend the contract to store hashes per tokenId.


 Example: Auction Contract Integration
The auction contract will call revealFile(tokenId) after a successful auction.


Frontend UI Suggestions
Show the blurred/intro file for all NFTs by default.
If the user is the owner or the token is revealed, show the full file.
Show the correct minting fee based on file size.
Only show the auction bid UI to users who have minted.