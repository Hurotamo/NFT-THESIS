import React, { useState, useEffect } from 'react';
import { Button } from '@/components/buttons/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/feedback/Alert';
import { StakingService } from '@/services/stakingService';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck, Percent, Users, AlertTriangle, PauseCircle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/modals/AlertDialog';
import type { EventLog } from 'web3-eth-contract';
import Web3 from 'web3';

interface AdminStakingPanelProps {
  walletAddress: string;
}

// Add the AcadeMeNFT logo (use the provided image URL)
const CORE_LOGO_URL = 'https://rose-imaginative-lion-87.mypinata.cloud/ipfs/bafybeibz55g4lhrh2oiicjyf6br5zg5fp6il4ou5mnbudrlprmzgp24rru';

const AdminStakingPanel: React.FC<AdminStakingPanelProps> = ({ walletAddress }) => {
  const [discountPercent, setDiscountPercent] = useState(20);
  const [newDiscount, setNewDiscount] = useState('');
  const [blacklistAddress, setBlacklistAddress] = useState('');
  const [unblacklistAddress, setUnblacklistAddress] = useState('');
  const [batchStakeList, setBatchStakeList] = useState('');
  const [batchUnstakeList, setBatchUnstakeList] = useState('');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [logTimestamps, setLogTimestamps] = useState<{ [blockNumber: string]: string }>({});
  const [eventFilter, setEventFilter] = useState<string>('All');
  const [page, setPage] = useState(0);
  const logsPerPage = 10;
  const [timestampsLoading, setTimestampsLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
    fetchLogs();
  }, [walletAddress]);

  useEffect(() => {
    const fetchTimestamps = async () => {
      if (logs.length === 0) return;
      setTimestampsLoading(true);
      const web3 = new Web3(window.ethereum as unknown as Web3.Provider);
      const timestamps: { [blockNumber: string]: string } = {};
      for (const log of logs) {
        const blockKey = String(log.blockNumber);
        if (!timestamps[blockKey]) {
          try {
            const block = await web3.eth.getBlock(log.blockNumber);
            timestamps[blockKey] = new Date(Number(block.timestamp) * 1000).toLocaleString();
          } catch {
            timestamps[blockKey] = '';
          }
        }
      }
      setLogTimestamps(timestamps);
      setTimestampsLoading(false);
    };
    fetchTimestamps();
  }, [logs]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const stakingService = StakingService.getInstance();
      stakingService.setWalletAddress(walletAddress);
      const config = await stakingService.getStakingConfig();
      const contractState = await stakingService.getContractState();
      setDiscountPercent(config.discountPercentage);
      setEmergencyMode(contractState.emergencyMode);
      setIsPaused(contractState.paused);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load admin data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const stakingService = StakingService.getInstance();
      stakingService.setWalletAddress(walletAddress);
      const logs = await stakingService.getAdminActionLogs();
      setLogs(logs);
    } catch (e) {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSetDiscount = async () => {
    if (!newDiscount) return;
    setLoading(true);
    try {
      const stakingService = StakingService.getInstance();
      await stakingService.setDiscountPercent(Number(newDiscount));
      toast({ title: 'Discount Updated', description: `Discount set to ${newDiscount}%` });
      setDiscountPercent(Number(newDiscount));
      setNewDiscount('');
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to set discount', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBlacklist = async () => {
    if (!blacklistAddress) return;
    setLoading(true);
    try {
      const stakingService = StakingService.getInstance();
      await stakingService.blacklistAddress(blacklistAddress);
      toast({ title: 'Blacklisted', description: `Address ${blacklistAddress} blacklisted.` });
      setBlacklistAddress('');
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to blacklist address', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblacklist = async () => {
    if (!unblacklistAddress) return;
    setLoading(true);
    try {
      const stakingService = StakingService.getInstance();
      await stakingService.unblacklistAddress(unblacklistAddress);
      toast({ title: 'Unblacklisted', description: `Address ${unblacklistAddress} unblacklisted.` });
      setUnblacklistAddress('');
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to unblacklist address', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchStake = async () => {
    if (!batchStakeList) return;
    setLoading(true);
    try {
      const addresses = batchStakeList.split(',').map(addr => addr.trim()).filter(Boolean);
      const stakingService = StakingService.getInstance();
      await stakingService.batchStake(addresses);
      toast({ title: 'Batch Stake', description: 'Batch stake successful.' });
      setBatchStakeList('');
    } catch (e) {
      toast({ title: 'Error', description: 'Batch stake failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUnstake = async () => {
    if (!batchUnstakeList) return;
    setLoading(true);
    try {
      const addresses = batchUnstakeList.split(',').map(addr => addr.trim()).filter(Boolean);
      const stakingService = StakingService.getInstance();
      await stakingService.batchUnstake(addresses);
      toast({ title: 'Batch Unstake', description: 'Batch unstake successful.' });
      setBatchUnstakeList('');
    } catch (e) {
      toast({ title: 'Error', description: 'Batch unstake failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyToggle = async () => {
    setLoading(true);
    try {
      const stakingService = StakingService.getInstance();
      if (!emergencyMode) {
        await stakingService.activateEmergencyMode();
        toast({ title: 'Emergency Mode', description: 'Emergency mode activated.' });
      } else {
        await stakingService.deactivateEmergencyMode();
        toast({ title: 'Emergency Mode', description: 'Emergency mode deactivated.' });
      }
      setEmergencyMode(!emergencyMode);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to toggle emergency mode', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePauseToggle = async () => {
    setLoading(true);
    try {
      const stakingService = StakingService.getInstance();
      if (!isPaused) {
        await stakingService.pauseContract();
        toast({ title: 'Paused', description: 'Contract paused.' });
      } else {
        await stakingService.unpauseContract();
        toast({ title: 'Unpaused', description: 'Contract unpaused.' });
      }
      setIsPaused(!isPaused);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to toggle pause', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered and paginated logs
  const uniqueEvents = Array.from(new Set(logs.map(log => String(log.event))));
  const filteredLogs = eventFilter === 'All' ? logs : logs.filter(log => String(log.event) === eventFilter);
  const paginatedLogs = filteredLogs.slice(page * logsPerPage, (page + 1) * logsPerPage);

  return (
    <div className="bg-white/5 rounded-2xl p-8 border border-white/10 mt-8 shadow-xl max-w-5xl mx-auto relative">
      {/* CORE Logo */}
      <div className="flex justify-center mb-6">
        <img
          src={CORE_LOGO_URL}
          alt="AcadeMeNFT Logo"
          className="w-24 h-24 rounded-full shadow-lg border-4 border-white/20 bg-white object-contain"
          style={{ background: 'linear-gradient(135deg, #ff9900 60%, #111 100%)' }}
        />
      </div>
      <h2 className="text-3xl font-extrabold mb-8 text-center flex items-center justify-center gap-2">
        <ShieldCheck className="w-7 h-7 text-orange-400" /> Admin Staking Panel
      </h2>
      {/* Alerts */}
      {logsLoading && <div className="flex justify-center mb-4"><Loader2 className="animate-spin text-orange-400 w-6 h-6" /></div>}
      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Discount Management */}
        <div className="bg-gradient-to-br from-black/60 via-orange-900/10 to-black/80 rounded-xl p-6 border border-orange-400/20 shadow-sm flex flex-col gap-3">
          <h3 className="font-semibold flex items-center gap-2 text-orange-300 text-lg mb-2">
            <Percent className="w-5 h-5" /> Discount Management
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span>Current Discount:</span>
            <span className="font-bold text-green-400 text-lg">{discountPercent}%</span>
          </div>
          <div className="flex gap-2 mb-2">
            <Input
              type="number"
              placeholder="Set new discount %"
              value={newDiscount}
              onChange={e => setNewDiscount(e.target.value)}
              min={0}
              max={20}
              className="w-32 bg-white/10 border-orange-400/30 focus:border-orange-400"
              aria-label="Set new discount percentage"
            />
            <Button onClick={handleSetDiscount} disabled={loading || !newDiscount} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold min-w-[80px]">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Set'}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Set the discount for eligible stakers (max 20%).</p>
        </div>
        {/* Blacklist Management */}
        <div className="bg-gradient-to-br from-black/60 via-orange-900/10 to-black/80 rounded-xl p-6 border border-orange-400/20 shadow-sm flex flex-col gap-3">
          <h3 className="font-semibold flex items-center gap-2 text-orange-300 text-lg mb-2">
            <Users className="w-5 h-5" /> Blacklist Management
          </h3>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Address to blacklist"
              value={blacklistAddress}
              onChange={e => setBlacklistAddress(e.target.value)}
              className="w-64 bg-white/10 border-orange-400/30 focus:border-orange-400"
              aria-label="Address to blacklist"
            />
            <Button onClick={handleBlacklist} disabled={loading || !blacklistAddress} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold min-w-[100px]">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Blacklist'}
            </Button>
          </div>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Address to unblacklist"
              value={unblacklistAddress}
              onChange={e => setUnblacklistAddress(e.target.value)}
              className="w-64 bg-white/10 border-orange-400/30 focus:border-orange-400"
              aria-label="Address to unblacklist"
            />
            <Button onClick={handleUnblacklist} disabled={loading || !unblacklistAddress} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold min-w-[100px]">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Unblacklist'}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Manage blacklisted addresses for staking.</p>
        </div>
        {/* Batch Stake */}
        <div className="bg-gradient-to-br from-black/60 via-orange-900/10 to-black/80 rounded-xl p-6 border border-orange-400/20 shadow-sm flex flex-col gap-3">
          <h3 className="font-semibold flex items-center gap-2 text-orange-300 text-lg mb-2">
            <Users className="w-5 h-5" /> Batch Stake
          </h3>
          <Input
            placeholder="Comma-separated addresses"
            value={batchStakeList}
            onChange={e => setBatchStakeList(e.target.value)}
            className="w-full mb-2 bg-white/10 border-orange-400/30 focus:border-orange-400"
            aria-label="Batch stake addresses"
          />
          <Button onClick={handleBatchStake} disabled={loading || !batchStakeList} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold min-w-[120px]">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Batch Stake'}
          </Button>
          <p className="text-xs text-gray-400 mt-1">Stake for multiple addresses at once (0.1 tCORE2 each).</p>
        </div>
        {/* Batch Unstake */}
        <div className="bg-gradient-to-br from-black/60 via-orange-900/10 to-black/80 rounded-xl p-6 border border-orange-400/20 shadow-sm flex flex-col gap-3">
          <h3 className="font-semibold flex items-center gap-2 text-orange-300 text-lg mb-2">
            <Users className="w-5 h-5" /> Batch Unstake
          </h3>
          <Input
            placeholder="Comma-separated addresses"
            value={batchUnstakeList}
            onChange={e => setBatchUnstakeList(e.target.value)}
            className="w-full mb-2 bg-white/10 border-orange-400/30 focus:border-orange-400"
            aria-label="Batch unstake addresses"
          />
          <Button onClick={handleBatchUnstake} disabled={loading || !batchUnstakeList} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold min-w-[120px]">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Batch Unstake'}
          </Button>
          <p className="text-xs text-gray-400 mt-1">Unstake for multiple addresses at once.</p>
        </div>
        {/* Emergency Controls */}
        <div className="bg-gradient-to-br from-black/60 via-orange-900/10 to-black/80 rounded-xl p-6 border border-orange-400/20 shadow-sm md:col-span-2 flex flex-col gap-3">
          <h3 className="font-semibold flex items-center gap-2 text-orange-300 text-lg mb-2">
            <AlertTriangle className="w-5 h-5" /> Emergency Controls
          </h3>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex items-center gap-2 mb-2">
              <span>Emergency Mode:</span>
              <AlertDialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
                <AlertDialogTrigger asChild>
                  <Switch checked={emergencyMode} onCheckedChange={() => setShowEmergencyDialog(true)} aria-label="Toggle emergency mode" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will {emergencyMode ? 'deactivate' : 'activate'} Emergency Mode. This action affects all users.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { setShowEmergencyDialog(false); handleEmergencyToggle(); }}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <span className="text-xs text-gray-400 ml-2">(Disables all staking actions)</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span>Pause Contract:</span>
              <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
                <AlertDialogTrigger asChild>
                  <Switch checked={isPaused} onCheckedChange={() => setShowPauseDialog(true)} aria-label="Toggle pause contract" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will {isPaused ? 'unpause' : 'pause'} the contract. This action affects all users.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { setShowPauseDialog(false); handlePauseToggle(); }}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <span className="text-xs text-gray-400 ml-2">(Pauses all contract functions)</span>
            </div>
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className="my-8 border-t border-white/10" />
      {/* Activity Log Section */}
      <div className="mt-8">
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-orange-300 text-lg">
          <Loader2 className="w-4 h-4 animate-spin" style={{ display: logsLoading || timestampsLoading ? 'inline-block' : 'none' }} />
          Admin Activity Log
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="eventFilter" className="text-xs text-gray-400">Filter by event:</label>
          <select
            id="eventFilter"
            value={eventFilter}
            onChange={e => { setEventFilter(e.target.value); setPage(0); }}
            className="bg-black/40 border border-orange-400/30 rounded px-2 py-1 text-xs text-white"
            aria-label="Filter by event"
          >
            <option value="All">All</option>
            {uniqueEvents.map(ev => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto rounded-lg bg-black/30 border border-orange-400/10">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-orange-200">
                <th className="py-2 px-3">Event</th>
                <th className="py-2 px-3">Block</th>
                <th className="py-2 px-3">Address</th>
                <th className="py-2 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log, idx) => (
                <tr key={log.id || log.transactionHash + idx} className="border-t border-white/5">
                  <td className="py-2 px-3 font-semibold text-orange-300">{log.event}</td>
                  <td className="py-2 px-3">{log.blockNumber}</td>
                  <td className="py-2 px-3 font-mono">{log.address}</td>
                  <td className="py-2 px-3">{logTimestamps[String(log.blockNumber)] || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-between items-center mt-2">
          <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
          <span className="text-xs text-gray-400">Page {page + 1} of {Math.ceil(filteredLogs.length / logsPerPage)}</span>
          <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(Math.ceil(filteredLogs.length / logsPerPage) - 1, p + 1))} disabled={page >= Math.ceil(filteredLogs.length / logsPerPage) - 1}>Next</Button>
        </div>
      </div>
    </div>
  );
};

export default AdminStakingPanel; 