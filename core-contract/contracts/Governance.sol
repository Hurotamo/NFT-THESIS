// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title Governance Contract
/// @author rjay solamo
/// @notice This contract manages community governance for parameter changes across the ecosystem.
/// @dev Implements voting mechanisms, timelock, and multi-signature capabilities.
contract Governance is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using Address for address;
    using Address for address payable;

    // ============ GOVERNANCE CONSTANTS ============
    uint256 public constant MIN_VOTING_PERIOD = 3 days;
    uint256 public constant MAX_VOTING_PERIOD = 14 days;
    uint256 public constant MIN_EXECUTION_DELAY = 1 days;
    uint256 public constant MAX_EXECUTION_DELAY = 7 days;
    uint256 public constant MIN_QUORUM_PERCENTAGE = 10; // 10% minimum quorum
    uint256 public constant MAX_QUORUM_PERCENTAGE = 50; // 50% maximum quorum
    uint256 public constant MIN_APPROVAL_PERCENTAGE = 60; // 60% minimum approval
    uint256 public constant MAX_PROPOSALS_PER_USER = 5;
    uint256 public constant EMERGENCY_EXECUTION_DELAY = 12 hours;
    uint256 public constant TIMELOCK_DELAY = 24 hours;

    // ============ STATE VARIABLES ============
    uint256 public votingPeriod;
    uint256 public executionDelay;
    uint256 public quorumPercentage;
    uint256 public approvalPercentage;
    uint256 public proposalCount;
    bool public emergencyMode;

    // ============ STRUCTS ============
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        bytes data;
        address targetContract;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 startTime;
        uint256 endTime;
        uint256 executionTime;
        bool executed;
        bool canceled;
        bool emergency;
        mapping(address => Receipt) receipts;
    }

    struct Receipt {
        bool hasVoted;
        bool support; // true = for, false = against
        uint256 votes;
        uint256 timestamp;
    }

    struct ProposalInfo {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 startTime;
        uint256 endTime;
        uint256 executionTime;
        bool executed;
        bool canceled;
        bool emergency;
    }

    struct OptimizedProposalInfo {
        uint96 forVotes;
        uint96 againstVotes;
        uint96 abstainVotes;
        uint64 startTime;
        uint64 endTime;
        bool executed;
        bool canceled;
    }

    // ============ MAPPINGS ============
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public userProposalCount;
    mapping(address => bool) public authorizedVoters;
    mapping(address => uint256) public voterWeight;
    mapping(address => bool) public blacklistedAddresses;
    mapping(bytes32 => bool) public executedActions;
    mapping(address => bool) public trustedTargets;
    mapping(bytes32 => uint256) public timelockExecutionTime;
    mapping(bytes32 => mapping(address => bool)) public confirmations;

    // ============ MULTI-SIG TYPES ============
    enum MultiSigOperation {
        TransferOwnership,
        UpdateVotingPeriod,
        UpdateQuorumPercentage,
        EmergencyAction,
        UpdateTrustedTarget
    }

    struct MultiSigAction {
        MultiSigOperation operation;
        address target;
        uint256 value;
        bool executed;
        uint256 numConfirmations;
        uint256 proposedTime;
    }

    // ============ MULTI-SIG STATE ============
    mapping(bytes32 => MultiSigAction) public multiSigActions;
    mapping(bytes32 => mapping(address => bool)) public hasConfirmedAction;
    uint256 public requiredConfirmations;

    // ============ EVENTS ============
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        address targetContract,
        uint256 startTime,
        uint256 endTime,
        bool emergency
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        bool support,
        uint256 votes
    );
    event ProposalExecuted(uint256 indexed proposalId, address indexed executor);
    event ProposalCanceled(uint256 indexed proposalId, address indexed canceler);
    event GovernanceParametersUpdated(
        uint256 votingPeriod,
        uint256 executionDelay,
        uint256 quorumPercentage,
        uint256 approvalPercentage
    );
    event VoterAuthorized(address indexed voter, uint256 weight);
    event VoterRemoved(address indexed voter);
    event EmergencyModeActivated(address indexed by);
    event EmergencyModeDeactivated(address indexed by);
    event TrustedTargetSet(address indexed target, bool trusted);
    event SecurityParametersUpdated(
        uint256 newVotingPeriod,
        uint256 newQuorumPercentage,
        address indexed updatedBy
    );
    event MultiSigActionProposed(bytes32 indexed actionHash, address indexed proposer, string operationType);
    event MultiSigActionConfirmed(bytes32 indexed actionHash, address indexed confirmer);
    event MultiSigActionExecuted(bytes32 indexed actionHash);
    event VotingPeriodUpdated(uint256 newPeriod);
    event QuorumPercentageUpdated(uint256 newPercentage);
    event ProposalReceipt(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votes,
        uint256 timestamp
    );

    // ============ MODIFIERS ============
    modifier onlyAuthorizedVoter() {
        require(authorizedVoters[msg.sender], "Not authorized voter");
        require(!blacklistedAddresses[msg.sender], "Voter blacklisted");
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        require(proposalId < proposalCount, "Proposal does not exist");
        _;
    }

    modifier proposalActive(uint256 proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.canceled, "Proposal canceled");
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp >= proposal.startTime, "Proposal not started");
        require(block.timestamp < proposal.endTime, "Proposal ended");
        _;
    }

    modifier proposalExecutable(uint256 proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.canceled, "Proposal canceled");
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp >= proposal.executionTime, "Execution delay not met");
        _;
    }

    modifier onlyProposer(uint256 proposalId) {
        require(proposals[proposalId].proposer == msg.sender, "Not proposer");
        _;
    }

    modifier onlyTrustedTarget(address target) {
        require(trustedTargets[target], "Target not trusted");
        _;
    }

    // ============ INITIALIZER ============
    function initialize(address initialOwner) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        require(initialOwner != address(0), "Invalid owner address");
        authorizedVoters[initialOwner] = true;
        voterWeight[initialOwner] = 100; // Owner gets 100 voting weight
        votingPeriod = 7 days;
        executionDelay = 2 days;
        quorumPercentage = 20;
        approvalPercentage = 70;
    }

    /// @notice Authorize contract upgrade (UUPS)
    /// @param newImplementation The address of the new implementation
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ CORE GOVERNANCE FUNCTIONS ============
    
    /// @notice Create a new proposal
    /// @param description The proposal description
    /// @param data The encoded function call data
    /// @param targetContract The contract to call if proposal passes
    /// @param emergency Whether this is an emergency proposal
    function createProposal(string memory description, bytes memory data, address targetContract, bool emergency) external onlyAuthorizedVoter nonReentrant whenNotPaused {
        require(userProposalCount[msg.sender] < MAX_PROPOSALS_PER_USER, "Too many proposals");
        require(targetContract != address(0), "Invalid target contract");
        require(bytes(description).length > 0, "Empty description");
        
        uint256 proposalId = proposalCount;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + votingPeriod;
        uint256 execDelay = emergency ? EMERGENCY_EXECUTION_DELAY : executionDelay;
        uint256 executionTime = endTime + execDelay;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.data = data;
        proposal.targetContract = targetContract;
        proposal.startTime = startTime;
        proposal.endTime = endTime;
        proposal.executionTime = executionTime;
        proposal.emergency = emergency;
        
        proposalCount++;
        userProposalCount[msg.sender]++;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            description,
            targetContract,
            startTime,
            endTime,
            emergency
        );
    }
    
    /// @notice Cast a vote on a proposal
    /// @param proposalId The ID of the proposal
    /// @param support True for, false against
    function castVote(
        uint256 proposalId,
        bool support
    ) external onlyAuthorizedVoter proposalExists(proposalId) proposalActive(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.receipts[msg.sender].hasVoted, "Already voted");
        uint256 votes = voterWeight[msg.sender];
        require(votes > 0, "No voting weight");
        proposal.receipts[msg.sender] = Receipt({
            hasVoted: true,
            support: support,
            votes: votes,
            timestamp: block.timestamp
        });
        if (support) {
            proposal.forVotes += votes;
        } else {
            proposal.againstVotes += votes;
        }
        emit VoteCast(msg.sender, proposalId, support, votes);
        emit ProposalReceipt(proposalId, msg.sender, support, votes, block.timestamp);
    }
    
    /// @notice Execute a proposal after voting and delay
    /// @param proposalId The ID of the proposal
    function executeProposal(uint256 proposalId) 
        external 
        onlyAuthorizedVoter 
        proposalExists(proposalId) 
        proposalExecutable(proposalId) 
        nonReentrant 
    {
        Proposal storage proposal = proposals[proposalId];
        require(hasQuorum(proposalId), "Quorum not met");
        require(hasApproval(proposalId), "Approval threshold not met");
        require(trustedTargets[proposal.targetContract], "Target not trusted");
        proposal.executed = true;
        (bool success, ) = proposal.targetContract.call(proposal.data);
        require(success, "Proposal execution failed");
        bytes32 actionHash = keccak256(abi.encodePacked(proposal.targetContract, proposal.data));
        executedActions[actionHash] = true;
        emit ProposalExecuted(proposalId, msg.sender);
    }
    
    /// @notice Cancel a proposal
    /// @param proposalId The ID of the proposal
    function cancelProposal(uint256 proposalId) 
        external 
        proposalExists(proposalId) 
    {
        require(
            msg.sender == proposals[proposalId].proposer || msg.sender == owner(),
            "Not authorized to cancel"
        );
        
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal already canceled");
        
        proposal.canceled = true;
        
        emit ProposalCanceled(proposalId, msg.sender);
    }

    // ============ ADMIN FUNCTIONS ============
    
    /// @notice Set governance parameters
    /// @param newVotingPeriod The new voting period
    /// @param newExecutionDelay The new execution delay
    /// @param newQuorumPercentage The new quorum percentage
    /// @param newApprovalPercentage The new approval percentage
    function setGovernanceParameters(
        uint256 newVotingPeriod,
        uint256 newExecutionDelay,
        uint256 newQuorumPercentage,
        uint256 newApprovalPercentage
    ) external onlyOwner {
        require(newVotingPeriod >= MIN_VOTING_PERIOD && newVotingPeriod <= MAX_VOTING_PERIOD, "Invalid voting period");
        require(newExecutionDelay >= MIN_EXECUTION_DELAY && newExecutionDelay <= MAX_EXECUTION_DELAY, "Invalid execution delay");
        require(newQuorumPercentage >= MIN_QUORUM_PERCENTAGE && newQuorumPercentage <= MAX_QUORUM_PERCENTAGE, "Invalid quorum");
        require(newApprovalPercentage >= MIN_APPROVAL_PERCENTAGE && newApprovalPercentage <= 100, "Invalid approval percentage");
        votingPeriod = newVotingPeriod;
        executionDelay = newExecutionDelay;
        quorumPercentage = newQuorumPercentage;
        approvalPercentage = newApprovalPercentage;
        emit GovernanceParametersUpdated(newVotingPeriod, newExecutionDelay, newQuorumPercentage, newApprovalPercentage);
    }
    
    /// @notice Authorize a voter
    /// @param voter The address of the voter
    /// @param weight The voting weight
    function authorizeVoter(address voter, uint256 weight) external onlyOwner {
        require(voter != address(0), "Invalid voter address");
        require(weight > 0, "Invalid voting weight");
        authorizedVoters[voter] = true;
        voterWeight[voter] = weight;
        emit VoterAuthorized(voter, weight);
    }
    
    /// @notice Remove voter authorization
    /// @param voter The address of the voter
    function removeVoter(address voter) external onlyOwner {
        require(voter != owner(), "Cannot remove owner");
        authorizedVoters[voter] = false;
        voterWeight[voter] = 0;
        emit VoterRemoved(voter);
    }
    
    /// @notice Update voter weight
    /// @param voter The address of the voter
    /// @param newWeight The new voting weight
    function updateVoterWeight(address voter, uint256 newWeight) external onlyOwner {
        require(authorizedVoters[voter], "Voter not authorized");
        require(newWeight > 0, "Invalid voting weight");
        voterWeight[voter] = newWeight;
        emit VoterAuthorized(voter, newWeight);
    }
    
    /// @notice Blacklist an address
    /// @param user The address to blacklist
    function blacklistAddress(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        require(user != owner(), "Cannot blacklist owner");
        blacklistedAddresses[user] = true;
    }
    
    /// @notice Remove an address from blacklist
    /// @param user The address to unblacklist
    function unblacklistAddress(address user) external onlyOwner {
        blacklistedAddresses[user] = false;
    }
    
    /// @notice Activate emergency mode
    function activateEmergencyMode() external onlyOwner {
        emergencyMode = true;
        emit EmergencyModeActivated(msg.sender);
    }
    
    /// @notice Deactivate emergency mode
    function deactivateEmergencyMode() external onlyOwner {
        emergencyMode = false;
        emit EmergencyModeDeactivated(msg.sender);
    }

    /// @notice Set a trusted target contract
    /// @param target The contract address
    /// @param trusted Whether the contract is trusted
    function setTrustedTarget(address target, bool trusted) external onlyOwner {
        trustedTargets[target] = trusted;
        emit TrustedTargetSet(target, trusted);
    }

    function initiateOwnershipTransfer(address newOwner) external onlyOwner {
        bytes32 operationHash = keccak256(abi.encodePacked("TRANSFER_OWNERSHIP", newOwner));
        timelockExecutionTime[operationHash] = block.timestamp + TIMELOCK_DELAY;
    }

    function confirmOperation(bytes32 operationHash) external onlyOwner {
        confirmations[operationHash][msg.sender] = true;
        // Implementation details for multi-sig execution would go here
    }

    // ============ VIEW FUNCTIONS ============
    
    /// @dev Get proposal information
    function getProposal(uint256 proposalId) 
        external 
        view 
        proposalExists(proposalId) 
        returns (ProposalInfo memory) 
    {
        Proposal storage proposal = proposals[proposalId];
        return ProposalInfo({
            id: proposal.id,
            proposer: proposal.proposer,
            description: proposal.description,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            startTime: proposal.startTime,
            endTime: proposal.endTime,
            executionTime: proposal.executionTime,
            executed: proposal.executed,
            canceled: proposal.canceled,
            emergency: proposal.emergency
        });
    }
    
    /// @dev Get voter receipt for a proposal
    function getReceipt(uint256 proposalId, address voter) 
        external 
        view 
        proposalExists(proposalId) 
        returns (Receipt memory) 
    {
        return proposals[proposalId].receipts[voter];
    }
    
    /// @dev Check if proposal has quorum
    function hasQuorum(uint256 proposalId) public view proposalExists(proposalId) returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalWeight = getTotalVotingWeight();
        return totalVotes >= (totalWeight * quorumPercentage) / 100;
    }
    
    /// @dev Check if proposal has approval
    function hasApproval(uint256 proposalId) public view proposalExists(proposalId) returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        if (totalVotes == 0) return false;
        return proposal.forVotes >= (totalVotes * approvalPercentage) / 100;
    }
    
    /// @dev Get total voting weight
    function getTotalVotingWeight() public pure returns (uint256) {
        // This is a simplified implementation
        // In production, maintain a separate counter or iterate through authorized voters
        return 1000; // Placeholder - should be calculated from actual voter weights
    }
    
    /// @dev Get governance statistics
    function getGovernanceStats() external view returns (
        uint256 totalProposals,
        uint256 activeProposals,
        uint256 executedProposals,
        uint256 canceledProposals,
        uint256 authorizedVoterCount,
        bool isEmergencyMode
    ) {
        uint256 active = 0;
        uint256 executed = 0;
        uint256 canceled = 0;
        
        for (uint256 i = 0; i < proposalCount; i++) {
            Proposal storage proposal = proposals[i];
            if (proposal.executed) {
                executed++;
            } else if (proposal.canceled) {
                canceled++;
            } else if (block.timestamp >= proposal.startTime && block.timestamp < proposal.endTime) {
                active++;
            }
        }
        
        return (
            proposalCount,
            active,
            executed,
            canceled,
            getAuthorizedVoterCount(),
            emergencyMode
        );
    }
    
    /// @dev Check if action has been executed
    function isActionExecuted(address targetContract, bytes memory data) external view returns (bool) {
        bytes32 actionHash = keccak256(abi.encodePacked(targetContract, data));
        return executedActions[actionHash];
    }

    // ============ INTERNAL FUNCTIONS ============
    
    /// @dev Count authorized voters
    function getAuthorizedVoterCount() internal pure returns (uint256) {
        // This is a simplified implementation
        // In production, maintain a separate counter
        return 1; // Placeholder - owner is always authorized
    }

    // ============ SECURITY: RECEIVE FUNCTION ============
    
    /// @dev Reject direct ETH transfers
    receive() external payable {
        revert("Direct ETH transfers not allowed");
    }

    /// @dev Reject fallback calls
    fallback() external payable {
        revert("Invalid function call");
    }

    // ============ MULTI-SIG FUNCTIONS ============
    function proposeMultiSigAction(
        MultiSigOperation operation,
        address target,
        uint256 value
    ) external onlyOwner {
        bytes32 actionHash = keccak256(abi.encodePacked(operation, target, value, block.timestamp));
        require(multiSigActions[actionHash].proposedTime == 0, "Action already exists");
        
        multiSigActions[actionHash] = MultiSigAction({
            operation: operation,
            target: target,
            value: value,
            executed: false,
            numConfirmations: 1,
            proposedTime: block.timestamp
        });
        
        hasConfirmedAction[actionHash][msg.sender] = true;
        emit MultiSigActionProposed(actionHash, msg.sender, getOperationTypeString(operation));
    }

    function confirmMultiSigAction(bytes32 actionHash) external onlyOwner {
        MultiSigAction storage action = multiSigActions[actionHash];
        require(action.proposedTime > 0, "Action does not exist");
        require(!action.executed, "Action already executed");
        require(!hasConfirmedAction[actionHash][msg.sender], "Already confirmed");
        require(block.timestamp <= action.proposedTime + TIMELOCK_DELAY, "Action expired");

        action.numConfirmations += 1;
        hasConfirmedAction[actionHash][msg.sender] = true;
        
        emit MultiSigActionConfirmed(actionHash, msg.sender);

        if (action.numConfirmations >= requiredConfirmations) {
            executeMultiSigAction(actionHash);
        }
    }

    function executeMultiSigAction(bytes32 actionHash) internal {
        MultiSigAction storage action = multiSigActions[actionHash];
        require(!action.executed, "Already executed");
        require(action.numConfirmations >= requiredConfirmations, "Not enough confirmations");

        action.executed = true;

        if (action.operation == MultiSigOperation.TransferOwnership) {
            _transferOwnership(action.target);
        } else if (action.operation == MultiSigOperation.UpdateVotingPeriod) {
            _updateVotingPeriod(action.value);
        } else if (action.operation == MultiSigOperation.UpdateQuorumPercentage) {
            _updateQuorumPercentage(action.value);
        } else if (action.operation == MultiSigOperation.EmergencyAction) {
            _handleEmergencyAction(action.value == 1);
        } else if (action.operation == MultiSigOperation.UpdateTrustedTarget) {
            _updateTrustedTarget(action.target, action.value == 1);
        }

        emit MultiSigActionExecuted(actionHash);
    }

    function getOperationTypeString(MultiSigOperation operation) internal pure returns (string memory) {
        if (operation == MultiSigOperation.TransferOwnership) return "TransferOwnership";
        if (operation == MultiSigOperation.UpdateVotingPeriod) return "UpdateVotingPeriod";
        if (operation == MultiSigOperation.UpdateQuorumPercentage) return "UpdateQuorumPercentage";
        if (operation == MultiSigOperation.EmergencyAction) return "EmergencyAction";
        if (operation == MultiSigOperation.UpdateTrustedTarget) return "UpdateTrustedTarget";
        return "Unknown";
    }

    function _updateVotingPeriod(uint256 newPeriod) internal {
        require(newPeriod >= 1 days && newPeriod <= 30 days, "Invalid voting period");
        votingPeriod = newPeriod;
        emit VotingPeriodUpdated(newPeriod);
    }

    function _updateQuorumPercentage(uint256 newPercentage) internal {
        require(newPercentage >= 10 && newPercentage <= 75, "Invalid percentage");
        quorumPercentage = newPercentage;
        emit QuorumPercentageUpdated(newPercentage);
    }

    function _handleEmergencyAction(bool activate) internal {
        if (activate) {
            _pause();
        } else {
            _unpause();
        }
    }

    function _updateTrustedTarget(address target, bool trusted) internal {
        require(target != address(0), "Invalid target");
        trustedTargets[target] = trusted;
        emit TrustedTargetSet(target, trusted);
    }
} 