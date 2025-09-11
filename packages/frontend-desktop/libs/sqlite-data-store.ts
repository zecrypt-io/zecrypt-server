'use client'

import { invoke } from '@tauri-apps/api/core'

async function tauriCall<T>(cmd: string, args?: Record<string, any>): Promise<T> {
	const res: any = await invoke(cmd, args)
	if (!res || res.success === false) {
		throw new Error(res?.error || `${cmd} failed`)
	}
	return res.data as T
}

export class SqliteDataStore {
	private generateId(prefix: string) {
		return `${prefix}_${Date.now()}`
	}

	// Safe JSON parse helper
	private parseOr<T>(value: any, fallback: T): T {
		try { return value ? JSON.parse(value) as T : fallback } catch { return fallback }
	}

	// Workspaces
	getWorkspaces() { return this.dsList('workspaces') }

	async createWorkspace(workspace: { name: string; description?: string }) {
		const res = await this.dsCreate('workspaces', 'ws', {
			name: workspace.name,
			description: workspace.description ?? null,
		})
		return res
	}

	async updateWorkspace(id: string, updates: any) {
		const res = await this.dsUpdate('workspaces', id, {
			name: updates.name ?? null,
			description: updates.description ?? null,
		})
		return res
	}

	async deleteWorkspace(id: string) {
		await this.dsDelete('workspaces', id)
		return true
	}

	// Projects
	async getProjects(workspaceId?: string) {
		const rows = await this.dsList('projects')
		const mapped = rows.map((r: any) => ({
			...r,
			isDefault: !!r.isDefault,
			features: this.parseOr(r.features_json, {}),
		}))
		return workspaceId ? mapped.filter((r: any) => r.workspaceId === workspaceId) : mapped
	}

	async createProject(project: { workspaceId: string; name: string; description?: string; color?: string; isDefault?: boolean; features?: any }) {
		const res = await this.dsCreate('projects', 'proj', {
			workspaceId: project.workspaceId,
			name: project.name,
			description: project.description ?? null,
			color: project.color ?? null,
			isDefault: project.isDefault ? 1 : 0,
			features_json: project.features ? JSON.stringify(project.features) : null,
		})
		return { ...res, isDefault: !!res.isDefault, features: this.parseOr(res.features_json, {}) }
	}

	async updateProject(id: string, updates: any) {
		const res = await this.dsUpdate('projects', id, {
			name: updates.name ?? null,
			description: updates.description ?? null,
			color: updates.color ?? null,
			isDefault: updates.isDefault === undefined ? null : (updates.isDefault ? 1 : 0),
			features_json: updates.features ? JSON.stringify(updates.features) : null,
		})
		return { ...res, isDefault: !!res.isDefault, features: this.parseOr(res.features_json, {}) }
	}

	async deleteProject(id: string) {
		await this.dsDelete('projects', id)
		return true
	}

	// Generic helpers for list tables with created/updated timestamps
	private async listByProject(table: string, projectId?: string) {
		const db = await getDb()
		if (projectId) return db.select(`SELECT * FROM ${table} WHERE projectId = $1 ORDER BY createdAt ASC`, [projectId])
		return db.select(`SELECT * FROM ${table} ORDER BY createdAt ASC`)
	}

	private transformPayloadForTable(table: string, payload: any) {
		const transformed: any = { ...payload }
		// Normalize tags -> tags_json (TEXT) for tables that store tags as JSON string
		if (Object.prototype.hasOwnProperty.call(transformed, 'tags')) {
			const value = transformed.tags
			transformed.tags_json = Array.isArray(value) ? JSON.stringify(value) : (value ?? null)
			delete transformed.tags
		}
		return transformed
	}

