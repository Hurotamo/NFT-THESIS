
<<<<<<< HEAD
import { useState } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> origin/feature/local-changes
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

interface ThesisPostingProps {
  walletAddress: string;
}

const ThesisPosting: React.FC<ThesisPostingProps> = ({ walletAddress }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [ipfsHash, setIpfsHash] = useState<string>('');
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

    const validation = validateFile(file);
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
  };

  const simulateIPFSUpload = async (file: File): Promise<string> => {
    // Simulate IPFS upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a mock IPFS hash
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    return `Qm${timestamp.toString(36)}${fileName.slice(0, 10)}MockHash`;
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

    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      console.log('Starting thesis upload process...');
      
      // Step 1: Upload to IPFS (simulated)
      const mockIpfsHash = await simulateIPFSUpload(selectedFile);
      console.log('File uploaded to IPFS:', mockIpfsHash);
      
      // Step 2: Create file reference with proper naming
      const fileReference: IPFSFileReference = createFileReference(
        selectedFile,
        walletAddress,
        category,
        mockIpfsHash
      );
      
      console.log('Generated file reference:', fileReference);
      
      // Step 3: Generate standardized filename
      const standardizedFileName = generateIPFSFileName(fileReference.metadata);
      console.log('Standardized filename:', standardizedFileName);
      
      // Store the IPFS hash for display
      setIpfsHash(mockIpfsHash);
      setUploadStatus('success');
      
      toast({
        title: "Thesis Uploaded Successfully",
        description: `File uploaded to IPFS with hash: ${mockIpfsHash.slice(0, 10)}...`,
      });

      // Log file reference for backend integration
      console.log('File reference for backend:', {
        ipfsHash: mockIpfsHash,
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

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your thesis. Please try again.",
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
                      PDF, DOC, DOCX, TXT (Max 50MB)
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
