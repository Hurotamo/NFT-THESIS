
<<<<<<< HEAD
import { useState } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> origin/feature/local-changes
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
<<<<<<< HEAD
import { create } from 'ipfs-http-client';
=======
>>>>>>> origin/feature/local-changes

interface ThesisUploadProps {
  walletAddress: string;
  onUploadSuccess?: (thesis: any) => void;
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

<<<<<<< HEAD
const ipfs = create({ url: 'http://127.0.0.1:5001/api/v0' });

=======
>>>>>>> origin/feature/local-changes
const ThesisUpload: React.FC<ThesisUploadProps> = ({ walletAddress, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [university, setUniversity] = useState('');
  const [year, setYear] = useState('');
  const [field, setField] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      if (uploadedFile.type === 'application/pdf' || uploadedFile.type.startsWith('text/')) {
        setFile(uploadedFile);
        toast({
          title: "File Uploaded",
          description: `${uploadedFile.name} ready for posting`,
        });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or text file",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!file || !title || !author || !university || !year || !field) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields and upload a thesis file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
<<<<<<< HEAD
      // Upload file to IPFS
      const added = await ipfs.add(file);
      const ipfsHash = added.path;

=======
      // Simulate IPFS upload and thesis posting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
>>>>>>> origin/feature/local-changes
      const newThesis: ThesisData = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        description,
        author,
        university,
        year,
        field,
        file,
<<<<<<< HEAD
        ipfsHash,
=======
        ipfsHash: `Qm${Math.random().toString(36).substr(2, 44)}`,
>>>>>>> origin/feature/local-changes
        postedAt: new Date(),
        walletAddress
      };

      // Store in localStorage for demo purposes
      const existingTheses = JSON.parse(localStorage.getItem('postedTheses') || '[]');
      existingTheses.push({...newThesis, file: undefined}); // Remove file object for storage
      localStorage.setItem('postedTheses', JSON.stringify(existingTheses));
      
      toast({
        title: "Thesis Uploaded Successfully!",
        description: `"${title}" is now available for minting by investors`,
      });
      
      // Call callback if provided
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
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload thesis. Please try again.",
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
                        PDF, TXT, DOC up to 50MB
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
      </motion.div>
    </div>
  );
};

export default ThesisUpload;
