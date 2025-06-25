import React, { useEffect, useState } from 'react';
import { useGovernanceService } from '@/services/governanceService';
import GovernanceProposalButton from '@/components/buttons/GovernanceProposalButton';
import { Plus, User, CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft, Info, Users, ThumbsUp, ThumbsDown, MinusCircle } from 'lucide-react';
import MultiSigActionsSection from '@/components/core/MultiSigActionsSection';

interface Proposal {
  id: number;
  description: string;
  proposer: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  executed: boolean;
  canceled: boolean;
  emergency: boolean;
  startTime: string | number;
  endTime: string | number;
}

const statusBadge = (proposal: Proposal) => {
  if (proposal.executed) return <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4" />Executed</span>;
  if (proposal.canceled) return <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"><XCircle className="w-4 h-4" />Canceled</span>;
  if (proposal.emergency) return <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"><AlertCircle className="w-4 h-4" />Emergency</span>;
  return <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4" />Active</span>;
};

const GovernanceSection: React.FC = () => {
  const { getProposalCount, getProposal, castVote } = useGovernanceService();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
  const [loading, setLoading] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteResult, setVoteResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (view === 'list') {
      setLoading(true);
      setError(null);
      getProposalCount().then(async (count: number) => {
        const items: Proposal[] = [];
        for (let i = 0; i < count; i++) {
          try {
            const proposal = await getProposal(i);
            items.push({
              ...proposal,
              id: i,
              forVotes: Number(proposal.forVotes),
              againstVotes: Number(proposal.againstVotes),
              abstainVotes: Number(proposal.abstainVotes),
              startTime: Number(proposal.startTime),
              endTime: Number(proposal.endTime),
            });
          } catch (e: unknown) {
            // If a proposal fails to load, skip it
          }
        }
        setProposals(items);
        setLoading(false);
      }).catch(() => {
        setError("Failed to fetch proposals.");
        setLoading(false);
      });
    }
  }, [view]);

  const handleSelectProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setView('detail');
  };

  const handleVote = async (support: boolean) => {
    if (!selectedProposal) return;
    setVoteLoading(true);
    try {
      await castVote(selectedProposal.id, support);
      setVoteResult('Vote submitted!');
    } catch (e: unknown) {
      let message = 'Vote failed.';
      if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
        message = 'Vote failed: ' + (e as { message: string }).message;
      }
      setVoteResult(message);
    }
    setVoteLoading(false);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse h-40" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-lg mt-8">{error}</div>;
  }

  // Create Proposal View
  if (view === 'create') {
    return (
      <>
        <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-xl p-8 mt-8 shadow-lg">
          <button onClick={() => setView('list')} className="mb-4 flex items-center gap-2 text-blue-400 hover:text-blue-300"><ArrowLeft className="w-4 h-4" />Back to Proposals</button>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Plus className="w-6 h-6" />Create Proposal</h2>
          <GovernanceProposalButton />
        </div>
      </>
    );
  }

  // Proposal Detail View
  if (view === 'detail' && selectedProposal) {
    return (
      <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-xl p-8 mt-8 shadow-lg">
        <button onClick={() => setView('list')} className="mb-4 flex items-center gap-2 text-blue-400 hover:text-blue-300"><ArrowLeft className="w-4 h-4" />Back to Proposals</button>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">Proposal #{selectedProposal.id}</h2>
          {statusBadge(selectedProposal)}
        </div>
        <div className="mb-4 text-gray-300 flex items-center gap-2"><Info className="w-4 h-4" />{selectedProposal.description}</div>
        <div className="mb-2 flex items-center gap-2"><User className="w-4 h-4 text-blue-400" />Proposer: <span className="text-white font-mono">{selectedProposal.proposer}</span></div>
        <div className="flex gap-4 mb-4">
          <span className="flex items-center gap-1 text-green-400"><ThumbsUp className="w-4 h-4" />For: {selectedProposal.forVotes}</span>
          <span className="flex items-center gap-1 text-red-400"><ThumbsDown className="w-4 h-4" />Against: {selectedProposal.againstVotes}</span>
          <span className="flex items-center gap-1 text-yellow-400"><MinusCircle className="w-4 h-4" />Abstain: {selectedProposal.abstainVotes}</span>
        </div>
        <div className="mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-purple-400" />Status: <span className="text-white">{selectedProposal.executed ? 'Executed' : selectedProposal.canceled ? 'Canceled' : 'Active'}</span></div>
        <div className="mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-gray-400" />Start: <span className="text-white">{new Date(Number(selectedProposal.startTime) * 1000).toLocaleString()}</span></div>
        <div className="mb-4 flex items-center gap-2"><Info className="w-4 h-4 text-gray-400" />End: <span className="text-white">{new Date(Number(selectedProposal.endTime) * 1000).toLocaleString()}</span></div>
        <div className="mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-400" />Emergency: <span className="text-white">{selectedProposal.emergency ? 'Yes' : 'No'}</span></div>
        <div className="flex gap-4 mt-6">
          <button disabled={voteLoading} onClick={() => handleVote(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"><ThumbsUp className="w-4 h-4" />Vote For</button>
          <button disabled={voteLoading} onClick={() => handleVote(false)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"><ThumbsDown className="w-4 h-4" />Vote Against</button>
        </div>
        {voteResult && <div className="mt-4 text-sm text-blue-400">{voteResult}</div>}
      </div>
    );
  }

  // Proposal List View
  return (
    <>
      <div className="bg-blue-950/80 border-2 border-blue-500 rounded-xl shadow-lg mb-10 p-6">
        <MultiSigActionsSection />
      </div>
      <div className="relative">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">Governance Proposals <Info className="w-6 h-6 text-blue-400" /></h1>
        <button
          onClick={() => setView('create')}
          className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center gap-2 text-lg"
          aria-label="Create Proposal"
        >
          <Plus className="w-6 h-6" />
        </button>
        {proposals.length === 0 ? (
          <div className="text-gray-400 text-lg">No proposals found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((p) => (
              <div
                key={p.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-lg hover:shadow-blue-400/20 transition-shadow cursor-pointer"
                onClick={() => handleSelectProposal(p)}
                aria-label={`View details for proposal ${p.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-white">#{p.id}</span>
                  {statusBadge(p)}
                </div>
                <div className="text-white mb-2 line-clamp-2 min-h-[2.5em]">{p.description}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1"><User className="w-4 h-4" />{p.proposer}</div>
                <div className="flex gap-2 mt-2">
                  <span className="text-green-400 flex items-center gap-1"><ThumbsUp className="w-4 h-4" />{p.forVotes}</span>
                  <span className="text-red-400 flex items-center gap-1"><ThumbsDown className="w-4 h-4" />{p.againstVotes}</span>
                  <span className="text-yellow-400 flex items-center gap-1"><MinusCircle className="w-4 h-4" />{p.abstainVotes}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default GovernanceSection; 