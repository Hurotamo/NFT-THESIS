import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Center, Text3D } from '@react-three/drei';
import { Wallet, FileText, Coins, Gavel, Menu, X, Upload, User, AlertCircle, LogOut, Bell, BookOpen, Image, Users, Sparkles, TrendingUp, Award, Zap, Home } from 'lucide-react';
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
import EmergencyBanner from '../components/core/EmergencyBanner';
import AdminStakingPanel from '../components/core/AdminStakingPanel';
import CountdownTimer from '../components/core/CountdownTimer';
import { StakingService } from '@/services/stakingService';
import { GovernanceService } from '@/services/governanceService';
import GovernanceSection from '@/components/core/GovernanceSection';
import { Link } from 'react-router-dom';
import SocialFeed from "./SocialFeed";
import { Gallery } from "./Gallery";
import { Forum } from "./Forum";
import { Collaboration } from "./Collaboration";
import TrendingSection from '../components/core/TrendingSection';

// Enhanced 3D NFT Card Component
function FloatingNFT() {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <group>
        {/* Main card */}
        <mesh>
          <boxGeometry args={[2.2, 3, 0.15]} />
          <meshStandardMaterial 
            color="#6366f1" 
            metalness={0.9} 
            roughness={0.1}
            envMapIntensity={1}
          />
        </mesh>
        
        {/* Glowing border */}
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[2.3, 3.1, 0.02]} />
          <meshStandardMaterial 
            color="#8b5cf6" 
            emissive="#8b5cf6"
            emissiveIntensity={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Enhanced 3D text */}
        <Center position={[0, 0, 0.1]}>
          <group>
            {/* N */}
            <mesh position={[-0.5, 0, 0]}>
              <boxGeometry args={[0.12, 0.7, 0.03]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[-0.3, 0.2, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.12, 0.5, 0.03]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[-0.1, 0, 0]}>
              <boxGeometry args={[0.12, 0.7, 0.03]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
            </mesh>
            
            {/* F */}
            <mesh position={[0.1, 0, 0]}>
              <boxGeometry args={[0.12, 0.7, 0.03]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0.25, 0.25, 0]}>
              <boxGeometry args={[0.25, 0.12, 0.03]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0.2, 0, 0]}>
              <boxGeometry args={[0.2, 0.12, 0.03]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
            </mesh>
            
            {/* T */}
            <mesh position={[0.5, 0.3, 0]}>
              <boxGeometry args={[0.35, 0.12, 0.03]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0.5, 0, 0]}>
              <boxGeometry args={[0.12, 0.6, 0.03]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
            </mesh>
          </group>
        </Center>
      </group>
    </Float>
  );
}

