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
      // Mock data for demonstration
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
        return <Badge className="bg-green-500/20 text-green-400 border-green-400">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-400">Completed</Badge>;
      case 'dissolved':
        return <Badge className="bg-red-500/20 text-red-400 border-red-400">Dissolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-400" />;
      case 'dissolved':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-black">
        <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-900/60 to-black/80 border border-blue-700/40 shadow-2xl rounded-2xl w-full max-w-md">
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-blue-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-blue-200">Connect Your Wallet</h2>
            <p className="text-gray-400">
              Please connect your wallet to manage collaborations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-black py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-8">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow mb-2">Collaborations</h1>
            <p className="text-gray-400 text-lg">
              Manage your research collaborations and invite others to work together on NFTs.
            </p>
          </div>

          {/* Create New Collaboration */}
          <Card className="backdrop-blur-2xl bg-gradient-to-br from-blue-900/70 to-black/80 border border-blue-400/30 shadow-2xl rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-blue-300">Create New Collaboration</CardTitle>
                <Button 
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  variant="outline"
                  className="rounded-full px-5 py-2 font-semibold border-blue-400 hover:bg-blue-900/30 transition-all"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {showInviteForm ? 'Cancel' : 'New Collaboration'}
                </Button>
              </div>
            </CardHeader>
            {showInviteForm && (
              <CardContent>
                <div className="animate-fade-in space-y-6 bg-white/10 dark:bg-black/30 rounded-2xl shadow-2xl border border-blue-400/30 p-8 backdrop-blur-xl">
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2 mb-2">
                    <Users className="w-7 h-7" /> Invite Collaborators
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Invite other researchers to collaborate on this NFT. Each collaborator will have shared ownership and rights.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-blue-200 mb-1">Wallet Address</label>
                      <input
                        className="w-full px-4 py-3 rounded-lg border border-blue-400 bg-black/40 text-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                        placeholder="0x..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-200 mb-1">Role</label>
                      <select
                        className="w-full px-4 py-3 rounded-lg border border-blue-400 bg-black/40 text-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                      >
                        <option>Author</option>
                        <option>Co-Author</option>
                        <option>Reviewer</option>
                      </select>
                    </div>
                    <button
                      className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:from-blue-600 hover:to-purple-600 transition"
                      type="button"
                    >
                      <Plus className="w-4 h-4" /> Add Collaborator
                    </button>
                  </div>
                  <button
                    className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-xl hover:from-blue-700 hover:to-purple-700 transition"
                    type="submit"
                  >
                    Create Collaboration
                  </button>
                  <ul className="mt-6 text-xs text-blue-200 space-y-1 list-disc list-inside">
                    <li>All collaborators will have shared ownership of the NFT</li>
                    <li>Revenue and royalties will be split according to roles</li>
                    <li>Collaborators can vote on important decisions</li>
                  </ul>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Active Collaborations */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-900/60 to-black/80 border border-blue-700/40 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-300">My Collaborations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-blue-200">Loading collaborations...</p>
                </div>
              ) : collaborations.length > 0 ? (
                <div className="space-y-6">
                  {collaborations.map((collab) => (
                    <div key={collab._id} className="rounded-xl p-5 bg-black/60 border border-blue-800 hover:shadow-2xl transition-shadow group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(collab.status)}
                          <h3 className="font-semibold text-blue-200">NFT: {collab.nftId}</h3>
                          {getStatusBadge(collab.status)}
                        </div>
                        <span className="text-sm text-gray-400">
                          Created {formatDate(collab.createdAt)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-100">Collaborators:</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {collab.collaborators.map((collaborator, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-lg">
                              <span className="text-sm font-mono text-blue-100">
                                {collaborator === currentAccount 
                                  ? 'You' 
                                  : `${collaborator.slice(0, 6)}...${collaborator.slice(-4)}`
                                }
                              </span>
                              <Badge variant="outline" className="text-xs bg-blue-900/40 border-blue-700 text-blue-300">
                                {collab.roles[index]}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm" className="rounded-full px-4 py-1 text-xs font-semibold border-blue-400 hover:bg-blue-900/30 transition-all">
                          View Details
                        </Button>
                        {collab.status === 'pending' && (
                          <Button variant="outline" size="sm" className="rounded-full px-4 py-1 text-xs font-semibold border-yellow-400 hover:bg-yellow-900/30 transition-all">
                            Accept
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center">
                  <Users className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                  <h3 className="text-lg font-semibold text-blue-200 mb-2">No collaborations yet</h3>
                  <p className="text-blue-100 mb-4">Start your first collaboration and work together on research NFTs!</p>
                  <Button onClick={() => setShowInviteForm(true)} className="rounded-full px-6 py-2 font-semibold bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg hover:from-blue-500 hover:to-purple-600 transition-all">New Collaboration</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-8">
          {/* Collaboration Stats */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-900/60 to-black/80 border border-blue-700/40 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-blue-300">Collaboration Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-100">Active Collaborations</span>
                <span className="font-semibold text-blue-400">
                  {collaborations.filter(c => c.status === 'active').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-100">Pending Invites</span>
                <span className="font-semibold text-yellow-400">
                  {collaborations.filter(c => c.status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-100">Total Collaborators</span>
                <span className="font-semibold text-purple-400">
                  {collaborations.reduce((acc, c) => acc + c.collaborators.length, 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Collaboration Tips */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-900/60 to-black/80 border border-blue-700/40 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-blue-300">Collaboration Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-blue-100">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Clearly define roles and responsibilities</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Set up regular communication channels</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Agree on revenue sharing upfront</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
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