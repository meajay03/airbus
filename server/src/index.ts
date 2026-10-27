import express, { Request, Response, NextFunction } from 'express'
import { config } from './config/index.js'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authenticate } from './middleware/auth.js'
import { pool } from './db/postgres.js'
import { ensureDatabaseAndMigrate } from './db/setupDb.js'

const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '5mb' }))

// Security & CORS headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key')
  if (_req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Authentication middleware to resolve bearer tokens and user sessions
app.use(authenticate)

// System Health Check
app.get('/api/health', async (_req: Request, res: Response) => {
  let database = 'in-memory-adapter-active'
  try {
    const pgCheck = await pool.query('SELECT current_database(), NOW()')
    database = `postgresql-connected (${pgCheck.rows[0].current_database})`
  } catch {
    database = 'postgresql-unavailable'
  }

  res.json({
    status: 'ok',
    brand: 'Maison Véla - Luxury Property Booking & Management Platform',
    database,
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  })
})

// Mount Central Modular API Router (v1 specification and standard /api alias)
app.use('/api/v1', apiRouter)
app.use('/api', apiRouter)

// Central Error Handling Middleware
app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  ensureDatabaseAndMigrate()
    .then(() => {
      app.listen(config.port, '0.0.0.0', () => {
        console.log(`🏰 [Maison Véla] Luxury Hospitality API online on http://127.0.0.1:${config.port}`)
        console.log(`🗄️ Connected to PostgreSQL database: ${config.db.database} at ${config.db.host}:${config.db.port}`)
      })
    })
    .catch((err) => {
      console.error('Failed to run initial PostgreSQL migration, starting with fallback:', err)
      app.listen(config.port, '0.0.0.0', () => {
        console.log(`🏰 [Maison Véla] Luxury Hospitality API online on http://127.0.0.1:${config.port} (Fallback mode)`)
      })
    })
}

export default app
