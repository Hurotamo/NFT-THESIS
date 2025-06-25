import React, { useState, useEffect } from "react";
import { useGovernanceService } from "@/services/governanceService";
import { Loader2, FileText, Link2, Code, CheckCircle, XCircle, Info, AlertCircle, ListOrdered } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/config/contractAddresses';

const MULTISIG_OPERATIONS = [
  { value: 0, label: 'Transfer Ownership' },
  { value: 1, label: 'Update Voting Period' },
  { value: 2, label: 'Update Quorum Percentage' },
  { value: 3, label: 'Emergency Action' },
  { value: 4, label: 'Update Trusted Target' },
];

const CONTRACT_LABELS = {
  staking: 'Staking',
  fileRegistry: 'File Registry',
  governance: 'Governance',
  auctionManager: 'Auction Manager',
  thesisNFT: 'Thesis NFT',
  thesisAuction: 'Thesis Auction',
  thesisFileManager: 'Thesis File Manager',
};

const CONTRACT_OPTIONS = [
  { value: CONTRACT_ADDRESSES.staking, label: CONTRACT_LABELS.staking, key: 'staking' },
  { value: CONTRACT_ADDRESSES.fileRegistry, label: CONTRACT_LABELS.fileRegistry, key: 'fileRegistry' },
  { value: CONTRACT_ADDRESSES.governance, label: CONTRACT_LABELS.governance, key: 'governance' },
  { value: CONTRACT_ADDRESSES.auctionManager, label: CONTRACT_LABELS.auctionManager, key: 'auctionManager' },
  { value: CONTRACT_ADDRESSES.thesisNFT, label: CONTRACT_LABELS.thesisNFT, key: 'thesisNFT' },
  { value: CONTRACT_ADDRESSES.thesisAuction, label: CONTRACT_LABELS.thesisAuction, key: 'thesisAuction' },
  { value: CONTRACT_ADDRESSES.thesisFileManager, label: CONTRACT_LABELS.thesisFileManager, key: 'thesisFileManager' },
];

