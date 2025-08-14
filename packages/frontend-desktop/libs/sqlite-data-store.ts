'use client'

import { getDb } from './sqlite'

export class SqliteDataStore {
	private generateId(prefix: string) {
		return `${prefix}_${Date.now()}`
	}

	// Safe JSON parse helper
	private parseOr<T>(value: any, fallback: T): T {
		try { return value ? JSON.parse(value) as T : fallback } catch { return fallback }
	}

	// Workspaces
	async getWorkspaces() {
		const db = await getDb()
		return db.select('SELECT * FROM workspaces ORDER BY createdAt ASC')
	}

	async createWorkspace(workspace: { name: string; description?: string }) {
		const db = await getDb()
		const id = this.generateId('ws')
		const createdAt = new Date().toISOString()
		await db.execute(
			'INSERT INTO workspaces (id, name, description, createdAt) VALUES ($1,$2,$3,$4)',
			[id, workspace.name, workspace.description ?? null, createdAt]
		)
		return { id, name: workspace.name, description: workspace.description, createdAt }
	}

	async updateWorkspace(id: string, updates: any) {
		const db = await getDb()
		await db.execute('UPDATE workspaces SET name = COALESCE($2,name), description = COALESCE($3,description) WHERE id = $1', [id, updates.name ?? null, updates.description ?? null])
		const rows = await db.select('SELECT * FROM workspaces WHERE id = $1', [id])
		return rows[0] || null
	}

	async deleteWorkspace(id: string) {
		const db = await getDb()
		await db.execute('DELETE FROM workspaces WHERE id = $1', [id])
		return true
	}

	// Projects
	async getProjects(workspaceId?: string) {
		const db = await getDb()
		const rows = workspaceId
			? await db.select('SELECT * FROM projects WHERE workspaceId = $1 ORDER BY createdAt ASC', [workspaceId])
			: await db.select('SELECT * FROM projects ORDER BY createdAt ASC')
		return rows.map((r: any) => ({
			...r,
			isDefault: !!r.isDefault,
			features: this.parseOr(r.features_json, {}),
		}))
	}

	async createProject(project: { workspaceId: string; name: string; description?: string; color?: string; isDefault?: boolean; features?: any }) {
		const db = await getDb()
		const id = this.generateId('proj')
		const createdAt = new Date().toISOString()
		await db.execute(
			'INSERT INTO projects (id, workspaceId, name, description, color, isDefault, features_json, createdAt) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
			[id, project.workspaceId, project.name, project.description ?? null, project.color ?? null, project.isDefault ? 1 : 0, project.features ? JSON.stringify(project.features) : null, createdAt]
		)
		return { id, workspaceId: project.workspaceId, name: project.name, description: project.description, color: project.color, isDefault: !!project.isDefault, features: project.features, createdAt }
	}

	async updateProject(id: string, updates: any) {
		const db = await getDb()
		await db.execute(
			'UPDATE projects SET name = COALESCE($2,name), description = COALESCE($3,description), color = COALESCE($4,color), isDefault = COALESCE($5,isDefault), features_json = COALESCE($6,features_json) WHERE id = $1',
			[id, updates.name ?? null, updates.description ?? null, updates.color ?? null, updates.isDefault === undefined ? null : (updates.isDefault ? 1 : 0), updates.features ? JSON.stringify(updates.features) : null]
		)
		const rows = await db.select('SELECT * FROM projects WHERE id = $1', [id])
		if (rows[0]) rows[0].isDefault = !!rows[0].isDefault
		return rows[0] || null
	}

	async deleteProject(id: string) {
		const db = await getDb()
		await db.execute('DELETE FROM projects WHERE id = $1', [id])
		return true
	}

	// Generic helpers for list tables with created/updated timestamps
	private async listByProject(table: string, projectId?: string) {
		const db = await getDb()
		if (projectId) return db.select(`SELECT * FROM ${table} WHERE projectId = $1 ORDER BY createdAt ASC`, [projectId])
		return db.select(`SELECT * FROM ${table} ORDER BY createdAt ASC`)
	}

	private async createWithTimestamps(table: string, idPrefix: string, payload: any) {
		const db = await getDb()
		const id = this.generateId(idPrefix)
		const now = new Date().toISOString()
		const columns = Object.keys(payload)
		const placeholders = columns.map((_, i) => `$${i + 2}`).join(',')
		await db.execute(
			`INSERT INTO ${table} (id, ${columns.join(',')}, createdAt, updatedAt) VALUES ($1, ${placeholders}, $${columns.length + 2}, $${columns.length + 3})`,
			[id, ...columns.map(k => payload[k]), now, now]
		)
		return { id, ...payload, createdAt: now, updatedAt: now }
	}

