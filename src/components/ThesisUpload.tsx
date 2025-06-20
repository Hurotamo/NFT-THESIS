import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { IPFSService, uploadFileAndRegisterOnChain } from '../services/ipfsService';
import { NFTContractService } from '../services/nftContractService';

interface ThesisUploadProps {
  walletAddress: string;
  onUploadSuccess?: (thesis: ThesisData) => void;
}

export interface ThesisData {
  id: string;
  title: string;
  description: string;
  author: string;
  university: string;
  year: string;
  field: string;
  file: File;
  ipfsHash?: string;
  postedAt: Date;
  walletAddress: string;
}

const ThesisUpload: React.FC<ThesisUploadProps> = ({ walletAddress, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [university, setUniversity] = useState('');
  const [year, setYear] = useState('');
  const [field, setField] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ ipfsHash: string; fileSize: number; uploader: string } | null>(null);
  const [mintPrice, setMintPrice] = useState('');
  const [numberOfNFTs, setNumberOfNFTs] = useState('40');
  const { toast } = useToast();

  // Fetch upload history on mount and after upload
  useEffect(() => {
    const fetchUploadHistory = async () => {
      if (!walletAddress) return;
      try {
        const nftService = NFTContractService.getInstance();
        const fileInfo = await nftService.getUploadedFileForUser(walletAddress);
        if (fileInfo && fileInfo.ipfsHash) {
          setUploadedFileInfo(fileInfo);
        } else {
          setUploadedFileInfo(null);
        }
      } catch {
        setUploadedFileInfo(null);
      }
    };
    fetchUploadHistory();
  }, [walletAddress, uploadStatus]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      const validation = IPFSService.getInstance().validateFile(uploadedFile);
      if (!validation.valid) {
        toast({
          title: "Invalid File",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      setFile(uploadedFile);
      toast({
        title: "File Uploaded",
        description: `${uploadedFile.name} ready for posting. Upload Fee: ${validation.fee} tCORE2`,
      });
    }
  };

  const handleSubmit = async () => {
    if (!file || !title || !author || !university || !year || !field || !mintPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields, select a minting price, and upload a thesis file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('pending');
    setTxHash(null);

    try {
      // Upload to IPFS and register on-chain
      const thesisMeta = {
        title,
        description,
        author,
        university,
        year,
        field,
        postedAt: new Date().toISOString(),
        walletAddress
      };
      const { ipfs, txReceipt } = await uploadFileAndRegisterOnChain(file, mintPrice, thesisMeta);

      const newThesis: ThesisData = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        description,
        author,
        university,
        year,
        field,
        file,
        ipfsHash: ipfs.hash,
        postedAt: new Date(),
        walletAddress
      };

      setTxHash(txReceipt.transactionHash);
      setUploadStatus('success');

      toast({
        title: "Thesis Uploaded Successfully!",
        description: `On-chain upload complete. IPFS Hash: ${ipfs.hash}`,
      });

      if (onUploadSuccess) {
        onUploadSuccess(newThesis);
      }

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setAuthor('');
      setUniversity('');
      setYear('');
      setField('');
      setMintPrice('');
    } catch (error: unknown) {
      setUploadStatus('error');
      setTxHash(null);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload thesis. Please try again.';
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10"
      >
        {/* Status and Transaction Hash Display */}
        {uploadStatus === 'pending' && (
          <div className="mb-4 text-blue-400">Uploading thesis and waiting for on-chain confirmation...</div>
        )}
        {uploadStatus === 'success' && txHash && (
          <div className="mb-4 text-green-400">
            Upload successful! <br />
            Transaction Hash: <a href={`https://explorer.coredao.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-300">{txHash}</a>
          </div>
        )}
        {uploadStatus === 'error' && (
          <div className="mb-4 text-red-400">Upload failed. Please try again.</div>
        )}
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Upload className="w-8 h-8 text-blue-400" />
          Upload Your Thesis
        </h3>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Thesis Information */}
          <div className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                Thesis Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your thesis title"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Author Name *
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                University *
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Enter university name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Year *
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">
                  Field *
                </label>
                <input
                  type="text"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Number of NFTs (40-100) *
              </label>
              <input
                type="number"
                min="40"
                max="100"
                value={numberOfNFTs}
                onChange={(e) => setNumberOfNFTs(e.target.value)}
                placeholder="e.g. 40"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Minting Price (per NFT, in tCORE2) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={mintPrice}
                onChange={(e) => setMintPrice(e.target.value)}
                placeholder="Set your price (e.g. 0.05, 0.1, 0.25, etc.)"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1">Set your own minting price for your NFT. This can be any value in tCORE2 (e.g., 0.05, 0.1, 0.25, etc.).</p>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your thesis research..."
                className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>
          </div>

          {/* Right Column - File Upload */}
          <div className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                Upload Thesis File *
              </label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
                <input
                  type="file"
                  id="thesis-upload"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="thesis-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {file ? (
                    <div>
                      <p className="text-green-400 font-semibold">{file.name}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-semibold mb-2">Upload your thesis</p>
                      <p className="text-sm text-gray-400">
                        PDF, TXT, DOC up to 80MB
                        <br />
                        Fee Tiers: 1–15MB: 0.01 tCORE2, 15–45MB: 0.03 tCORE2, 45–60MB: 0.06 tCORE2, 60–80MB: 0.09 tCORE2
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg p-6 border border-white/20">
              <div className="text-center">
                <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h4 className="text-white font-bold text-lg">Thesis Preview</h4>
                <p className="text-gray-300 text-sm mt-2">
                  {title || 'Your thesis title will appear here'}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  by {author || 'Author Name'}
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>{university || 'University'} • {year || 'Year'}</p>
                  <p>{field || 'Field of Study'}</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!file || !title || !author || !university || !year || !field || isUploading}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading Thesis...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  Upload Thesis
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Upload History Section */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-2">Your Uploaded Thesis</h4>
          {uploadedFileInfo && uploadedFileInfo.ipfsHash ? (
            <div className="bg-white/10 rounded-lg p-4 text-white">
              <div><span className="font-bold">IPFS Hash:</span> <a href={`https://ipfs.io/ipfs/${uploadedFileInfo.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-300">{uploadedFileInfo.ipfsHash}</a></div>
              <div><span className="font-bold">File Size:</span> {(uploadedFileInfo.fileSize / 1024 / 1024).toFixed(2)} MB</div>
              <div><span className="font-bold">Uploader:</span> {uploadedFileInfo.uploader}</div>
            </div>
          ) : (
            <div className="text-gray-400">No thesis uploaded yet.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ThesisUpload;
