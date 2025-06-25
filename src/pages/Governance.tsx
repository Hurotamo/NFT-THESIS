import React from 'react';
import GovernanceSection from '@/components/core/GovernanceSection';
import MultiSigActionsSection from '@/components/core/MultiSigActionsSection';

const GovernancePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-blue-950/80 border-2 border-blue-500 rounded-xl shadow-lg mb-10 p-6">
        <MultiSigActionsSection />
      </div>
      <GovernanceSection />
    </div>
  );
};

export default GovernancePage; 