// Enhanced 3D Scene Background
function ThreeScene() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#6366f1" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#8b5cf6" />
      
      <FloatingNFT />
      
      {/* Enhanced floating particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <Float key={i} speed={1 + Math.random()} rotationIntensity={0.5}>
          <mesh position={[(Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 15]}>
            <sphereGeometry args={[0.08 + Math.random() * 0.04]} />
            <meshStandardMaterial 
              color={i % 3 === 0 ? "#8b5cf6" : i % 3 === 1 ? "#6366f1" : "#ec4899"} 
              opacity={0.4 + Math.random() * 0.3} 
              transparent 
              emissive={i % 3 === 0 ? "#8b5cf6" : i % 3 === 1 ? "#6366f1" : "#ec4899"}
              emissiveIntensity={0.2}
            />
          </mesh>
        </Float>
      ))}
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        enableRotate={true} 
        autoRotate 
        autoRotateSpeed={0.3} 
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}

const WalletRequiredPrompt = () => (
  <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-black via-gray-900 to-black">
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="backdrop-blur-xl bg-gradient-to-br from-gray-900/95 to-black/95 rounded-3xl p-12 border border-gray-700/50 text-center max-w-md mx-auto shadow-2xl"
    >
      <div className="p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
        <AlertCircle className="w-12 h-12 text-yellow-400" />
      </div>
      <h3 className="text-3xl font-bold text-white mb-6">Wallet Required</h3>
      <p className="text-gray-300 mb-8 text-lg leading-relaxed">Please connect your wallet to view your profile and access all features.</p>
      <WalletConnect />
    </motion.div>
  </div>
);

const HomeContent = () => (
  <div className="relative">
    {/* Enhanced Hero Section */}
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <ThreeScene />
      </div>
      
      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-purple-900/40 to-blue-900/60 z-10" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 z-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>
      
      {/* Content */}
      <div className="relative z-20 text-center px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-full px-6 py-3 mb-8 backdrop-blur-sm"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-medium">Revolutionizing Academic Publishing</span>
          </motion.div>

          <div className="relative inline-block mb-12">
            <motion.span 
              className="absolute -top-12 -left-12 text-8xl md:text-9xl select-none opacity-90"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              🎓
            </motion.span>
            <h1 className="text-8xl md:text-[10rem] font-black bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-none tracking-tight">
              ACADEME NFT
            </h1>
          </div>
          
          <motion.p 
            className="text-2xl md:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            A revolutionary platform where students post academic research and investors mint them as <span className="text-blue-400 font-semibold">Academe NFTs</span>.
          </motion.p>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
        </div>
      </motion.div>
    </section>

    {/* Enhanced Features Section */}
    <section className="py-40 px-4 bg-gradient-to-b from-black via-gray-900 to-black relative">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-full px-6 py-3 mb-8 backdrop-blur-sm"
          >
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-medium">Platform Features</span>
          </motion.div>
          
          <h2 className="text-7xl md:text-8xl font-black text-white mb-12 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
            Revolutionize Academic Publishing
          </h2>
          <p className="text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light">
            Our platform creates a bridge between academic research and blockchain technology, enabling a new ecosystem for research monetization as Academe NFTs.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-16">
          {[
            {
              icon: Upload,
              title: "Students Post Academe NFT",
              description: "Upload and share your academic research as an Academe NFT with metadata preservation on IPFS. Get recognized for your contributions.",
              gradient: "from-emerald-500 via-green-500 to-teal-500",
              bgGradient: "from-emerald-500/10 to-green-500/5",
              features: ["IPFS Storage", "Metadata Preservation", "Academic Recognition"]
            },
            {
              icon: Coins,
              title: "Investors Mint Academe NFTs",
              description: "Browse available research and mint them as Academe NFTs. Stake 100+ CORE for 20% discount and earn rewards.",
              gradient: "from-blue-500 via-cyan-500 to-indigo-500",
              bgGradient: "from-blue-500/10 to-cyan-500/5",
              features: ["20% Staking Discount", "Reward System", "Portfolio Diversification"]
            },
            {
              icon: Gavel,
              title: "Trade in Auctions",
              description: "List Academe NFTs in our escrow-secured auction marketplace for secure and transparent trading.",
              gradient: "from-purple-500 via-violet-500 to-pink-500",
              bgGradient: "from-purple-500/10 to-violet-500/5",
              features: ["Escrow Protection", "Transparent Bidding", "Secure Trading"]
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="group relative"
            >
              {/* Background Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700`} />
              
              {/* Card Content */}
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-gray-900/95 to-black/95 rounded-3xl p-10 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-500 group hover:transform hover:scale-105 shadow-2xl hover:shadow-3xl">
                {/* Icon */}
                <div className={`inline-flex p-8 rounded-3xl bg-gradient-to-br ${feature.gradient} mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-300 w-fit`}>
                  <feature.icon className="w-16 h-16 text-white" />
                </div>
                
                {/* Content */}
                <div className="space-y-6">
                  <h3 className="text-4xl font-bold text-white mb-6 group-hover:text-blue-300 transition-colors leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-lg group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                  
                  {/* Feature list */}
                  <div className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
                        <span className="text-gray-300 text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-6 right-6 w-24 h-24 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="absolute bottom-6 left-6 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Enhanced Stats Section */}
    <section className="py-40 px-4 bg-gradient-to-r from-gray-900 via-black to-gray-900 relative">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-full px-6 py-3 mb-8 backdrop-blur-sm"
          >
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-medium">Platform Statistics</span>
          </motion.div>
          
          <h2 className="text-6xl font-black text-white mb-6">Growing Community</h2>
          <p className="text-2xl text-gray-400 max-w-3xl mx-auto">Real-time metrics from our thriving ecosystem</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12">
          {[
            { number: "500+", label: "Theses Published", icon: FileText, color: "blue", description: "Research papers uploaded" },
            { number: "10K+", label: "NFTs Minted", icon: Coins, color: "green", description: "Digital assets created" },
            { number: "1M+", label: "CORE Staked", icon: Wallet, color: "purple", description: "Tokens locked in protocol" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/5 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-12 border border-white/20 hover:border-white/30 transition-all duration-300 text-center group hover:transform hover:scale-105">
                <div className={`inline-flex p-6 rounded-2xl bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-300`}>
                  <stat.icon className="w-12 h-12 text-white" />
                </div>
                <div className="text-7xl font-black text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-2xl font-bold text-white mb-3">{stat.label}</div>
                <div className="text-gray-400 text-lg">{stat.description}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

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
    { name: 'Home', id: 'home', icon: Home, description: 'Return to the main page' },
    { name: 'Post', id: 'post', icon: Upload, description: 'Share your research' },
    { name: 'Mint', id: 'mint', icon: FileText, description: 'Create NFTs' },
    { name: 'Stake', id: 'stake', icon: Coins, description: 'Earn rewards' },
    { name: 'Auction', id: 'auction', icon: Gavel, description: 'Trade NFTs' },
    { name: 'Profile', id: 'profile', icon: User, description: 'Your account' },
    { name: 'Gallery', id: 'gallery', icon: Image, description: 'Browse NFTs' },
    { name: 'Forum', id: 'forum', icon: BookOpen, description: 'Discuss research' },
    { name: 'Collaboration', id: 'collaboration', icon: Users, description: 'Team up' },
    { name: 'Governance', id: 'governance', icon: BookOpen, description: 'Vote & propose' },
  ];

  const handleWalletConnect = async () => {
    await connectWallet();
  };

  const handleWalletLogout = () => {
    disconnectWallet();
    setActiveSection('home');
  };

  const handleAcademeNFTPosted = () => {
    toast({
      title: "Academe NFT Posted!",
      description: "Your research is now available for minting as an Academe NFT.",
    });
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'post':
        return <ThesisPosting walletAddress={currentAccount || ''} onThesisPosted={handleAcademeNFTPosted} />;
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
          <WalletRequiredPrompt />
        );
      case 'social':
        return <SocialFeed />;
      case 'gallery':
        return <Gallery />;
      case 'forum':
        return <Forum />;
      case 'collaboration':
        return <Collaboration />;
      case 'governance':
        return <GovernanceSection />;
      default:
        return (
          <HomeContent />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <motion.h1 
                className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                ACADEMENFT
              </motion.h1>
            </div>
            
            {/* Enhanced Desktop Navigation */}
            <div className="hidden md:flex flex-1 justify-center space-x-1 relative">
              {navigation.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`group flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 text-sm relative ${
                    activeSection === item.id
                      ? 'text-blue-400 bg-blue-500/10 border border-blue-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={`${item.name} - ${item.description}`}
                >
                  <item.icon className="w-6 h-6 mb-1 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.7)] transition-transform duration-200" />
                  {/* Enhanced animated underline */}
                  {activeSection === item.id && (
                    <motion.span 
                      className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-1 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
                      layoutId="activeTab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  <span className="sr-only md:not-sr-only md:hidden group-hover:block absolute bg-black/90 text-white text-xs rounded-lg px-3 py-2 mt-12 z-50 backdrop-blur-sm border border-white/20">
                    {item.name}
                  </span>
                </motion.button>
              ))}
            </div>
            
            {/* Enhanced Wallet/Connect/Profile Section */}
            <div className="hidden md:flex items-center space-x-4">
              <motion.button 
                className="relative p-3 rounded-xl hover:bg-white/10 transition-all duration-300 group" 
                aria-label="Notifications"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-5 h-5 text-white group-hover:text-blue-400 transition-colors" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </motion.button>
              
              {!isConnected ? (
                <WalletConnect />
              ) : (
                <motion.button
                  onClick={handleWalletLogout}
                  className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-400/30 text-green-400 rounded-xl hover:from-green-600/30 hover:to-emerald-600/30 transition-all duration-300 group text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="font-mono">
                    {currentAccount?.slice(0, 6)}...{currentAccount?.slice(-4)}
                  </span>
                  <LogOut className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              )}
            </div>
            
            {/* Enhanced Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              {isConnected && currentAccount && (
                <motion.button
                  onClick={handleWalletLogout}
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-400/30 text-green-400 rounded-lg text-xs backdrop-blur-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{currentAccount.slice(0, 4)}...{currentAccount.slice(-2)}</span>
                  <LogOut className="w-3 h-3" />
                </motion.button>
              )}
              {!isConnected && <WalletConnect />}
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-3 rounded-xl hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Enhanced Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
            >
              <div className="px-4 py-6 grid grid-cols-2 gap-3">
                {navigation.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center px-4 py-4 rounded-xl transition-all duration-300 text-sm ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 border border-blue-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-6 h-6 mb-2" />
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-gray-500 mt-1">{item.description}</span>
                  </motion.button>
                ))}
                {isConnected && (
                  <motion.button
                    onClick={() => {
                      handleWalletLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center px-4 py-4 rounded-xl text-red-400 hover:bg-red-600/10 transition-all duration-300 text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="w-6 h-6 mb-2" />
                    <span className="font-medium">Logout</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-32 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {activeSection === 'home' && <TrendingSection />}
            {renderActiveSection()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
