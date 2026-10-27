import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config/index.js'
import { luxuryStore } from './store.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function ensureDatabaseAndMigrate() {
  const { host, user, password, port, database } = config.db

  console.log(`🔌 Connecting to PostgreSQL at ${host}:${port} as ${user}...`)

  // Step 1: Connect to maintenance database 'postgres' to ensure target database exists
  const maintenancePool = new Pool({
    host,
    user,
    password,
    port,
    database: 'postgres'
  })

  try {
    const dbCheck = await maintenancePool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [database]
    )

    if (dbCheck.rows.length === 0) {
      console.log(`✨ Database "${database}" does not exist. Creating...`)
      await maintenancePool.query(`CREATE DATABASE "${database}"`)
      console.log(`✓ Database "${database}" created successfully.`)
    } else {
      console.log(`✓ Database "${database}" already exists.`)
    }
  } catch (err: any) {
    console.error('⚠️ Could not verify/create database via postgres maintenance pool:', err.message)
  } finally {
    await maintenancePool.end().catch(() => {})
  }

  // Step 2: Connect to the actual target database
  const appPool = new Pool({
    host,
    user,
    password,
    port,
    database
  })

  try {
    // Run all versioned migration scripts in sequence
    const migrationsDir = path.resolve(__dirname, '../../db/migrations')
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
      for (const file of migrationFiles) {
        console.log(`📜 Executing PostgreSQL migration ${file}...`)
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
        await appPool.query(sql)
        console.log(`✓ Migration ${file} executed successfully.`)
      }
    }

    // Step 3: Check if properties exist in PostgreSQL. If empty, seed from luxuryStore
    const countRes = await appPool.query('SELECT count(*)::int as count FROM properties')
    const propertyCount = countRes.rows[0]?.count || 0

    if (propertyCount === 0) {
      console.log('🌱 Seeding initial luxury properties and users into PostgreSQL...')

      // 1. Seed users
      for (const u of luxuryStore.users) {
        await appPool.query(
          `INSERT INTO users (id, email, password_hash, full_name, phone, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
          [
            // convert custom user id to valid uuid or use gen_random_uuid fallback
            'a0000000-0000-4000-8000-' + u.id.replace(/[^0-9a-f]/gi, '0').padEnd(12, '0').slice(0, 12),
            u.email,
            'pbkdf2_sha256$placeholder_hash',
            u.fullName,
            u.phone,
            u.status,
            u.createdAt
          ]
        )
      }

      // 2. Seed properties
      for (const p of luxuryStore.properties) {
        const propUuid = 'b0000000-0000-4000-8000-' + p.id.replace(/[^0-9a-f]/gi, '0').padEnd(12, '0').slice(0, 12)
        const ownerUuid = 'a0000000-0000-4000-8000-' + p.ownerId.replace(/[^0-9a-f]/gi, '0').padEnd(12, '0').slice(0, 12)

        await appPool.query(
          `INSERT INTO properties (
             id, owner_id, slug, name, description, city, region, country,
             accommodation_type, max_guests, bedrooms, bathrooms, base_nightly_price,
             currency, status, management_model, average_rating, is_featured, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
           ON CONFLICT (id) DO NOTHING`,
          [
            propUuid,
            ownerUuid,
            p.slug,
            p.name,
            p.description,
            p.city,
            p.region,
            p.country,
            p.accommodationType,
            p.maxGuests,
            p.bedrooms,
            p.bathrooms,
            p.baseNightlyPrice,
            p.currency,
            p.status,
            p.managementModel,
            p.averageRating,
            p.isFeatured,
            p.createdAt
          ]
        )

        // Seed property media
        for (let i = 0; i < p.images.length; i++) {
          const img = p.images[i]
          await appPool.query(
            `INSERT INTO property_media (property_id, url, alt_text, is_cover, position)
             VALUES ($1, $2, $3, $4, $5)`,
            [propUuid, img.url, img.altText, img.isCover, img.position]
          )
        }

        // Seed amenities
        for (const am of p.amenities) {
          const amRes = await appPool.query(
            `INSERT INTO amenities (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
            [am]
          )
          const amId = amRes.rows[0].id
          await appPool.query(
            `INSERT INTO property_amenities (property_id, amenity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [propUuid, amId]
          )
        }
      }

      // 3. Seed coupons
      for (const c of luxuryStore.coupons) {
        await appPool.query(
          `INSERT INTO coupons (code, discount_type, amount, active)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO NOTHING`,
          [c.code, c.discountType, c.amount, c.active]
        )
      }

      console.log('✓ Initial luxury catalog seeded into PostgreSQL.')
    } else {
      console.log(`✓ PostgreSQL database contains ${propertyCount} properties.`)
    }

    return appPool
  } catch (err: any) {
    console.error('❌ PostgreSQL setup failed:', err.message)
    throw err
  }
}

// Auto-run if executed directly
if (process.argv[1]?.includes('setupDb')) {
  ensureDatabaseAndMigrate()
    .then(() => {
      console.log('🚀 Database setup finished!')
      process.exit(0)
    })
    .catch(err => {
      console.error('Database setup error:', err)
      process.exit(1)
    })
}
