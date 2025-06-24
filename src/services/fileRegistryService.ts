import { useContracts } from "../hooks/useContracts";

export function useFileRegistryService() {
  const { fileRegistry } = useContracts();

  const uploadFile = async (
    ipfsHash: string,
    publicPreviewHash: string,
    fullFileHash: string,
    fileSize: number,
    nftSupply: number,
    ticker: string,
    fileName: string,
    fileDescription: string,
    previewPages: number,
    totalPages: number,
    mintPrice: string,
    overrides = {}
  ) => {
    return fileRegistry.uploadFile(
      ipfsHash,
      publicPreviewHash,
      fullFileHash,
      fileSize,
      nftSupply,
      ticker,
      fileName,
      fileDescription,
      previewPages,
      totalPages,
      mintPrice,
      overrides
    );
  };

  // Add more methods as needed...
  return { uploadFile };
} 