	private async createWithTimestamps(table: string, idPrefix: string, payload: any) {
		const db = await getDb()
		const id = this.generateId(idPrefix)
		const now = new Date().toISOString()
		const normalized = this.transformPayloadForTable(table, payload)
		const columns = Object.keys(normalized)
		const placeholders = columns.map((_, i) => `$${i + 2}`).join(',')
		await db.execute(
			`INSERT INTO ${table} (id, ${columns.join(',')}, createdAt, updatedAt) VALUES ($1, ${placeholders}, $${columns.length + 2}, $${columns.length + 3})`,
			[id, ...columns.map(k => normalized[k]), now, now]
		)
		return { id, ...normalized, createdAt: now, updatedAt: now }
	}

	private async updateWithTimestamps(table: string, id: string, updates: any) {
		const db = await getDb()
		const normalized = this.transformPayloadForTable(table, updates)
		const columns = Object.keys(normalized)
		const setPieces = columns.map((k, i) => `${k} = COALESCE($${i + 2}, ${k})`).join(', ')
		const now = new Date().toISOString()
		await db.execute(
			`UPDATE ${table} SET ${setPieces}${setPieces ? ', ' : ''}updatedAt = $${columns.length + 2} WHERE id = $1`,
			[id, ...columns.map(k => normalized[k]), now]
		)
		const rows = await db.select(`SELECT * FROM ${table} WHERE id = $1`, [id])
		return rows[0] || null
	}

	private async deleteById(table: string, id: string) {
		const db = await getDb()
		await db.execute(`DELETE FROM ${table} WHERE id = $1`, [id])
		return true
	}

	// Accounts -> now backed by Tauri native commands (no plugin dependency)
	getAccounts(projectId?: string) {
		return tauriCall<any[]>('accounts_list', { projectId })
	}
	async createAccount(payload: any) {
		const res = await tauriCall<any>('accounts_create', {
			payload: {
				projectId: payload.projectId ?? null,
				name: payload.name,
				username: payload.username ?? null,
				email: payload.email ?? null,
				encryptedPassword: payload.encryptedPassword ?? null,
				url: payload.url ?? null,
				notes: payload.notes ?? null,
				tags: payload.tags ?? null,
			},
		})
		return res
	}
	async updateAccount(id: string, updates: any) {
		const res = await tauriCall<any>('accounts_update', {
			id,
			updates: {
				name: updates.name ?? null,
				username: updates.username ?? null,
				email: updates.email ?? null,
				encryptedPassword: updates.encryptedPassword ?? null,
				url: updates.url ?? null,
				notes: updates.notes ?? null,
				tags: updates.tags ?? null,
			},
		})
		return res
	}
	async deleteAccount(id: string) {
		await tauriCall<void>('accounts_delete', { id })
		return true
	}

	// Identities -> backed by Tauri native commands
	getIdentities(projectId?: string) {
		return tauriCall<any[]>('identities_list', { projectId })
	}
	async createIdentity(payload: any) {
		const res = await tauriCall<any>('identities_create', {
			payload: {
				projectId: payload.projectId,
				title: payload.title,
				first_name: payload.first_name ?? null,
				last_name: payload.last_name ?? null,
				email: payload.email ?? null,
				phone: payload.phone ?? null,
				address: payload.address ?? null,
				country: payload.country ?? null,
				date_of_birth: payload.date_of_birth ?? null,
				national_id: payload.national_id ?? null,
				notes: payload.notes ?? null,
				tags: payload.tags ?? null,
			}
		})
		return res
	}
	async updateIdentity(id: string, updates: any) {
		const res = await tauriCall<any>('identities_update', {
			id,
			updates: {
				title: updates.title ?? null,
				first_name: updates.first_name ?? null,
				last_name: updates.last_name ?? null,
				email: updates.email ?? null,
				phone: updates.phone ?? null,
				address: updates.address ?? null,
				country: updates.country ?? null,
				date_of_birth: updates.date_of_birth ?? null,
				national_id: updates.national_id ?? null,
				notes: updates.notes ?? null,
				tags: updates.tags ?? null,
			},
		})
		return res
	}
	async deleteIdentity(id: string) {
		await tauriCall<void>('identities_delete', { id })
		return true
	}

