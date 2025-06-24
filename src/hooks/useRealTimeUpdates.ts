import { useState, useEffect, useCallback } from 'react';
import DataManager from '../utils/dataManager';
import { NFTContractService } from '../services/nftContractService';
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
      // Get data from backend (MongoDB)
      const backendRes = await axios.get('/api/all-files');
      const backendData = backendRes.data;
      
      // Get data from smart contract
      let contractData: FileInfo[] = [];
      try {
        const nftService = NFTContractService.getInstance();
        const contractFiles = await nftService.getAllUploadedFiles();
        
        // Transform contract data to match backend format
        contractData = contractFiles.map(file => ({
          uploader: file.uploader,
          ipfsHash: file.ipfsHash,
          fileName: `thesis_${file.uploader.slice(0, 6)}_${Date.now()}.pdf`,
          fileSize: file.fileSize.toString(),
          feePaid: file.feePaid,
          mintPrice: file.mintPrice,
          timestamp: file.blockNumber,
          title: `Thesis by ${file.uploader.slice(0, 6)}...${file.uploader.slice(-4)}`,
          description: `Thesis uploaded by ${file.uploader}`,
          author: file.uploader,
          university: 'Unknown',
          year: new Date().getFullYear().toString(),
          field: 'General',
          postedAt: new Date().toISOString(),
          walletAddress: file.uploader,
          source: 'contract'
        }));
      } catch (contractError) {
        console.error('Error fetching from smart contract:', contractError);
        // Continue with backend data only if contract fails
      }
      
      // Merge backend and contract data, avoiding duplicates
      const allData = [...backendData];
      
      // Add contract data that's not already in backend data
      contractData.forEach(contractFile => {
        const exists = allData.some(backendFile => backendFile.ipfsHash === contractFile.ipfsHash);
        if (!exists) {
          allData.push(contractFile);
        }
      });
      
      setData(prevData => ({
        ...prevData,
        thesis: allData,
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
