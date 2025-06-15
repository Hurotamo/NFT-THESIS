
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'correct' | 'incorrect' | 'error'>('checking');
  const { toast } = useToast();

  // Updated CORE Testnet configuration with correct details
  const CORE_TESTNET_CONFIG = {
    chainId: '0x457', // 1111 in hex
    chainName: 'Core Blockchain Testnet',
    nativeCurrency: {
      name: 'tCORE',
      symbol: 'tCORE',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.test.btcs.network'],
    blockExplorerUrls: ['https://scan.test.btcs.network'],
  };

  useEffect(() => {
    checkMetaMaskInstalled();
    if (window.ethereum) {
      checkNetwork();
      // Listen for network changes
      window.ethereum.on('chainChanged', checkNetwork);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkNetwork);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkMetaMaskInstalled = () => {
    const installed = typeof window.ethereum !== 'undefined';
    setIsMetaMaskInstalled(installed);
    if (!installed) {
      setNetworkStatus('error');
    }
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

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      onConnect('');
      setNetworkStatus('checking');
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
        variant: "destructive",
      });
    } else {
      // Re-check network when account changes
      checkNetwork();
    }
  };

  const addCoreTestnetToMetaMask = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [CORE_TESTNET_CONFIG],
      });
      
      toast({
        title: "Network Added",
        description: "CORE Testnet has been added to MetaMask",
      });
      
      // Check network status after adding
      setTimeout(checkNetwork, 1000);
      return true;
    } catch (error: any) {
      console.error('Failed to add Core Testnet:', error);
      toast({
        title: "Network Error",
        description: error.message || "Failed to add CORE Testnet to MetaMask",
        variant: "destructive",
      });
      return false;
    }
  };

  const switchToTestnet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CORE_TESTNET_CONFIG.chainId }],
      });
      
      toast({
        title: "Network Switched",
        description: "Successfully switched to CORE Testnet",
      });
      
      // Check network status after switching
      setTimeout(checkNetwork, 1000);
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added yet, add it
        return await addCoreTestnetToMetaMask();
      }
      console.error('Failed to switch to Core Testnet:', error);
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch to CORE Testnet",
        variant: "destructive",
      });
      return false;
    }
  };

  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // First, switch to Core Testnet if not already connected
      if (!isCorrectNetwork) {
        const networkSwitched = await switchToTestnet();
        if (!networkSwitched) {
          setIsConnecting(false);
          return;
        }
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        onConnect(accounts[0]);
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to CORE Testnet",
        });
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getNetworkStatusIcon = () => {
    switch (networkStatus) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'correct':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'incorrect':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getNetworkStatusText = () => {
    switch (networkStatus) {
      case 'checking':
        return 'Checking network...';
      case 'correct':
        return 'Connected to CORE Testnet';
      case 'incorrect':
        return 'Wrong network detected';
      case 'error':
        return 'Network error';
      default:
        return '';
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="backdrop-blur-md bg-white/10 rounded-xl p-8 border border-white/20 max-w-md mx-auto"
      >
        <div className="text-center">
          <Wallet className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">MetaMask Required</h3>
          <p className="text-gray-300 mb-6">
            You need MetaMask to connect to CORE Testnet and interact with our platform.
          </p>
          <Button
            onClick={() => window.open('https://metamask.io/download/', '_blank')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto"
          >
            Install MetaMask
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      {/* Network Status Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg backdrop-blur-md border ${
          networkStatus === 'correct' 
            ? 'bg-green-600/20 border-green-400/30 text-green-400'
            : networkStatus === 'incorrect'
            ? 'bg-yellow-600/20 border-yellow-400/30 text-yellow-400'
            : networkStatus === 'error'
            ? 'bg-red-600/20 border-red-400/30 text-red-400'
            : 'bg-blue-600/20 border-blue-400/30 text-blue-400'
        }`}
      >
        {getNetworkStatusIcon()}
        <span>{getNetworkStatusText()}</span>
      </motion.div>

      {/* CORE Testnet Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-4 border border-white/10"
      >
        <h4 className="text-white font-semibold mb-2">CORE Blockchain Testnet</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p><span className="text-gray-400">Chain ID:</span> 1111 (0x457)</p>
          <p><span className="text-gray-400">Currency:</span> tCORE</p>
          <p><span className="text-gray-400">RPC URL:</span> https://rpc.test.btcs.network</p>
        </div>
      </motion.div>
      
      {/* Connect Button */}
      <Button
        onClick={connectWallet}
        disabled={isConnecting}
        size="lg"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 mx-auto min-w-[280px]"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-6 h-6" />
            {isCorrectNetwork ? 'Connect Wallet' : 'Connect to CORE Testnet'}
          </>
        )}
      </Button>
      
      {/* Help Text */}
      <div className="mt-6 text-sm text-gray-400 space-y-2">
        <p>Connect your MetaMask wallet to CORE Testnet</p>
        {!isCorrectNetwork && networkStatus !== 'checking' && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-yellow-400 bg-yellow-600/10 rounded-lg px-3 py-2 border border-yellow-400/20"
          >
            Network will be added automatically when you connect
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default WalletConnect;