	private async updateWithTimestamps(table: string, id: string, updates: any) {
		const db = await getDb()
		const columns = Object.keys(updates)
		const setPieces = columns.map((k, i) => `${k} = COALESCE($${i + 2}, ${k})`).join(', ')
		const now = new Date().toISOString()
		await db.execute(
			`UPDATE ${table} SET ${setPieces}${setPieces ? ', ' : ''}updatedAt = $${columns.length + 2} WHERE id = $1`,
			[id, ...columns.map(k => updates[k]), now]
		)
		const rows = await db.select(`SELECT * FROM ${table} WHERE id = $1`, [id])
		return rows[0] || null
	}

	private async deleteById(table: string, id: string) {
		const db = await getDb()
		await db.execute(`DELETE FROM ${table} WHERE id = $1`, [id])
		return true
	}

	// Accounts
	getAccounts(projectId?: string) { return this.listByProject('accounts', projectId) }
	createAccount(payload: any) { return this.createWithTimestamps('accounts', 'acc', payload) }
	updateAccount(id: string, updates: any) { return this.updateWithTimestamps('accounts', id, updates) }
	deleteAccount(id: string) { return this.deleteById('accounts', id) }

	// Emails
	getEmails(projectId?: string) { return this.listByProject('emails', projectId) }
	createEmail(payload: any) { return this.createWithTimestamps('emails', 'email', payload) }
	updateEmail(id: string, updates: any) { return this.updateWithTimestamps('emails', id, updates) }
	deleteEmail(id: string) { return this.deleteById('emails', id) }

	// Cards
	getCards(projectId?: string) { return this.listByProject('cards', projectId) }
	createCard(payload: any) { return this.createWithTimestamps('cards', 'card', payload) }
	updateCard(id: string, updates: any) { return this.updateWithTimestamps('cards', id, updates) }
	deleteCard(id: string) { return this.deleteById('cards', id) }

	// Notes
	getNotes(projectId?: string) { return this.listByProject('notes', projectId) }
	createNote(payload: any) { return this.createWithTimestamps('notes', 'note', payload) }
	updateNote(id: string, updates: any) { return this.updateWithTimestamps('notes', id, updates) }
	deleteNote(id: string) { return this.deleteById('notes', id) }

	// Wallet phrases
	getWalletPhrases(projectId?: string) { return this.listByProject('wallet_phrases', projectId) }
	createWalletPhrase(payload: any) { return this.createWithTimestamps('wallet_phrases', 'wallet', payload) }
	updateWalletPhrase(id: string, updates: any) { return this.updateWithTimestamps('wallet_phrases', id, updates) }
	deleteWalletPhrase(id: string) { return this.deleteById('wallet_phrases', id) }

	// Identities
	getIdentities(projectId?: string) { return this.listByProject('identities', projectId) }
	createIdentity(payload: any) { return this.createWithTimestamps('identities', 'identity', payload) }
	updateIdentity(id: string, updates: any) { return this.updateWithTimestamps('identities', id, updates) }
	deleteIdentity(id: string) { return this.deleteById('identities', id) }

	// SSH Keys
	getSshKeys(projectId?: string) { return this.listByProject('ssh_keys', projectId) }
	createSshKey(payload: any) { return this.createWithTimestamps('ssh_keys', 'ssh', payload) }
	updateSshKey(id: string, updates: any) { return this.updateWithTimestamps('ssh_keys', id, updates) }
	deleteSshKey(id: string) { return this.deleteById('ssh_keys', id) }

	// Licenses
	getLicenses(projectId?: string) { return this.listByProject('licenses', projectId) }
	createLicense(payload: any) { return this.createWithTimestamps('licenses', 'license', payload) }
	updateLicense(id: string, updates: any) { return this.updateWithTimestamps('licenses', id, updates) }
	deleteLicense(id: string) { return this.deleteById('licenses', id) }

	// Envs
	getEnvs(projectId?: string) { return this.listByProject('envs', projectId) }
	createEnv(payload: any) { return this.createWithTimestamps('envs', 'env', payload) }
	updateEnv(id: string, updates: any) { return this.updateWithTimestamps('envs', id, updates) }
	deleteEnv(id: string) { return this.deleteById('envs', id) }

	// Wifi
	getWifiNetworks(projectId?: string) { return this.listByProject('wifi_networks', projectId) }
	createWifiNetwork(payload: any) { return this.createWithTimestamps('wifi_networks', 'wifi', payload) }
	updateWifiNetwork(id: string, updates: any) { return this.updateWithTimestamps('wifi_networks', id, updates) }
	deleteWifiNetwork(id: string) { return this.deleteById('wifi_networks', id) }

	// Api Keys
	getApiKeys(projectId?: string) { return this.listByProject('api_keys', projectId) }
	createApiKey(payload: any) { return this.createWithTimestamps('api_keys', 'apikey', payload) }
	updateApiKey(id: string, updates: any) { return this.updateWithTimestamps('api_keys', id, updates) }
	deleteApiKey(id: string) { return this.deleteById('api_keys', id) }
}

export const sqliteDataStore = new SqliteDataStore()


