import React, { useEffect, useState } from 'react';
import { Button } from '@/components/buttons/Button';
import { useToast } from '@/hooks/use-toast';
import { useWeb3 } from '@/contexts/Web3Context';
import AdminStakingPanel from '@/components/core/AdminStakingPanel';
import { NFTContractService } from '@/services/nftContractService';
import { AuctionService } from '@/services/auctionService';
import { ethers } from 'ethers';
import AdminFilePanel from '@/components/core/AdminFilePanel';
import { useStakingService } from "@/services/stakingService";
import { useGovernanceService, MultiSigActionInfo } from "@/services/governanceService";
import { useFileRegistryService } from "@/services/fileRegistryService";
import { useNFTService } from "@/services/nftContractService";
import { StakingService } from "@/services/stakingService";
import type { EventLog } from 'web3-eth-contract';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/cards/Card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, ShieldCheck, FileText, Users, Database, AlertTriangle, CheckCircle, PauseCircle, Activity } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { currentAccount, isConnected, connectWallet } = useWeb3();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nftWithdrawable, setNftWithdrawable] = useState<string>('0');
  const [auctionWithdrawable, setAuctionWithdrawable] = useState<string>('0');
  const [refreshFlag, setRefreshFlag] = useState(false);
  const stakingService = useStakingService();
  const governanceService = useGovernanceService();
  const fileRegistryService = useFileRegistryService();
  const nftService = useNFTService();

  // State for forms
  const [voterAddress, setVoterAddress] = useState("");
  const [voterWeight, setVoterWeight] = useState(1);
  const [blacklistAddress, setBlacklistAddress] = useState("");
  const [unblacklistAddress, setUnblacklistAddress] = useState("");
  const [batchMintAddresses, setBatchMintAddresses] = useState("");
  const [batchMintAmounts, setBatchMintAmounts] = useState("");
  const [feeWithdrawTarget, setFeeWithdrawTarget] = useState("");
  const [emergencyWithdrawTarget, setEmergencyWithdrawTarget] = useState("");
  const [pauseTarget, setPauseTarget] = useState("staking");
  const [isPaused, setIsPaused] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [multiSigOperation, setMultiSigOperation] = useState(0);
  const [multiSigTarget, setMultiSigTarget] = useState("");
  const [multiSigValue, setMultiSigValue] = useState("");
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [adminLogs, setAdminLogs] = useState<EventLog[]>([]);
  const [multiSigStatus, setMultiSigStatus] = useState<MultiSigActionInfo[]>([]);

  // Add state for summary metrics
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [proposalCount, setProposalCount] = useState<number | null>(null);
  const [blacklistCount, setBlacklistCount] = useState<number | null>(null);

  // Check admin status (owner of Staking, NFT, FileRegistry, Governance)
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setLoading(true);
        if (!currentAccount) {
          setIsAdmin(false);
          return;
        }
        const stakingOwner = await StakingService.getInstance().getOwner();
        setIsAdmin(currentAccount.toLowerCase() === stakingOwner.toLowerCase());
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    if (currentAccount) checkAdmin();
  }, [currentAccount]);

  // Fetch withdrawable balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!currentAccount) return;
      try {
        // NFT contract: no withdrawable mapping, so just show 'admin only' or contract balance if needed
        setNftWithdrawable('admin only');
        // Auction contract: show withdrawable for current account
        const auctionService = AuctionService.getInstance();
        await auctionService.setWalletAddress(currentAccount);
        const auctionBal = await auctionService.getWithdrawable(currentAccount);
        setAuctionWithdrawable(ethers.utils.formatEther(auctionBal));
      } catch {
        setNftWithdrawable('0');
        setAuctionWithdrawable('0');
      }
    };
    fetchBalances();
  }, [currentAccount, refreshFlag]);

  // Fetch admin logs (audit log)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logs = await StakingService.getInstance().getAdminActionLogs();
        setAdminLogs(logs);
      } catch {
        setAdminLogs([]);
      }
    };
    fetchLogs();
  }, []);

  // Fetch multi-sig status (for demo, just fetch proposals)
  useEffect(() => {
    const fetchMultiSig = async () => {
      try {
        const actions = await governanceService.getMultiSigActions();
        setMultiSigStatus(actions);
      } catch {
        setMultiSigStatus([]);
      }
    };
    fetchMultiSig();
  }, []);

  useEffect(() => {
    // Fetch summary metrics
    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const count = await governanceService.getProposalCount();
        setProposalCount(Number(count));
        // No getBlacklistedAddresses available, so set to null
        setBlacklistCount(null);
      } catch {
        setProposalCount(null);
        setBlacklistCount(null);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, [governanceService, fileRegistryService]);

  const handleWithdrawNFT = async () => {
    setLoading(true);
    try {
      const nftService = NFTContractService.getInstance();
      await nftService.setWalletAddress(currentAccount!);
      await nftService.withdraw();
      toast({ title: 'NFT Platform Fee Withdrawn', description: 'Funds withdrawn from Thesis-NFT contract.' });
      setRefreshFlag(f => !f);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to withdraw from NFT contract', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawAuction = async () => {
    setLoading(true);
    try {
      const auctionService = AuctionService.getInstance();
      await auctionService.setWalletAddress(currentAccount!);
      await auctionService.withdrawFunds();
      toast({ title: 'Auction Platform Fee Withdrawn', description: 'Funds withdrawn from Thesis-Auction contract.' });
      setRefreshFlag(f => !f);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to withdraw from Auction contract', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Handlers (add try/catch and toast for all)
  const handleAuthorizeVoter = async () => {
    try {
      await governanceService.authorizeVoter(voterAddress, voterWeight);
      toast({ title: "Success", description: "Voter authorized." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };
  const handleRemoveVoter = async () => {
    try {
      await governanceService.removeVoter(voterAddress);
      toast({ title: "Success", description: "Voter removed." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };
  const handleUpdateVoterWeight = async () => {
    try {
      await governanceService.updateVoterWeight(voterAddress, voterWeight);
      toast({ title: "Success", description: "Voter weight updated." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };
  const handleBlacklist = async () => {
    try {
      await fileRegistryService.blacklistAddress(blacklistAddress);
      toast({ title: "Success", description: "Address blacklisted." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };
  const handleUnblacklist = async () => {
    try {
      await fileRegistryService.unblacklistAddress(unblacklistAddress);
      toast({ title: "Success", description: "Address unblacklisted." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };
  const handleBatchMint = async () => {
    try {
      // Parse addresses and amounts
      const addresses = batchMintAddresses.split(",").map(a => a.trim());
      const amounts = batchMintAmounts.split(",").map(a => parseInt(a.trim(), 10));
      await nftService.batchMint(addresses, amounts);
      toast({ title: "Success", description: "Batch mint successful." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };
  const handleWithdrawFees = async () => {
    try {
      await fileRegistryService.withdrawFees();
      toast({ title: "Success", description: "Fees withdrawn." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };
  const handleEmergencyWithdraw = async () => {
    try {
      await stakingService.emergencyRecoverTokens(emergencyWithdrawTarget);
      toast({ title: "Success", description: "Emergency withdrawal complete." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };
  const handlePauseToggle = async () => {
    try {
      if (!isPaused) {
        await stakingService.pauseContract();
        toast({ title: "Paused", description: "Contract paused." });
      } else {
        await stakingService.unpauseContract();
        toast({ title: "Unpaused", description: "Contract unpaused." });
      }
      setIsPaused(!isPaused);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };
  const handleEmergencyToggle = async () => {
    try {
      if (!isEmergency) {
        await stakingService.activateEmergencyMode();
        toast({ title: "Emergency", description: "Emergency mode activated." });
      } else {
        await stakingService.deactivateEmergencyMode();
        toast({ title: "Normal", description: "Emergency mode deactivated." });
      }
      setIsEmergency(!isEmergency);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };
  const handleMultiSigPropose = async () => {
    try {
      await governanceService.proposeMultiSigAction(multiSigOperation, multiSigTarget, multiSigValue);
      toast({ title: "Success", description: "Multi-sig proposal submitted." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  // Confirmation dialog handler
  const confirmAction = (action: string, handler: () => Promise<void>): React.ReactNode => {
    if (showConfirm !== action) return null;
    const onConfirm = async () => {
      setShowConfirm(null);
      setLoading(true);
      try {
        await handler();
      } finally {
        setLoading(false);
      }
    };
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-xl max-w-sm w-full">
          <div className="mb-4 font-bold">Are you sure?</div>
          <div className="mb-4 text-sm text-gray-700">This action cannot be undone.</div>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setShowConfirm(null)} variant="secondary">Cancel</Button>
            <Button onClick={onConfirm} variant="destructive">Confirm</Button>
          </div>
        </div>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={connectWallet}>Connect Wallet</Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/10 p-8 rounded-xl border border-white/20 text-center">
          <h2 className="text-2xl font-bold mb-2">Admin Access Only</h2>
          <p className="text-gray-300">You must be the contract owner or platform wallet to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white"><Skeleton className="w-96 h-32" /></div>;
  }

  // --- Enhanced Professional Layout ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-purple-950 text-white relative">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-blue-900/40 pointer-events-none z-0" />
      <div className="relative z-10 flex flex-col gap-12 p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold mb-2 drop-shadow-lg flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-blue-400" /> Admin Dashboard
            </h1>
            <p className="text-lg text-white/70 font-medium">Platform Control Center</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-base px-4 py-2 flex items-center gap-2">
              <Users className="w-5 h-5" /> {currentAccount?.slice(0, 6)}...{currentAccount?.slice(-4)}
            </Badge>
            <Badge variant={isPaused ? 'destructive' : 'default'} className="text-base px-4 py-2 flex items-center gap-2">
              {isPaused ? <PauseCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />} {isPaused ? 'Paused' : 'Active'}
            </Badge>
            <Badge variant={isEmergency ? 'destructive' : 'default'} className="text-base px-4 py-2 flex items-center gap-2">
              {isEmergency ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />} {isEmergency ? 'Emergency' : 'Normal'}
            </Badge>
          </div>
        </div>
        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <Card className="bg-white/10 border-blue-900/40 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Database className="w-6 h-6 text-blue-400" />NFT Fee</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? <Skeleton className="h-8 w-24" /> : <span className="text-2xl font-bold text-blue-300">{String(nftWithdrawable)}</span>}
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-blue-900/40 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Database className="w-6 h-6 text-purple-400" />Auction Fee</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? <Skeleton className="h-8 w-24" /> : <span className="text-2xl font-bold text-purple-300">{String(auctionWithdrawable)} ETH</span>}
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-blue-900/40 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-6 h-6 text-yellow-400" />Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? <Skeleton className="h-8 w-16" /> : <span className="text-2xl font-bold text-yellow-300">{proposalCount !== null ? String(proposalCount) : '--'}</span>}
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-blue-900/40 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Users className="w-6 h-6 text-red-400" />Blacklisted</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? <Skeleton className="h-8 w-16" /> : <span className="text-2xl font-bold text-red-300">{blacklistCount !== null ? String(blacklistCount) : '--'}</span>}
            </CardContent>
          </Card>
        </div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white/10 border-blue-900/40 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-6 h-6 text-green-400" />Staking Management</CardTitle>
              <CardDescription>Manage staking, pause, emergency, and more.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminStakingPanel walletAddress={currentAccount!} />
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-blue-900/40 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-6 h-6 text-blue-400" />File Registry</CardTitle>
              <CardDescription>Manage file blacklisting, unblacklisting, and fees.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminFilePanel />
            </CardContent>
          </Card>
        </div>
        {/* Audit Log / Activity Feed */}
        <div className="mt-12">
          <Card className="bg-white/10 border-blue-900/40 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="w-6 h-6 text-cyan-400" />Admin Activity Log</CardTitle>
              <CardDescription>Recent admin actions and events.</CardDescription>
            </CardHeader>
            <CardContent>
              {adminLogs.length === 0 ? (
                <div className="text-gray-400">No recent admin actions found.</div>
              ) : (
                <ul className="divide-y divide-white/10">
                  {adminLogs.slice(0, 10).map((log, idx) => (
                    <li key={idx} className="py-2 flex items-center gap-3">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-sm text-white/80 font-mono">{log.event}</span>
                      <span className="text-xs text-gray-400 ml-auto">Block {log.blockNumber}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 