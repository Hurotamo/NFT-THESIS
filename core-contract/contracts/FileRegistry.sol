// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FileRegistry {
    struct FileInfo {
        address uploader;
        string ipfsHash;
        string fileName;
        uint256 timestamp;
    }

    FileInfo[] public files;

    event FileUploaded(address indexed uploader, string ipfsHash, string fileName, uint256 timestamp);

    function uploadFile(string memory ipfsHash, string memory fileName) public {
        files.push(FileInfo(msg.sender, ipfsHash, fileName, block.timestamp));
        emit FileUploaded(msg.sender, ipfsHash, fileName, block.timestamp);
    }

    function getFilesCount() public view returns (uint256) {
        return files.length;
    }

    function getFile(uint256 index) public view returns (address, string memory, string memory, uint256) {
        FileInfo memory f = files[index];
        return (f.uploader, f.ipfsHash, f.fileName, f.timestamp);
    }

    function getAllFiles() public view returns (FileInfo[] memory) {
        return files;
    }
} 