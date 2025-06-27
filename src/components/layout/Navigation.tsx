import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../buttons/Button';
import { useWeb3 } from '../../contexts/Web3Context';
import { 
  Home, 
  User, 
  Image, 
  MessageSquare, 
  Users, 
  Settings,
  Wallet,
  Activity,
  FileText,
  Coins,
  Gavel,
  BookOpen
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { currentAccount, connectWallet, isConnected } = useWeb3();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/social-feed', label: 'Social Feed', icon: Activity },
    { path: '/gallery', label: 'Gallery', icon: Image },
    { path: '/forum', label: 'Forum', icon: MessageSquare },
    { path: '/collaboration', label: 'Collaboration', icon: Users },
    { path: '/mint', label: 'Mint', icon: FileText },
    { path: '/stake', label: 'Stake', icon: Coins },
    { path: '/auction', label: 'Auction', icon: Gavel },
    { path: '/governance', label: 'Governance', icon: BookOpen },
    { path: '/admin', label: 'Admin', icon: Gavel },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-transparent sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-xl text-white">ACADEMENFT</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-white hover:text-blue-200 hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-3">
            {isConnected && currentAccount ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-white/10 rounded-md">
                  <Wallet className="h-4 w-4 text-white" />
                  <span className="text-sm font-mono text-white">
                    {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={connectWallet} size="sm">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-white/10">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center space-y-1 px-2 py-1 rounded-md text-xs transition-colors ${
                    isActive(item.path)
                      ? 'text-blue-400'
                      : 'text-white hover:text-blue-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}; 