import React, { useState } from "react";
import { useGovernanceService } from "@/services/governanceService";

const GovernanceProposalButton: React.FC = () => {
  const { propose } = useGovernanceService();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [data, setData] = useState("");
  const [targetContract, setTargetContract] = useState("");

  const handlePropose = async () => {
    setLoading(true);
    try {
      const tx = await propose(description, data, targetContract);
      await tx.wait();
      alert("Proposal submitted!");
    } catch (error) {
      alert("Proposal failed: " + (error as Error).message);
    }
    setLoading(false);
  };

  return (
    <div>
      <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      <input type="text" placeholder="Data (hex)" value={data} onChange={e => setData(e.target.value)} />
      <input type="text" placeholder="Target Contract Address" value={targetContract} onChange={e => setTargetContract(e.target.value)} />
      <button onClick={handlePropose} disabled={loading}>
        {loading ? "Submitting..." : "Submit Proposal"}
      </button>
    </div>
  );
};

export default GovernanceProposalButton; 