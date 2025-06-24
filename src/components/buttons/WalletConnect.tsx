import { Button } from "@/components/buttons/Button";
import { useWeb3 } from "@/contexts/Web3Context";

const WalletConnect = () => {
  const { connectWallet, disconnectWallet, currentAccount, isConnected, isCorrectNetwork, networkStatus } = useWeb3();

  const getNetworkName = () => {
    // This is a simplified version, you might want a more robust implementation
    return "CORE Testnet";
  };

  const handleConnect = async () => {
    if (!isConnected) {
      await connectWallet();
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  if (isConnected && currentAccount) {
    return (
      <div className="flex items-center gap-4 bg-gray-800 p-2 rounded-lg">
        <div className="flex-grow">
          <p className="text-white font-bold text-sm truncate">{currentAccount}</p>
          <p className="text-green-400 text-xs">{getNetworkName()}</p>
        </div>
        <Button onClick={handleDisconnect} variant="destructive" size="sm">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={networkStatus === 'checking'}
    >
      {networkStatus === 'checking' && "Checking Network..."}
      {!isCorrectNetwork && networkStatus !== 'checking' && "Switch to CORE Testnet"}
      {isCorrectNetwork && "Connect Wallet"}
    </Button>
  );
};

export default WalletConnect;
