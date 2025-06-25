// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @title Staking Contract
/// @author rjay solamo
/// @notice This contract manages tCORE2 staking for NFT minting discounts with enhanced security.
/// @dev Implements comprehensive security protections and emergency controls.
contract Staking is Initializable, UUPSUpgradeable, ReentrancyGuardUpgradeable, OwnableUpgradeable, PausableUpgradeable {
    using Address for address payable;

    // ============ SECURITY CONSTANTS ============
    uint256 public constant REQUIRED_STAKE_AMOUNT = 10**17; // 0.1 tCORE2
    uint256 public constant LOCK_PERIOD = 3 hours;
    uint256 public constant MAX_DISCOUNT_PERCENT = 20; // Maximum 20% discount
    uint256 public constant EMERGENCY_WITHDRAWAL_DELAY = 24 hours;
    uint256 public constant TIMELOCK_DELAY = 24 hours;

    // ============ STATE VARIABLES ============
    uint256 public discountPercent;
    uint256 public totalStakedAmount;
    uint256 public totalStakers;
    bool public emergencyMode;

    // ============ SECURITY: EMERGENCY CONTROLS ============
    uint256 public emergencyWithdrawalRequestTime;
    address public emergencyWithdrawalRequestor;

    // ============ SECURITY: Timelock for critical functions ============
    mapping(bytes32 => uint256) public timelockExecutionTime;

    // ============ STRUCTS ============
    struct StakeInfo {
        uint256 amount;
        uint256 unlockTime;
        bool hasStaked;
        uint256 stakeTime;
        bool isActive;
    }

    // --- Gas Optimization: Use smaller uint types in structs where possible ---
    struct OptimizedStakeInfo {
        uint96 amount;
        uint64 unlockTime;
        bool hasStaked;
        uint64 stakeTime;
        bool isActive;
    }

    // ============ MAPPINGS ============
    mapping(address => StakeInfo) public stakes;
    mapping(address => bool) public blacklistedAddresses;

    // --- Multi-signature Support ---
    mapping(bytes32 => mapping(address => bool)) public confirmations;
    uint256 public requiredConfirmations;

    // ============ EVENTS ============
    event Staked(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount);
    event DiscountParamsUpdated(uint256 newPercent);
    event EmergencyModeActivated(address indexed by);
    event EmergencyModeDeactivated(address indexed by);
    event EmergencyWithdrawalRequested(address indexed requestor);
    event EmergencyWithdrawalExecuted(address indexed requestor, uint256 amount);
    event AddressBlacklisted(address indexed user);
    event AddressUnblacklisted(address indexed user);
    event GovernanceContractSet(address indexed governance);
    event SecurityParametersUpdated(
        uint256 newDiscountPercent,
        uint256 newLockPeriod,
        address indexed updatedBy
    );

    // Add new events for multi-sig operations
    event OperationProposed(bytes32 indexed operationHash, address indexed proposer, string operationType);
    event OperationConfirmed(bytes32 indexed operationHash, address indexed confirmer);
    event OperationExecuted(bytes32 indexed operationHash);

    // Add operation types enum
    enum OperationType {
        TransferOwnership,
        UpdateDiscountPercent,
        UpdateEmergencyMode,
        BlacklistAddress
    }

    // Add operation struct
    struct Operation {
        OperationType operationType;
        address target;
        uint256 value;
        bool executed;
        uint256 numConfirmations;
        uint256 proposedTime;
    }

    // Add operations mapping
    mapping(bytes32 => Operation) public operations;
    mapping(bytes32 => mapping(address => bool)) public hasConfirmed;

    // ============ MODIFIERS ============
    modifier whenNotEmergency() {
        require(!emergencyMode, "Contract is in emergency mode");
        _;
    }

    modifier onlyAfterDelay(uint256 delay) {
        require(block.timestamp >= emergencyWithdrawalRequestTime + delay, "Delay not met");
        _;
    }

    modifier notBlacklisted(address user) {
        require(!blacklistedAddresses[user], "Address is blacklisted");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor() {
        // Empty for upgradable contracts
    }

    function initialize(address initialOwner) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __Pausable_init();
        require(initialOwner != address(0), "Invalid owner address");
        discountPercent = 20;
        requiredConfirmations = 2;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ CORE STAKING FUNCTIONS ============
    
    /// @notice Stake exactly 0.1 tCORE2 (can re-stake after collecting)
    function stake() 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        whenNotEmergency 
        notBlacklisted(msg.sender)
    {
        require(msg.value == REQUIRED_STAKE_AMOUNT, "Must stake exactly 0.1 tCORE2");
        
        OptimizedStakeInfo storage existingStake = optimizedStakes[msg.sender];
        require(!existingStake.isActive, "Already has an active stake");

        uint64 unlockTime = uint64(block.timestamp + LOCK_PERIOD);
        
        optimizedStakes[msg.sender] = OptimizedStakeInfo({
            amount: uint96(msg.value),
            unlockTime: unlockTime,
            hasStaked: true,
            stakeTime: uint64(block.timestamp),
            isActive: true
        });
        stakes[msg.sender] = StakeInfo({
            amount: msg.value,
            unlockTime: unlockTime,
            hasStaked: true,
            stakeTime: block.timestamp,
            isActive: true
        });

        totalStakedAmount += msg.value;
        totalStakers++;

        emit Staked(msg.sender, msg.value, unlockTime);
    }

    /// @notice Batch stake for multiple users (admin only, for airdrops or migration)
    /// @param users Array of user addresses
    /// @param amounts Array of amounts (should be 0.1 tCORE2 for each)
    function batchStake(address[] calldata users, uint256[] calldata amounts) external onlyOwner whenNotPaused {
        require(users.length == amounts.length, "Array length mismatch");
        for (uint256 i = 0; i < users.length; i++) {
            require(amounts[i] == REQUIRED_STAKE_AMOUNT, "Must stake exactly 0.1 tCORE2");
            OptimizedStakeInfo storage existingStake = optimizedStakes[users[i]];
            require(!existingStake.isActive, "Already has an active stake");
            uint64 unlockTime = uint64(block.timestamp + LOCK_PERIOD);
            optimizedStakes[users[i]] = OptimizedStakeInfo({
                amount: uint96(amounts[i]),
                unlockTime: unlockTime,
                hasStaked: true,
                stakeTime: uint64(block.timestamp),
                isActive: true
            });
            totalStakedAmount += amounts[i];
            totalStakers++;
            emit Staked(users[i], amounts[i], unlockTime);
        }
    }

    /// @dev Secure unstaking function with validation
    function unstake() 
        external 
        nonReentrant 
        whenNotPaused 
        notBlacklisted(msg.sender) 
    {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.hasStaked, "No stake found");
        require(userStake.isActive, "Stake not active");
        require(block.timestamp >= userStake.unlockTime, "Stake still locked");

        uint256 amount = userStake.amount;
        require(amount > 0, "Invalid stake amount");
        
        // Reset user stake info but keep hasStaked flag for history
        userStake.isActive = false;
        userStake.amount = 0;
        userStake.unlockTime = 0;
        userStake.stakeTime = 0;
        
        // Also reset optimizedStakes for this user
        OptimizedStakeInfo storage optStake = optimizedStakes[msg.sender];
        optStake.isActive = false;
        optStake.amount = 0;
        optStake.unlockTime = 0;
        optStake.stakeTime = 0;

        totalStakedAmount -= amount;
        totalStakers--;

        // Secure transfer with checks
        require(address(this).balance >= amount, "Insufficient contract balance");
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Unstake refund failed");

        emit Unstaked(msg.sender, amount);
    }

    /// @notice Batch unstake for multiple users (admin only)
    /// @param users Array of user addresses
    function batchUnstake(address[] calldata users) external onlyOwner whenNotPaused {
        for (uint256 i = 0; i < users.length; i++) {
            StakeInfo storage userStake = stakes[users[i]];
            if (userStake.hasStaked && userStake.isActive && block.timestamp >= userStake.unlockTime) {
                uint256 amount = userStake.amount;
                userStake.isActive = false;
                userStake.amount = 0;
                userStake.unlockTime = 0;
                userStake.stakeTime = 0;
                totalStakedAmount -= amount;
                totalStakers--;
                (bool sent, ) = payable(users[i]).call{value: amount}("");
                require(sent, "Unstake refund failed");
                emit Unstaked(users[i], amount);
            }
        }
    }

    // ============ VIEW FUNCTIONS ============
    
    /// @dev Get discount percentage for a user
    function getDiscountPercentage(address user) external view returns (uint256) {
        StakeInfo storage userStake = stakes[user];
        if (userStake.hasStaked && userStake.isActive) {
            return discountPercent;
        }
        return 0;
    }

    /// @dev Check if user has active stake
    function hasActiveStake(address user) external view returns (bool) {
        StakeInfo storage userStake = stakes[user];
        return userStake.hasStaked && userStake.isActive;
    }

    /// @dev Get user stake info
    function getUserStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 unlockTime,
        bool hasStaked,
        uint256 stakeTime,
        bool isActive
    ) {
        StakeInfo storage userStake = stakes[user];
        return (
            userStake.amount,
            userStake.unlockTime,
            userStake.hasStaked,
            userStake.stakeTime,
            userStake.isActive
        );
    }

    /// @notice Get the total number of stakers
    function getTotalStakers() external view returns (uint256) {
        return totalStakers;
    }

    /// @notice Get the total staked amount
    function getTotalStakedAmount() external view returns (uint256) {
        return totalStakedAmount;
    }

    /// @notice Get the current discount percent
    function getCurrentDiscountPercent() external view returns (uint256) {
        return discountPercent;
    }

    /// @notice Get the emergency status
    function getEmergencyStatus() external view returns (bool, uint256, address) {
        return (emergencyMode, emergencyWithdrawalRequestTime, emergencyWithdrawalRequestor);
    }

    /// @notice Get the blacklist status of a user
    function isBlacklisted(address user) external view returns (bool) {
        return blacklistedAddresses[user];
    }

    /// @notice Get the contract owner
    function getOwner() external view returns (address) {
        return owner();
    }

    /// @notice Get the governance contract address
    function getGovernanceContract() external view returns (address) {
        return governanceContract;
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
        emit EmergencyWithdrawalRequested(msg.sender);
    }

    /// @dev Execute emergency withdrawal after delay
    function executeEmergencyWithdrawal() external onlyGovernance onlyAfterDelay(EMERGENCY_WITHDRAWAL_DELAY) {
        require(emergencyWithdrawalRequestor != address(0), "No requestor");
        require(emergencyMode, "Not in emergency mode");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        emergencyWithdrawalRequestTime = 0;
        emergencyWithdrawalRequestor = address(0);
        (bool sent, ) = payable(governanceContract).call{value: balance}("");
        require(sent, "Emergency withdrawal failed");
        emit EmergencyWithdrawalExecuted(msg.sender, balance);
    }

    // ============ ADMIN FUNCTIONS ============
    
    /// @dev Update discount percentage with validation
    function setDiscountPercent(uint256 newPercent) external onlyOwner whenNotPaused {
        require(newPercent <= MAX_DISCOUNT_PERCENT, "Discount too high");
        discountPercent = newPercent;
        emit DiscountParamsUpdated(newPercent);
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

    // ============ EMERGENCY FUNCTIONS ============
    
    /// @dev Emergency function to recover stuck native tokens (tCORE2)
    function emergencyRecoverTokens(address to) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to recover");
        (bool sent, ) = payable(to).call{value: balance}("");
        require(sent, "Transfer failed");
    }

    address public governanceContract;
    function setGovernanceContract(address _gov) external onlyOwner {
        require(_gov != address(0), "Invalid governance contract");
        governanceContract = _gov;
        emit GovernanceContractSet(_gov);
    }

    modifier onlyGovernance {
        require(msg.sender == governanceContract, "Only governance");
        _;
    }

    function initiateOwnershipTransfer(address newOwner) external onlyOwner {
        bytes32 operationHash = keccak256(abi.encodePacked("TRANSFER_OWNERSHIP", newOwner));
        timelockExecutionTime[operationHash] = block.timestamp + TIMELOCK_DELAY;
    }

    // Modify existing functions to use multi-sig
    function proposeOperation(
        OperationType operationType,
        address target,
        uint256 value
    ) external onlyOwner {
        bytes32 operationHash = keccak256(abi.encodePacked(operationType, target, value, block.timestamp));
        require(operations[operationHash].proposedTime == 0, "Operation already exists");
        
        operations[operationHash] = Operation({
            operationType: operationType,
            target: target,
            value: value,
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
        } else if (operation.operationType == OperationType.UpdateDiscountPercent) {
            _setDiscountPercent(operation.value);
        } else if (operation.operationType == OperationType.UpdateEmergencyMode) {
            operation.value == 1 ? _activateEmergencyMode() : _deactivateEmergencyMode();
        } else if (operation.operationType == OperationType.BlacklistAddress) {
            _blacklistAddress(operation.target);
        }

        emit OperationExecuted(operationHash);
    }

    // Helper function to get operation type string
    function getOperationTypeString(OperationType operationType) internal pure returns (string memory) {
        if (operationType == OperationType.TransferOwnership) return "TransferOwnership";
        if (operationType == OperationType.UpdateDiscountPercent) return "UpdateDiscountPercent";
        if (operationType == OperationType.UpdateEmergencyMode) return "UpdateEmergencyMode";
        if (operationType == OperationType.BlacklistAddress) return "BlacklistAddress";
        return "Unknown";
    }

    // Update existing functions to use internal versions
    function _setDiscountPercent(uint256 newPercent) internal {
        require(newPercent <= MAX_DISCOUNT_PERCENT, "Discount too high");
        discountPercent = newPercent;
        emit DiscountParamsUpdated(newPercent);
    }

    function _activateEmergencyMode() internal {
        emergencyMode = true;
        emit EmergencyModeActivated(msg.sender);
    }

    function _deactivateEmergencyMode() internal {
        emergencyMode = false;
        emit EmergencyModeDeactivated(msg.sender);
    }

    function _blacklistAddress(address user) internal {
        require(user != address(0), "Invalid address");
        require(user != owner(), "Cannot blacklist owner");
        blacklistedAddresses[user] = true;
        emit AddressBlacklisted(user);
    }

    // Replace StakeInfo with OptimizedStakeInfo for new stakes
    mapping(address => OptimizedStakeInfo) public optimizedStakes;
} 