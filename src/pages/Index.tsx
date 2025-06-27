import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Center } from '@react-three/drei';
import { Wallet, FileText, Coins, Gavel, Menu, X, Upload, User, AlertCircle, LogOut, Bell, Settings } from 'lucide-react';
import { Button } from "@/components/buttons/Button";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/contexts/Web3Context";
import WalletConnect from "@/components/buttons/WalletConnect";
import StakingSection from "../components/core/StakingSection";
import AuctionSection from "../components/core/AuctionSection";
import ThesisPosting from "@/components/core/ThesisPosting";
import UserProfile from "../components/core/UserProfile";
import EnhancedMintingSection from "@/components/core/EnhancedMintingSection";
import Footer from "@/components/layout/Footer";

// 3D NFT Card Component
function FloatingNFT() {
  return <Float speed={2} rotationIntensity={1} floatIntensity={2}>
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
    </Float>;
}

// 3D Scene Background
function ThreeScene() {
  return <Canvas camera={{
    position: [0, 0, 8],
    fov: 50
  }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
      
      <FloatingNFT />
      
      {/* Floating particles */}
      {Array.from({
      length: 20
    }).map((_, i) => <Float key={i} speed={1 + Math.random()} rotationIntensity={0.5}>
          <mesh position={[(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10]}>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color="#8b5cf6" opacity={0.6} transparent />
          </mesh>
        </Float>)}
      
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} autoRotate autoRotateSpeed={0.5} />
    </Canvas>;
}

const sections = {
  mint: EnhancedMintingSection,
  stake: StakingSection,
  auction: AuctionSection,
  post: ThesisPosting,
  profile: UserProfile
};

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { toast } = useToast();
  const { currentAccount, isConnected, isCorrectNetwork, connectWallet, disconnectWallet } = useWeb3();

  const navigation = [
    { name: 'Home', id: 'home', icon: FileText },
    { name: 'Post Thesis', id: 'post', icon: Upload },
    { name: 'Mint NFTs', id: 'mint', icon: Coins },
    { name: 'Stake', id: 'stake', icon: Wallet },
    { name: 'Auction', id: 'auction', icon: Gavel },
    { name: 'Profile', id: 'profile', icon: User }
  ];

  const handleWalletConnect = async () => {
    await connectWallet();
  };

  const handleWalletLogout = () => {
    disconnectWallet();
    setActiveSection('home');
  };

  const handleThesisPosted = () => {
    setActiveSection('mint');
    toast({
      title: "Thesis Posted!",
      description: "Your thesis is now available for minting."
    });
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'post':
        return <ThesisPosting walletAddress={currentAccount || ''} onThesisPosted={handleThesisPosted} />;
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
          <div className="min-h-screen flex items-center justify-center px-4 bg-black">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-gradient-to-br from-gray-900/90 to-black/90 rounded-2xl p-12 border border-gray-700/50 text-center max-w-md mx-auto shadow-2xl"
            >
              <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Wallet Required</h3>
              <p className="text-gray-300 mb-6">Please connect your wallet to view your profile and access all features.</p>
              <WalletConnect />
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
              
              {/* Enhanced Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-purple-900/30 to-blue-900/50 z-10" />
              
              {/* Content */}
              <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="relative inline-block mb-8">
                    <span className="absolute -top-10 -left-10 text-7xl md:text-8xl select-none opacity-80">
                      🎓
                    </span>
                    <h1 className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                      ACADEME NFT
                    </h1>
                  </div>
                  <p className="text-xl md:text-3xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                    A revolutionary platform where students post academic research and investors mint them as NFTs.
                  </p>
                </motion.div>
              </div>
            </section>

            {/* Enhanced Features Section */}
            <section className="py-32 px-4 bg-gradient-to-b from-black to-gray-900">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-20"
                >
                  <h2 className="text-6xl md:text-7xl font-bold text-white mb-8 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Revolutionize Academic Publishing
                  </h2>
                  <p className="text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                    Our platform creates a bridge between academic research and blockchain technology, enabling a new ecosystem for thesis monetization and intellectual property protection.
                  </p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-12">
                  {[
                    {
                      icon: Upload,
                      title: "Students Post Thesis",
                      description: "Upload and share your academic research with metadata preservation on IPFS. Secure, permanent, and immutable storage for your intellectual work with advanced encryption.",
                      gradient: "from-emerald-500 via-green-500 to-teal-500",
                      bgGradient: "from-emerald-500/10 to-green-500/5"
                    },
                    {
                      icon: Coins,
                      title: "Investors Mint NFTs",
                      description: "Browse available theses and mint them as NFTs. Stake 100+ CORE tokens for exclusive 20% discount on all minting fees and early access to premium content.",
                      gradient: "from-blue-500 via-cyan-500 to-indigo-500",
                      bgGradient: "from-blue-500/10 to-cyan-500/5"
                    },
                    {
                      icon: Gavel,
                      title: "Trade in Auctions",
                      description: "List thesis NFTs in our escrow-secured auction marketplace. Safe, transparent trading with smart contract protection and automated royalty distribution.",
                      gradient: "from-purple-500 via-violet-500 to-pink-500",
                      bgGradient: "from-purple-500/10 to-violet-500/5"
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      className="group relative h-96"
                    >
                      {/* Background Glow */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                      
                      {/* Card Content */}
                      <div className="relative h-full backdrop-blur-xl bg-gradient-to-br from-gray-900/95 to-black/95 rounded-3xl p-8 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-500 group hover:transform hover:scale-105 shadow-2xl hover:shadow-3xl flex flex-col">
                        {/* Icon */}
                        <div className={`inline-flex p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-2xl group-hover:shadow-3xl transition-all duration-300 w-fit`}>
                          <feature.icon className="w-12 h-12 text-white" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 flex flex-col">
                          <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-blue-300 transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-gray-400 leading-relaxed text-lg group-hover:text-gray-300 transition-colors flex-1">
                            {feature.description}
                          </p>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Enhanced Stats Section */}
            <section className="py-32 px-4 bg-gradient-to-r from-gray-900 via-black to-gray-900">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="text-center mb-16"
                >
                  <h2 className="text-5xl font-bold text-white mb-4">Platform Statistics</h2>
                  <p className="text-xl text-gray-400">Real-time metrics from our growing community</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { number: "500+", label: "Theses Published", icon: FileText, color: "blue" },
                    { number: "10K+", label: "NFTs Minted", icon: Coins, color: "green" },
                    { number: "1M+", label: "CORE Staked", icon: Wallet, color: "purple" }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="group relative"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                      <div className="relative backdrop-blur-lg bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-8 border border-white/20 hover:border-white/30 transition-all duration-300 text-center group hover:transform hover:scale-105">
                        <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 mb-6 shadow-lg`}>
                          <stat.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          {stat.number}
                        </div>
                        <div className="text-gray-400 text-lg font-medium">{stat.label}</div>
                      </div>
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
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-black/80 border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                ACADEMENFT
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 justify-center space-x-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-blue-600/40 to-purple-600/40 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/20 backdrop-blur-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10 hover:backdrop-blur-lg'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            {/* Enhanced Notification Bell + Wallet Section */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="relative p-3 rounded-full hover:bg-white/10 transition-all duration-200 group" aria-label="Notifications">
                <Bell className="w-6 h-6 text-white group-hover:text-blue-300 transition-colors" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              {!isConnected ? (
                <WalletConnect />
              ) : (
                <button
                  onClick={handleWalletLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-400/30 text-green-300 rounded-xl hover:from-green-600/30 hover:to-emerald-600/30 transition-all duration-200 group backdrop-blur-lg shadow-lg"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-mono">
                    {currentAccount?.slice(0, 6)}...{currentAccount?.slice(-4)}
                  </span>
                  <LogOut className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            {/* Enhanced Mobile Menu */}
            <div className="md:hidden flex items-center space-x-2">
              {isConnected && currentAccount && (
                <button
                  onClick={handleWalletLogout}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600/20 border border-green-400/30 text-green-400 rounded-lg text-xs backdrop-blur-lg"
                >
                  <span>{currentAccount.slice(0, 4)}...{currentAccount.slice(-2)}</span>
                  <LogOut className="w-3 h-3" />
                </button>
              )}
              {!isConnected && <WalletConnect />}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
          >
            <div className="px-4 py-6 space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 w-full px-4 py-4 rounded-xl transition-all duration-200 font-medium ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 border border-blue-500/30'
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
                  className="flex items-center space-x-3 w-full px-4 py-4 rounded-xl text-red-400 hover:bg-red-600/10 transition-all duration-200 font-medium border border-red-500/20"
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
