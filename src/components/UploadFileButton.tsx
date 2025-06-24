import React, { useState } from "react";
import { useFileRegistryService } from "../services/fileRegistryService";

const UploadFileButton: React.FC = () => {
  const { uploadFile } = useFileRegistryService();
  const [loading, setLoading] = useState(false);
  const [ipfsHash, setIpfsHash] = useState("");
  const [publicPreviewHash, setPublicPreviewHash] = useState("");
  const [fullFileHash, setFullFileHash] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [nftSupply, setNftSupply] = useState("");
  const [ticker, setTicker] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [previewPages, setPreviewPages] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [mintPrice, setMintPrice] = useState("");

  const handleUpload = async () => {
    setLoading(true);
    try {
      const tx = await uploadFile(
        ipfsHash,
        publicPreviewHash,
        fullFileHash,
        Number(fileSize),
        Number(nftSupply),
        ticker,
        fileName,
        fileDescription,
        Number(previewPages),
        Number(totalPages),
        mintPrice
      );
      await tx.wait();
      alert("File uploaded!");
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <input type="text" placeholder="IPFS Hash" value={ipfsHash} onChange={e => setIpfsHash(e.target.value)} />
      <input type="text" placeholder="Public Preview Hash" value={publicPreviewHash} onChange={e => setPublicPreviewHash(e.target.value)} />
      <input type="text" placeholder="Full File Hash" value={fullFileHash} onChange={e => setFullFileHash(e.target.value)} />
      <input type="text" placeholder="File Size" value={fileSize} onChange={e => setFileSize(e.target.value)} />
      <input type="text" placeholder="NFT Supply" value={nftSupply} onChange={e => setNftSupply(e.target.value)} />
      <input type="text" placeholder="Ticker" value={ticker} onChange={e => setTicker(e.target.value)} />
      <input type="text" placeholder="File Name" value={fileName} onChange={e => setFileName(e.target.value)} />
      <input type="text" placeholder="File Description" value={fileDescription} onChange={e => setFileDescription(e.target.value)} />
      <input type="text" placeholder="Preview Pages" value={previewPages} onChange={e => setPreviewPages(e.target.value)} />
      <input type="text" placeholder="Total Pages" value={totalPages} onChange={e => setTotalPages(e.target.value)} />
      <input type="text" placeholder="Mint Price (wei)" value={mintPrice} onChange={e => setMintPrice(e.target.value)} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload File"}
      </button>
    </div>
  );
};

export default UploadFileButton; 