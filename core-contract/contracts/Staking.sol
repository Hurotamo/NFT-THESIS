// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

contract Staking is ReentrancyGuard, AccessControlEnumerable {
    using Checkpoints for Checkpoints.Trace224;
 
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event DiscountParamsUpdated(uint256 newMinimum, uint256 newPercent);
    event UserBlacklisted(address indexed user, bool status);
    event StakeBlockDelayUpdated(uint256 newDelay);
    event AllowedContractUpdated(address indexed contractAddress, bool status);
    event NativeTokenRecovered(uint256 amount);

    struct StakeInfo {
        Checkpoints.Trace224 stakeHistory;
        uint256 lastStakeBlock;
    }

    // Ownership metadata (EIP-173)
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Timelock events
    event ParameterQueued(bytes32 indexed paramName, uint256 executionTime, uint256 newValue);
    event ParameterExecuted(bytes32 indexed paramName, uint256 executedValue);

    // Core state - tCORE2 is native token
    uint256 public constant TIMELOCK_DURATION = 2 days;

    // Parameter timelock storage
    struct TimelockData {
        uint256 newValue;
        uint256 executionTime;
    }

    TimelockData private _minimumStakeTimelock;
    TimelockData private _discountPercentTimelock;
    TimelockData private _stakeBlockDelayTimelock;

    // Configuration
    uint256 public minimumStake = 0.1 * 10**18; // 0.1 tCORE2 for discount eligibility
    uint256 public discountPercent = 20; // 20% discount for staking 0.1 tCORE2
    uint256 public constant MAX_DISCOUNT = 100;
    uint256 public stakeBlockDelay = 1;

    // State mappings
    mapping(address => StakeInfo) public stakes;
    mapping(address => bool) public isBlacklisted;
    mapping(address => bool) public allowedContracts;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
    }

    // EIP-173 compliance
    function owner() public view returns (address) {
        return getRoleMember(DEFAULT_ADMIN_ROLE, 0);
    }

    function transferOwnership(address newOwner) external onlyRole(ADMIN_ROLE) {
        require(newOwner != address(0), "Invalid owner");
        address oldOwner = owner();
        _revokeRole(DEFAULT_ADMIN_ROLE, oldOwner);
        _grantRole(DEFAULT_ADMIN_ROLE, newOwner);
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // Native tCORE2 staking (not gasless, user must pay gas)
    function stake() external payable nonReentrant {
        require(!isBlacklisted[msg.sender], "User blacklisted");
        require(msg.value > 0, "Amount must be > 0");

        // Allow EOAs or whitelisted contracts
        require(
            msg.sender == tx.origin || allowedContracts[msg.sender],
            "Flash loans not allowed"
        );

        StakeInfo storage userStake = stakes[msg.sender];
        userStake.stakeHistory.push(uint32(block.number), uint224(userStake.stakeHistory.latest() + msg.value));
        userStake.lastStakeBlock = block.number;
        
        emit Staked(msg.sender, msg.value);
    }

    // Timelocked parameter updates
    function queueMinimumStake(uint256 newMinimum) external onlyRole(ADMIN_ROLE) {
        require(newMinimum > 0, "Minimum must be > 0");
        _minimumStakeTimelock = TimelockData(newMinimum, block.timestamp + TIMELOCK_DURATION);
        emit ParameterQueued(keccak256("minimumStake"), _minimumStakeTimelock.executionTime, newMinimum);
    }

    function queueDiscountPercent(uint256 newPercent) external onlyRole(ADMIN_ROLE) {
        require(newPercent <= MAX_DISCOUNT, "Invalid discount");
        _discountPercentTimelock = TimelockData(newPercent, block.timestamp + TIMELOCK_DURATION);
        emit ParameterQueued(keccak256("discountPercent"), _discountPercentTimelock.executionTime, newPercent);
    }

    function queueStakeBlockDelay(uint256 newDelay) external onlyRole(ADMIN_ROLE) {
        require(newDelay >= 1, "Delay must be > 0");
        _stakeBlockDelayTimelock = TimelockData(newDelay, block.timestamp + TIMELOCK_DURATION);
        emit ParameterQueued(keccak256("stakeBlockDelay"), _stakeBlockDelayTimelock.executionTime, newDelay);
    }

    function executeQueuedChanges() external nonReentrant {
        if (block.timestamp >= _minimumStakeTimelock.executionTime && _minimumStakeTimelock.newValue != 0) {
            minimumStake = _minimumStakeTimelock.newValue;
            emit ParameterExecuted(keccak256("minimumStake"), minimumStake);
            _minimumStakeTimelock.newValue = 0;
        }

        if (block.timestamp >= _discountPercentTimelock.executionTime && _discountPercentTimelock.newValue != 0) {
            discountPercent = _discountPercentTimelock.newValue;
            emit ParameterExecuted(keccak256("discountPercent"), discountPercent);
            _discountPercentTimelock.newValue = 0;
        }

        if (block.timestamp >= _stakeBlockDelayTimelock.executionTime && _stakeBlockDelayTimelock.newValue != 0) {
            stakeBlockDelay = _stakeBlockDelayTimelock.newValue;
            emit ParameterExecuted(keccak256("stakeBlockDelay"), stakeBlockDelay);
            _stakeBlockDelayTimelock.newValue = 0;
        }
    }

    // Native tCORE2 unstaking (not gasless, user must pay gas)
    function unstake(uint256 amount) external nonReentrant {
        require(!isBlacklisted[msg.sender], "User blacklisted");
        require(amount > 0, "Amount must be > 0");

        StakeInfo storage userStake = stakes[msg.sender];
        uint256 currentAmount = userStake.stakeHistory.latest();
        require(currentAmount >= amount, "Insufficient stake");
        require(block.number > userStake.lastStakeBlock + stakeBlockDelay, "Stake locked");

        // Transfer native tCORE2 tokens
        payable(msg.sender).transfer(amount);
       
        userStake.stakeHistory.push(uint32(block.number), uint224(currentAmount - amount));
        userStake.lastStakeBlock = block.number;

        emit Unstaked(msg.sender, amount);
    }

    function getDiscountPercentage(address user) external view returns (uint256) {
        if (isBlacklisted[user]) return 0;
        return userStakeHistoryLatest(user) >= minimumStake ? discountPercent : 0;
    }

    // Helper for latest stake amount
    function userStakeHistoryLatest(address user) public view returns (uint256) {
        return stakes[user].stakeHistory.latest();
    }

    function setAllowedContract(address contractAddress, bool status) external onlyRole(ADMIN_ROLE) {
        allowedContracts[contractAddress] = status;
        emit AllowedContractUpdated(contractAddress, status);
    }

    function blacklistUser(address user, bool status) external onlyRole(ADMIN_ROLE) {
        isBlacklisted[user] = status;
        emit UserBlacklisted(user, status);
    }

    // Recover native tCORE2 tokens (emergency only)
    function recoverNativeTokens() external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No native tokens to recover");
        
        payable(getRoleMember(DEFAULT_ADMIN_ROLE, 0)).transfer(balance);
        emit NativeTokenRecovered(balance);
    }

    // Receive function to accept native tCORE2 tokens
    receive() external payable {
        // This allows the contract to receive native tokens
    }
}