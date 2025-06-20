import { useState, useEffect, useCallback } from 'react';
import DataManager from '../utils/dataManager';
import axios from 'axios';

interface FileInfo {
  uploader: string;
  ipfsHash: string;
  fileName: string;
  timestamp: number;
  title?: string;
  description?: string;
  author?: string;
  university?: string;
  year?: string;
  field?: string;
  postedAt?: string;
  walletAddress?: string;
  tags?: string[];
}

interface RealTimeData {
  thesis: FileInfo[];
  mintCounts: Record<string, number>;
  globalStats: Record<string, unknown>;
  lastUpdate: Date;
}

export const useRealTimeUpdates = (walletAddress?: string) => {
  const [data, setData] = useState<RealTimeData>({
    thesis: [],
    mintCounts: {},
    globalStats: {},
    lastUpdate: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [thesis, setThesis] = useState<FileInfo[]>([]);

  const dataManager = DataManager.getInstance();

  // Only refresh stats, not thesis list
  const refreshStats = useCallback(() => {
    setData(prev => ({
      ...prev,
      mintCounts: dataManager.getMintCounts(),
      globalStats: dataManager.getGlobalStats(),
      lastUpdate: new Date()
    }));
    setIsLoading(false);
  }, [dataManager]);

  const fetchAllFiles = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/all-files');
      setData(prevData => ({
        ...prevData,
        thesis: res.data,
        lastUpdate: new Date()
      }));
    } catch (err) {
      setData(prevData => ({
        ...prevData,
        thesis: [],
        lastUpdate: new Date()
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load: fetch all files from backend
    fetchAllFiles();

    // Set up real-time stats updates every 3 seconds
    const interval = setInterval(() => {
      dataManager.simulateActivity();
      refreshStats();
    }, 3000);

    // Listen for storage changes from other tabs (for stats only)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('thesis_vault_')) {
        refreshStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshStats]);

  useEffect(() => {
    fetchAllFiles();
    const interval = setInterval(fetchAllFiles, 3 * 60 * 1000); // 3 minutes
    return () => clearInterval(interval);
  }, []);

  const getUserThesis = useCallback(() => {
    if (!walletAddress) return [];
    return dataManager.getUserThesis(walletAddress);
  }, [walletAddress, dataManager, data.lastUpdate]);

  const getUserMints = useCallback(() => {
    if (!walletAddress) return [];
    return dataManager.getUserMints(walletAddress);
  }, [walletAddress, dataManager, data.lastUpdate]);

  const getUserData = useCallback(() => {
    if (!walletAddress) return null;
    return dataManager.getUserData(walletAddress);
  }, [walletAddress, dataManager, data.lastUpdate]);

  return {
    ...data,
    isLoading,
    refreshStats,
    getUserThesis,
    getUserMints,
    getUserData,
    dataManager
  };
};
