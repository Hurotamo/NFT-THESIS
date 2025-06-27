// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title File Registry 
/// @author rjay solamo
/// @notice This contract manages file uploads with comprehensive security measures.
/// @dev Implements advanced security protections and emergency controls.
interface IStaking {
    function getDiscountPercentage(address user) external view returns (uint256);
}

contract FileRegistry is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using Address for address;

    // ============ SECURITY CONSTANTS ============
    uint256 public constant MAX_FILE_NAME_LENGTH = 100;
    uint256 public constant MAX_IPFS_HASH_LENGTH = 100;
    uint256 public constant UPLOAD_COOLDOWN = 5 minutes;
    uint256 public constant EMERGENCY_WITHDRAWAL_DELAY = 24 hours;
    uint256 public constant BASE_UPLOAD_FEE = 0.01 ether; // Base fee for file uploads
    uint256 public constant MAX_DISCOUNT_PERCENT = 50; // Maximum 50% discount
    uint256 public constant TIMELOCK_DELAY = 24 hours;
    
    // ============ IPFS VALIDATION CONSTANTS ============
    uint256 public constant MIN_CID_LENGTH = 46; // Minimum CID v1 length
    uint256 public constant MAX_CID_LENGTH = 62; // Maximum CID v1 length
    bytes1 public constant CID_V0_PREFIX = 0x12; // CID v0 prefix
    bytes1 public constant CID_V1_PREFIX = 0x01; // CID v1 prefix
    string public constant IPFS_PREFIX = "ipfs://";
    string public constant IPFS_GATEWAY_PREFIX = "https://ipfs.io/ipfs/";

    // ============ STATE VARIABLES ============
    uint256 public totalFiles;
    bool public emergencyMode;
    uint256 public uploadFee;

    // ============ SECURITY: EMERGENCY CONTROLS ============
    uint256 public emergencyWithdrawalRequestTime;
    address public emergencyWithdrawalRequestor;

    // ============ CONTRACT REFERENCES ============
    IStaking public stakingContract;

    // ============ STRUCTS ============
    struct FileInfo {
        address uploader;
        string ipfsHash;
        string fileName;
        uint256 timestamp;
        bool isValid;
        uint256 fileSize;
        uint256 feePaid;
        uint256 discountApplied;
        bool isVerified; // New field for IPFS verification
        uint256 verificationTimestamp;
    }

    struct OptimizedFileInfo {
        address uploader;
        uint64 timestamp;
        uint96 fileSize;
        bool isValid;
    }

    // ============ MAPPINGS ============
    mapping(uint256 => FileInfo) public files;
    mapping(address => bool) public authorizedUploaders;
    mapping(address => uint256) public userFileCount;
    mapping(address => uint256) public lastUploadTime;
    mapping(address => bool) public blacklistedAddresses;
    mapping(address => uint256) public uploadAttempts;
    mapping(address => uint256) public uploadAttemptsTimestamp;
    mapping(string => bool) public verifiedIpfsHashes; // Track verified IPFS hashes
    mapping(string => uint256) public hashUsageCount; // Track hash usage to prevent duplicates
    mapping(bytes32 => uint256) public timelockExecutionTime;
    mapping(bytes32 => mapping(address => bool)) public confirmations;
    uint256 public requiredConfirmations;
    uint256 public authorizedUploaderCount;

    // Add new events for multi-sig operations
    event OperationProposed(bytes32 indexed operationHash, address indexed proposer, string operationType);
    event OperationConfirmed(bytes32 indexed operationHash, address indexed confirmer);
    event OperationExecuted(bytes32 indexed operationHash);

    // Add operation types enum
    enum OperationType {
        TransferOwnership,
        UpdateUploadFee,
        EmergencyAction,
        UpdateFileVerification,
        BlacklistAddress
    }

    // Add operation struct
    struct Operation {
        OperationType operationType;
        address target;
        uint256 value;
        string stringValue;
        bool executed;
        uint256 numConfirmations;
        uint256 proposedTime;
    }

    // Add operations mapping
    mapping(bytes32 => Operation) public operations;
    mapping(bytes32 => mapping(address => bool)) public hasConfirmed;

    // ============ EVENTS ============
    event FileUploaded(
        address indexed uploader, 
        string ipfsHash, 
        string fileName, 
        uint256 timestamp,
        uint256 fileId,
        uint256 feePaid,
        uint256 discountApplied,
        bool isVerified
    );
    event FileRemoved(uint256 fileId, address indexed uploader);
    event AuthorizedUploaderSet(address indexed uploader, bool isAuthorized);
    event EmergencyModeActivated(address indexed by);
    event EmergencyModeDeactivated(address indexed by);
    event AddressBlacklisted(address indexed user);
    event AddressUnblacklisted(address indexed user);
    event UploadAttemptLimitExceeded(address indexed user);
    event UploadFeeUpdated(uint256 newFee);
    event IpfsHashVerified(string indexed ipfsHash, bool isValid);
    event FileVerificationUpdated(uint256 indexed fileId, bool isVerified);
    event SecurityParametersUpdated(
        uint256 newUploadFee,
        uint256 newMaxFileSize,
        address indexed updatedBy
    );

    // ============ MODIFIERS ============
    modifier whenNotEmergency() {
        require(!emergencyMode, "Contract is in emergency mode");
        _;
    }

    modifier onlyAfterDelay(uint256 delay) {
        require(block.timestamp >= emergencyWithdrawalRequestTime + delay, "Delay not met");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedUploaders[msg.sender] || msg.sender == owner(), 
            "Unauthorized uploader"
        );
        _;
    }

    modifier notBlacklisted(address user) {
        require(!blacklistedAddresses[user], "Address is blacklisted");
        _;
    }

    modifier rateLimited() {
        require(block.timestamp >= lastUploadTime[msg.sender] + UPLOAD_COOLDOWN, "Rate limit: wait before next upload");
        _;
    }

    modifier validFileName(string memory fileName) {
        require(bytes(fileName).length > 0, "Empty filename");
        require(bytes(fileName).length <= MAX_FILE_NAME_LENGTH, "Filename too long");
        _;
    }

    modifier validIpfsHash(string memory ipfsHash) {
        require(bytes(ipfsHash).length > 0, "Empty IPFS hash");
        require(bytes(ipfsHash).length <= MAX_IPFS_HASH_LENGTH, "IPFS hash too long");
        require(isValidIpfsCid(ipfsHash), "Invalid IPFS CID format");
        _;
    }

    // ============ INITIALIZER ============
    function initialize(address initialOwner, address stakingContractAddress) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        require(initialOwner != address(0), "Invalid owner address");
        require(stakingContractAddress != address(0), "Invalid staking contract address");
        authorizedUploaders[initialOwner] = true;
        stakingContract = IStaking(stakingContractAddress);
        uploadFee = BASE_UPLOAD_FEE;
        requiredConfirmations = 2;
    }

    // ============ IPFS VALIDATION FUNCTIONS ============
    
    /// @dev Validate IPFS CID format
    function isValidIpfsCid(string memory cid) public pure returns (bool) {
        bytes memory cidBytes = bytes(cid);
        if (cidBytes.length < 32 || cidBytes.length > 100) { return false; }
        // Accept v0, v1, and future CIDs (alphanumeric, base32, base58btc, etc.)
        for (uint256 i = 0; i < cidBytes.length; i++) {
            bytes1 char = cidBytes[i];
            if (!((char >= 0x30 && char <= 0x39) || (char >= 0x41 && char <= 0x5A) || (char >= 0x61 && char <= 0x7A))) {
                return false;
            }
        }
        return true;
    }
    
    /// @dev Verify IPFS hash format and basic structure
    function verifyIpfsHash(string memory ipfsHash) external pure returns (bool) {
        return isValidIpfsCid(ipfsHash);
    }
    
    /// @dev Check if IPFS hash has been previously verified
    function isHashVerified(string memory ipfsHash) external view returns (bool) {
        return verifiedIpfsHashes[ipfsHash];
    }
    
    /// @dev Mark IPFS hash as verified (admin function)
    function markHashAsVerified(string memory ipfsHash) external onlyOwner {
        require(isValidIpfsCid(ipfsHash), "Invalid IPFS CID");
        verifiedIpfsHashes[ipfsHash] = true;
        emit IpfsHashVerified(ipfsHash, true);
    }
    
    /// @dev Remove IPFS hash verification (admin function)
    function removeHashVerification(string memory ipfsHash) external onlyOwner {
        verifiedIpfsHashes[ipfsHash] = false;
        emit IpfsHashVerified(ipfsHash, false);
    }
    
    /// @dev Update file verification status
    function updateFileVerification(uint256 fileId, bool isVerified) external onlyOwner {
        require(fileId < totalFiles, "File does not exist");
        require(files[fileId].isValid, "File not valid");
        
        files[fileId].isVerified = isVerified;
        files[fileId].verificationTimestamp = block.timestamp;
        
        emit FileVerificationUpdated(fileId, isVerified);
    }

    // ============ SECURITY: EMERGENCY FUNCTIONS ============
    
    /// @dev Activate emergency mode - only owner
    function activateEmergencyMode() external onlyOwner {
        emergencyMode = true;
        emit EmergencyModeActivated(msg.sender);
    }

    /// @dev Deactivate emergency mode - only owner
    function deactivateEmergencyMode() external onlyOwner {
        emergencyMode = false;
        emit EmergencyModeDeactivated(msg.sender);
    }

    /// @dev Request emergency withdrawal with delay
    function requestEmergencyWithdrawal() external onlyOwner {
        emergencyWithdrawalRequestTime = block.timestamp;
        emergencyWithdrawalRequestor = msg.sender;
    }

    /// @dev Execute emergency withdrawal after delay
    function executeEmergencyWithdrawal() 
        external 
        onlyOwner 
        onlyAfterDelay(EMERGENCY_WITHDRAWAL_DELAY) 
    {
        require(emergencyWithdrawalRequestor == msg.sender, "Not the requestor");
        require(emergencyMode, "Not in emergency mode");
        
        emergencyWithdrawalRequestTime = 0;
        emergencyWithdrawalRequestor = address(0);
    }

    // ============ ADMIN FUNCTIONS ============
    
    /// @notice Set authorized uploader
    function setAuthorizedUploader(address uploader, bool isAuthorized) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        require(uploader != address(0), "Invalid address");
        if (authorizedUploaders[uploader] != isAuthorized) {
            if (isAuthorized) {
                authorizedUploaderCount++;
            } else {
                authorizedUploaderCount--;
            }
        }
        authorizedUploaders[uploader] = isAuthorized;
        emit AuthorizedUploaderSet(uploader, isAuthorized);
    }

    /// @dev Blacklist address for security
    function blacklistAddress(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        require(user != owner(), "Cannot blacklist owner");
        blacklistedAddresses[user] = true;
        emit AddressBlacklisted(user);
    }

    /// @dev Remove address from blacklist
    function unblacklistAddress(address user) external onlyOwner {
        blacklistedAddresses[user] = false;
        emit AddressUnblacklisted(user);
    }

    /// @dev Pause contract
    function pause() external onlyOwner {
        _pause();
    }

    /// @dev Unpause contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @dev Remove file (admin only)
    function removeFile(uint256 fileId) external onlyOwner whenNotPaused {
        require(fileId < totalFiles, "File does not exist");
        require(files[fileId].isValid, "File already removed");
        
        address uploader = files[fileId].uploader;
        files[fileId].isValid = false;
        userFileCount[uploader]--;
        
        emit FileRemoved(fileId, uploader);
    }

    /// @dev Update upload fee
    function setUploadFee(uint256 newFee) external onlyOwner whenNotPaused {
        require(newFee > 0, "Fee must be greater than 0");
        require(newFee <= 0.1 ether, "Fee too high");
        uploadFee = newFee;
        emit UploadFeeUpdated(newFee);
    }

    /// @dev Withdraw accumulated fees
    function withdrawFees() external onlyOwner whenNotPaused {
        require(!emergencyMode, "Use emergency withdrawal in emergency mode");
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }

    // ============ CORE FUNCTIONS ============
    
    /// @notice Upload a file to the registry
    /// @param ipfsHash The IPFS hash of the file
    /// @param fileName The name of the file
    /// @param fileSize The size of the file in bytes
    /// @dev Secure file upload with comprehensive validation and discount integration
    function uploadFile(
        string memory ipfsHash, 
        string memory fileName,
        uint256 fileSize
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        whenNotEmergency 
        notBlacklisted(msg.sender) 
        rateLimited 
        validFileName(fileName) 
        validIpfsHash(ipfsHash) 
    {
        // Anti-spam protection
        require(fileSize > 0, "Invalid file size");
        require(fileSize <= 100 * 1024 * 1024, "File size too large"); // 100MB max
        
        // Prevent duplicate hash usage
        require(hashUsageCount[ipfsHash] == 0, "IPFS hash already used");
        
        // Upload attempt tracking
        uint256 currentAttempts = uploadAttempts[msg.sender];
        if (currentAttempts > 0) {
            uint256 timeSinceLastAttempt = block.timestamp - uploadAttemptsTimestamp[msg.sender];
            if (timeSinceLastAttempt < 1 hours) {
                require(currentAttempts < 5, "Too many upload attempts");
            } else {
                uploadAttempts[msg.sender] = 0;
            }
        }
        
        uploadAttempts[msg.sender]++;
        uploadAttemptsTimestamp[msg.sender] = block.timestamp;

        // Calculate fee with discount
        uint256 baseFee = uploadFee;
        uint256 discountPercent = stakingContract.getDiscountPercentage(msg.sender);
        uint256 discountAmount = 0;
        uint256 finalFee = baseFee;

        if (discountPercent > 0) {
            discountAmount = (baseFee * discountPercent) / 100;
            finalFee = baseFee - discountAmount;
        }

        require(msg.value >= finalFee, "Insufficient upload fee");
        require(msg.value <= finalFee + 0.01 ether, "Excessive fee payment");

        uint256 fileId = totalFiles;
        
        files[fileId] = FileInfo({
            uploader: msg.sender,
            ipfsHash: ipfsHash,
            fileName: fileName,
            timestamp: block.timestamp,
            isValid: true,
            fileSize: fileSize,
            feePaid: finalFee,
            discountApplied: discountAmount,
            isVerified: verifiedIpfsHashes[ipfsHash], // Auto-verify if hash is pre-verified
            verificationTimestamp: verifiedIpfsHashes[ipfsHash] ? block.timestamp : 0
        });

        totalFiles++;
        userFileCount[msg.sender]++;
        lastUploadTime[msg.sender] = block.timestamp;
        hashUsageCount[ipfsHash] = 1; // Mark hash as used

        emit FileUploaded(msg.sender, ipfsHash, fileName, block.timestamp, fileId, finalFee, discountAmount, files[fileId].isVerified);

        // Refund excess fee
        uint256 excess = msg.value - finalFee;
        if (excess > 0) {
            (bool sent, ) = payable(msg.sender).call{value: excess}("");
            require(sent, "Refund failed");
        }
    }

    /// @notice Batch upload multiple files to the registry
    /// @param ipfsHashes Array of IPFS hashes
    /// @param fileNames Array of file names
    /// @param fileSizes Array of file sizes
    function batchUploadFiles(
        string[] memory ipfsHashes,
        string[] memory fileNames,
        uint256[] memory fileSizes
    ) external payable nonReentrant whenNotPaused whenNotEmergency notBlacklisted(msg.sender) {
        require(ipfsHashes.length == fileNames.length && fileNames.length == fileSizes.length, "Array length mismatch");
        uint256 totalFee = 0;
        for (uint256 i = 0; i < ipfsHashes.length; i++) {
            // Calculate fee for each file
            uint256 baseFee = uploadFee;
            uint256 discountPercent = stakingContract.getDiscountPercentage(msg.sender);
            uint256 discountAmount = (baseFee * discountPercent) / 100;
            uint256 finalFee = baseFee - discountAmount;
            totalFee += finalFee;
            // Call internal upload logic (copy-paste from uploadFile, minus msg.value logic)
            require(fileSizes[i] > 0, "Invalid file size");
            require(fileSizes[i] <= 100 * 1024 * 1024, "File size too large");
            require(hashUsageCount[ipfsHashes[i]] == 0, "IPFS hash already used");
            require(bytes(fileNames[i]).length > 0, "Empty filename");
            require(bytes(fileNames[i]).length <= MAX_FILE_NAME_LENGTH, "Filename too long");
            require(isValidIpfsCid(ipfsHashes[i]), "Invalid IPFS CID format");
            uint256 fileId = totalFiles;
            files[fileId] = FileInfo({
                uploader: msg.sender,
                ipfsHash: ipfsHashes[i],
                fileName: fileNames[i],
                timestamp: block.timestamp,
                isValid: true,
                fileSize: fileSizes[i],
                feePaid: finalFee,
                discountApplied: discountAmount,
                isVerified: verifiedIpfsHashes[ipfsHashes[i]],
                verificationTimestamp: verifiedIpfsHashes[ipfsHashes[i]] ? block.timestamp : 0
            });
            totalFiles++;
            userFileCount[msg.sender]++;
            lastUploadTime[msg.sender] = block.timestamp;
            hashUsageCount[ipfsHashes[i]] = 1;
            emit FileUploaded(msg.sender, ipfsHashes[i], fileNames[i], block.timestamp, fileId, finalFee, discountAmount, files[fileId].isVerified);
        }
        require(msg.value >= totalFee, "Insufficient upload fee");
        require(msg.value <= totalFee + 0.01 ether, "Excessive fee payment");
        // Refund excess fee
        uint256 excess = msg.value - totalFee;
        if (excess > 0) {
            (bool sent, ) = payable(msg.sender).call{value: excess}("");
            require(sent, "Refund failed");
        }
    }

    // ============ VIEW FUNCTIONS ============
    
    /// @notice Get file count
    function getFilesCount() external view returns (uint256) {
        return totalFiles;
    }

    /// @notice Get file info with validation
    /// @param index The file index
    function getFile(uint256 index) 
        external 
        view 
        returns (address, string memory, string memory, uint256, bool, uint256, uint256, uint256, bool, uint256) 
    {
        require(index < totalFiles, "File does not exist");
        FileInfo memory f = files[index];
        return (f.uploader, f.ipfsHash, f.fileName, f.timestamp, f.isValid, f.fileSize, f.feePaid, f.discountApplied, f.isVerified, f.verificationTimestamp);
    }

    /// @notice Get all valid files (gas optimized, off-chain indexing recommended for large sets)
    function getAllValidFiles() external view returns (FileInfo[] memory) {
        uint256 validCount = 0;
        for (uint256 i = 0; i < totalFiles; i++) {
            if (files[i].isValid) {
                validCount++;
            }
        }
        FileInfo[] memory validFiles = new FileInfo[](validCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < totalFiles; i++) {
            if (files[i].isValid) {
                validFiles[currentIndex] = files[i];
                currentIndex++;
            }
        }
        return validFiles;
    }

    /// @notice Get user files (gas optimized, off-chain indexing recommended for large sets)
    /// @param user The address of the user
    function getUserFiles(address user) external view returns (uint256[] memory) {
        uint256 userFileCountLocal = 0;
        for (uint256 i = 0; i < totalFiles; i++) {
            if (files[i].isValid && files[i].uploader == user) {
                userFileCountLocal++;
            }
        }
        uint256[] memory userFiles = new uint256[](userFileCountLocal);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < totalFiles; i++) {
            if (files[i].isValid && files[i].uploader == user) {
                userFiles[currentIndex] = i;
                currentIndex++;
            }
        }
        return userFiles;
    }

    /// @notice Get upload fee with discount for a user
    /// @param user The address of the user
    function getUploadFeeWithDiscount(address user) external view returns (uint256 baseFee, uint256 discountPercent, uint256 finalFee) {
        baseFee = uploadFee;
        discountPercent = stakingContract.getDiscountPercentage(user);
        uint256 discountAmount = (baseFee * discountPercent) / 100;
        finalFee = baseFee - discountAmount;
        return (baseFee, discountPercent, finalFee);
    }

    /// @notice Check if user is eligible for upload discount
    /// @param user The address of the user
    function isEligibleForUploadDiscount(address user) external view returns (bool) {
        return stakingContract.getDiscountPercentage(user) > 0;
    }

    /// @notice Get contract statistics
    function getContractStats() external view returns (
        uint256 totalFileCount,
        uint256 authorizedUploaderCountValue,
        bool isEmergencyMode,
        bool isPaused,
        uint256 currentUploadFee
    ) {
        return (
            totalFiles,
            authorizedUploaderCount,
            emergencyMode,
            paused(),
            uploadFee
        );
    }

    /// @notice Get emergency status
    function getEmergencyStatus() external view returns (
        bool isEmergency,
        uint256 requestTime,
        address requestor
    ) {
        return (
            emergencyMode,
            emergencyWithdrawalRequestTime,
            emergencyWithdrawalRequestor
        );
    }

    // ============ INTERNAL FUNCTIONS ============
    /// @dev Reject direct ETH transfers
    receive() external payable {
        revert("Direct ETH transfers not allowed");
    }

    /// @dev Reject fallback calls
    fallback() external payable {
        revert("Invalid function call");
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function initiateOwnershipTransfer(address newOwner) external onlyOwner {
        bytes32 operationHash = keccak256(abi.encodePacked("TRANSFER_OWNERSHIP", newOwner));
        timelockExecutionTime[operationHash] = block.timestamp + TIMELOCK_DELAY;
    }

    function proposeOperation(
        OperationType operationType,
        address target,
        uint256 value,
        string memory stringValue
    ) external onlyOwner {
        bytes32 operationHash = keccak256(abi.encodePacked(
            operationType, 
            target, 
            value, 
            stringValue, 
            block.timestamp
        ));
        require(operations[operationHash].proposedTime == 0, "Operation already exists");
        
        operations[operationHash] = Operation({
            operationType: operationType,
            target: target,
            value: value,
            stringValue: stringValue,
            executed: false,
            numConfirmations: 1,
            proposedTime: block.timestamp
        });
        
        hasConfirmed[operationHash][msg.sender] = true;
        emit OperationProposed(operationHash, msg.sender, getOperationTypeString(operationType));
    }

    function confirmOperation(bytes32 operationHash) external onlyOwner {
        Operation storage operation = operations[operationHash];
        require(operation.proposedTime > 0, "Operation does not exist");
        require(!operation.executed, "Operation already executed");
        require(!hasConfirmed[operationHash][msg.sender], "Already confirmed");
        require(block.timestamp <= operation.proposedTime + TIMELOCK_DELAY, "Operation expired");

        operation.numConfirmations += 1;
        hasConfirmed[operationHash][msg.sender] = true;
        
        emit OperationConfirmed(operationHash, msg.sender);

        if (operation.numConfirmations >= requiredConfirmations) {
            executeOperation(operationHash);
        }
    }

    function executeOperation(bytes32 operationHash) internal {
        Operation storage operation = operations[operationHash];
        require(!operation.executed, "Already executed");
        require(operation.numConfirmations >= requiredConfirmations, "Not enough confirmations");

        operation.executed = true;

        if (operation.operationType == OperationType.TransferOwnership) {
            _transferOwnership(operation.target);
        } else if (operation.operationType == OperationType.UpdateUploadFee) {
            _updateUploadFee(operation.value);
        } else if (operation.operationType == OperationType.EmergencyAction) {
            _handleEmergencyAction(operation.value == 1);
        } else if (operation.operationType == OperationType.UpdateFileVerification) {
            _updateFileVerification(operation.value, operation.stringValue);
        } else if (operation.operationType == OperationType.BlacklistAddress) {
            _blacklistAddress(operation.target);
        }

        emit OperationExecuted(operationHash);
    }

    // Helper function to get operation type string
    function getOperationTypeString(OperationType operationType) internal pure returns (string memory) {
        if (operationType == OperationType.TransferOwnership) return "TransferOwnership";
        if (operationType == OperationType.UpdateUploadFee) return "UpdateUploadFee";
        if (operationType == OperationType.EmergencyAction) return "EmergencyAction";
        if (operationType == OperationType.UpdateFileVerification) return "UpdateFileVerification";
        if (operationType == OperationType.BlacklistAddress) return "BlacklistAddress";
        return "Unknown";
    }

    // Internal functions for operations
    function _updateUploadFee(uint256 newFee) internal {
        require(newFee > 0, "Fee must be greater than 0");
        require(newFee <= 0.1 ether, "Fee too high");
        uploadFee = newFee;
        emit UploadFeeUpdated(newFee);
    }

    function _handleEmergencyAction(bool activate) internal {
        if (activate) {
            emergencyMode = true;
            emit EmergencyModeActivated(msg.sender);
        } else {
            emergencyMode = false;
            emit EmergencyModeDeactivated(msg.sender);
        }
    }

    function _updateFileVerification(uint256 fileId, string memory ipfsHash) internal {
        require(fileId < totalFiles, "File does not exist");
        require(files[fileId].isValid, "File not valid");
        require(isValidIpfsCid(ipfsHash), "Invalid IPFS CID");
        
        verifiedIpfsHashes[ipfsHash] = true;
        files[fileId].isVerified = true;
        files[fileId].verificationTimestamp = block.timestamp;
        
        emit FileVerificationUpdated(fileId, true);
        emit IpfsHashVerified(ipfsHash, true);
    }

    function _blacklistAddress(address user) internal {
        require(user != address(0), "Invalid address");
        require(user != owner(), "Cannot blacklist owner");
        blacklistedAddresses[user] = true;
        emit AddressBlacklisted(user);
    }
} 