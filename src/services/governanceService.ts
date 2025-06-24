import { useContracts } from "../hooks/useContracts";

export function useGovernanceService() {
  const { governance } = useContracts();

  // Example: add a method to call a governance function
  const propose = async (description: string, data: string, targetContract: string, overrides = {}) => {
    return governance.propose(description, data, targetContract, overrides);
  };

  // Add more methods as needed...
  return { propose };
} 