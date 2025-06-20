interface ThesisData {
  id: string;
  title: string;
  description: string;
  author: string;
  university: string;
  year: string;
  field: string;
  ipfsHash?: string;
  postedAt: Date;
  walletAddress: string;
  status: 'active' | 'archived';
  tags: string[];
  mintCount?: number;
}

interface MintRecord {
  id: string;
  thesisId: string;
  thesisTitle: string;
  mintedAt: Date;
  cost: number;
  transactionHash?: string;
  status: 'completed' | 'pending';
  isBlurred?: boolean;
  blurredContent?: string;
  ipfsHash?: string;
}

interface UserData {
  walletAddress: string;
  totalThesesPosted: number;
  totalEarnings: number;
  totalMinted: number;
  totalSpent: number;
  joinedAt: Date;
  lastActive: Date;
}

class DataManager {
  private static instance: DataManager;
  private storageKeys = {
    thesis: 'thesis_vault_thesis',
    mintCounts: 'thesis_vault_mint_counts',
    userMints: 'thesis_vault_user_mints',
    userData: 'thesis_vault_user_data',
    settings: 'thesis_vault_settings'
  };

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  // Thesis Management
  saveThesis(thesis: ThesisData): void {
    const thesisVault = this.getAllThesis();
    const existingIndex = thesisVault.findIndex(t => t.id === thesis.id);
    
    if (existingIndex >= 0) {
      thesisVault[existingIndex] = thesis;
    } else {
      thesisVault.push(thesis);
    }
    
    localStorage.setItem(this.storageKeys.thesis, JSON.stringify(thesisVault));
    this.updateUserData(thesis.walletAddress, { totalThesesPosted: this.getUserThesis(thesis.walletAddress).length });
  }

  getAllThesis(): ThesisData[] {
    const stored = localStorage.getItem(this.storageKeys.thesis);
    if (!stored) return [];
    
    return JSON.parse(stored).map((thesis: ThesisData) => ({
      ...thesis,
      postedAt: new Date(thesis.postedAt)
    }));
  }

  getUserThesis(walletAddress: string): ThesisData[] {
    return this.getAllThesis().filter(thesis => thesis.walletAddress === walletAddress);
  }

  // Mint Management
  recordMint(walletAddress: string, mintRecord: MintRecord): void {
    const userMints = this.getUserMints(walletAddress);
    userMints.push(mintRecord);
    
    const allUserMints = JSON.parse(localStorage.getItem(this.storageKeys.userMints) || '{}');
    allUserMints[walletAddress] = userMints;
    localStorage.setItem(this.storageKeys.userMints, JSON.stringify(allUserMints));

    // Update mint counts
    const mintCounts = this.getMintCounts();
    mintCounts[mintRecord.thesisId] = (mintCounts[mintRecord.thesisId] || 0) + 1;
    localStorage.setItem(this.storageKeys.mintCounts, JSON.stringify(mintCounts));

    // Update user data
    this.updateUserData(walletAddress, {
      totalMinted: userMints.length,
      totalSpent: userMints.reduce((sum, mint) => sum + mint.cost, 0)
    });
  }

  getUserMints(walletAddress: string): MintRecord[] {
    const allUserMints = JSON.parse(localStorage.getItem(this.storageKeys.userMints) || '{}');
    const userMints = allUserMints[walletAddress] || [];
    
    return userMints.map((mint: MintRecord) => ({
      ...mint,
      mintedAt: new Date(mint.mintedAt)
    }));
  }

  getMintCounts(): { [thesisId: string]: number } {
    return JSON.parse(localStorage.getItem(this.storageKeys.mintCounts) || '{}');
  }

  // User Data Management
  updateUserData(walletAddress: string, updates: Partial<UserData>): void {
    const userData = this.getUserData(walletAddress);
    const updatedData = {
      ...userData,
      ...updates,
      walletAddress,
      lastActive: new Date()
    };
    
    const allUserData = JSON.parse(localStorage.getItem(this.storageKeys.userData) || '{}');
    allUserData[walletAddress] = updatedData;
    localStorage.setItem(this.storageKeys.userData, JSON.stringify(allUserData));
  }

  getUserData(walletAddress: string): UserData {
    const allUserData = JSON.parse(localStorage.getItem(this.storageKeys.userData) || '{}');
    const userData = allUserData[walletAddress];
    
    if (!userData) {
      return {
        walletAddress,
        totalThesesPosted: 0,
        totalEarnings: 0,
        totalMinted: 0,
        totalSpent: 0,
        joinedAt: new Date(),
        lastActive: new Date()
      };
    }
    
    return {
      ...userData,
      joinedAt: new Date(userData.joinedAt),
      lastActive: new Date(userData.lastActive)
    };
  }

  // Analytics and Statistics
  getGlobalStats() {
    const allThesis = this.getAllThesis();
    const mintCounts = this.getMintCounts();
    const totalMints = Object.values(mintCounts).reduce((sum, count) => sum + count, 0);
    
    return {
      totalTheses: allThesis.length,
      totalMints,
      activeUsers: Object.keys(JSON.parse(localStorage.getItem(this.storageKeys.userData) || '{}')).length,
      totalVolume: totalMints * 0.04 // Assuming 0.04 CORE per mint average
    };
  }

  // Real-time simulation
  simulateActivity(): void {
    // Simulate some background activity for demo purposes
    const stats = this.getGlobalStats();
    if (stats.totalTheses > 0 && Math.random() < 0.1) {
      // Randomly add a mint to a random thesis
      const allThesis = this.getAllThesis();
      const randomThesis = allThesis[Math.floor(Math.random() * allThesis.length)];
      const fakeWallet = `0x${Math.random().toString(16).substr(2, 40)}`;
      
      this.recordMint(fakeWallet, {
        id: `mint_${Date.now()}_${Math.random()}`,
        thesisId: randomThesis.id,
        thesisTitle: randomThesis.title,
        mintedAt: new Date(),
        cost: 0.04,
        status: 'completed'
      });
    }
  }

  // Clear all data (for testing)
  clearAllData(): void {
    Object.values(this.storageKeys).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export default DataManager;
export type { ThesisData, MintRecord, UserData };
