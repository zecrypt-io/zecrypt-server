'use client';

// Offline data store for desktop app
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface ProjectFeatureState {
  enabled: boolean;
  is_client_side_encryption: boolean;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
  color?: string;
  isDefault?: boolean;
  features?: Record<string, ProjectFeatureState>;
}

export interface WalletPhrase {
  id: string;
  projectId: string;
  name: string;
  encryptedPhrase: string;
  createdAt: string;
}

export interface Account {
  id: string;
  projectId: string;
  name: string;
  username?: string;
  email?: string;
  encryptedPassword: string;
  url?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

class OfflineDataStore {
  private storagePrefix = 'zecrypt_desktop_';

  // Generic storage methods
  private getStorageKey(type: string): string {
    return `${this.storagePrefix}${type}`;
  }

  private getData<T>(type: string): T[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(type));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting ${type}:`, error);
      return [];
    }
  }

  private setData<T>(type: string, data: T[]): void {
    try {
      localStorage.setItem(this.getStorageKey(type), JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting ${type}:`, error);
    }
  }

  // Workspace methods
  getWorkspaces(): Workspace[] {
    return this.getData<Workspace>('workspaces');
  }

  createWorkspace(workspace: Omit<Workspace, 'id' | 'createdAt'>): Workspace {
    const newWorkspace: Workspace = {
      ...workspace,
      id: 'ws_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    
    const workspaces = this.getWorkspaces();
    workspaces.push(newWorkspace);
    this.setData('workspaces', workspaces);
    
    return newWorkspace;
  }

  updateWorkspace(id: string, updates: Partial<Workspace>): Workspace | null {
    const workspaces = this.getWorkspaces();
    const index = workspaces.findIndex(ws => ws.id === id);
    
    if (index === -1) return null;
    
    workspaces[index] = { ...workspaces[index], ...updates };
    this.setData('workspaces', workspaces);
    
    return workspaces[index];
  }

  deleteWorkspace(id: string): boolean {
    const workspaces = this.getWorkspaces();
    const filteredWorkspaces = workspaces.filter(ws => ws.id !== id);
    
    if (filteredWorkspaces.length === workspaces.length) return false;
    
    this.setData('workspaces', filteredWorkspaces);
    return true;
  }

  // Project methods
  getProjects(workspaceId?: string): Project[] {
    const projects = this.getData<Project>('projects');
    return workspaceId ? projects.filter(p => p.workspaceId === workspaceId) : projects;
  }

  createProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
    const newProject: Project = {
      ...project,
      id: 'proj_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    
    const projects = this.getProjects();
    projects.push(newProject);
    this.setData('projects', projects);
    
    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    projects[index] = { ...projects[index], ...updates };
    this.setData('projects', projects);
    
    return projects[index];
  }

  deleteProject(id: string): boolean {
    const projects = this.getProjects();
    const filteredProjects = projects.filter(p => p.id !== id);
    
    if (filteredProjects.length === projects.length) return false;
    
    this.setData('projects', filteredProjects);
    return true;
  }

  // Account methods
  getAccounts(projectId?: string): Account[] {
    const accounts = this.getData<Account>('accounts');
    return projectId ? accounts.filter(a => a.projectId === projectId) : accounts;
  }

  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Account {
    const now = new Date().toISOString();
    const newAccount: Account = {
      ...account,
      id: 'acc_' + Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    
    const accounts = this.getAccounts();
    accounts.push(newAccount);
    this.setData('accounts', accounts);
    
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<Account>): Account | null {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === id);
    
    if (index === -1) return null;
    
    accounts[index] = { 
      ...accounts[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.setData('accounts', accounts);
    
    return accounts[index];
  }

  deleteAccount(id: string): boolean {
    const accounts = this.getAccounts();
    const filteredAccounts = accounts.filter(a => a.id !== id);
    
    if (filteredAccounts.length === accounts.length) return false;
    
    this.setData('accounts', filteredAccounts);
    return true;
  }

  // Wallet phrase methods
  getWalletPhrases(projectId?: string): WalletPhrase[] {
    const phrases = this.getData<WalletPhrase>('wallet_phrases');
    return projectId ? phrases.filter(w => w.projectId === projectId) : phrases;
  }

  createWalletPhrase(phrase: Omit<WalletPhrase, 'id' | 'createdAt'>): WalletPhrase {
    const newPhrase: WalletPhrase = {
      ...phrase,
      id: 'wallet_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    
    const phrases = this.getWalletPhrases();
    phrases.push(newPhrase);
    this.setData('wallet_phrases', phrases);
    
    return newPhrase;
  }

  updateWalletPhrase(id: string, updates: Partial<WalletPhrase>): WalletPhrase | null {
    const phrases = this.getWalletPhrases();
    const index = phrases.findIndex(w => w.id === id);
    
    if (index === -1) return null;
    
    phrases[index] = { ...phrases[index], ...updates };
    this.setData('wallet_phrases', phrases);
    
    return phrases[index];
  }

  deleteWalletPhrase(id: string): boolean {
    const phrases = this.getWalletPhrases();
    const filteredPhrases = phrases.filter(w => w.id !== id);
    
    if (filteredPhrases.length === phrases.length) return false;
    
    this.setData('wallet_phrases', filteredPhrases);
    return true;
  }

  // Initialize with sample data if empty
  initializeSampleData(): void {
    if (this.getWorkspaces().length === 0) {
      const sampleWorkspace = this.createWorkspace({
        name: 'Personal Workspace',
        description: 'Your personal password and crypto management space'
      });

      const sampleProject = this.createProject({
        workspaceId: sampleWorkspace.id,
        name: 'Personal Accounts',
        description: 'Personal login credentials and accounts',
        color: '#4f46e5',
        isDefault: true,
        features: {
          login: { enabled: true, is_client_side_encryption: false },
          identity: { enabled: true, is_client_side_encryption: false },
        }
      });

      this.createAccount({
        projectId: sampleProject.id,
        name: 'Gmail Account',
        username: 'user@gmail.com',
        email: 'user@gmail.com',
        encryptedPassword: 'encrypted_password_placeholder',
        url: 'https://gmail.com',
        notes: 'Primary email account'
      });
    }
  }
}

export const offlineDataStore = new OfflineDataStore();