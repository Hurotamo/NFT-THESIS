import React from 'react';

// Mock data for trending NFTs and creators
const trendingNFTs = [
  { id: 1, title: 'Quantum Thesis', creator: 'Alice', creatorAvatar: '/public/placeholder.svg', image: '/public/placeholder.svg', likes: 120, views: 340 },
  { id: 2, title: 'AI Art Manifesto', creator: 'Bob', creatorAvatar: '/public/placeholder.svg', image: '/public/placeholder.svg', likes: 98, views: 210 },
  { id: 3, title: 'Decentralized Dreams', creator: 'Carol', creatorAvatar: '/public/placeholder.svg', image: '/public/placeholder.svg', likes: 75, views: 180 },
];

const trendingCreators = [
  { id: 1, name: 'Alice', avatar: '/public/placeholder.svg' },
  { id: 2, name: 'Bob', avatar: '/public/placeholder.svg' },
  { id: 3, name: 'Carol', avatar: '/public/placeholder.svg' },
];

const TrendingSection: React.FC = () => {
  return (
    <section className="my-12">
      <h2 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg font-sans">Trending NFTs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
        {trendingNFTs.map(nft => (
          <div
            key={nft.id}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 flex flex-col items-center transition-all duration-200 hover:shadow-xl border border-gray-200 dark:border-gray-800 hover:border-blue-400 group relative overflow-hidden min-h-[270px] max-w-xs mx-auto"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <img
              src={nft.image}
              alt={nft.title}
              className="w-32 h-32 object-cover mb-3 rounded-lg border-2 border-blue-100 group-hover:border-blue-400 transition-all duration-200 shadow-sm"
            />
            <div className="font-semibold text-base mb-1 text-gray-900 dark:text-white text-center group-hover:text-blue-500 transition-colors truncate w-full">{nft.title}</div>
            <div className="flex items-center gap-2 mb-2">
              <img src={nft.creatorAvatar} alt={nft.creator} className="w-6 h-6 rounded-full border border-blue-300" />
              <span className="text-xs text-gray-600 dark:text-gray-300">by <span className="font-medium text-blue-500">{nft.creator}</span></span>
            </div>
            <div className="flex gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-pink-400" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg> {nft.likes}</span>
              <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10c0 3.866-3.582 7-8 7s-8-3.134-8-7a8 8 0 1116 0z" /></svg> {nft.views}</span>
            </div>
            <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white text-[10px] px-2 py-0.5 rounded-full shadow font-semibold uppercase tracking-wider">HOT</div>
          </div>
        ))}
      </div>
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-400 font-sans">Trending Creators</h2>
      <div className="flex flex-wrap justify-center gap-6">
        {trendingCreators.map(creator => (
          <div key={creator.id} className="flex flex-col items-center bg-white dark:bg-gray-900 rounded-lg p-3 shadow border border-gray-200 dark:border-gray-800 hover:border-purple-400 transition-all min-w-[120px]">
            <img src={creator.avatar} alt={creator.name} className="w-12 h-12 rounded-full mb-2 border border-purple-300" />
            <div className="font-medium text-gray-800 dark:text-white text-sm">{creator.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingSection; 