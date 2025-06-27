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
      // This would typically fetch NFTs from your smart contract or backend
      // For now, we'll create some mock data
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
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-500">
              Please connect your wallet to view and manage your galleries.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Galleries</h1>
        <p className="text-gray-600 mt-2">
          Create and manage your NFT galleries. Curate collections and share them with the community.
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your NFTs...</p>
          </CardContent>
        </Card>
      ) : (
        <GalleryCreator 
          userId={currentAccount}
          availableNFTs={userNFTs}
          onGalleryCreated={(gallery) => {
            console.log('Gallery created:', gallery);
            // You can add additional logic here, like refreshing the gallery list
          }}
        />
      )}

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total NFTs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userNFTs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Galleries Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 