import React, { useState, useEffect } from 'react';
import { CollabInviteForm } from '../components/core/CollabInviteForm';
import { Card, CardContent, CardHeader, CardTitle } from '../components/cards/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/buttons/Button';
import { useWeb3 } from '../contexts/Web3Context';
import { Users, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Collaboration {
  _id: string;
  nftId: string;
  collaborators: string[];
  roles: string[];
  status: 'pending' | 'active' | 'completed' | 'dissolved';
  createdAt: Date;
  updatedAt: Date;
}

export const Collaboration: React.FC = () => {
  const { currentAccount } = useWeb3();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<string>('');

  useEffect(() => {
    if (currentAccount) {
      loadCollaborations();
    }
  }, [currentAccount]);

  const loadCollaborations = async () => {
    setIsLoading(true);
    try {
      // This would typically fetch collaborations from your backend
      // For now, we'll create some mock data
      const mockCollaborations: Collaboration[] = [
        {
          _id: '1',
          nftId: 'NFT-001',
          collaborators: [currentAccount!, '0x1234...5678', '0xabcd...efgh'],
          roles: ['Lead Author', 'Co-Author', 'Reviewer'],
          status: 'active',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20')
        },
        {
          _id: '2',
          nftId: 'NFT-002',
          collaborators: [currentAccount!, '0x9876...5432'],
          roles: ['Author', 'Contributor'],
          status: 'pending',
          createdAt: new Date('2024-01-18'),
          updatedAt: new Date('2024-01-18')
        }
      ];
      
      setCollaborations(mockCollaborations);
    } catch (error) {
      console.error('Error loading collaborations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'dissolved':
        return <Badge className="bg-red-100 text-red-800">Dissolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'dissolved':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  if (!currentAccount) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-500">
              Please connect your wallet to manage collaborations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow font-sans">Collaborations</h1>
        <p className="text-gray-600 mt-2 text-lg">Manage your research collaborations and invite others to work together on NFTs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-gradient-to-br from-blue-50/60 via-white/60 to-purple-50/60 dark:from-gray-900/80 dark:via-gray-950/60 dark:to-blue-900/60 rounded-2xl shadow-xl backdrop-blur-md p-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Create New Collaboration */}
          <Card className="bg-white/80 dark:bg-gray-900/80 border border-blue-200/40 dark:border-blue-900/40 shadow-lg rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-blue-500">Create New Collaboration</CardTitle>
                <Button 
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  variant="outline"
                  className="rounded-full px-5 py-2 font-semibold border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {showInviteForm ? 'Cancel' : 'New Collaboration'}
                </Button>
              </div>
            </CardHeader>
            {showInviteForm && (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select NFT</label>
                    <select 
                      className="w-full mt-1 p-2 border rounded-lg border-blue-200 focus:border-blue-400"
                      value={selectedNFT}
                      onChange={(e) => setSelectedNFT(e.target.value)}
                      aria-label="Select an Academe NFT for collaboration"
                    >
                      <option value="">Choose an Academe NFT...</option>
                      <option value="NFT-001">Research Academe NFT on Blockchain</option>
                      <option value="NFT-002">NFT Market Analysis</option>
                      <option value="NFT-003">DeFi Protocol Research</option>
                    </select>
                  </div>
                  {selectedNFT && (
                    <CollabInviteForm 
                      nftId={selectedNFT}
                      onCollaborationCreated={(collab) => {
                        console.log('Collaboration created:', collab);
                        setShowInviteForm(false);
                        setSelectedNFT('');
                        loadCollaborations();
                      }}
                    />
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Active Collaborations */}
          <Card className="bg-gradient-to-br from-white/80 to-blue-100/60 dark:from-gray-900/80 dark:to-blue-900/40 border border-blue-200/40 dark:border-blue-900/40 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-500">My Collaborations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading collaborations...</p>
                </div>
              ) : collaborations.length > 0 ? (
                <div className="space-y-6">
                  {collaborations.map((collab) => (
                    <div key={collab._id} className="rounded-xl p-5 bg-white/70 dark:bg-gray-900/70 border border-blue-100/60 dark:border-blue-900/40 hover:shadow-2xl transition-shadow group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(collab.status)}
                          <h3 className="font-semibold text-blue-700 dark:text-blue-300">NFT: {collab.nftId}</h3>
                          {getStatusBadge(collab.status)}
                        </div>
                        <span className="text-sm text-gray-500">
                          Created {formatDate(collab.createdAt)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Collaborators:</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {collab.collaborators.map((collaborator, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50/60 to-purple-50/60 dark:from-blue-900/40 dark:to-purple-900/40 rounded-lg">
                              <span className="text-sm font-mono">
                                {collaborator === currentAccount 
                                  ? 'You' 
                                  : `${collaborator.slice(0, 6)}...${collaborator.slice(-4)}`
                                }
                              </span>
                              <Badge variant="outline" className="text-xs bg-blue-100/60 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                                {collab.roles[index]}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm" className="rounded-full px-4 py-1 text-xs font-semibold border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                          View Details
                        </Button>
                        {collab.status === 'pending' && (
                          <Button variant="outline" size="sm" className="rounded-full px-4 py-1 text-xs font-semibold border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all">
                            Accept
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No collaborations yet</h3>
                  <p className="text-gray-500 mb-4">Start your first collaboration and work together on research NFTs!</p>
                  <Button onClick={() => setShowInviteForm(true)} className="rounded-full px-6 py-2 font-semibold bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg hover:from-blue-500 hover:to-purple-600 transition-all">New Collaboration</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Collaboration Stats */}
          <Card className="bg-gradient-to-br from-blue-100/60 via-white/30 to-purple-100/60 dark:from-blue-900/40 dark:via-gray-900/60 dark:to-purple-900/40 backdrop-blur-md border border-blue-200/40 dark:border-blue-900/40 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-blue-500">Collaboration Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Collaborations</span>
                <span className="font-semibold">
                  {collaborations.filter(c => c.status === 'active').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Invites</span>
                <span className="font-semibold">
                  {collaborations.filter(c => c.status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Collaborators</span>
                <span className="font-semibold">
                  {collaborations.reduce((acc, c) => acc + c.collaborators.length, 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Collaboration Tips */}
          <Card className="bg-gradient-to-br from-blue-100/60 via-white/30 to-purple-100/60 dark:from-blue-900/40 dark:via-gray-900/60 dark:to-purple-900/40 backdrop-blur-md border border-blue-200/40 dark:border-blue-900/40 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-blue-500">Collaboration Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Clearly define roles and responsibilities</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Set up regular communication channels</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Agree on revenue sharing upfront</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Document all decisions and changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 