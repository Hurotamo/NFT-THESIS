import React from 'react';
import GovernanceSection from '@/components/core/GovernanceSection';
import MultiSigActionsSection from '@/components/core/MultiSigActionsSection';

const GovernancePage: React.FC = () => {
  return (
    <div className="max-w-5xl w-full mx-auto px-4 py-12 flex flex-col gap-12">
      <section className="bg-blue-950/80 border-2 border-blue-500 rounded-2xl shadow-xl p-8 min-h-[140px] flex flex-col justify-center">
        <MultiSigActionsSection />
      </section>
      <section className="bg-black/80 border border-blue-900 rounded-2xl shadow-lg p-8 flex-1 overflow-auto">
        <GovernanceSection />
      </section>
    </div>
  );
};

GovernancePage.displayName = "GovernancePage";

export default GovernancePage; 