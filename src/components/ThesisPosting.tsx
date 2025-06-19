import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  generateIPFSFileName, 
  createFileReference, 
  validateFile,
  type FileMetadata,
  type IPFSFileReference 
} from '../utils/fileNaming';
import DataManager from '../utils/dataManager';
import { IPFSService, postThesisAndDeployContract, uploadToIPFSWithPinata } from '../services/ipfsService';
import { ethers } from "ethers";
import ThesisNFTAbi from '../../core-contract/artifacts/contracts/Thesis-NFT.sol/ThesisNFT.json';

interface ThesisPostingProps {
  walletAddress: string;
}

const contractAddress = "0x660C6Bc195a5B12CF453FaCC4AbA419216C6fB24";

const ThesisPosting: React.FC<ThesisPostingProps> = ({ walletAddress }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [ipfsHash, setIpfsHash] = useState<string>('');
  const [uploadFee, setUploadFee] = useState<number | null>(null);
  const [nftSupply, setNftSupply] = useState<number>(40);
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

  const handlePayForUpload = async (fee: number) => {
    if (!window.ethereum) {
      toast({ title: "No wallet found", description: "Please install MetaMask or another wallet.", variant: "destructive" });
      return false;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ThesisNFTAbi.abi, signer);
      const tx = await contract.payForUpload({ value: ethers.utils.parseEther(fee.toString()) });
      await tx.wait();
      toast({ title: "Payment Successful", description: "Upload fee paid on-chain." });
      return true;
    } catch (error: any) {
      toast({ title: "Payment Failed", description: error.message || String(error), variant: "destructive" });
      return false;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !category || !walletAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      });
      return;
    }
    if (nftSupply < 40 || nftSupply > 100) {
      toast({
        title: "Invalid NFT Supply",
        description: "NFT supply must be between 40 and 100.",
        variant: "destructive",
      });
      return;
    }

    // Require payment before upload
    if (!uploadFee) {
      toast({ title: "Upload Fee Missing", description: "Please select a file to calculate the upload fee.", variant: "destructive" });
      return;
    }
    const paid = await handlePayForUpload(uploadFee);
    if (!paid) return;

    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      console.log('Starting thesis upload process...');
      
      // Step 1: Upload to IPFS (real Pinata integration)
      const ipfsResult = await uploadToIPFSWithPinata(selectedFile);
      console.log('File uploaded to IPFS:', ipfsResult.hash);
      
      // Step 2: Create file reference with proper naming
      const fileReference: IPFSFileReference = createFileReference(
        selectedFile,
        walletAddress,
        category,
        ipfsResult.hash
      );
      
      console.log('Generated file reference:', fileReference);
      
      // Step 3: Generate standardized filename
      const standardizedFileName = generateIPFSFileName(fileReference.metadata);
      console.log('Standardized filename:', standardizedFileName);
      
      // Store the IPFS hash for display
      setIpfsHash(ipfsResult.hash);
      setUploadStatus('success');
      
      // Save thesis to DataManager so it appears in minting section
      const thesisData = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        description,
        author: walletAddress, // or replace with an author field if you have one
        university: '', // add a field if you collect it
        year: '', // add a field if you collect it
        field: category,
        ipfsHash: ipfsResult.hash,
        postedAt: new Date(),
        walletAddress,
        status: 'active' as const,
        tags: [],
        nftSupply,
      };
      DataManager.getInstance().saveThesis(thesisData);
      
      // Call backend to deploy contract
      const contractAddress = await postThesisAndDeployContract(thesisData);
      if (contractAddress) {
        toast({
          title: "Contract Deployed!",
          description: `NFT contract deployed at: ${contractAddress}`,
        });
      } else {
        toast({
          title: "Contract Deployment Failed",
          description: "Could not deploy NFT contract.",
          variant: "destructive",
        });
      }
      
      toast({
        title: "Thesis Uploaded Successfully",
        description: `File uploaded to IPFS with hash: ${ipfsResult.hash.slice(0, 10)}...`,
      });

      // Log file reference for backend integration
      console.log('File reference for backend:', {
        ipfsHash: ipfsResult.hash,
        fileName: standardizedFileName,
        title,
        description,
        category,
        researcherAddress: walletAddress,
        timestamp: fileReference.metadata.timestamp,
        originalFileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'There was an error uploading your thesis. Please try again.';
      console.error('Upload failed:', error);
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: errorMessage,
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
            Post Your Thesis
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Upload your academic research to IPFS and make it available for minting as NFTs
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
                    <option key={cat} value={cat} className="bg-gray-800">
                      {cat}
                    </option>
                  ))}
                </select>
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

              {/* NFT Supply */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Number of NFTs (40-100) *
                </label>
                <input
                  type="number"
                  min={40}
                  max={100}
                  value={nftSupply}
                  onChange={e => setNftSupply(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="Enter NFT supply (40-100)"
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
