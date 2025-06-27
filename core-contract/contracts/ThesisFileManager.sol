// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ThesisFileManager is Initializable, OwnableUpgradeable {
    struct UploadedFile {
        string ipfsHash;
        string publicPreviewHash;
        string fullFileHash;
        uint256 fileSize;
        address uploader;
        uint256 uploadTime;
        bool isValid;
        uint256 nftSupply;
        string ticker;
        string fileName;
        string fileDescription;
        uint256 previewPages;
        uint256 totalPages;
    }

    mapping(address => UploadedFile) public uploadedFiles;
    mapping(address => uint256) public mintPrices;
    address public thesisNFT;

    /// @notice Emitted when a file is uploaded
    event FileUploaded(address indexed uploader, string ipfsHash, string ticker);
    /// @notice Emitted when a file is updated
    event FileUpdated(address indexed uploader, string ipfsHash, string ticker);
    /// @notice Emitted when files are batch uploaded
    event BatchFilesUploaded(address indexed uploader, uint256 count);

    /// @notice Initializes the contract and sets the owner
    function initialize(address /* initialOwner */) public initializer {
        __Ownable_init();
    }

    /// @notice Set the NFT contract address
    /// @param _nft The address of the NFT contract
    function setThesisNFT(address _nft) external onlyOwner {
        thesisNFT = _nft;
    }

    /// @notice Upload a new file (one per user)
    /// @param ipfsHash The IPFS hash
    /// @param publicPreviewHash The public preview hash
    /// @param fullFileHash The full file hash
    /// @param fileSize The file size
    /// @param nftSupply The NFT supply
    /// @param ticker The ticker string
    /// @param fileName The file name
    /// @param fileDescription The file description
    /// @param previewPages The number of preview pages
    /// @param totalPages The total number of pages
    /// @param mintPrice The mint price
    function uploadFile(
        string memory ipfsHash,
        string memory publicPreviewHash,
        string memory fullFileHash,
        uint256 fileSize,
        uint256 nftSupply,
        string memory ticker,
        string memory fileName,
        string memory fileDescription,
        uint256 previewPages,
        uint256 totalPages,
        uint256 mintPrice
    ) external {
        require(!uploadedFiles[msg.sender].isValid, "AU");
        uploadedFiles[msg.sender] = UploadedFile({
            ipfsHash: ipfsHash,
            publicPreviewHash: publicPreviewHash,
            fullFileHash: fullFileHash,
            fileSize: fileSize,
            uploader: msg.sender,
            uploadTime: block.timestamp,
            isValid: true,
            nftSupply: nftSupply,
            ticker: ticker,
            fileName: fileName,
            fileDescription: fileDescription,
            previewPages: previewPages,
            totalPages: totalPages
        });
        mintPrices[msg.sender] = mintPrice;
        emit FileUploaded(msg.sender, ipfsHash, ticker);
    }

    /// @notice Update an existing uploaded file
    /// @param ipfsHash The IPFS hash
    /// @param publicPreviewHash The public preview hash
    /// @param fullFileHash The full file hash
    /// @param fileSize The file size
    /// @param nftSupply The NFT supply
    /// @param ticker The ticker string
    /// @param fileName The file name
    /// @param fileDescription The file description
    /// @param previewPages The number of preview pages
    /// @param totalPages The total number of pages
    /// @param mintPrice The mint price
    function updateFile(
        string memory ipfsHash,
        string memory publicPreviewHash,
        string memory fullFileHash,
        uint256 fileSize,
        uint256 nftSupply,
        string memory ticker,
        string memory fileName,
        string memory fileDescription,
        uint256 previewPages,
        uint256 totalPages,
        uint256 mintPrice
    ) external {
        require(uploadedFiles[msg.sender].isValid, "NO_FILE");
        uploadedFiles[msg.sender] = UploadedFile({
            ipfsHash: ipfsHash,
            publicPreviewHash: publicPreviewHash,
            fullFileHash: fullFileHash,
            fileSize: fileSize,
            uploader: msg.sender,
            uploadTime: block.timestamp,
            isValid: true,
            nftSupply: nftSupply,
            ticker: ticker,
            fileName: fileName,
            fileDescription: fileDescription,
            previewPages: previewPages,
            totalPages: totalPages
        });
        mintPrices[msg.sender] = mintPrice;
        emit FileUpdated(msg.sender, ipfsHash, ticker);
    }

    /// @notice Batch upload files (one per user)
    /// @param ipfsHashes Array of IPFS hashes
    /// @param publicPreviewHashes Array of public preview hashes
    /// @param fullFileHashes Array of full file hashes
    /// @param fileSizes Array of file sizes
    /// @param nftSupplies Array of NFT supplies
    /// @param tickers Array of ticker strings
    /// @param fileNames Array of file names
    /// @param fileDescriptions Array of file descriptions
    /// @param previewPagesArr Array of preview pages
    /// @param totalPagesArr Array of total pages
    /// @param mintPricesArr Array of mint prices
    function batchUploadFiles(
        string[] memory ipfsHashes,
        string[] memory publicPreviewHashes,
        string[] memory fullFileHashes,
        uint256[] memory fileSizes,
        uint256[] memory nftSupplies,
        string[] memory tickers,
        string[] memory fileNames,
        string[] memory fileDescriptions,
        uint256[] memory previewPagesArr,
        uint256[] memory totalPagesArr,
        uint256[] memory mintPricesArr
    ) external {
        uint256 len = ipfsHashes.length;
        require(
            len == publicPreviewHashes.length &&
            len == fullFileHashes.length &&
            len == fileSizes.length &&
            len == nftSupplies.length &&
            len == tickers.length &&
            len == fileNames.length &&
            len == fileDescriptions.length &&
            len == previewPagesArr.length &&
            len == totalPagesArr.length &&
            len == mintPricesArr.length,
            "Array length mismatch"
        );
        for (uint256 i = 0; i < len; i++) {
            require(!uploadedFiles[msg.sender].isValid, "AU");
            uploadedFiles[msg.sender] = UploadedFile({
                ipfsHash: ipfsHashes[i],
                publicPreviewHash: publicPreviewHashes[i],
                fullFileHash: fullFileHashes[i],
                fileSize: fileSizes[i],
                uploader: msg.sender,
                uploadTime: block.timestamp,
                isValid: true,
                nftSupply: nftSupplies[i],
                ticker: tickers[i],
                fileName: fileNames[i],
                fileDescription: fileDescriptions[i],
                previewPages: previewPagesArr[i],
                totalPages: totalPagesArr[i]
            });
            mintPrices[msg.sender] = mintPricesArr[i];
        }
        emit BatchFilesUploaded(msg.sender, len);
    }

    /// @notice Get uploaded file for a user
    /// @param user The address of the user
    function getUploadedFile(address user) external view returns (UploadedFile memory) {
        return uploadedFiles[user];
    }

    /// @notice Get mint price for a user
    /// @param user The address of the user
    function getMintPrice(address user) external view returns (uint256) {
        return mintPrices[user];
    }

    // For upgradability, add a reserved storage gap
    uint256[50] private __gap;
} 