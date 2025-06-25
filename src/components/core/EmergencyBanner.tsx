import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/feedback/Alert';
import { AlertTriangle } from 'lucide-react';

interface EmergencyBannerProps {
  emergencyMode: boolean;
}

const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ emergencyMode }) => {
  if (!emergencyMode) return null;
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="w-6 h-6 text-red-500" />
      <div>
        <AlertTitle>Emergency Mode Active</AlertTitle>
        <AlertDescription>
          The staking contract is currently in <b>emergency mode</b>. Staking and unstaking are temporarily disabled for all users. Please contact the administrator for more information.
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default EmergencyBanner; 