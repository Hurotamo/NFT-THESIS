import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/buttons/Button";
import { useToast } from "@/hooks/use-toast";
import { IPFSService, uploadToIPFS } from "@/services/ipfsService";
import { ethers } from "ethers";
import ThesisNFTAbi from '@/abis/ThesisNFT.json';
import { CONTRACT_ADDRESSES } from '@/config/contractAddresses';

interface ThesisPostingProps {
  walletAddress: string;
  onThesisPosted: () => void;
}

const contractAddress = CONTRACT_ADDRESSES.thesisNFT;

const ThesisPosting: React.FC<ThesisPostingProps> = ({ walletAddress, onThesisPosted }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [ipfsHash, setIpfsHash] = useState<string>('');
  const [uploadFee, setUploadFee] = useState<number | null>(null);
  const [nftSupply, setNftSupply] = useState<number>(40);
  const [mintPrice, setMintPrice] = useState<string>('1');
  const [ticker, setTicker] = useState<string>('');
  const { toast } = useToast();

  const categories = [
    'Computer Science',
    'Engineering',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Medicine',
    'Economics',
    'Business',
    'Psychology',
    'Literature',
    'History',
    'Other'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = IPFSService.getInstance().validateFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
    setUploadFee(validation.fee || null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !description || !category || !walletAddress || !ticker || !mintPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      });
      return;
    }
    if (nftSupply < 1 || nftSupply > 5) {
      toast({
        title: "Invalid NFT Supply",
        description: "NFT supply must be between 1 and 5.",
        variant: "destructive",
      });
      return;
    }
    if (parseFloat(mintPrice) < 1 || parseFloat(mintPrice) > 3) {
      toast({
        title: "Invalid Minting Price",
        description: "Minting price must be between 1 and 3 tCORE.",
        variant: "destructive",
      });
      return;
    }
    if (ticker.length === 0 || ticker.length > 10) {
      toast({
        title: "Invalid Ticker",
        description: "Ticker must be between 1 and 10 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      const setStatus = (status: { success: boolean; message: string }) => {
        toast({
          title: status.success ? "Success" : "Error",
          description: status.message,
          variant: status.success ? "default" : "destructive",
        });
      };

      const ipfsResult = await uploadToIPFS(selectedFile, setIsUploading, setStatus);

      if (!ipfsResult) {
        throw new Error("Failed to upload to IPFS.");
      }

      const publicPreviewHash = ipfsResult.cid;
      const fullFileHash = ipfsResult.cid;

      if (!window.ethereum) {
        throw new Error("Wallet provider not found. Please install MetaMask.");
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ThesisNFTAbi.abi, signer);

      const mintPriceInWei = ethers.utils.parseEther(mintPrice);
      const fileSize = selectedFile.size;
      const fileName = selectedFile.name;

      const sizeInMB = fileSize / (1024 * 1024);
      let requiredFee;
      if (sizeInMB <= 15) requiredFee = ethers.utils.parseEther("0.01");
      else if (sizeInMB <= 45) requiredFee = ethers.utils.parseEther("0.03");
      else if (sizeInMB <= 60) requiredFee = ethers.utils.parseEther("0.06");
      else if (sizeInMB <= 80) requiredFee = ethers.utils.parseEther("0.09");
      else {
        throw new Error("File size not supported.");
      }

      const tx = await contract.uploadFile(
        ipfsResult.cid,
        fileName,
        publicPreviewHash,
        fullFileHash,
        description,
        fileSize,
        mintPriceInWei,
        nftSupply,
        ticker,
        1,
        10, 
        { value: requiredFee }
      );

      await tx.wait();

      setIpfsHash(ipfsResult.cid);
      setUploadStatus('success');

      toast({
        title: "Thesis Uploaded Successfully",
        description: `Transaction successful with hash: ${tx.hash}`,
      });

      onThesisPosted();

    } catch (error) {
      const e = error as { reason?: string; message?: string };
      console.error('Upload failed:', e);
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: e.reason || e.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setCategory('');
    setUploadStatus('idle');
    setIpfsHash('');
    setUploadFee(null);
    setNftSupply(40);
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-white/10 rounded-xl p-8 border border-white/20 text-center max-w-md mx-auto"
        >
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">Wallet Required</h3>
          <p className="text-gray-300">Please connect your wallet to post a thesis.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Post Your Academe NFT
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Upload your academic research to IPFS and make it available for minting as an Academe NFT
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10"
        >
          {uploadStatus === 'success' ? (
            // Success State
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              <h3 className="text-2xl font-bold text-white">Thesis Uploaded Successfully!</h3>
              <div className="bg-green-600/10 border border-green-400/20 rounded-lg p-4">
                <p className="text-green-400 font-mono text-sm break-all">
                  IPFS Hash: {ipfsHash}
                </p>
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  View on IPFS
                </a>
              </div>
              <p className="text-gray-300">
                Your thesis has been uploaded to IPFS and is now available for minting.
              </p>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Upload Another Thesis
              </Button>
            </div>
          ) : (
            // Upload Form
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Select Thesis File *
                </label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-2">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, DOC, DOCX, TXT (Max 80MB)
                      <br />
                      Fee Tiers: 1–15MB: 0.01 tCORE2, 15–45MB: 0.03 tCORE2, 45–60MB: 0.06 tCORE2, 60–80MB: 0.09 tCORE2
                    </p>
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Thesis Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="Enter your thesis title"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  title="Select a category"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Uploader Controls Section */}
              <div className="space-y-4 border-t border-white/10 pt-6">
                <h4 className="text-lg font-semibold text-white mb-4">Uploader Controls</h4>
                
                {/* NFT Supply Selection */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    NFT Supply (1-5) *
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={nftSupply}
                      onChange={(e) => setNftSupply(parseInt(e.target.value) || 40)}
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      placeholder="40"
                    />
                    <span className="text-gray-400 text-sm">
                      NFTs must be minted before auction
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: 1 NFT | Maximum: 5 NFTs
                  </p>
                </div>

                {/* Ticker/Name Selection */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    NFT Ticker/Name *
                  </label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    placeholder="e.g., BLOCK2024, DEFI2024"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Short identifier for your NFT (max 10 characters)
                  </p>
                </div>

                {/* Minting Fee Setting */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Minting Fee (1-3 tCORE) *
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="3"
                      step="0.1"
                      value={mintPrice}
                      onChange={(e) => setMintPrice(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      placeholder="1.0"
                    />
                    <span className="text-gray-400 text-sm">
                      tCORE per NFT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: 1 tCORE | Maximum: 3 tCORE
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                  placeholder="Provide a brief description of your thesis"
                />
              </div>

              {/* Upload Fee */}
              {selectedFile && uploadFee !== null && (
                <div className="text-yellow-400 font-semibold mb-2">
                  Upload Fee: {uploadFee.toFixed(4)} tCORE2 (depends on file size)
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile || !title || !category}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Uploading to IPFS...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Upload Thesis
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid md:grid-cols-3 gap-6"
        >
          {[
            {
              title: "IPFS Storage",
              description: "Your thesis will be stored on IPFS for decentralized access"
            },
            {
              title: "NFT Ready",
              description: "Once uploaded, investors can mint your thesis as NFTs"
            },
            {
              title: "Secure & Permanent",
              description: "Files are cryptographically secured and permanently stored"
            }
          ].map((item, index) => (
            <div
              key={item.title}
              className="backdrop-blur-md bg-white/5 rounded-lg p-6 border border-white/10"
            >
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.description}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default ThesisPosting;
