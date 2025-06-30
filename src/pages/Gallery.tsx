import React, { useState, useEffect } from 'react';
import { GalleryCreator } from '../components/core/GalleryCreator';
import { Card, CardContent, CardHeader, CardTitle } from '../components/cards/Card';
import { useWeb3 } from '../contexts/Web3Context';
import { Image, Plus } from 'lucide-react';

interface NFT {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  ipfsHash?: string;
}

export const Gallery: React.FC = () => {
  const { currentAccount } = useWeb3();
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentAccount) {
      loadUserNFTs();
    }
  }, [currentAccount]);

  const loadUserNFTs = async () => {
    setIsLoading(true);
    try {
      // Mock data for demonstration
      const mockNFTs: NFT[] = [
        {
          id: '1',
          title: 'Research Academe NFT on Blockchain',
          description: 'A comprehensive study on blockchain technology and its applications',
          imageUrl: '/placeholder.svg',
          ipfsHash: 'QmExample1'
        },
        {
          id: '2',
          title: 'NFT Market Analysis',
          description: 'Analysis of NFT market trends and future predictions',
          imageUrl: '/placeholder.svg',
          ipfsHash: 'QmExample2'
        },
        {
          id: '3',
          title: 'DeFi Protocol Research',
          description: 'Research on decentralized finance protocols and their impact',
          imageUrl: '/placeholder.svg',
          ipfsHash: 'QmExample3'
        }
      ];
      setUserNFTs(mockNFTs);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-black">
        <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-900/60 to-black/80 border border-blue-700/40 shadow-2xl rounded-2xl w-full max-w-md">
          <CardContent className="text-center py-12">
            <Image className="mx-auto h-12 w-12 text-blue-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-blue-200">Connect Your Wallet</h2>
            <p className="text-gray-400">
              Please connect your wallet to view and manage your galleries.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-black py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">My Galleries</h1>
          <p className="text-gray-400 mt-2 text-lg">
            Create and manage your NFT galleries. Curate collections and share them with the community.
          </p>
        </div>

        {isLoading ? (
          <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-900/60 to-black/80 border border-blue-700/40 shadow-2xl rounded-2xl">
            <CardContent className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-400 mx-auto mb-6"></div>
              <p className="text-blue-200 text-lg">Loading your NFTs...</p>
            </CardContent>
          </Card>
        ) : (
          <GalleryCreator 
            userId={currentAccount}
            availableNFTs={userNFTs}
            onGalleryCreated={(gallery) => {
              console.log('Gallery created:', gallery);
            }}
          />
        )}

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-900/60 to-black/80 border border-blue-700/40 shadow-xl rounded-2xl hover:scale-105 transition-transform">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-300">Total NFTs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-blue-400">{userNFTs.length}</div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-900/60 to-black/80 border border-purple-700/40 shadow-xl rounded-2xl hover:scale-105 transition-transform">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-300">Galleries Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-purple-400">0</div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-xl bg-gradient-to-br from-pink-900/60 to-black/80 border border-pink-700/40 shadow-xl rounded-2xl hover:scale-105 transition-transform">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-pink-300">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-pink-400">0</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 