import React, { useEffect, useState } from 'react';
import { useGovernanceService, MultiSigActionInfo } from '@/services/governanceService';
import { ListOrdered, User, Hash, Clock } from 'lucide-react';

const MultiSigActionsSection: React.FC = () => {
  const { getMultiSigActions } = useGovernanceService();
  const [actions, setActions] = useState<MultiSigActionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMultiSigActions()
      .then(setActions)
      .catch(() => setError("Failed to fetch multi-sig actions."))
      .finally(() => setLoading(false));
  }, [getMultiSigActions]);

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ListOrdered className="w-6 h-6 text-blue-400" />MultiSig Actions
      </h2>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : actions.length === 0 ? (
        <div className="text-gray-400">No multi-sig actions found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action) => (
            <div
              key={action.actionHash}
              className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-lg"
            >
              <div className="mb-2 text-sm text-blue-300 flex items-center gap-2">
                <Hash className="w-4 h-4" />{action.actionHash.slice(0, 10)}...{action.actionHash.slice(-6)}
              </div>
              <div className="text-lg font-bold text-white mb-2">{action.operation}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                <User className="w-4 h-4" />{action.proposer}
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-4 h-4" />Block: {action.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSigActionsSection; 