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
const ethers = require('ethers');
const METADATA_FILE = './thesis-metadata.json';
const fsPromises = require('fs').promises;
const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'nft_thesis';

// Use environment variables for credentials
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

// FileRegistry contract setup
const fileRegistryABI = require('./core-contract/artifacts/contracts/FileRegistry.sol/FileRegistry.json').abi;
const fileRegistryAddress = process.env.FILEREGISTRY_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.CONTRACT_PRIVATE_KEY, provider);
const fileRegistry = new ethers.Contract(fileRegistryAddress, fileRegistryABI, wallet);

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'https://academenft.netlify.app'
}));

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

let db;
MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
  .then(client => {
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ===== USER PROFILES ENDPOINTS =====

// Create or update user profile
app.post('/api/users/profile', async (req, res) => {
  try {
    const { wallet, username, avatarUrl, bio, socialLinks } = req.body;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const userData = {
      wallet,
      username: username || '',
      avatarUrl: avatarUrl || '',
      bio: bio || '',
      socialLinks: socialLinks || [],
      updatedAt: new Date()
    };
    
    await db.collection('users').updateOne(
      { wallet },
      { $set: userData },
      { upsert: true }
    );
    
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/users/profile/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const user = await db.collection('users').findOne({ wallet });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's social feed (activities from followed users)
app.get('/api/users/feed/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const user = await db.collection('users').findOne({ wallet });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get followed users' activities (simplified - you can expand this)
    const followedUsers = user.following || [];
    const feed = await db.collection('activities')
      .find({ 
        wallet: { $in: followedUsers },
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    res.json(feed);
  } catch (error) {
    console.error('Feed fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Follow/unfollow user
app.post('/api/users/follow', async (req, res) => {
  try {
    const { follower, following, action } = req.body; // action: 'follow' or 'unfollow'
    
    if (!follower || !following || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const update = action === 'follow' 
      ? { $addToSet: { following: following } }
      : { $pull: { following: following } };
    
    await db.collection('users').updateOne(
      { wallet: follower },
      update
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Follow action error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== GALLERIES ENDPOINTS =====

// Create gallery
app.post('/api/galleries', async (req, res) => {
  try {
    const { userId, name, description, nftIds, isPublic } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({ error: 'User ID and name are required' });
    }
    
    const gallery = {
      userId,
      name,
      description: description || '',
      nftIds: nftIds || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('galleries').insertOne(gallery);
    gallery._id = result.insertedId;
    
    res.json(gallery);
  } catch (error) {
    console.error('Gallery creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's galleries
app.get('/api/galleries/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const galleries = await db.collection('galleries')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(galleries);
  } catch (error) {
    console.error('Gallery fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get public galleries
app.get('/api/galleries/public', async (req, res) => {
  try {
    const galleries = await db.collection('galleries')
      .find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    res.json(galleries);
  } catch (error) {
    console.error('Public galleries fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update gallery
app.put('/api/galleries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };
    
    const result = await db.collection('galleries').findOneAndUpdate(
      { _id: new require('mongodb').ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'Gallery not found' });
    }
    
    res.json(result.value);
  } catch (error) {
    console.error('Gallery update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== COMMENTS ENDPOINTS =====

// Add comment
app.post('/api/comments', async (req, res) => {
  try {
    const { nftId, userId, text, parentId } = req.body;
    
    if (!nftId || !userId || !text) {
      return res.status(400).json({ error: 'NFT ID, user ID, and text are required' });
    }
    
    const comment = {
      nftId,
      userId,
      text,
      parentId: parentId || null, // For replies
      timestamp: new Date(),
      likes: 0,
      likedBy: []
    };
    
    const result = await db.collection('comments').insertOne(comment);
    comment._id = result.insertedId;
    
    res.json(comment);
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get comments for NFT
app.get('/api/comments/nft/:nftId', async (req, res) => {
  try {
    const { nftId } = req.params;
    const comments = await db.collection('comments')
      .find({ nftId, parentId: null }) // Only top-level comments
      .sort({ timestamp: -1 })
      .toArray();
    
    // Get replies for each comment
    for (let comment of comments) {
      const replies = await db.collection('comments')
        .find({ parentId: comment._id.toString() })
        .sort({ timestamp: 1 })
        .toArray();
      comment.replies = replies;
    }
    
    res.json(comments);
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Like/unlike comment
app.post('/api/comments/like', async (req, res) => {
  try {
    const { commentId, userId, action } = req.body; // action: 'like' or 'unlike'
    
    const update = action === 'like'
      ? { $inc: { likes: 1 }, $addToSet: { likedBy: userId } }
      : { $inc: { likes: -1 }, $pull: { likedBy: userId } };
    
    await db.collection('comments').updateOne(
      { _id: new require('mongodb').ObjectId(commentId) },
      update
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Comment like error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== COLLABORATIONS ENDPOINTS =====

// Create collaboration
app.post('/api/collaborations', async (req, res) => {
  try {
    const { nftId, collaborators, roles, status } = req.body;
    
    if (!nftId || !collaborators || collaborators.length < 2) {
      return res.status(400).json({ error: 'NFT ID and at least 2 collaborators are required' });
    }
    
    const collaboration = {
      nftId,
      collaborators,
      roles: roles || collaborators.map(() => 'author'),
      status: status || 'pending', // pending, active, completed, dissolved
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('collaborations').insertOne(collaboration);
    collaboration._id = result.insertedId;
    
    res.json(collaboration);
  } catch (error) {
    console.error('Collaboration creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get collaborations for NFT
app.get('/api/collaborations/nft/:nftId', async (req, res) => {
  try {
    const { nftId } = req.params;
    const collaborations = await db.collection('collaborations')
      .find({ nftId })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(collaborations);
  } catch (error) {
    console.error('Collaborations fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update collaboration status
app.put('/api/collaborations/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await db.collection('collaborations').findOneAndUpdate(
      { _id: new require('mongodb').ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'Collaboration not found' });
    }
    
    res.json(result.value);
  } catch (error) {
    console.error('Collaboration update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== FORUM ENDPOINTS =====

// Create forum thread
app.post('/api/forum/threads', async (req, res) => {
  try {
    const { title, content, author, tags } = req.body;
    
    if (!title || !content || !author) {
      return res.status(400).json({ error: 'Title, content, and author are required' });
    }
    
    const thread = {
      title,
      content,
      author,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: 0,
      views: 0,
      upvotes: 0,
      downvotes: 0
    };
    
    const result = await db.collection('forum_threads').insertOne(thread);
    thread._id = result.insertedId;
    
    res.json(thread);
  } catch (error) {
    console.error('Thread creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get forum threads
app.get('/api/forum/threads', async (req, res) => {
  try {
    const { page = 1, limit = 20, tag } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = tag ? { tags: tag } : {};
    const threads = await db.collection('forum_threads')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const total = await db.collection('forum_threads').countDocuments(filter);
    
    res.json({
      threads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Threads fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single thread with replies
app.get('/api/forum/threads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const thread = await db.collection('forum_threads').findOne(
      { _id: new require('mongodb').ObjectId(id) }
    );
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // Get replies
    const replies = await db.collection('forum_replies')
      .find({ threadId: id })
      .sort({ createdAt: 1 })
      .toArray();
    
    thread.replies = replies;
    
    // Increment views
    await db.collection('forum_threads').updateOne(
      { _id: new require('mongodb').ObjectId(id) },
      { $inc: { views: 1 } }
    );
    
    res.json(thread);
  } catch (error) {
    console.error('Thread fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add reply to thread
app.post('/api/forum/threads/:id/replies', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, author } = req.body;
    
    if (!content || !author) {
      return res.status(400).json({ error: 'Content and author are required' });
    }
    
    const reply = {
      threadId: id,
      content,
      author,
      createdAt: new Date(),
      upvotes: 0,
      downvotes: 0
    };
    
    const result = await db.collection('forum_replies').insertOne(reply);
    reply._id = result.insertedId;
    
    // Increment reply count
    await db.collection('forum_threads').updateOne(
      { _id: new require('mongodb').ObjectId(id) },
      { $inc: { replies: 1 } }
    );
    
    res.json(reply);
  } catch (error) {
    console.error('Reply creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== EXISTING ENDPOINTS =====

// Pinata IPFS upload endpoint
app.post('/api/upload-ipfs', upload.single('thesisFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const stream = Readable.from(req.file.buffer);
    const result = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: { name: req.file.originalname }
    });
    // Save file info to smart contract
    const tx = await fileRegistry.uploadFile(result.IpfsHash, req.file.originalname);
    await tx.wait();
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

// Save thesis metadata (called after upload)
app.post('/api/thesis-metadata', async (req, res) => {
  try {
    const thesis = req.body;
    if (!thesis || !thesis.ipfsHash) {
      return res.status(400).json({ error: 'Missing thesis metadata or ipfsHash' });
    }
    await db.collection('theses').updateOne(
      { ipfsHash: thesis.ipfsHash },
      { $set: { ...thesis, timestamp: Date.now() } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add a new endpoint to get all uploaded files from smart contract
app.get('/api/contract-files', async (req, res) => {
  try {
    const thesisNFTABI = require('./core-contract/artifacts/contracts/Thesis-NFT.sol/ThesisNFT.json').abi;
    const thesisNFTAddress = process.env.THESIS_NFT_ADDRESS;
    
    if (!thesisNFTAddress) {
      return res.status(400).json({ error: 'THESIS_NFT_ADDRESS not configured' });
    }
    
    const thesisNFTContract = new ethers.Contract(thesisNFTAddress, thesisNFTABI, provider);
    
    // Get the latest block number to scan for events
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 10000); // Scan last 10000 blocks
    
    // Get FileUploaded events
    const fileUploadedEvents = await thesisNFTContract.queryFilter(
      thesisNFTContract.filters.FileUploaded(),
      fromBlock,
      latestBlock
    );
    
    const contractFiles = [];
    for (const event of fileUploadedEvents) {
      const { uploader, ipfsHash, fileSize, feePaid, mintPrice } = event.args;
      
      contractFiles.push({
        uploader: uploader,
        ipfsHash: ipfsHash,
        fileSize: fileSize.toString(),
        feePaid: feePaid.toString(),
        mintPrice: mintPrice.toString(),
        timestamp: event.blockNumber,
        title: `Thesis by ${uploader.slice(0, 6)}...${uploader.slice(-4)}`,
        description: `Thesis uploaded by ${uploader}`,
        author: uploader,
        university: 'Unknown',
        year: new Date().getFullYear().toString(),
        field: 'General',
        postedAt: new Date().toISOString(),
        walletAddress: uploader,
        source: 'contract',
        blockNumber: event.blockNumber
      });
    }
    
    res.json(contractFiles);
  } catch (err) {
    console.error('Fetch contract files error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update /api/all-files to return all metadata from MongoDB and smart contract
app.get('/api/all-files', async (req, res) => {
  try {
    // Get data from MongoDB
    const mongoData = await db.collection('theses').find({}).toArray();
    
    // Get data from smart contract (Thesis-NFT contract)
    const thesisNFTABI = require('./core-contract/artifacts/contracts/Thesis-NFT.sol/ThesisNFT.json').abi;
    const thesisNFTAddress = process.env.THESIS_NFT_ADDRESS;
    
    let contractData = [];
    if (thesisNFTAddress) {
      try {
        const thesisNFTContract = new ethers.Contract(thesisNFTAddress, thesisNFTABI, provider);
        
        // Get the latest block number to scan for events
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 10000); // Scan last 10000 blocks
        
        // Get FileUploaded events
        const fileUploadedEvents = await thesisNFTContract.queryFilter(
          thesisNFTContract.filters.FileUploaded(),
          fromBlock,
          latestBlock
        );
        
        // Process each event to get file data
        for (const event of fileUploadedEvents) {
          const { uploader, ipfsHash, fileSize, feePaid, mintPrice } = event.args;
          
          // Check if this file is already in MongoDB
          const existingInMongo = mongoData.find(item => item.ipfsHash === ipfsHash);
          
          if (!existingInMongo) {
            // Add contract data that's not in MongoDB
            contractData.push({
              uploader: uploader,
              ipfsHash: ipfsHash,
              fileSize: fileSize.toString(),
              feePaid: feePaid.toString(),
              mintPrice: mintPrice.toString(),
              timestamp: Date.now(),
              // Add default metadata since we don't have it from the contract
              title: `Thesis by ${uploader.slice(0, 6)}...${uploader.slice(-4)}`,
              description: `Thesis uploaded by ${uploader}`,
              author: uploader,
              university: 'Unknown',
              year: new Date().getFullYear().toString(),
              field: 'General',
              postedAt: new Date().toISOString(),
              walletAddress: uploader,
              source: 'contract'
            });
          }
        }
      } catch (contractError) {
        console.error('Error fetching from smart contract:', contractError);
        // Continue with MongoDB data only if contract fails
      }
    }
    
    // Merge MongoDB and contract data
    const allData = [...mongoData, ...contractData];
    
    res.json(allData);
  } catch (err) {
    console.error('Fetch all files error:', err);
    res.status(500).json({ error: err.message });
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