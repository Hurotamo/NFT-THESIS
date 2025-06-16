
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

export class IPFSService {
  private static instance: IPFSService;
  private uploadFees: UploadFeeStructure = {
    baseFee: 0.01, // 0.01 CORE base fee
    sizeMultiplier: 0.005, // 0.005 CORE per MB
    maxFileSize: 50 * 1024 * 1024, // 50MB
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

    // Calculate upload fee
    const sizeInMB = file.size / (1024 * 1024);
    const uploadFee = this.uploadFees.baseFee + (sizeInMB * this.uploadFees.sizeMultiplier);

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
    return this.uploadFees.baseFee + (sizeInMB * this.uploadFees.sizeMultiplier);
  }
}
