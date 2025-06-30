import React from 'react';
import { UserProfileEditor } from '../components/core/UserProfileEditor';
import { useWeb3 } from '../contexts/Web3Context';
import { User, Wallet } from 'lucide-react';
import { Button } from '../components/buttons/Button';
import { motion } from 'framer-motion';

export const Profile: React.FC = () => {
  const { currentAccount } = useWeb3();

  if (!currentAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-black via-gray-900 to-black">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-gradient-to-br from-blue-900/80 via-purple-900/60 to-black/90 rounded-3xl p-12 border-2 border-blue-500/40 text-center max-w-md mx-auto shadow-2xl"
        >
          <div className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
            <User className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text mb-4">Connect Your Wallet</h2>
          <p className="text-blue-200 mb-6">Please connect your wallet to view and edit your profile.</p>
          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-2">
            <Wallet className="w-5 h-5" /> Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-black via-gray-900 to-black">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto backdrop-blur-2xl bg-gradient-to-br from-blue-900/80 via-purple-900/60 to-black/90 rounded-3xl p-12 border-2 border-blue-500/40 shadow-2xl"
      >
        <div className="mb-10 text-center">
          <div className="flex flex-col items-center mb-4">
            <User className="w-14 h-14 text-blue-400 mb-2" />
            <h1 className="text-4xl font-extrabold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text mb-2">My Profile</h1>
          </div>
          <p className="text-blue-200 text-lg">Manage your profile and account information.</p>
        </div>
        <div className="mt-8">
          <UserProfileEditor 
            wallet={currentAccount} 
            onProfileUpdated={(profile) => {
              console.log('Profile updated:', profile);
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}; 