// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Wrapper.sol";

contract Staking is ReentrancyGuard, AccessControlEnumerable {
    using SafeERC20 for IERC20;
    using Checkpoints for Checkpoints.Trace224;
 
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event DiscountParamsUpdated(uint256 newMinimum, uint256 newPercent);
    event UserBlacklisted(address indexed user, bool status);
    event StakeBlockDelayUpdated(uint256 newDelay);
    event AllowedContractUpdated(address indexed contractAddress, bool status);
    event ERC20Recovered(address indexed tokenAddress, uint256 amount);

    struct StakeInfo {
        Checkpoints.Trace224 stakeHistory;
        uint256 lastStakeBlock;
    }

    // Ownership metadata (EIP-173)
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Timelock events
    event ParameterQueued(bytes32 indexed paramName, uint256 executionTime, uint256 newValue);
    event ParameterExecuted(bytes32 indexed paramName, uint256 executedValue);

    // Core state
    IERC20 public coreToken;
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
    uint256 public minimumStake = 100 * 10**18;
    uint256 public discountPercent = 20;
    uint256 public constant MAX_DISCOUNT = 100;
    uint256 public stakeBlockDelay = 1;

    // State mappings
    mapping(address => StakeInfo) public stakes;
    mapping(address => bool) public isBlacklisted;
    mapping(address => bool) public allowedContracts;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Permit signature data
    struct Permit {
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    constructor(address coreTokenAddress, address initialAdmin) {
        
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        if (coreTokenAddress != address(0)) {
            coreToken = IERC20(coreTokenAddress);
        }
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

    // Gasless staking with permit
    function stake(uint256 amount, Permit calldata permit) external payable nonReentrant {
        require(!isBlacklisted[msg.sender], "User blacklisted");
        require(amount > 0, "Amount must be > 0");

        // Allow EOAs or whitelisted contracts
        require(
            msg.sender == tx.origin || allowedContracts[msg.sender],
            "Flash loans not allowed"
        );

        StakeInfo storage userStake = stakes[msg.sender];

        if (address(coreToken) == address(0)) {
            // Native token staking
            require(msg.value == amount, "Incorrect native token amount sent");
            userStake.stakeHistory.push(uint32(block.number), uint224(userStake.stakeHistory.latest() + amount));
            userStake.lastStakeBlock = block.number;
            emit Staked(msg.sender, amount);
            return;
        }

        // Handle permit if provided
        if (msg.sender == tx.origin && permit.deadline > 0) {
            IERC20Permit(address(coreToken)).permit(
                msg.sender,
                address(this),
                amount,
                permit.deadline,
                permit.v,
                permit.r,
                permit.s
            );
        }

        uint256 balanceBefore = coreToken.balanceOf(address(this));
        coreToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = coreToken.balanceOf(address(this)) - balanceBefore;
        require(received > 0, "No tokens received");

        userStake.stakeHistory.push(uint32(block.number), uint224(userStake.stakeHistory.latest() + received));
        userStake.lastStakeBlock = block.number;

        emit Staked(msg.sender, received);
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

    // Enhanced unstake with fee handling
    function unstake(uint256 amount) external nonReentrant {
        require(!isBlacklisted[msg.sender], "User blacklisted");
        require(amount > 0, "Amount must be > 0");

        StakeInfo storage userStake = stakes[msg.sender];
        uint256 currentAmount = userStake.stakeHistory.latest();
        require(currentAmount >= amount, "Insufficient stake");
        require(block.number > userStake.lastStakeBlock + stakeBlockDelay, "Stake locked");

        if (address(coreToken) == address(0)) {
            // Native token unstaking
            payable(msg.sender).transfer(amount);
            uint256 newAmount = currentAmount - amount;
            userStake.stakeHistory.push(uint32(block.number), uint224(newAmount));
            userStake.lastStakeBlock = block.number;
            emit Unstaked(msg.sender, amount);
            return;
        }

        coreToken.safeTransfer(msg.sender, amount);
       
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

    function recoverERC20(address tokenAddress, uint256 amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(tokenAddress != address(coreToken), "Cannot recover staking token");
        IERC20(tokenAddress).safeTransfer(getRoleMember(DEFAULT_ADMIN_ROLE, 0), amount);
        emit ERC20Recovered(tokenAddress, amount);
    }
}