import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { useToast } from '@/hooks/use-toast';
import { CONTRACT_ADDRESSES } from '@/config/contractAddresses';
import StakingABI from '@/abis/Staking.json';
import ThesisNFTABI from '@/abis/ThesisNFT.json';
import ThesisAuctionABI from '@/abis/ThesisAuction.json';
import GovernanceABI from '@/abis/Governance.json';
import FileRegistryABI from '@/abis/FileRegistry.json';
import AuctionManagerABI from '@/abis/AuctionManager.json';

declare global {
  interface Window {
    ethereum?: typeof Web3.givenProvider & {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

interface Web3ContextType {
  web3: Web3 | null;
  accounts: string[];
  currentAccount: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  networkStatus: 'checking' | 'correct' | 'incorrect' | 'error';
  contracts: {
    staking: Contract;
    thesisNFT: Contract;
    thesisAuction: Contract;
    governance: Contract;
    fileRegistry: Contract;
    auctionManager: Contract;
  } | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToCoreTestnet: () => Promise<boolean>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const CORE_TESTNET_CONFIG = {
  chainId: '0x45a', // 1114 in hex (tCORE2 Chain ID)
  chainName: 'Core Blockchain TestNet',
  nativeCurrency: {
    name: 'tCORE2',
    symbol: 'tCORE2',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.test2.btcs.network'],
  blockExplorerUrls: ['https://scan.test2.btcs.network'],
};

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'correct' | 'incorrect' | 'error'>('checking');
  const [contracts, setContracts] = useState<{
    staking: Contract;
    thesisNFT: Contract;
    thesisAuction: Contract;
    governance: Contract;
    fileRegistry: Contract;
    auctionManager: Contract;
  } | null>(null);
  const { toast } = useToast();

  const initializeWeb3 = () => {
    if (typeof window.ethereum !== 'undefined') {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      
      // Initialize contracts
      const stakingContract = new web3Instance.eth.Contract(
        StakingABI.abi as any,
        CONTRACT_ADDRESSES.staking
      );
      
      const thesisNFTContract = new web3Instance.eth.Contract(
        ThesisNFTABI.abi as any,
        CONTRACT_ADDRESSES.thesisNFT
      );
      
      const thesisAuctionContract = new web3Instance.eth.Contract(
        ThesisAuctionABI.abi as any,
        CONTRACT_ADDRESSES.thesisAuction
      );

      const governanceContract = new web3Instance.eth.Contract(
        GovernanceABI.abi as any,
        CONTRACT_ADDRESSES.governance
      );

      const fileRegistryContract = new web3Instance.eth.Contract(
        FileRegistryABI.abi as any,
        CONTRACT_ADDRESSES.fileRegistry
      );

      const auctionManagerContract = new web3Instance.eth.Contract(
        AuctionManagerABI.abi as any,
        CONTRACT_ADDRESSES.auctionManager
      );
      
      setContracts({
        staking: stakingContract,
        thesisNFT: thesisNFTContract,
        thesisAuction: thesisAuctionContract,
        governance: governanceContract,
        fileRegistry: fileRegistryContract,
        auctionManager: auctionManagerContract,
      });
      
      return web3Instance;
    }
    return null;
  };

  const checkNetwork = async () => {
    if (!window.ethereum) {
      setNetworkStatus('error');
      return;
    }
    
    setNetworkStatus('checking');
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const isCorrect = chainId === CORE_TESTNET_CONFIG.chainId;
      setIsCorrectNetwork(isCorrect);
      setNetworkStatus(isCorrect ? 'correct' : 'incorrect');
    } catch (error) {
      console.error('Error checking network:', error);
      setNetworkStatus('error');
      setIsCorrectNetwork(false);
    }
  };

  const addCoreTestnetToMetaMask = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not found");
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [CORE_TESTNET_CONFIG],
      });
      
      toast({
        title: "Network Added",
        description: "CORE Testnet has been added to MetaMask",
      });
      
      setTimeout(checkNetwork, 1000);
      return true;
    } catch (error) {
      const err = error as { message?: string };
      console.error('Failed to add Core Testnet:', err);
      toast({
        title: "Network Error",
        description: err.message || "Failed to add CORE Testnet to MetaMask",
        variant: "destructive",
      });
      return false;
    }
  };

  const switchToCoreTestnet = async (): Promise<boolean> => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not found");
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CORE_TESTNET_CONFIG.chainId }],
      });
      
      toast({
        title: "Network Switched",
        description: "Successfully switched to CORE Testnet",
      });
      
      setTimeout(checkNetwork, 1000);
      return true;
    } catch (error) {
      const err = error as { code?: number; message?: string };
      if (err.code === 4902) {
        return await addCoreTestnetToMetaMask();
      }
      console.error('Failed to switch to Core Testnet:', err);
      toast({
        title: "Switch Failed",
        description: err.message || "Failed to switch to CORE Testnet",
        variant: "destructive",
      });
      return false;
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      // Initialize Web3 if not already done
      if (!web3) {
        initializeWeb3();
      }

      // Check and switch network if needed
      if (!isCorrectNetwork) {
        const networkSwitched = await switchToCoreTestnet();
        if (!networkSwitched) {
          return;
        }
      }

      // Request account access
      if (!web3) throw new Error("Web3 not initialized");
      if (!window.ethereum) throw new Error("MetaMask not found");

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length > 0) {
        setAccounts(accounts);
        setCurrentAccount(accounts[0]);
        setIsConnected(true);
        
        // Update services with wallet address
        const { NFTContractService } = await import('@/services/nftContractService');
        const { StakingService } = await import('@/services/stakingService');
        
        NFTContractService.getInstance().setWalletAddress(accounts[0]);
        StakingService.getInstance().setWalletAddress(accounts[0]);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error) {
      const err = error as { message?: string };
      console.error('Failed to connect wallet:', err);
      toast({
        title: "Connection Failed",
        description: err.message || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = () => {
    setAccounts([]);
    setCurrentAccount(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    setNetworkStatus('checking');
    
    toast({
      title: "Wallet Disconnected",
      description: "You have been logged out successfully",
    });
  };

  const handleAccountsChanged = (newAccounts: unknown) => {
    const accounts = newAccounts as string[];
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccounts(accounts);
      setCurrentAccount(accounts[0]);
      setIsConnected(true);
      
      // Update services with new wallet address
      const updateServices = async () => {
        const { NFTContractService } = await import('@/services/nftContractService');
        const { StakingService } = await import('@/services/stakingService');
        
        NFTContractService.getInstance().setWalletAddress(accounts[0]);
        StakingService.getInstance().setWalletAddress(accounts[0]);
      };
      updateServices();
    }
  };

  const handleChainChanged = () => {
    checkNetwork();
  };

  useEffect(() => {
    const web3Instance = initializeWeb3();
    checkNetwork();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const value: Web3ContextType = {
    web3,
    accounts,
    currentAccount,
    isConnected,
    isCorrectNetwork,
    networkStatus,
    contracts,
    connectWallet,
    disconnectWallet,
    switchToCoreTestnet,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}; 