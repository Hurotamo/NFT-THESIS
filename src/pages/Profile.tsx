import React from 'react';
import { UserProfileEditor } from '../components/core/UserProfileEditor';
import { Card, CardContent } from '../components/cards/Card';
import { useWeb3 } from '../contexts/Web3Context';
import { User } from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentAccount } = useWeb3();

  if (!currentAccount) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-500">
              Please connect your wallet to view and edit your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your profile and account information.
        </p>
      </div>
      <UserProfileEditor 
        wallet={currentAccount} 
        onProfileUpdated={(profile) => {
          console.log('Profile updated:', profile);
        }}
      />
    </div>
  );
}; 