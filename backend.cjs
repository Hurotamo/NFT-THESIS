require('dotenv').config();

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const { Readable } = require('stream');
const upload = multer();
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

// Use environment variables for credentials
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

const app = express();
app.use(express.json());
app.use(cors());

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Pinata IPFS upload endpoint
app.post('/api/upload-ipfs', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const stream = Readable.from(req.file.buffer);
    const result = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: { name: req.file.originalname }
    });
    res.json({
      hash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      size: req.file.size,
      fileName: req.file.originalname
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

// POST /api/post-thesis
app.post('/api/post-thesis', async (req, res) => {
  const { title, description, nftSupply, ...otherFields } = req.body;

  if (!nftSupply || nftSupply < 40 || nftSupply > 100) {
    return res.status(400).json({ error: 'NFT supply must be between 40 and 100.' });
  }

  // Run the deployment script with env vars
  const deployCmd = `MAX_SUPPLY=${nftSupply} MIN_SUPPLY=40 npx hardhat run scripts/deployThesis-NFT.ts --network core_testnet`;

  exec(deployCmd, { cwd: './core-contract' }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    // Parse the deployed contract address from stdout
    const match = stdout.match(/ThesisNFT deployed to: (0x[a-fA-F0-9]{40})/);
    const contractAddress = match ? match[1] : null;

    if (!contractAddress) {
      return res.status(500).json({ error: 'Failed to parse contract address.' });
    }

    // For now, just return the contract address
    return res.json({ success: true, contractAddress });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
}); 