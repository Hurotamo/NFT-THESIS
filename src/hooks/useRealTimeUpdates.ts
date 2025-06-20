import { useState, useEffect, useCallback } from 'react';
import DataManager from '../utils/dataManager';
import axios from 'axios';

interface RealTimeData {
  thesis: any[];
  mintCounts: { [key: string]: number };
  globalStats: any;
  lastUpdate: Date;
}

interface FileInfo {
  uploader: string;
  ipfsHash: string;
  fileName: string;
  timestamp: number;
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

  const refreshData = useCallback(() => {
    const newData = {
      thesis: dataManager.getAllThesis(),
      mintCounts: dataManager.getMintCounts(),
      globalStats: dataManager.getGlobalStats(),
      lastUpdate: new Date()
    };
    setData(newData);
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
    // Initial load
    refreshData();

    // Set up real-time updates every 3 seconds
    const interval = setInterval(() => {
      // Simulate some background activity
      dataManager.simulateActivity();
      refreshData();
    }, 3000);

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('thesis_vault_')) {
        refreshData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshData]);

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
    refreshData,
    getUserThesis,
    getUserMints,
    getUserData,
    dataManager
  };
};
