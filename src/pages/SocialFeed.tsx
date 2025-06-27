import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { SocialFeed as SocialFeedComponent } from '../components/core/SocialFeed';

const SocialFeed: React.FC = () => {
  const { currentAccount } = useWeb3();
  if (!currentAccount) {
    return <div className="container mx-auto px-4 py-8 text-center text-gray-400">Connect your wallet to view the social feed.</div>;
  }
  return <SocialFeedComponent currentUser={currentAccount} />;
};

export default SocialFeed; 