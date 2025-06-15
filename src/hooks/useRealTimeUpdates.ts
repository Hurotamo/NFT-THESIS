
import { useState, useEffect, useCallback } from 'react';
import DataManager from '../utils/dataManager';

interface RealTimeData {
  theses: any[];
  mintCounts: { [key: string]: number };
  globalStats: any;
  lastUpdate: Date;
}

export const useRealTimeUpdates = (walletAddress?: string) => {
  const [data, setData] = useState<RealTimeData>({
    theses: [],
    mintCounts: {},
    globalStats: {},
    lastUpdate: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);

  const dataManager = DataManager.getInstance();

  const refreshData = useCallback(() => {
    const newData = {
      theses: dataManager.getAllTheses(),
      mintCounts: dataManager.getMintCounts(),
      globalStats: dataManager.getGlobalStats(),
      lastUpdate: new Date()
    };
    setData(newData);
    setIsLoading(false);
  }, [dataManager]);

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

  const getUserTheses = useCallback(() => {
    if (!walletAddress) return [];
    return dataManager.getUserTheses(walletAddress);
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
    getUserTheses,
    getUserMints,
    getUserData,
    dataManager
  };
};
