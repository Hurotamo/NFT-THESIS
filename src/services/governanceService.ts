import { useContracts } from "@/hooks/useContracts";
import GovernanceABI from '@/abis/Governance.json';
import Web3 from 'web3';
import type { Contract } from 'web3-eth-contract';
import { useWeb3 } from '@/contexts/Web3Context';
import { AbiItem } from 'web3-utils';
import type { EventLog } from 'web3-eth-contract';

export interface ProposalInfo {
  id: number;
  proposer: string;
  description: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  startTime: string;
  endTime: string;
  executionTime: string;
  executed: boolean;
  canceled: boolean;
  emergency: boolean;
}

export interface ReceiptInfo {
  hasVoted: boolean;
  support: boolean;
  votes: string;
  timestamp: string;
}

export interface MultiSigActionInfo {
  actionHash: string;
  proposer: string;
  operation: string;
  target: string;
  value: string;
  timestamp: number;
}

interface MultiSigActionEvent {
  returnValues: {
    actionHash: string;
    proposer?: string;
    by?: string;
    operationType?: string;
    [key: string]: unknown;
  };
  blockNumber: number;
}

export function useGovernanceService() {
  const { governance } = useContracts();
  const { web3, contracts } = useWeb3();

  // Propose a new governance action
  const propose = async (description: string, data: string, targetContract: string, overrides = {}) => {
    if (!governance) throw new Error("Governance contract is not available.");
    return governance.propose(description, data, targetContract, overrides);
  };

  // Get total number of proposals
  const getProposalCount = async (): Promise<number> => {
    if (!governance) throw new Error("Governance contract is not available.");
    return governance.proposalCount();
  };

  // Get proposal details by ID
  const getProposal = async (proposalId: number): Promise<ProposalInfo> => {
    if (!governance) throw new Error("Governance contract is not available.");
    return governance.getProposal(proposalId);
  };

  // Cast a vote on a proposal
  const castVote = async (proposalId: number, support: boolean) => {
    if (!governance) throw new Error("Governance contract is not available.");
    return governance.castVote(proposalId, support);
  };

  // Get voting receipt for a user on a proposal
  const getReceipt = async (proposalId: number, voter: string): Promise<ReceiptInfo> => {
    if (!governance) throw new Error("Governance contract is not available.");
    return governance.getReceipt(proposalId, voter);
  };

  // Propose a new multi-sig action
  const proposeMultiSigAction = async (operation: number, target: string, value: string | number, overrides = {}) => {
    if (!governance) throw new Error("Governance contract is not available.");
    return governance.proposeMultiSigAction(operation, target, value, overrides);
  };

  // Fetch MultiSigActionProposed events
  const getMultiSigActions = async (): Promise<MultiSigActionInfo[]> => {
    const governanceWeb3 = contracts?.governance;
    if (!governanceWeb3 || !web3) throw new Error('Governance contract or web3 not available');
    const events = await governanceWeb3.getPastEvents('MultiSigActionProposed', {
      fromBlock: 0,
      toBlock: 'latest',
    });
    return (events as EventLog[]).map((e) => {
      const rv = e.returnValues as { actionHash: string; proposer: string; operationType: string };
      return {
        actionHash: rv.actionHash,
        proposer: rv.proposer,
        operation: rv.operationType,
        target: '', // Not available in event, can be fetched if needed
        value: '',  // Not available in event, can be fetched if needed
        timestamp: Number(e.blockNumber),
      };
    });
  };

  // Admin functions
  const authorizeVoter = async (voter: string, weight: number) => {
    if (!governance) throw new Error("Governance contract is not available.");
    return governance.authorizeVoter(voter, weight);
  };
  const removeVoter = async (voter: string) => {
    if (!governance) throw new Error("Governance contract is not available.");
    return governance.removeVoter(voter);
  };
  const updateVoterWeight = async (voter: string, weight: number) => {
    if (!governance) throw new Error("Governance contract is not available.");
    return governance.updateVoterWeight(voter, weight);
  };

  return { propose, getProposalCount, getProposal, castVote, getReceipt, proposeMultiSigAction, getMultiSigActions, authorizeVoter, removeVoter, updateVoterWeight };
}

export class GovernanceService {
  private contract: Contract<AbiItem[]>;
  constructor(governanceAddress: string, web3: Web3) {
    this.contract = new web3.eth.Contract(GovernanceABI.abi, governanceAddress);
  }
  async isAuthorizedVoter(address: string): Promise<boolean> {
    return await this.contract.methods.authorizedVoters(address).call();
  }
  async getProposalCount(): Promise<number> {
    return await this.contract.methods.proposalCount().call();
  }
  async getProposal(proposalId: number): Promise<ProposalInfo> {
    return await this.contract.methods.getProposal(proposalId).call();
  }
  async castVote(proposalId: number, support: boolean, from: string): Promise<unknown> {
    return await this.contract.methods.castVote(proposalId, support).send({ from });
  }
  async getReceipt(proposalId: number, voter: string): Promise<ReceiptInfo> {
    return await this.contract.methods.getReceipt(proposalId, voter).call();
  }
} 