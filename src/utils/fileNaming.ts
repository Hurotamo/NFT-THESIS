
/**
 * File naming utilities following the flowchart structure
 * Ensures backend can correctly locate files without confusion
 */

export interface FileMetadata {
  originalName: string;
  researcherAddress: string;
  timestamp: number;
  fileType: 'thesis' | 'research' | 'paper';
  category: string;
}

export interface IPFSFileReference {
  ipfsHash: string;
  fileName: string;
  metadata: FileMetadata;
  contractReference?: string;
}

/**
 * Generate standardized filename for IPFS storage
 * Format: {researcherAddress}_{timestamp}_{category}_{originalName}
 */
export const generateIPFSFileName = (metadata: FileMetadata): string => {
  const sanitizedName = metadata.originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
  
  const shortAddress = metadata.researcherAddress.slice(0, 8);
  const category = metadata.category.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${shortAddress}_${metadata.timestamp}_${category}_${sanitizedName}`;
};

/**
 * Create contract reference identifier
 * Format: CONTRACT_{chainId}_{contractAddress}_{tokenId}
 */
export const generateContractReference = (
  chainId: string,
  contractAddress: string,
  tokenId: string
): string => {
  return `CONTRACT_${chainId}_${contractAddress}_${tokenId}`;
};

/**
 * Parse filename to extract metadata
 */
export const parseIPFSFileName = (fileName: string): Partial<FileMetadata> | null => {
  const parts = fileName.split('_');
  
  if (parts.length < 4) {
    return null;
  }
  
  const [researcherAddress, timestamp, category, ...nameParts] = parts;
  const originalName = nameParts.join('_');
  
  return {
    researcherAddress: researcherAddress,
    timestamp: parseInt(timestamp),
    category: category,
    originalName: originalName
  };
};

/**
 * Generate auction reference
 * Format: AUCTION_{auctionId}_{contractRef}
 */
export const generateAuctionReference = (
  auctionId: string,
  contractReference: string
): string => {
  return `AUCTION_${auctionId}_${contractReference}`;
};

/**
 * Generate staking reference
 * Format: STAKE_{userAddress}_{amount}_{timestamp}
 */
export const generateStakingReference = (
  userAddress: string,
  amount: string,
  timestamp: number
): string => {
  const shortAddress = userAddress.slice(0, 8);
  return `STAKE_${shortAddress}_${amount}_${timestamp}`;
};

/**
 * File validation for upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Please upload PDF, DOC, DOCX, or TXT files.' };
  }
  
  return { valid: true };
};

/**
 * Create file reference for database storage
 */
export const createFileReference = (
  file: File,
  researcherAddress: string,
  category: string,
  ipfsHash: string
): IPFSFileReference => {
  const metadata: FileMetadata = {
    originalName: file.name,
    researcherAddress,
    timestamp: Date.now(),
    fileType: 'thesis',
    category
  };
  
  const fileName = generateIPFSFileName(metadata);
  
  return {
    ipfsHash,
    fileName,
    metadata
  };
};
