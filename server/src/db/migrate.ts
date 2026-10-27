import { ensureDatabaseAndMigrate } from './setupDb.js'
import { pool } from './postgres.js'

async function run() {
  try {
    console.log('Running database setup and migrations...')
    await ensureDatabaseAndMigrate()
    console.log('All migrations completed successfully.')
  } catch (err: any) {
    console.error('Migration failed:', err)
  } finally {
    await pool.end().catch(() => {})
    process.exit(0)
  }
}

run()
