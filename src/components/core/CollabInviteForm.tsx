import React, { useState } from 'react';
import { Button } from '../buttons/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../cards/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { collaborationService } from '../../services/socialService';
import { useToast } from '../../hooks/use-toast';
import { UserPlus, X } from 'lucide-react';

interface Collaborator {
  address: string;
  role: string;
}

interface CollabInviteFormProps {
  nftId: string;
  onCollaborationCreated?: (collab: any) => void;
}

export const CollabInviteForm: React.FC<CollabInviteFormProps> = ({ 
  nftId, 
  onCollaborationCreated 
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { address: '', role: 'author' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddressChange = (index: number, value: string) => {
    setCollaborators(prev =>
      prev.map((collab, i) => i === index ? { ...collab, address: value } : collab)
    );
  };

  const handleRoleChange = (index: number, role: string) => {
    setCollaborators(prev =>
      prev.map((collab, i) => i === index ? { ...collab, role } : collab)
    );
  };

  const addCollaborator = () => {
    setCollaborators(prev => [...prev, { address: '', role: 'author' }]);
  };

  const removeCollaborator = (index: number) => {
    if (collaborators.length > 1) {
      setCollaborators(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateAddresses = (addresses: string[]) => {
    const validAddresses = addresses.filter(addr => addr.trim() !== '');
    return validAddresses.length >= 2 && validAddresses.every(addr => 
      /^0x[a-fA-F0-9]{40}$/.test(addr.trim())
    );
  };

  const handleInvite = async () => {
    const addresses = collaborators.map(c => c.address.trim()).filter(addr => addr !== '');
    const roles = collaborators.map(c => c.role).filter((_, i) => collaborators[i].address.trim() !== '');

    if (!validateAddresses(addresses)) {
      toast({
        title: "Error",
        description: "Please provide at least 2 valid wallet addresses.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await collaborationService.createCollaboration({
        nftId,
        collaborators: addresses,
        roles,
        status: 'pending'
      });
      
      if (result._id) {
        toast({
          title: "Collaboration Created",
          description: "Collaborators have been invited successfully.",
        });
        setCollaborators([{ address: '', role: 'author' }]);
        onCollaborationCreated?.(result);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create collaboration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create collaboration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>Invite Collaborators</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Invite other researchers to collaborate on this NFT. Each collaborator will have shared ownership and rights.
        </p>

        {collaborators.map((collaborator, index) => (
          <div key={index} className="flex space-x-2 items-start">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`address-${index}`}>Wallet Address</Label>
              <Input
                id={`address-${index}`}
                value={collaborator.address}
                onChange={(e) => handleAddressChange(index, e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>
            
            <div className="w-32 space-y-2">
              <Label htmlFor={`role-${index}`}>Role</Label>
              <Select
                value={collaborator.role}
                onValueChange={(role) => handleRoleChange(index, role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="co-author">Co-Author</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {collaborators.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeCollaborator(index)}
                className="mt-6"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        <div className="flex space-x-2">
          <Button onClick={addCollaborator} variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-1" />
            Add Collaborator
          </Button>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleInvite} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating Collaboration...' : 'Create Collaboration'}
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>• All collaborators will have shared ownership of the NFT</p>
          <p>• Revenue and royalties will be split according to roles</p>
          <p>• Collaborators can vote on important decisions</p>
        </div>
      </CardContent>
    </Card>
  );
}; 