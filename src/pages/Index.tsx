import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Center } from '@react-three/drei';
import { Wallet, FileText, Coins, Gavel, Menu, X, Upload, User, AlertCircle, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/contexts/Web3Context";
import WalletConnect from '../components/WalletConnect';
import MintingSection from '../components/MintingSection';
import StakingSection from '../components/StakingSection';
import AuctionSection from '../components/AuctionSection';
import ThesisPosting from '../components/ThesisPosting';
import UserProfile from '../components/UserProfile';
import EnhancedMintingSection from '../components/EnhancedMintingSection';
import Footer from '../components/Footer';

// 3D NFT Card Component
function FloatingNFT() {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh>
        <boxGeometry args={[2, 2.8, 0.1]} />
        <meshStandardMaterial color="#6366f1" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Simple 3D text replacement using basic geometry */}
      <Center position={[0, 0, 0.06]}>
        <group>
          {/* N */}
          <mesh position={[-0.4, 0, 0]}>
            <boxGeometry args={[0.1, 0.6, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.25, 0.15, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.1, 0.42, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.1, 0, 0]}>
            <boxGeometry args={[0.1, 0.6, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          
          {/* F */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.6, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.15, 0.2, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.1, 0, 0]}>
            <boxGeometry args={[0.15, 0.1, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          
          {/* T */}
          <mesh position={[0.4, 0.25, 0]}>
            <boxGeometry args={[0.3, 0.1, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.4, 0, 0]}>
            <boxGeometry args={[0.1, 0.5, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      </Center>
    </Float>
  );
}

// 3D Scene Background
function ThreeScene() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
      
      <FloatingNFT />
      
      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Float key={i} speed={1 + Math.random()} rotationIntensity={0.5}>
          <mesh position={[
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10
          ]}>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color="#8b5cf6" opacity={0.6} transparent />
          </mesh>
        </Float>
      ))}
      
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { toast } = useToast();
  const { 
    currentAccount, 
    isConnected, 
    isCorrectNetwork, 
    networkStatus,
    connectWallet, 
    disconnectWallet 
  } = useWeb3();

  const navigation = [
    { name: 'Home', id: 'home', icon: FileText },
    { name: 'Post Thesis', id: 'post', icon: Upload },
    { name: 'Mint NFTs', id: 'mint', icon: Coins },
    { name: 'Stake', id: 'stake', icon: Wallet },
    { name: 'Auction', id: 'auction', icon: Gavel },
    { name: 'Profile', id: 'profile', icon: User },
  ];

  const handleWalletConnect = async () => {
    await connectWallet();
  };

  const handleWalletLogout = () => {
    disconnectWallet();
    setActiveSection('home');
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'post':
        return <ThesisPosting walletAddress={currentAccount || ''} />;
      case 'mint':
        return <EnhancedMintingSection walletAddress={currentAccount || ''} />;
      case 'stake':
        return <StakingSection walletAddress={currentAccount || ''} />;
      case 'auction':
        return <AuctionSection walletAddress={currentAccount || ''} />;
      case 'profile':
        return currentAccount ? (
          <UserProfile walletAddress={currentAccount} />
        ) : (
          <div className="min-h-screen flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-md bg-white/10 rounded-xl p-8 border border-white/20 text-center max-w-md mx-auto"
            >
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Wallet Required</h3>
              <p className="text-gray-300">Please connect your wallet to view your profile.</p>
            </motion.div>
          </div>
        );
      default:
        return (
          <div className="relative">
            {/* Hero Section */}
            <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
              {/* 3D Background */}
              <div className="absolute inset-0 z-0">
                <ThreeScene />
              </div>
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-blue-900/40 z-10" />
              
              {/* Content */}
              <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-6">
                    ThesisNFT
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    A revolutionary platform where students post academic research and investors mint them as NFTs. Powered by Core blockchain technology.
                  </p>
                  
                  {!isConnected ? (
                    <WalletConnect onConnect={handleWalletConnect} />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="backdrop-blur-md bg-white/10 rounded-lg p-4 inline-block">
                        <p className="text-green-400 font-semibold">
                          Wallet Connected: {currentAccount?.slice(0, 6)}...{currentAccount?.slice(-4)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4 justify-center">
                        <Button
                          onClick={() => setActiveSection('post')}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105"
                        >
                          Post Your Thesis
                        </Button>
                        <Button
                          onClick={() => setActiveSection('mint')}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105"
                        >
                          Mint NFTs
                        </Button>
                        <Button
                          onClick={() => setActiveSection('stake')}
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold"
                        >
                          Stake CORE
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-16"
                >
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Revolutionize Academic Publishing
                  </h2>
                  <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                    Our platform creates a bridge between academic research and blockchain technology, enabling a new ecosystem for thesis monetization.
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Upload,
                      title: "Students Post Theses",
                      description: "Upload and share your academic research with metadata preservation on IPFS."
                    },
                    {
                      icon: Coins,
                      title: "Investors Mint NFTs",
                      description: "Browse available theses and mint them as NFTs. Stake 100+ CORE for 20% discount."
                    },
                    {
                      icon: Gavel,
                      title: "Trade in Auctions",
                      description: "List thesis NFTs in our escrow-secured auction marketplace for trading."
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="backdrop-blur-md bg-white/5 rounded-xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                    >
                      <feature.icon className="w-12 h-12 text-blue-400 mb-6 group-hover:text-purple-400 transition-colors" />
                      <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                      <p className="text-gray-400">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ThesisNFT
              </h1>
            </div>

            {/* Wallet Address Display with Logout */}
            {isConnected && currentAccount && (
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={handleWalletLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 border border-green-400/30 text-green-400 rounded-lg hover:bg-green-600/30 transition-all duration-200 group"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-mono">
                    {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
                  </span>
                  <LogOut className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            )}

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Wallet Display */}
              {isConnected && currentAccount && (
                <button
                  onClick={handleWalletLogout}
                  className="flex items-center space-x-1 px-2 py-1 bg-green-600/20 border border-green-400/30 text-green-400 rounded text-xs"
                >
                  <span>{currentAccount.slice(0, 4)}...{currentAccount.slice(-2)}</span>
                  <LogOut className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/90 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 w-full px-3 py-3 rounded-lg transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              ))}
              {isConnected && (
                <button
                  onClick={() => {
                    handleWalletLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-red-400 hover:bg-red-600/10 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout Wallet</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {renderActiveSection()}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
