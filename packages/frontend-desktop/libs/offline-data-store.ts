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

export interface WalletPassphraseItem {
  id: string;
  projectId: string;
  title: string;
  wallet_type: string;
  passphrase: string;
  wallet_address: string;
  notes?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
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

export interface EmailItem {
  id: string;
  projectId: string;
  title: string;
  email_address: string;
  imap_server?: string;
  smtp_server?: string;
  username: string;
  password: string;
  notes?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CardItem {
  id: string;
  projectId: string;
  title: string;
  brand: string;
  card_holder_name: string;
  number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  notes?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteItem {
  id: string;
  projectId: string;
  title: string;
  data: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WifiNetworkItem {
  id: string;
  projectId: string;
  title: string;
  security_type: string;
  password: any;
  notes?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyItem {
  id: string;
  projectId: string;
  title: string;
  key: any;
  env: string;
  notes?: string | null;
  tags?: string[];
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

  // Email methods
  getEmails(projectId?: string): EmailItem[] {
    const items = this.getData<EmailItem>('emails');
    return projectId ? items.filter(e => e.projectId === projectId) : items;
  }

  createEmail(email: Omit<EmailItem, 'id' | 'createdAt' | 'updatedAt'>): EmailItem {
    const now = new Date().toISOString();
    const newEmail: EmailItem = {
      ...email,
      id: 'email_' + Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    const emails = this.getEmails();
    emails.push(newEmail);
    this.setData('emails', emails);
    return newEmail;
  }

  updateEmail(id: string, updates: Partial<EmailItem>): EmailItem | null {
    const emails = this.getEmails();
    const index = emails.findIndex(e => e.id === id);
    if (index === -1) return null;
    emails[index] = { ...emails[index], ...updates, updatedAt: new Date().toISOString() };
    this.setData('emails', emails);
    return emails[index];
  }

  deleteEmail(id: string): boolean {
    const emails = this.getEmails();
    const filtered = emails.filter(e => e.id !== id);
    if (filtered.length === emails.length) return false;
    this.setData('emails', filtered);
    return true;
  }

  // Card methods
  getCards(projectId?: string): CardItem[] {
    const items = this.getData<CardItem>('cards');
    return projectId ? items.filter(c => c.projectId === projectId) : items;
  }

  createCard(card: Omit<CardItem, 'id' | 'createdAt' | 'updatedAt'>): CardItem {
    const now = new Date().toISOString();
    const newCard: CardItem = {
      ...card,
      id: 'card_' + Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    const cards = this.getCards();
    cards.push(newCard);
    this.setData('cards', cards);
    return newCard;
  }

  updateCard(id: string, updates: Partial<CardItem>): CardItem | null {
    const cards = this.getCards();
    const index = cards.findIndex(c => c.id === id);
    if (index === -1) return null;
    cards[index] = { ...cards[index], ...updates, updatedAt: new Date().toISOString() };
    this.setData('cards', cards);
    return cards[index];
  }

  deleteCard(id: string): boolean {
    const cards = this.getCards();
    const filtered = cards.filter(c => c.id !== id);
    if (filtered.length === cards.length) return false;
    this.setData('cards', filtered);
    return true;
  }

  // Note methods
  getNotes(projectId?: string): NoteItem[] {
    const items = this.getData<NoteItem>('notes');
    return projectId ? items.filter(n => n.projectId === projectId) : items;
  }

  createNote(note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>): NoteItem {
    const now = new Date().toISOString();
    const newNote: NoteItem = {
      ...note,
      id: 'note_' + Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    const notes = this.getNotes();
    notes.push(newNote);
    this.setData('notes', notes);
    return newNote;
  }

  updateNote(id: string, updates: Partial<NoteItem>): NoteItem | null {
    const notes = this.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;
    notes[index] = { ...notes[index], ...updates, updatedAt: new Date().toISOString() };
    this.setData('notes', notes);
    return notes[index];
  }

  deleteNote(id: string): boolean {
    const notes = this.getNotes();
    const filtered = notes.filter(n => n.id !== id);
    if (filtered.length === notes.length) return false;
    this.setData('notes', filtered);
    return true;
  }

  // Wallet passphrase methods
  getWalletPhrases(projectId?: string): WalletPassphraseItem[] {
    const phrases = this.getData<WalletPassphraseItem>('wallet_phrases');
    return projectId ? phrases.filter(w => w.projectId === projectId) : phrases;
  }

  createWalletPhrase(phrase: Omit<WalletPassphraseItem, 'id' | 'createdAt' | 'updatedAt'>): WalletPassphraseItem {
    const now = new Date().toISOString();
    const newPhrase: WalletPassphraseItem = {
      ...phrase,
      id: 'wallet_' + Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    const phrases = this.getWalletPhrases();
    phrases.push(newPhrase);
    this.setData('wallet_phrases', phrases);
    return newPhrase;
  }

  updateWalletPhrase(id: string, updates: Partial<WalletPassphraseItem>): WalletPassphraseItem | null {
    const phrases = this.getWalletPhrases();
    const index = phrases.findIndex(w => w.id === id);
    if (index === -1) return null;
    phrases[index] = { ...phrases[index], ...updates, updatedAt: new Date().toISOString() };
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

  // Identity methods
  getIdentities(projectId?: string) {
    const items = this.getData<any>('identities');
    return projectId ? items.filter((i: any) => i.projectId === projectId) : items;
  }

  createIdentity(identity: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const item = { ...identity, id: 'identity_' + Date.now(), createdAt: now, updatedAt: now };
    const items = this.getIdentities();
    items.push(item);
    this.setData('identities', items);
    return item;
  }

  updateIdentity(id: string, updates: Partial<any>) {
    const items = this.getIdentities();
    const index = items.findIndex((i: any) => i.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    this.setData('identities', items);
    return items[index];
  }

  deleteIdentity(id: string) {
    const items = this.getIdentities();
    const filtered = items.filter((i: any) => i.id !== id);
    if (filtered.length === items.length) return false;
    this.setData('identities', filtered);
    return true;
  }

  // SSH Keys methods
  getSshKeys(projectId?: string) {
    const items = this.getData<any>('ssh_keys');
    return projectId ? items.filter((i: any) => i.projectId === projectId) : items;
  }

  createSshKey(item: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const created = { ...item, id: 'ssh_' + Date.now(), createdAt: now, updatedAt: now };
    const items = this.getSshKeys();
    items.push(created);
    this.setData('ssh_keys', items);
    return created;
  }

  updateSshKey(id: string, updates: Partial<any>) {
    const items = this.getSshKeys();
    const index = items.findIndex((i: any) => i.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    this.setData('ssh_keys', items);
    return items[index];
  }

  deleteSshKey(id: string) {
    const items = this.getSshKeys();
    const filtered = items.filter((i: any) => i.id !== id);
    if (filtered.length === items.length) return false;
    this.setData('ssh_keys', filtered);
    return true;
  }

  // Licenses methods
  getLicenses(projectId?: string) {
    const items = this.getData<any>('licenses');
    return projectId ? items.filter((i: any) => i.projectId === projectId) : items;
  }

  createLicense(item: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const created = { ...item, id: 'license_' + Date.now(), createdAt: now, updatedAt: now };
    const items = this.getLicenses();
    items.push(created);
    this.setData('licenses', items);
    return created;
  }

  updateLicense(id: string, updates: Partial<any>) {
    const items = this.getLicenses();
    const index = items.findIndex((i: any) => i.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    this.setData('licenses', items);
    return items[index];
  }

  deleteLicense(id: string) {
    const items = this.getLicenses();
    const filtered = items.filter((i: any) => i.id !== id);
    if (filtered.length === items.length) return false;
    this.setData('licenses', filtered);
    return true;
  }

  // Environment variables methods
  getEnvs(projectId?: string) {
    const items = this.getData<any>('envs');
    return projectId ? items.filter((i: any) => i.projectId === projectId) : items;
  }

  createEnv(item: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const created = { ...item, id: 'env_' + Date.now(), createdAt: now, updatedAt: now };
    const items = this.getEnvs();
    items.push(created);
    this.setData('envs', items);
    return created;
  }

  updateEnv(id: string, updates: Partial<any>) {
    const items = this.getEnvs();
    const index = items.findIndex((i: any) => i.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    this.setData('envs', items);
    return items[index];
  }

  deleteEnv(id: string) {
    const items = this.getEnvs();
    const filtered = items.filter((i: any) => i.id !== id);
    if (filtered.length === items.length) return false;
    this.setData('envs', filtered);
    return true;
  }

  // WiFi Network methods
  getWifiNetworks(projectId?: string): WifiNetworkItem[] {
    const items = this.getData<WifiNetworkItem>('wifi_networks');
    return projectId ? items.filter(w => w.projectId === projectId) : items;
  }

  createWifiNetwork(item: Omit<WifiNetworkItem, 'id' | 'createdAt' | 'updatedAt'>): WifiNetworkItem {
    const now = new Date().toISOString();
    const created = { ...item, id: 'wifi_' + Date.now(), createdAt: now, updatedAt: now };
    const items = this.getWifiNetworks();
    items.push(created);
    this.setData('wifi_networks', items);
    return created;
  }

  updateWifiNetwork(id: string, updates: Partial<WifiNetworkItem>): WifiNetworkItem | null {
    const items = this.getWifiNetworks();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    this.setData('wifi_networks', items);
    return items[index];
  }

  deleteWifiNetwork(id: string): boolean {
    const items = this.getWifiNetworks();
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) return false;
    this.setData('wifi_networks', filtered);
    return true;
  }

  // API Key methods
  getApiKeys(projectId?: string): ApiKeyItem[] {
    const items = this.getData<ApiKeyItem>('api_keys');
    return projectId ? items.filter(k => k.projectId === projectId) : items;
  }

  createApiKey(item: Omit<ApiKeyItem, 'id' | 'createdAt' | 'updatedAt'>): ApiKeyItem {
    const now = new Date().toISOString();
    const created = { ...item, id: 'apikey_' + Date.now(), createdAt: now, updatedAt: now };
    const items = this.getApiKeys();
    items.push(created);
    this.setData('api_keys', items);
    return created;
  }

  updateApiKey(id: string, updates: Partial<ApiKeyItem>): ApiKeyItem | null {
    const items = this.getApiKeys();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    this.setData('api_keys', items);
    return items[index];
  }

  deleteApiKey(id: string): boolean {
    const items = this.getApiKeys();
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) return false;
    this.setData('api_keys', filtered);
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