// Map operation value to valid contract keys
const OPERATION_CONTRACTS: Record<number, string[]> = {
  0: [ // Transfer Ownership
    'staking', 'fileRegistry', 'governance', 'auctionManager', 'thesisNFT', 'thesisAuction', 'thesisFileManager'
  ],
  1: [ // Update Voting Period
    'governance'
  ],
  2: [ // Update Quorum Percentage
    'governance'
  ],
  3: [ // Emergency Action
    'staking', 'fileRegistry', 'auctionManager', 'thesisNFT', 'thesisAuction'
  ],
  4: [ // Update Trusted Target
    'governance'
  ],
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Add value field config for each operation
const VALUE_FIELD_CONFIG: Record<number, { show: boolean; type: string; min?: number; max?: number; step?: number; hint: string; example?: string }> = {
  0: { // Transfer Ownership
    show: false,
    type: 'text',
    hint: 'Enter the new owner address in the Target field.',
    example: 'Example: 0x1234...abcd'
  },
  1: { // Update Voting Period
    show: true,
    type: 'number',
    min: 86400,
    max: 2592000,
    step: 1,
    hint: 'Enter the new voting period in seconds (1 day = 86400, 7 days = 604800, 30 days = 2592000).',
    example: 'Example: 604800 (7 days)'
  },
  2: { // Update Quorum Percentage
    show: true,
    type: 'number',
    min: 10,
    max: 75,
    step: 1,
    hint: 'Enter the new quorum percentage (10-75).',
    example: 'Example: 20'
  },
  3: { // Emergency Action
    show: true,
    type: 'number',
    min: 0,
    max: 1,
    step: 1,
    hint: '1 = Activate emergency mode (pause), 0 = Deactivate (unpause).',
    example: 'Example: 1 (activate), 0 (deactivate)'
  },
  4: { // Update Trusted Target
    show: true,
    type: 'number',
    min: 0,
    max: 1,
    step: 1,
    hint: '1 = Trust this contract, 0 = Remove trust.',
    example: 'Example: 1 (trust), 0 (untrust)'
  },
};

const GovernanceProposalButton: React.FC = () => {
  const { proposeMultiSigAction } = useGovernanceService();
  const [operation, setOperation] = useState(0);
  const [target, setTarget] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validContracts, setValidContracts] = useState(CONTRACT_OPTIONS);

  const validateValue = (): string | null => {
    const config = VALUE_FIELD_CONFIG[operation];
    if (!config.show) return null;
    if (value === "" || value === undefined || value === null) return "Value is required.";
    const num = Number(value);
    if (isNaN(num)) return "Value must be a number.";
    if (config.min !== undefined && num < config.min) return `Value must be at least ${config.min}.`;
    if (config.max !== undefined && num > config.max) return `Value must be at most ${config.max}.`;
    if (config.step === 1 && !Number.isInteger(num)) return "Value must be an integer.";
    return null;
  };

  const handlePropose = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    // Custom validation
    if (!target || (VALUE_FIELD_CONFIG[operation].show && value === "")) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }
    if (VALUE_FIELD_CONFIG[operation].show) {
      const validationError = validateValue();
      if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
      }
    }
    try {
      if (!proposeMultiSigAction) {
        setError("proposeMultiSigAction function not available.");
        setLoading(false);
        return;
      }
      // Call the contract function
      const tx = await proposeMultiSigAction(operation, target, VALUE_FIELD_CONFIG[operation].show ? value : 0);
      await tx.wait();
      setSuccess("Proposal submitted successfully!");
      setTarget("");
      setValue("");
    } catch (error) {
      setError("Proposal failed: " + (error as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Filter valid contracts for the selected operation
    const validKeys = OPERATION_CONTRACTS[operation];
    const filtered = CONTRACT_OPTIONS.filter(opt => validKeys.includes(opt.key));
    setValidContracts(filtered);
    // Auto-select if only one valid contract
    if (filtered.length === 1) {
      setTarget(filtered[0].value);
    } else {
      setTarget("");
    }
  }, [operation]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-lg max-w-xl mx-auto">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ListOrdered className="w-5 h-5 text-blue-400" />Create MultiSig Proposal</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 flex items-center gap-1" htmlFor="operation">
          <ListOrdered className="w-4 h-4 text-gray-400" />Operation
        </label>
        <select
          id="operation"
          className="w-full rounded bg-black/40 border border-white/10 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={operation}
          onChange={e => setOperation(Number(e.target.value))}
        >
          {MULTISIG_OPERATIONS.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        <div className="text-xs text-gray-400 mt-1">Select the type of multi-sig operation.</div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 flex items-center gap-1" htmlFor="target">
          <Link2 className="w-4 h-4 text-gray-400" />Target Address
        </label>
        {validContracts.length === 1 ? (
          <input
            id="target"
            type="text"
            className="w-full rounded bg-black/40 border border-white/10 p-2 text-white opacity-50 cursor-not-allowed"
            value={validContracts[0].label + ' (' + validContracts[0].value + ')'}
            disabled
          />
        ) : (
          <select
            id="target"
            className="w-full rounded bg-black/40 border border-white/10 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={target}
            onChange={e => setTarget(e.target.value)}
          >
            <option value="">Select contract</option>
            {validContracts.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
        <div className="text-xs text-gray-400 mt-1">
          {validContracts.length === 1
            ? `This operation is only valid for ${validContracts[0].label}.`
            : 'Select the contract affected by this operation.'}
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 flex items-center gap-1" htmlFor="value">
          <Code className="w-4 h-4 text-gray-400" />Value
        </label>
        {VALUE_FIELD_CONFIG[operation].show ? (
          <input
            id="value"
            type={VALUE_FIELD_CONFIG[operation].type}
            className="w-full rounded bg-black/40 border border-white/10 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Value (uint256)"
            value={value}
            min={VALUE_FIELD_CONFIG[operation].min}
            max={VALUE_FIELD_CONFIG[operation].max}
            step={VALUE_FIELD_CONFIG[operation].step}
            onChange={e => setValue(e.target.value)}
          />
        ) : (
          <input
            id="value"
            type="text"
            className="w-full rounded bg-black/40 border border-white/10 p-2 text-white opacity-50 cursor-not-allowed"
            value="(not required for this operation)"
            disabled
          />
        )}
        <div className="text-xs text-gray-400 mt-1">{VALUE_FIELD_CONFIG[operation].hint}</div>
        {VALUE_FIELD_CONFIG[operation].example && (
          <div className="text-xs text-blue-400 mt-1">{VALUE_FIELD_CONFIG[operation].example}</div>
        )}
      </div>
      <div className="mb-4">
        <div className="font-semibold text-white mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-400" />Proposal Summary</div>
        <div className="bg-black/30 border border-white/10 rounded p-3 text-sm text-gray-300">
          <div><span className="font-bold text-white">Operation:</span> {MULTISIG_OPERATIONS.find(op => op.value === operation)?.label}</div>
          <div><span className="font-bold text-white">Target:</span> {target || <span className="italic text-gray-500">(none)</span>}</div>
          <div><span className="font-bold text-white">Value:</span> {value || <span className="italic text-gray-500">(none)</span>}</div>
        </div>
      </div>
      {error && <div className="mb-2 text-red-400 flex items-center gap-2"><XCircle className="w-4 h-4" />{error}</div>}
      {success && <div className="mb-2 text-green-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
      <button
        onClick={handlePropose}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />} Submit Proposal
      </button>
    </div>
  );
};

export default GovernanceProposalButton; 