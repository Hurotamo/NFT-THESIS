import { ethers } from "hardhat";

async function main() {
  // TODO: Replace with your actual values
  const thesisNFTAddress = "0xYourThesisNFTAddress";
  const auctionPrice = ethers.parseEther("1");
  const ownerAddress = "0xB490Ea033524c85c2740e6dDF6A30c75bbff1A8F";

  const ThesisAuction = await ethers.getContractFactory("ThesisAuction");
  const thesisAuction = await ThesisAuction.deploy(
    thesisNFTAddress,
    auctionPrice,
    ownerAddress
  );
  await thesisAuction.waitForDeployment();

  console.log("ThesisAuction contract deployed to:", await thesisAuction.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
