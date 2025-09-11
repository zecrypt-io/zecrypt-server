// Deprecated: plugin-sql not used in desktop build. This stub exists only
// to make legacy imports explicit failures so we can remove them over time.

let dbPromise: Promise<any> | null = null

export async function getDb() { throw new Error('sql.load not allowed. Plugin not found') }

async function bootstrap(_db: any) { /* intentionally empty */ }


