import React, { useState, useEffect } from 'react';
import { Button } from '../buttons/Button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../cards/Card';
import { userProfileService } from '../../services/socialService';
import { useToast } from '../../hooks/use-toast';

interface UserProfile {
  wallet: string;
  username: string;
  avatarUrl: string;
  bio: string;
  socialLinks: string[];
}

interface UserProfileEditorProps {
  wallet: string;
  onProfileUpdated?: (profile: UserProfile) => void;
}

export const UserProfileEditor: React.FC<UserProfileEditorProps> = ({
  wallet,
  onProfileUpdated
}) => {
  const [profile, setProfile] = useState<UserProfile>({
    wallet,
    username: '',
    avatarUrl: '',
    bio: '',
    socialLinks: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [wallet]);

  const loadProfile = async () => {
    try {
      const userProfile = await userProfileService.getProfile(wallet);
      if (userProfile && !userProfile.error) {
        setProfile({
          wallet: userProfile.wallet || wallet,
          username: userProfile.username || '',
          avatarUrl: userProfile.avatarUrl || '',
          bio: userProfile.bio || '',
          socialLinks: userProfile.socialLinks || []
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await userProfileService.updateProfile(profile);
      if (result.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
        setIsEditing(false);
        onProfileUpdated?.(profile);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSocialLink = () => {
    setProfile(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, '']
    }));
  };

  const updateSocialLink = (index: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => i === index ? value : link)
    }));
  };

  const removeSocialLink = (index: number) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  if (!isEditing) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Profile
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Profile
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            {profile.avatarUrl && (
              <img
                src={profile.avatarUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="text-xl font-semibold">
                {profile.username || `User ${wallet.slice(0, 6)}...${wallet.slice(-4)}`}
              </h3>
              <p className="text-sm text-gray-500">{wallet}</p>
            </div>
          </div>
          
          {profile.bio && (
            <div>
              <Label>Bio</Label>
              <p className="text-sm text-gray-700 mt-1">{profile.bio}</p>
            </div>
          )}
          
          {profile.socialLinks.length > 0 && (
            <div>
              <Label>Social Links</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={profile.username}
            onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
            placeholder="Enter your username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <Input
            id="avatarUrl"
            value={profile.avatarUrl}
            onChange={(e) => setProfile(prev => ({ ...prev, avatarUrl: e.target.value }))}
            placeholder="Enter avatar image URL"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell us about yourself..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Social Links</Label>
          {profile.socialLinks.map((link, index) => (
            <div key={index} className="flex space-x-2">
              <Input
                value={link}
                onChange={(e) => updateSocialLink(index, e.target.value)}
                placeholder="Enter social media URL"
              />
              <Button
                onClick={() => removeSocialLink(index)}
                variant="outline"
                size="sm"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button onClick={addSocialLink} variant="outline" size="sm">
            Add Social Link
          </Button>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
          <Button onClick={() => setIsEditing(false)} variant="outline">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 