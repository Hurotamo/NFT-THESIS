import { useContracts } from "@/hooks/useContracts";

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
    if (!fileRegistry) {
      throw new Error("FileRegistry contract is not available.");
    }
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

  const getAllValidFiles = async () => {
    if (!fileRegistry) throw new Error("FileRegistry contract is not available.");
    return fileRegistry.getAllValidFiles();
  };

  const getFile = async (index: number) => {
    if (!fileRegistry) throw new Error("FileRegistry contract is not available.");
    return fileRegistry.getFile(index);
  };

  const updateFileVerification = async (fileId: number, isVerified: boolean) => {
    if (!fileRegistry) throw new Error("FileRegistry contract is not available.");
    return fileRegistry.updateFileVerification(fileId, isVerified);
  };

  const removeFile = async (fileId: number) => {
    if (!fileRegistry) throw new Error("FileRegistry contract is not available.");
    return fileRegistry.removeFile(fileId);
  };

  const blacklistAddress = async (address: string) => {
    if (!fileRegistry) throw new Error("FileRegistry contract is not available.");
    return fileRegistry.blacklistAddress(address);
  };

  const unblacklistAddress = async (address: string) => {
    if (!fileRegistry) throw new Error("FileRegistry contract is not available.");
    return fileRegistry.unblacklistAddress(address);
  };

  const withdrawFees = async () => {
    if (!fileRegistry) throw new Error("FileRegistry contract is not available.");
    return fileRegistry.withdrawFees();
  };

  return {
    uploadFile,
    getAllValidFiles,
    getFile,
    updateFileVerification,
    removeFile,
    blacklistAddress,
    unblacklistAddress,
    withdrawFees,
  };
} 