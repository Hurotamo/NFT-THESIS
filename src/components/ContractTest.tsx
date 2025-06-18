import React, { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContracts } from '@/hooks/useContracts';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { StakePosition } from '@/services/stakingService';
import { StakingService } from '@/services/stakingService';

const ContractTest: React.FC = () => {
  const { isConnected, currentAccount, contracts } = useWeb3();
  const { getTotalStaked, hasDiscountEligibility, getUserStakes, stakeTokens } = useContracts();
  const { toast } = useToast();
  
  const [totalStaked, setTotalStaked] = useState<number>(0);
  const [hasDiscount, setHasDiscount] = useState<boolean>(false);
  const [userStakes, setUserStakes] = useState<StakePosition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const testContractConnection = async () => {
    if (!isConnected || !currentAccount) {
      setDebugInfo('❌ Wallet not connected\\n');
      return;
    }

    setIsLoading(true);
    setDebugInfo('Testing contract connection...\\n');

    try {
      // Test 1: Check MetaMask connection
      setDebugInfo(prev => prev + `✅ Wallet connected: ${currentAccount}\\n`);

      // Test 2: Check network
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      setDebugInfo(prev => prev + `✅ Chain ID: ${chainId} (should be 0x45a for tCORE2)\\n`);

      // Test 3: Check contracts
      if (contracts.staking) {
        setDebugInfo(prev => prev + '✅ Staking contract loaded\\n');
      } else {
        setDebugInfo(prev => prev + '❌ Staking contract not loaded\\n');
      }

      if (contracts.thesisNFT) {
        setDebugInfo(prev => prev + '✅ NFT contract loaded\\n');
      } else {
        setDebugInfo(prev => prev + '❌ NFT contract not loaded\\n');
      }

      if (contracts.thesisAuction) {
        setDebugInfo(prev => prev + '✅ Auction contract loaded\\n');
      } else {
        setDebugInfo(prev => prev + '❌ Auction contract not loaded\\n');
      }

      // Test 4: Check wallet balance
      const balance = await (window as any).ethereum.request({
        method: 'eth_getBalance',
        params: [currentAccount, 'latest']
      });
      const balanceInCORE = Number((window as any).ethereum.utils.fromWei(balance, 'ether'));
      setDebugInfo(prev => prev + `✅ Wallet balance: ${balanceInCORE.toFixed(4)} tCORE2\\n`);

      // Test 5: Check minimum stake requirement
      if (contracts.staking) {
        try {
          const minimumStake = await contracts.staking.methods.minimumStake().call();
          const minimumStakeInCORE = Number((window as any).ethereum.utils.fromWei(minimumStake, 'ether'));
          setDebugInfo(prev => prev + `✅ Minimum stake: ${minimumStakeInCORE} tCORE2\\n`);
          
          if (balanceInCORE >= minimumStakeInCORE) {
            setDebugInfo(prev => prev + '✅ Sufficient balance for staking\\n');
          } else {
            setDebugInfo(prev => prev + '❌ Insufficient balance for staking\\n');
          }
        } catch (error) {
          setDebugInfo(prev => prev + `❌ Failed to get minimum stake: ${error}\\n`);
        }
      }

    } catch (error) {
      setDebugInfo(prev => prev + `❌ Connection test failed: ${error}\\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const testStakingFunctions = async () => {
    if (!isConnected || !currentAccount) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDebugInfo('Testing staking functions...\n');

    try {
      // Test 1: Get total staked
      setDebugInfo(prev => prev + 'Testing getTotalStaked...\n');
      const totalStakedResult = await getTotalStaked();
      setTotalStaked(totalStakedResult);
      setDebugInfo(prev => prev + `✅ Total staked: ${totalStakedResult} CORE\n`);

      // Test 2: Check discount eligibility
      setDebugInfo(prev => prev + 'Testing hasDiscountEligibility...\n');
      const hasDiscountResult = await hasDiscountEligibility();
      setHasDiscount(hasDiscountResult);
      setDebugInfo(prev => prev + `✅ Has discount: ${hasDiscountResult}\n`);

      // Test 3: Get user stakes
      setDebugInfo(prev => prev + 'Testing getUserStakes...\n');
      const userStakesResult = await getUserStakes();
      setUserStakes(userStakesResult);
      setDebugInfo(prev => prev + `✅ User stakes: ${userStakesResult.length} positions\n`);

      // Test 4: Try a small stake (3 CORE for testing)
      setDebugInfo(prev => prev + 'Testing stakeTokens (3 CORE)...\\n');
      const stakeResult = await stakeTokens(3);
      setDebugInfo(prev => prev + `✅ Staking successful! Position created\\n`);

      toast({
        title: "Staking Test Complete",
        description: "All staking functions are working properly",
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setDebugInfo(prev => prev + `❌ Error: ${errorMessage}\n`);
      
      toast({
        title: "Staking Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectStaking = async () => {
    if (!isConnected || !currentAccount) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDebugInfo('Testing direct staking...\n');

    try {
      const stakingService = StakingService.getInstance();
      await stakingService.setWalletAddress(currentAccount);

      setDebugInfo(prev => prev + 'Attempting to stake 3 CORE directly...\\n');
      
      const result = await stakingService.stakeTokens(3);
      
      setDebugInfo(prev => prev + `✅ Direct staking successful! Amount: ${result.amount} CORE\n`);
      
      toast({
        title: "Direct Staking Success",
        description: `Successfully staked ${result.amount} CORE`,
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setDebugInfo(prev => prev + `❌ Direct staking failed: ${errorMessage}\n`);
      
      toast({
        title: "Direct Staking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testContractMethods = async () => {
    if (!isConnected || !currentAccount || !contracts.staking) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDebugInfo('Testing contract methods...\n');

    try {
      // Test 1: Get minimum stake
      setDebugInfo(prev => prev + 'Testing minimumStake()...\n');
      const minimumStake = await contracts.staking.methods.minimumStake().call();
      setDebugInfo(prev => prev + `✅ Minimum stake: ${minimumStake} wei\n`);

      // Test 2: Get discount percent
      setDebugInfo(prev => prev + 'Testing discountPercent()...\n');
      const discountPercent = await contracts.staking.methods.discountPercent().call();
      setDebugInfo(prev => prev + `✅ Discount percent: ${discountPercent}%\n`);

      // Test 3: Get user stake
      setDebugInfo(prev => prev + 'Testing userStakeHistoryLatest()...\n');
      const userStake = await contracts.staking.methods.userStakeHistoryLatest(currentAccount).call();
      setDebugInfo(prev => prev + `✅ User stake: ${userStake} wei\n`);

      // Test 4: Get discount percentage for user
      setDebugInfo(prev => prev + 'Testing getDiscountPercentage()...\n');
      const userDiscount = await contracts.staking.methods.getDiscountPercentage(currentAccount).call();
      setDebugInfo(prev => prev + `✅ User discount: ${userDiscount}%\n`);

      // Test 5: Gas estimation for stake (0.1 CORE)
      setDebugInfo(prev => prev + 'Testing gas estimation for stake...\n');
      try {
        const amountInWei = '100000000000000000'; // 0.1 CORE in wei
        
        const gasEstimate = await contracts.staking.methods.stake().estimateGas({
          from: currentAccount,
          value: amountInWei
        });
        setDebugInfo(prev => prev + `✅ Gas estimate for stake: ${gasEstimate} gas\n`);
      } catch (error) {
        setDebugInfo(prev => prev + `❌ Gas estimation failed: ${error}\n`);
      }

    } catch (error) {
      setDebugInfo(prev => prev + `❌ Contract method test failed: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDebug = () => {
    setDebugInfo('');
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Contract Test & Debug</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Connection Status</h3>
          <p className="text-gray-300">Connected: {isConnected ? '✅ Yes' : '❌ No'}</p>
          <p className="text-gray-300">Account: {currentAccount ? `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}` : 'Not connected'}</p>
          <p className="text-gray-300">Network: CORE Testnet</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Contract Status</h3>
          <p className="text-gray-300">Staking Contract: {contracts.staking ? '✅ Loaded' : '❌ Not loaded'}</p>
          <p className="text-gray-300">NFT Contract: {contracts.thesisNFT ? '✅ Loaded' : '❌ Not loaded'}</p>
          <p className="text-gray-300">Auction Contract: {contracts.thesisAuction ? '✅ Loaded' : '❌ Not loaded'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button 
          onClick={testContractConnection}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Test Contract Connection
        </Button>
        
        <Button 
          onClick={testStakingFunctions}
          disabled={isLoading || !isConnected}
          className="bg-green-600 hover:bg-green-700"
        >
          Test Staking Functions
        </Button>
        
        <Button 
          onClick={testDirectStaking}
          disabled={isLoading || !isConnected}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Test Direct Staking
        </Button>
        
        <Button 
          onClick={testContractMethods}
          disabled={isLoading || !isConnected}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          Test Contract Methods
        </Button>
        
        <Button 
          onClick={clearDebug}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Clear Debug
        </Button>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Debug Information</h3>
        <div className="bg-black p-4 rounded-lg h-64 overflow-y-auto">
          <pre className="text-green-400 text-sm whitespace-pre-wrap">{debugInfo || 'No debug information yet. Run a test to see results.'}</pre>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Total Staked</h4>
          <p className="text-2xl text-green-400">{totalStaked} CORE</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Discount Eligible</h4>
          <p className="text-2xl text-blue-400">{hasDiscount ? 'Yes' : 'No'}</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Stake Positions</h4>
          <p className="text-2xl text-purple-400">{userStakes.length}</p>
        </div>
      </div>
    </div>
  );
};

export default ContractTest; 