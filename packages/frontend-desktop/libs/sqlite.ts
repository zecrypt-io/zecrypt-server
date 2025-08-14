import Database from '@tauri-apps/plugin-sql'

let dbPromise: Promise<any> | null = null

export async function getDb() {
	if (!dbPromise) {
		dbPromise = (async () => {
			const db = await Database.load('sqlite:zecrypt.db')
			await bootstrap(db)
			return db
		})()
	}
	return dbPromise
}

async function bootstrap(db: any) {
	// Core entity tables
	await db.execute(`CREATE TABLE IF NOT EXISTS workspaces (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		description TEXT,
		createdAt TEXT NOT NULL
	)`)

	await db.execute(`CREATE TABLE IF NOT EXISTS projects (
		id TEXT PRIMARY KEY,
		workspaceId TEXT NOT NULL,
		name TEXT NOT NULL,
		description TEXT,
		color TEXT,
		isDefault INTEGER,
		features_json TEXT,
		createdAt TEXT NOT NULL
	)`)

	await db.execute(`CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspaceId)`) 

	// Generic item table factory creation
	// Ensure accounts table has the correct columns; if legacy schema is detected, drop and recreate
	try {
		const cols = await db.select('PRAGMA table_info(accounts)')
		const names = Array.isArray(cols) ? cols.map((c: any) => c.name) : []
		if (names.length && (!names.includes('encryptedPassword') || names.includes('password'))) {
			await db.execute('DROP TABLE IF EXISTS accounts')
		}
	} catch {}
	await db.execute(`CREATE TABLE IF NOT EXISTS accounts (
		id TEXT PRIMARY KEY,
		projectId TEXT NOT NULL,
		name TEXT NOT NULL,
		username TEXT,
		email TEXT,
		encryptedPassword TEXT,
		url TEXT,
		notes TEXT,
		tags_json TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`)
	await db.execute(`CREATE INDEX IF NOT EXISTS idx_accounts_project ON accounts(projectId)`) 

	await db.execute(`CREATE TABLE IF NOT EXISTS emails (
		id TEXT PRIMARY KEY,
		projectId TEXT NOT NULL,
		title TEXT NOT NULL,
		email_address TEXT,
		imap_server TEXT,
		smtp_server TEXT,
		username TEXT,
		password TEXT,
		notes TEXT,
		tags_json TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`)
	await db.execute(`CREATE INDEX IF NOT EXISTS idx_emails_project ON emails(projectId)`) 

	await db.execute(`CREATE TABLE IF NOT EXISTS cards (
		id TEXT PRIMARY KEY,
		projectId TEXT NOT NULL,
		title TEXT NOT NULL,
		brand TEXT,
		card_holder_name TEXT,
		number TEXT,
		expiry_month TEXT,
		expiry_year TEXT,
		cvv TEXT,
		notes TEXT,
		tags_json TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`)
	await db.execute(`CREATE INDEX IF NOT EXISTS idx_cards_project ON cards(projectId)`) 

	await db.execute(`CREATE TABLE IF NOT EXISTS notes (
		id TEXT PRIMARY KEY,
		projectId TEXT NOT NULL,
		title TEXT NOT NULL,
		data TEXT,
		tags_json TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`)
	await db.execute(`CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(projectId)`) 

	await db.execute(`CREATE TABLE IF NOT EXISTS wallet_phrases (
		id TEXT PRIMARY KEY,
		projectId TEXT NOT NULL,
		title TEXT NOT NULL,
		wallet_type TEXT,
		passphrase TEXT,
		wallet_address TEXT,
		notes TEXT,
		tags_json TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`)
	await db.execute(`CREATE INDEX IF NOT EXISTS idx_wallet_phrases_project ON wallet_phrases(projectId)`) 

	// Ensure identities has the new 'country' column for desktop usage
	try {
		const cols = await db.select('PRAGMA table_info(identities)')
		const names = Array.isArray(cols) ? cols.map((c: any) => c.name) : []
		if (names.length && !names.includes('country')) {
			await db.execute('ALTER TABLE identities ADD COLUMN country TEXT')
		}
	} catch {}

	await db.execute(`CREATE TABLE IF NOT EXISTS identities (
		id TEXT PRIMARY KEY,
		projectId TEXT NOT NULL,
		title TEXT NOT NULL,
		first_name TEXT,
		last_name TEXT,
		email TEXT,
		phone TEXT,
		address TEXT,
		country TEXT,
		date_of_birth TEXT,
		national_id TEXT,
		notes TEXT,
		tags_json TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`)
	await db.execute(`CREATE INDEX IF NOT EXISTS idx_identities_project ON identities(projectId)`) 

	await db.execute(`CREATE TABLE IF NOT EXISTS ssh_keys (
		id TEXT PRIMARY KEY,
		projectId TEXT NOT NULL,
		title TEXT NOT NULL,
		ssh_key TEXT,
		notes TEXT,
		tags_json TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`)
	await db.execute(`CREATE INDEX IF NOT EXISTS idx_ssh_keys_project ON ssh_keys(projectId)`) 

	await db.execute(`CREATE TABLE IF NOT EXISTS licenses (
		id TEXT PRIMARY KEY,
		projectId TEXT NOT NULL,
		title TEXT NOT NULL,
		license_key TEXT,
		expires_at TEXT,
		notes TEXT,
		tags_json TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`)
	await db.execute(`CREATE INDEX IF NOT EXISTS idx_licenses_project ON licenses(projectId)`) 

	await db.execute(`CREATE TABLE IF NOT EXISTS envs (
		id TEXT PRIMARY KEY,
		projectId TEXT NOT NULL,
		title TEXT NOT NULL,
		data TEXT,
		notes TEXT,
		tags_json TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`)
	await db.execute(`CREATE INDEX IF NOT EXISTS idx_envs_project ON envs(projectId)`) 

	await db.execute(`CREATE TABLE IF NOT EXISTS wifi_networks (
		id TEXT PRIMARY KEY,
		projectId TEXT NOT NULL,
		title TEXT NOT NULL,
		security_type TEXT,
		password TEXT,
		notes TEXT,
		tags_json TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`)
	await db.execute(`CREATE INDEX IF NOT EXISTS idx_wifi_networks_project ON wifi_networks(projectId)`) 

	await db.execute(`CREATE TABLE IF NOT EXISTS api_keys (
		id TEXT PRIMARY KEY,
		projectId TEXT NOT NULL,
		title TEXT NOT NULL,
		key TEXT,
		env TEXT,
		notes TEXT,
		tags_json TEXT,
		createdAt TEXT NOT NULL,
		updatedAt TEXT NOT NULL
	)`)
	await db.execute(`CREATE INDEX IF NOT EXISTS idx_api_keys_project ON api_keys(projectId)`) 

	// Settings key-value store
	await db.execute(`CREATE TABLE IF NOT EXISTS settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	)`)
}


