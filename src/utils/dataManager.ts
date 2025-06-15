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
    theses: 'thesis_vault_theses',
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
    const theses = this.getAllTheses();
    const existingIndex = theses.findIndex(t => t.id === thesis.id);
    
    if (existingIndex >= 0) {
      theses[existingIndex] = thesis;
    } else {
      theses.push(thesis);
    }
    
    localStorage.setItem(this.storageKeys.theses, JSON.stringify(theses));
    this.updateUserData(thesis.walletAddress, { totalThesesPosted: this.getUserTheses(thesis.walletAddress).length });
  }

  getAllTheses(): ThesisData[] {
    const stored = localStorage.getItem(this.storageKeys.theses);
    if (!stored) return [];
    
    return JSON.parse(stored).map((thesis: any) => ({
      ...thesis,
      postedAt: new Date(thesis.postedAt)
    }));
  }

  getUserTheses(walletAddress: string): ThesisData[] {
    return this.getAllTheses().filter(thesis => thesis.walletAddress === walletAddress);
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
    
    return userMints.map((mint: any) => ({
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
    const allTheses = this.getAllTheses();
    const mintCounts = this.getMintCounts();
    const totalMints = Object.values(mintCounts).reduce((sum, count) => sum + count, 0);
    
    return {
      totalTheses: allTheses.length,
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
      const allTheses = this.getAllTheses();
      const randomThesis = allTheses[Math.floor(Math.random() * allTheses.length)];
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