	// Generic DS helpers via Tauri
	private dsList(table: string, projectId?: string) { return tauriCall<any[]>('ds_list', { table, projectId }) }
	private dsCreate(table: string, idPrefix: string, payload: any) { return tauriCall<any>('ds_create', { args: { table, id_prefix: idPrefix, payload } }) }
	private dsUpdate(table: string, id: string, updates: any) { return tauriCall<any>('ds_update', { args: { table, id, updates } }) }
	private dsDelete(table: string, id: string) { return tauriCall<void>('ds_delete', { table, id }) }

	// Emails
	getEmails(projectId?: string) { return this.dsList('emails', projectId) }
	createEmail(payload: any) { return this.dsCreate('emails', 'email', payload) }
	updateEmail(id: string, updates: any) { return this.dsUpdate('emails', id, updates) }
	deleteEmail(id: string) { return this.dsDelete('emails', id).then(() => true) }

	// Cards
	getCards(projectId?: string) { return this.dsList('cards', projectId) }
	createCard(payload: any) { return this.dsCreate('cards', 'card', payload) }
	updateCard(id: string, updates: any) { return this.dsUpdate('cards', id, updates) }
	deleteCard(id: string) { return this.dsDelete('cards', id).then(() => true) }

	// Notes
	getNotes(projectId?: string) { return this.dsList('notes', projectId) }
	createNote(payload: any) { return this.dsCreate('notes', 'note', payload) }
	updateNote(id: string, updates: any) { return this.dsUpdate('notes', id, updates) }
	deleteNote(id: string) { return this.dsDelete('notes', id).then(() => true) }

	// Wallet phrases
	getWalletPhrases(projectId?: string) { return this.dsList('wallet_phrases', projectId) }
	createWalletPhrase(payload: any) { return this.dsCreate('wallet_phrases', 'wallet', payload) }
	updateWalletPhrase(id: string, updates: any) { return this.dsUpdate('wallet_phrases', id, updates) }
	deleteWalletPhrase(id: string) { return this.dsDelete('wallet_phrases', id).then(() => true) }

	// Identities (already overridden above)
	// SSH Keys
	getSshKeys(projectId?: string) { return this.dsList('ssh_keys', projectId) }
	createSshKey(payload: any) { return this.dsCreate('ssh_keys', 'ssh', payload) }
	updateSshKey(id: string, updates: any) { return this.dsUpdate('ssh_keys', id, updates) }
	deleteSshKey(id: string) { return this.dsDelete('ssh_keys', id).then(() => true) }

	// Licenses
	getLicenses(projectId?: string) { return this.dsList('licenses', projectId) }
	createLicense(payload: any) { return this.dsCreate('licenses', 'license', payload) }
	updateLicense(id: string, updates: any) { return this.dsUpdate('licenses', id, updates) }
	deleteLicense(id: string) { return this.dsDelete('licenses', id).then(() => true) }

	// Envs
	getEnvs(projectId?: string) { return this.dsList('envs', projectId) }
	createEnv(payload: any) { return this.dsCreate('envs', 'env', payload) }
	updateEnv(id: string, updates: any) { return this.dsUpdate('envs', id, updates) }
	deleteEnv(id: string) { return this.dsDelete('envs', id).then(() => true) }

	// Wifi
	getWifiNetworks(projectId?: string) { return this.dsList('wifi_networks', projectId) }
	createWifiNetwork(payload: any) { return this.dsCreate('wifi_networks', 'wifi', payload) }
	updateWifiNetwork(id: string, updates: any) { return this.dsUpdate('wifi_networks', id, updates) }
	deleteWifiNetwork(id: string) { return this.dsDelete('wifi_networks', id).then(() => true) }

	// Api Keys
	getApiKeys(projectId?: string) { return this.dsList('api_keys', projectId) }
	createApiKey(payload: any) { return this.dsCreate('api_keys', 'apikey', payload) }
	updateApiKey(id: string, updates: any) { return this.dsUpdate('api_keys', id, updates) }
	deleteApiKey(id: string) { return this.dsDelete('api_keys', id).then(() => true) }
}

export const sqliteDataStore = new SqliteDataStore()


