import React, { useState, useEffect } from 'react';
import { Button } from '../buttons/Button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../cards/Card';
import { Checkbox } from '../ui/checkbox';
import { galleryService } from '../../services/socialService';
import { useToast } from '../../hooks/use-toast';

interface NFT {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  ipfsHash?: string;
}

interface Gallery {
  _id?: string;
  userId: string;
  name: string;
  description: string;
  nftIds: string[];
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GalleryCreatorProps {
  userId: string;
  availableNFTs: NFT[];
  onGalleryCreated?: (gallery: Gallery) => void;
}

export const GalleryCreator: React.FC<GalleryCreatorProps> = ({
  userId,
  availableNFTs,
  onGalleryCreated
}) => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newGallery, setNewGallery] = useState<Partial<Gallery>>({
    userId,
    name: '',
    description: '',
    nftIds: [],
    isPublic: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadGalleries();
  }, [userId]);

  const loadGalleries = async () => {
    try {
      const userGalleries = await galleryService.getUserGalleries(userId);
      if (Array.isArray(userGalleries)) {
        setGalleries(userGalleries);
      }
    } catch (error) {
      console.error('Error loading galleries:', error);
    }
  };

  const handleCreateGallery = async () => {
    if (!newGallery.name) {
      toast({
        title: "Error",
        description: "Gallery name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await galleryService.createGallery(newGallery as Gallery);
      if (result._id) {
        toast({
          title: "Gallery Created",
          description: "Your gallery has been created successfully.",
        });
        setNewGallery({
          userId,
          name: '',
          description: '',
          nftIds: [],
          isPublic: true
        });
        setIsCreating(false);
        await loadGalleries();
        onGalleryCreated?.(result);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create gallery.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create gallery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNFTSelection = (nftId: string) => {
    setNewGallery(prev => ({
      ...prev,
      nftIds: prev.nftIds?.includes(nftId)
        ? prev.nftIds.filter(id => id !== nftId)
        : [...(prev.nftIds || []), nftId]
    }));
  };

  const getSelectedNFTs = () => {
    return availableNFTs.filter(nft => newGallery.nftIds?.includes(nft.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Galleries</h2>
        <Button onClick={() => setIsCreating(!isCreating)} variant="outline">
          {isCreating ? 'Cancel' : 'Create New Gallery'}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Gallery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="galleryName">Gallery Name *</Label>
              <Input
                id="galleryName"
                value={newGallery.name}
                onChange={(e) => setNewGallery(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter gallery name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="galleryDescription">Description</Label>
              <Textarea
                id="galleryDescription"
                value={newGallery.description}
                onChange={(e) => setNewGallery(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your gallery..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={newGallery.isPublic}
                onCheckedChange={(checked) => 
                  setNewGallery(prev => ({ ...prev, isPublic: checked as boolean }))
                }
              />
              <Label htmlFor="isPublic">Make gallery public</Label>
            </div>

            <div className="space-y-2">
              <Label>Select NFTs ({getSelectedNFTs().length} selected)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto border rounded-md p-4">
                {availableNFTs.map((nft) => (
                  <div
                    key={nft.id}
                    className={`flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-gray-50 ${
                      newGallery.nftIds?.includes(nft.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => toggleNFTSelection(nft.id)}
                  >
                    <Checkbox
                      checked={newGallery.nftIds?.includes(nft.id)}
                      onCheckedChange={() => toggleNFTSelection(nft.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{nft.title}</p>
                      <p className="text-xs text-gray-500 truncate">{nft.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleCreateGallery} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Gallery'}
              </Button>
              <Button onClick={() => setIsCreating(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {galleries.map((gallery) => {
          // Find the first NFT for cover image and all NFTs for thumbnails
          const galleryNFTs = availableNFTs.filter(nft => gallery.nftIds.includes(nft.id));
          const coverImage = galleryNFTs[0]?.imageUrl || '/placeholder.svg';
          return (
            <Card key={gallery._id} className="hover:shadow-2xl transition-shadow rounded-xl border border-blue-200/40 dark:border-blue-900/40 bg-gradient-to-br from-blue-100/60 via-white/30 to-purple-100/60 dark:from-blue-900/40 dark:via-gray-900/60 dark:to-purple-900/40 backdrop-blur-md bg-opacity-60 overflow-hidden">
              <div className="relative h-32 w-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-800 dark:to-blue-900 flex items-center justify-center">
                <img src={coverImage} alt={gallery.name} className="h-24 w-24 object-cover rounded-lg shadow-lg border-2 border-white absolute left-1/2 -translate-x-1/2 top-4 bg-white" />
              </div>
              <CardHeader className="pt-16 pb-2 text-center">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white truncate">{gallery.name}</CardTitle>
                <p className="text-xs text-gray-500 mb-1">{gallery.nftIds.length} NFTs • {gallery.isPublic ? 'Public' : 'Private'}</p>
              </CardHeader>
              <CardContent>
                {gallery.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 truncate">{gallery.description}</p>
                )}
                <div className="flex flex-wrap gap-1 justify-center mb-3">
                  {galleryNFTs.slice(0, 4).map(nft => (
                    <img key={nft.id} src={nft.imageUrl || '/placeholder.svg'} alt={nft.title} className="w-8 h-8 object-cover rounded border border-gray-200 dark:border-gray-700" />
                  ))}
                  {galleryNFTs.length > 4 && (
                    <span className="text-xs text-gray-400 ml-2">+{galleryNFTs.length - 4} more</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    Created {gallery.createdAt ? new Date(gallery.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                  <Button variant="outline" size="sm" className="rounded-full px-4 py-1 text-xs font-semibold border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                    View Gallery
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {galleries.length === 0 && !isCreating && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900 border-0 shadow-none">
          <CardContent className="text-center py-12 flex flex-col items-center">
            <img src="/placeholder.svg" alt="No galleries" className="w-20 h-20 mb-4 opacity-60" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No galleries yet</h3>
            <p className="text-gray-500 mb-4">Create your first gallery to curate and share your NFT collections with the community.</p>
            <Button onClick={() => setIsCreating(true)} className="rounded-full px-6 py-2 font-semibold bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg hover:from-blue-500 hover:to-purple-600 transition-all">Create Gallery</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 