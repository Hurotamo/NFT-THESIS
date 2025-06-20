import { NFTContractService } from './nftContractService';
import { ethers } from 'ethers';
import { ThesisInfo } from "@/components/form/ThesisInfoForm";

const API_URL = import.meta.env.VITE_API_URL;

export interface IPFSUploadResult {
  hash: string;
  url: string;
  size: number;
  fileName: string;
}

export interface UploadFeeStructure {
  baseFee: number; // Base fee in CORE
  sizeMultiplier: number; // Additional fee per MB
  maxFileSize: number; // Max size in bytes (50MB)
  allowedTypes: string[];
}

export interface ThesisMeta {
  title: string;
  description: string;
  author: string;
  university: string;
  year: string;
  field: string;
  postedAt: string;
  walletAddress: string;
  [key: string]: unknown;
}

export class IPFSService {
  private static instance: IPFSService;
  private uploadFees: UploadFeeStructure = {
    baseFee: 0.01, // 0.01 CORE base fee (not used in strict tier mode)
    sizeMultiplier: 0.005, // (not used in strict tier mode)
    maxFileSize: 80 * 1024 * 1024, // 80MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  };

  static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService();
    }
    return IPFSService.instance;
  }

  validateFile(file: File): { valid: boolean; error?: string; fee?: number } {
    // Check file size
    if (file.size > this.uploadFees.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${this.uploadFees.maxFileSize / (1024 * 1024)}MB limit`
      };
    }

    // Check file type
    if (!this.uploadFees.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload PDF, DOC, DOCX, or TXT files.'
      };
    }

    // Calculate upload fee using strict tiers
    const sizeInMB = file.size / (1024 * 1024);
    let uploadFee = 0;
    if (sizeInMB >= 1 && sizeInMB <= 15) uploadFee = 0.01;
    else if (sizeInMB > 15 && sizeInMB <= 45) uploadFee = 0.03;
    else if (sizeInMB > 45 && sizeInMB <= 60) uploadFee = 0.06;
    else if (sizeInMB > 60 && sizeInMB <= 80) uploadFee = 0.09;
    else {
      return {
        valid: false,
        error: 'File size must be between 1MB and 80MB.'
      };
    }

    return {
      valid: true,
      fee: uploadFee
    };
  }

  async uploadToIPFS(file: File): Promise<IPFSUploadResult> {
    // Simulate IPFS upload
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
        resolve({
          hash: mockHash,
          url: `https://ipfs.io/ipfs/${mockHash}`,
          size: file.size,
          fileName: file.name
        });
      }, 2000);
    });
  }

  getUploadFee(fileSizeInBytes: number): number {
    const sizeInMB = fileSizeInBytes / (1024 * 1024);
    if (sizeInMB >= 1 && sizeInMB <= 15) return 0.01;
    if (sizeInMB > 15 && sizeInMB <= 45) return 0.03;
    if (sizeInMB > 45 && sizeInMB <= 60) return 0.06;
    if (sizeInMB > 60 && sizeInMB <= 80) return 0.09;
    return 0;
  }
}

export const postThesis = async (thesisInfo: ThesisInfo, setIsLoading: (isLoading: boolean) => void, setStatus: (status: { success: boolean; message: string }) => void) => {
  try {
    console.log('Starting thesis submission process...');
    console.log('Thesis Info:', thesisInfo);

    const response = await fetch(`${API_URL}/post-thesis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(thesisInfo),
    });
    const data = await response.json();
    if (data.success && data.contractAddress) {
      setStatus({ success: true, message: `Thesis submitted successfully. Contract address: ${data.contractAddress}` });
      return data.contractAddress;
    }
    setStatus({ success: false, message: 'Thesis submission failed. No contract address returned.' });
    return null;
  } catch (error) {
    console.error('Submission failed:', error);
    setStatus({ success: false, message: `Submission failed: ${error instanceof Error ? error.message : String(error)}` });
    return null;
  }
};

export const uploadToIPFS = async (file: File, setIsLoading: (isLoading: boolean) => void, setStatus: (status: { success: boolean; message: string }) => void): Promise<{ cid: string; ipfsUrl: string } | null> => {
  setIsLoading(true);
  try {
    console.log('Starting thesis upload process...');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload-ipfs`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('IPFS upload failed');
    const data = await response.json();
    setStatus({ success: true, message: `Thesis uploaded successfully. IPFS CID: ${data.cid}, IPFS URL: ${data.ipfsUrl}` });
    return data;
  } catch (error) {
    console.error('Upload failed:', error);
    setStatus({ success: false, message: `Upload failed: ${error instanceof Error ? error.message : String(error)}` });
    return null;
  } finally {
    setIsLoading(false);
  }
};

export const saveThesisMetadata = async (metadata: any, setIsLoading: (isLoading: boolean) => void, setStatus: (status: { success: boolean; message: string }) => void) => {
  setIsLoading(true);
  try {
    console.log('Saving thesis metadata...');
    await fetch(`${API_URL}/thesis-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata),
    });
    setStatus({ success: true, message: 'Thesis metadata saved successfully' });
  } catch (error) {
    console.error('Metadata save failed:', error);
    setStatus({ success: false, message: `Metadata save failed: ${error instanceof Error ? error.message : String(error)}` });
  } finally {
    setIsLoading(false);
  }
};

/**
 * Upload a file to IPFS and then register it on-chain with the NFT contract (enforcing fee and size)
 * @param file The file to upload
 * @param mintPrice The mint price in CORE
 * @param thesisMeta Optional thesis metadata
 * @returns The IPFS upload result and the contract transaction receipt
 */
export async function uploadFileAndRegisterOnChain(
  file: File,
  mintPrice: string,
  thesisMeta?: ThesisMeta
): Promise<{ ipfs: IPFSUploadResult; txReceipt: import('ethers').providers.TransactionReceipt }> {
  const ipfsService = IPFSService.getInstance();
  const nftService = NFTContractService.getInstance();
  // Upload to IPFS
  const ipfs = await ipfsService.uploadToIPFS(file);
  // Register on-chain (enforce fee/size and mint price)
  const txReceipt = await nftService.uploadFileToContract(ipfs.hash, ipfs.size, mintPrice);

  // Send metadata to backend for global visibility
  if (thesisMeta) {
    await saveThesisMetadata(thesisMeta, () => {}, () => {});
  }

  return { ipfs, txReceipt };
}
