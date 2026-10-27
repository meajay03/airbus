import { Pool } from 'pg'
import { config } from '../config/index.js'
import { Property, Booking, CleaningTask, MaintenanceTask, Coupon, AuditLog } from './store.js'

export const pool = new Pool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  port: config.db.port,
  database: config.db.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err)
})

export class PostgresRepository {
  // Query helper
  static async query(text: string, params?: any[]) {
    return pool.query(text, params)
  }

  // --- PROPERTIES ---
  static async getProperties(filters?: {
    destination?: string
    guests?: number
    category?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
    status?: string
    includeAll?: boolean
  }): Promise<Property[]> {
    let sql = `
      SELECT p.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', pm.id::text,
            'url', pm.url,
            'altText', pm.alt_text,
            'isCover', pm.is_cover,
            'position', pm.position
          )) FILTER (WHERE pm.id IS NOT NULL), '[]'
        ) as images,
        COALESCE(
          json_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL), '[]'
        ) as amenities
      FROM properties p
      LEFT JOIN property_media pm ON p.id = pm.property_id
      LEFT JOIN property_amenities pa ON p.id = pa.property_id
      LEFT JOIN amenities a ON pa.amenity_id = a.id
      WHERE 1=1
    `
    const params: any[] = []
    let pIdx = 1

    if (!filters?.includeAll) {
      sql += ` AND p.status = $${pIdx++}`
      params.push(filters?.status || 'published')
    }

    if (filters?.destination && filters.destination.trim() !== '') {
      sql += ` AND (LOWER(p.name) LIKE $${pIdx} OR LOWER(p.city) LIKE $${pIdx} OR LOWER(p.region) LIKE $${pIdx})`
      params.push(`%${filters.destination.toLowerCase().trim()}%`)
      pIdx++
    }

    if (filters?.guests) {
      sql += ` AND p.max_guests >= $${pIdx++}`
      params.push(Number(filters.guests))
    }

    if (filters?.category && filters.category !== 'All stays' && filters.category !== 'All') {
      sql += ` AND LOWER(p.category) = $${pIdx++}`
      params.push(filters.category.toLowerCase())
    }

    if (filters?.minPrice) {
      sql += ` AND p.base_nightly_price >= $${pIdx++}`
      params.push(Number(filters.minPrice))
    }

    if (filters?.maxPrice) {
      sql += ` AND p.base_nightly_price <= $${pIdx++}`
      params.push(Number(filters.maxPrice))
    }

    sql += ` GROUP BY p.id`

    if (filters?.sort === 'price_asc') {
      sql += ` ORDER BY p.base_nightly_price ASC`
    } else if (filters?.sort === 'price_desc') {
      sql += ` ORDER BY p.base_nightly_price DESC`
    } else if (filters?.sort === 'rating') {
      sql += ` ORDER BY p.average_rating DESC NULLS LAST`
    } else {
      sql += ` ORDER BY p.is_featured DESC, p.created_at DESC`
    }

    const res = await pool.query(sql, params)
    return res.rows.map(this.mapRowToProperty)
  }

  static async getPropertyByIdOrSlug(idOrSlug: string): Promise<Property | null> {
    const sql = `
      SELECT p.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', pm.id::text,
            'url', pm.url,
            'altText', pm.alt_text,
            'isCover', pm.is_cover,
            'position', pm.position
          )) FILTER (WHERE pm.id IS NOT NULL), '[]'
        ) as images,
        COALESCE(
          json_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL), '[]'
        ) as amenities
      FROM properties p
      LEFT JOIN property_media pm ON p.id = pm.property_id
      LEFT JOIN property_amenities pa ON p.id = pa.property_id
      LEFT JOIN amenities a ON pa.amenity_id = a.id
      WHERE p.id::text = $1 OR p.slug = $1
      GROUP BY p.id
    `
    const res = await pool.query(sql, [idOrSlug])
    if (res.rows.length === 0) return null
    return this.mapRowToProperty(res.rows[0])
  }

  static async createProperty(prop: Partial<Property>): Promise<Property> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const slug = prop.slug || (prop.name || 'luxury-stay').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)
      const insertPropSql = `
        INSERT INTO properties (
          name, slug, tagline, description, city, region, country,
          accommodation_type, category, max_guests, bedrooms, bathrooms,
          base_nightly_price, cleaning_fee, currency, status, management_model,
          average_rating, is_featured, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
        RETURNING *
      `
      const propRes = await client.query(insertPropSql, [
        prop.name || 'Untitled Villa',
        slug,
        prop.tagline || 'Exclusive sanctuary curated by Maison Véla',
        prop.description || '',
        prop.city || 'Goa',
        prop.region || 'Goa',
        prop.country || 'India',
        prop.accommodationType || 'Luxury Villa',
        prop.category || 'Private Pool Villas',
        Number(prop.maxGuests || 6),
        Number(prop.bedrooms || 3),
        Number(prop.bathrooms || 3),
        Number(prop.baseNightlyPrice || 45000),
        Number(prop.cleaningFee || 3500),
        prop.currency || 'INR',
        prop.status || 'submitted',
        prop.managementModel || 'managed',
        4.95,
        false
      ])

      const newProp = propRes.rows[0]

      // Insert media
      if (prop.images && prop.images.length > 0) {
        for (let i = 0; i < prop.images.length; i++) {
          const img = prop.images[i]
          await client.query(
            `INSERT INTO property_media (property_id, url, alt_text, is_cover, position)
             VALUES ($1, $2, $3, $4, $5)`,
            [newProp.id, img.url, img.altText || newProp.name, i === 0, i]
          )
        }
      }

      // Insert amenities
      if (prop.amenities && prop.amenities.length > 0) {
        for (const am of prop.amenities) {
          const amRes = await client.query(
            `INSERT INTO amenities (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
            [am]
          )
          await client.query(
            `INSERT INTO property_amenities (property_id, amenity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newProp.id, amRes.rows[0].id]
          )
        }
      }

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4)`,
        ['SUBMIT_PROPERTY', 'PROPERTY', newProp.id, JSON.stringify({ name: newProp.name, model: newProp.management_model })]
      )

      await client.query('COMMIT')
      return (await this.getPropertyByIdOrSlug(newProp.id))!
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  static async updatePropertyStatus(id: string, status: string, remarks?: string): Promise<Property | null> {
    const res = await pool.query(
      `UPDATE properties SET status = $1, updated_at = NOW() WHERE id::text = $2 OR slug = $2 RETURNING *`,
      [status, id]
    )
    if (res.rows.length === 0) return null

    await pool.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4)`,
      ['UPDATE_PROPERTY_STATUS', 'PROPERTY', res.rows[0].id, JSON.stringify({ status, remarks })]
    )

    return (await this.getPropertyByIdOrSlug(res.rows[0].id))!
  }

  // --- BOOKINGS ---
  static async getBookings(filters?: { guestId?: string; propertyId?: string }): Promise<Booking[]> {
    let sql = `
      SELECT b.*,
        p.name as property_name,
        p.city as property_city,
        p.region as property_region,
        pm.url as property_image,
        pb.accommodation, pb.cleaning, pb.guest_fee, pb.taxes, pb.discounts
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      LEFT JOIN property_media pm ON p.id = pm.property_id AND pm.is_cover = true
      LEFT JOIN booking_price_breakdowns pb ON b.id = pb.booking_id
      WHERE 1=1
    `
    const params: any[] = []
    if (filters?.propertyId) {
      sql += ` AND (b.property_id::text = $1 OR p.slug = $1)`
      params.push(filters.propertyId)
    }
    sql += ` ORDER BY b.created_at DESC`

    const res = await pool.query(sql, params)
    return res.rows.map(r => ({
      id: r.id,
      reference: r.reference,
      propertyId: r.property_id,
      propertyName: r.property_name,
      propertyCity: r.property_city,
      propertyRegion: r.property_region,
      propertyImage: r.property_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
      propertyCoverImage: r.property_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
      guestId: r.guest_id,
      guestName: 'Aarav Singhania',
      guestEmail: 'guest@maisonvela.com',
      guestPhone: '+91 98200 12345',
      checkIn: r.check_in instanceof Date ? r.check_in.toISOString().split('T')[0] : String(r.check_in),
      checkOut: r.check_out instanceof Date ? r.check_out.toISOString().split('T')[0] : String(r.check_out),
      guests: r.guests,
      status: r.status,
      currency: r.currency,
      priceBreakdown: {
        nights: Math.max(1, Math.round((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / (1000 * 60 * 60 * 24))),
        nightlyRate: Math.round(Number(r.accommodation) / Math.max(1, Math.round((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / (1000 * 60 * 60 * 24)))),
        accommodationTotal: Number(r.accommodation),
        cleaningFee: Number(r.cleaning || 0),
        guestServiceFee: Number(r.guest_fee || 0),
        taxes: Number(r.taxes || 0),
        discountAmount: Number(r.discounts || 0),
        grossTotal: Number(r.gross_total),
        currency: r.currency
      },
      paymentMethod: 'Razorpay (Cards & UPI)',
      paymentTransactionId: 'tx_pg_' + r.id,
      idempotencyKey: 'idem-' + r.id,
      conciergeServicesBooked: [],
      createdAt: r.created_at.toISOString()
    }))
  }

  static async getBookingById(id: string): Promise<Booking | null> {
    const list = await this.getBookings()
    return list.find(b => b.id === id || b.reference === id) || null
  }

  static async createBooking(data: {
    propertyId: string
    guestName: string
    guestEmail: string
    guestPhone?: string
    checkIn: string
    checkOut: string
    guests: number
    grossTotal: number
    priceBreakdown: any
    paymentMethod?: string
    idempotencyKey: string
    conciergeServicesBooked?: string[]
  }): Promise<Booking> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Resolve property
      const pRes = await client.query(
        `SELECT id, name, city, region FROM properties WHERE id::text = $1 OR slug = $1`,
        [data.propertyId]
      )
      if (pRes.rows.length === 0) throw new Error('Property not found for booking')
      const property = pRes.rows[0]

      // 2. Check for date overlap (Double Booking Prevention Transaction)
      const conflictRes = await client.query(
        `SELECT id FROM bookings
         WHERE property_id = $1
           AND status IN ('confirmed', 'pending_payment')
           AND check_in < $3 AND check_out > $2
         FOR UPDATE`,
        [property.id, data.checkIn, data.checkOut]
      )
      if (conflictRes.rows.length > 0) {
        throw new Error('These dates are already reserved for this property. Please choose alternative dates.')
      }

      // 3. Resolve or create user
      const uRes = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [data.guestEmail]
      )
      let guestId = uRes.rows[0]?.id
      if (!guestId) {
        const newU = await client.query(
          `INSERT INTO users (email, password_hash, full_name, phone, status)
           VALUES ($1, 'guest_auto_hash', $2, $3, 'active') RETURNING id`,
          [data.guestEmail, data.guestName, data.guestPhone || '']
        )
        guestId = newU.rows[0].id
      }

      // 4. Generate reference MV-YEAR-XXXX
      const ref = `MV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

      // 5. Insert Booking
      const bRes = await client.query(
        `INSERT INTO bookings (
           reference, property_id, guest_id, check_in, check_out, guests,
           status, currency, gross_total
         ) VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', 'INR', $7)
         RETURNING *`,
        [ref, property.id, guestId, data.checkIn, data.checkOut, data.guests, data.grossTotal]
      )
      const booking = bRes.rows[0]

      // 6. Insert price breakdown
      const pb = data.priceBreakdown
      const taxAmount = pb.taxes ?? (pb as any).taxGst ?? 0
      const discountVal = pb.discountAmount ?? 0
      await client.query(
        `INSERT INTO booking_price_breakdowns (
           booking_id, accommodation, cleaning, guest_fee, taxes, discounts, currency
         ) VALUES ($1, $2, $3, $4, $5, $6, 'INR')`,
        [booking.id, pb.accommodationTotal, pb.cleaningFee, pb.guestServiceFee, taxAmount, discountVal]
      )

      // 7. Schedule Housekeeping Turnover Task
      await client.query(
        `INSERT INTO cleaning_tasks (
           property_id, booking_id, due_at, status, checklist
         ) VALUES ($1, $2, $3, 'open', $4)`,
        [
          property.id,
          booking.id,
          data.checkIn,
          JSON.stringify([
            { task: 'Steam sanitize 400-thread count Egyptian cotton linens', done: false },
            { task: 'Pool chlorination and surface skimming', done: false },
            { task: 'Pre-stock cellar with guest requested artisanal spirits', done: false },
            { task: 'Fresh garden frangipani floral urn arrangement in foyer', done: false },
            { task: 'Air purification cycle in all guest suites', done: false }
          ])
        ]
      )

      // 8. Audit log
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [guestId, 'CREATE_BOOKING', 'BOOKING', booking.id, JSON.stringify({ reference: ref, total: data.grossTotal })]
      )

      await client.query('COMMIT')

      const [resObj] = await this.getBookings({ propertyId: property.id })
      return resObj
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  static async cancelBooking(bookingId: string, reason?: string) {
    const res = await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id::text = $1 OR reference = $1 RETURNING *`,
      [bookingId]
    )
    if (res.rows.length === 0) throw new Error('Booking not found')

    await pool.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4)`,
      ['CANCEL_BOOKING', 'BOOKING', res.rows[0].id, JSON.stringify({ reason: reason || 'Guest requested cancellation' })]
    )

    return res.rows[0]
  }

  // --- TASKS & AUDIT ---
  static async getCleaningTasks(): Promise<CleaningTask[]> {
    const res = await pool.query(`
      SELECT ct.*, p.name as property_name, b.reference as booking_reference
      FROM cleaning_tasks ct
      JOIN properties p ON ct.property_id = p.id
      LEFT JOIN bookings b ON ct.booking_id = b.id
      ORDER BY ct.due_at ASC
    `)
    return res.rows.map(r => ({
      id: r.id,
      propertyId: r.property_id,
      propertyName: r.property_name,
      bookingReference: r.booking_reference,
      assignedTo: 'Devika Mehra (Head Housekeeper)',
      dueAt: r.due_at ? r.due_at.toISOString() : new Date().toISOString(),
      status: r.status === 'open' ? 'pending' : (r.status as any),
      checklist: Array.isArray(r.checklist) ? r.checklist : JSON.parse(r.checklist || '[]')
    }))
  }

  static async updateCleaningTask(id: string, checklist: { task: string; done: boolean }[]) {
    const isAllDone = checklist.every(c => c.done)
    const status = isAllDone ? 'completed' : 'in_progress'
    await pool.query(
      `UPDATE cleaning_tasks SET checklist = $1, status = $2 WHERE id::text = $3`,
      [JSON.stringify(checklist), status, id]
    )
  }

  static async getMaintenanceTasks(): Promise<MaintenanceTask[]> {
    const res = await pool.query(`
      SELECT mt.*, p.name as property_name
      FROM maintenance_tasks mt
      JOIN properties p ON mt.property_id = p.id
      ORDER BY mt.created_at DESC
    `)
    return res.rows.map(r => ({
      id: r.id,
      propertyId: r.property_id,
      propertyName: r.property_name,
      reportedBy: 'Devika Mehra (Operations)',
      assignedTo: 'Estate Engineering Team',
      description: r.description,
      priority: r.priority,
      status: r.status,
      costEstimate: 6500,
      createdAt: r.created_at.toISOString()
    }))
  }

  static async createMaintenanceTask(data: Partial<MaintenanceTask>): Promise<any> {
    const pRes = await pool.query(
      `SELECT id FROM properties WHERE name = $1 OR id::text = $1 LIMIT 1`,
      [data.propertyName || 'Casa Serena']
    )
    const propId = pRes.rows[0]?.id || (await pool.query(`SELECT id FROM properties LIMIT 1`)).rows[0].id

    const res = await pool.query(
      `INSERT INTO maintenance_tasks (property_id, description, priority, status)
       VALUES ($1, $2, $3, 'open') RETURNING *`,
      [propId, data.description || 'Routine service', data.priority || 'normal']
    )
    return res.rows[0]
  }

  static async getCoupons(): Promise<Coupon[]> {
    const res = await pool.query(`SELECT * FROM coupons WHERE active = true ORDER BY amount DESC`)
    return res.rows.map(r => ({
      code: r.code,
      discountType: r.discount_type,
      amount: Number(r.amount),
      active: r.active
    }))
  }

  static async createCoupon(code: string, discountType: string, amount: number) {
    const res = await pool.query(
      `INSERT INTO coupons (code, discount_type, amount, active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (code) DO UPDATE SET amount = EXCLUDED.amount, active = true
       RETURNING *`,
      [code.toUpperCase(), discountType, amount]
    )
    return res.rows[0]
  }

  static async getAuditLogs(): Promise<AuditLog[]> {
    const res = await pool.query(`
      SELECT al.*, COALESCE(u.full_name, 'System Administrator') as actor_name
      FROM audit_logs al
      LEFT JOIN users u ON al.actor_id = u.id
      ORDER BY al.created_at DESC LIMIT 50
    `)
    return res.rows.map(r => ({
      id: r.id,
      actorId: r.actor_id || 'usr-admin-01',
      actorName: r.actor_name,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id || '',
      details: typeof r.details === 'string' ? r.details : JSON.stringify(r.details),
      timestamp: r.created_at.toISOString()
    }))
  }

  // --- HOTEL ROOM TYPES & INVENTORY ---
  static async getRoomTypes(propertyId: string): Promise<any[]> {
    try {
      const res = await pool.query(
        `SELECT rt.*,
                COALESCE(
                  (SELECT json_agg(json_build_object('id', rp.id, 'name', rp.name, 'mealPlan', rp.meal_plan, 'cancellationPolicy', rp.cancellation_policy, 'rateMultiplier', rp.rate_multiplier))
                   FROM rate_plans rp WHERE rp.room_type_id = rt.id AND rp.is_active = true),
                  '[]'
                ) as rate_plans
         FROM room_types rt
         WHERE rt.property_id::text = $1 OR rt.property_id IN (SELECT id FROM properties WHERE slug = $1)
         ORDER BY rt.base_nightly_rate ASC`,
        [propertyId]
      )
      return res.rows.map(r => ({
        id: r.id,
        propertyId: r.property_id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        maxOccupancy: r.max_occupancy,
        adultsCapacity: r.adults_capacity,
        childrenCapacity: r.children_capacity,
        totalInventory: r.total_inventory,
        baseNightlyRate: Number(r.base_nightly_rate),
        weekendNightlyRate: r.weekend_nightly_rate ? Number(r.weekend_nightly_rate) : null,
        bedConfiguration: r.bed_configuration,
        roomSizeSqft: r.room_size_sqft,
        amenities: r.amenities || [],
        photos: r.photos || [],
        ratePlans: r.rate_plans || [],
        isActive: r.is_active
      }))
    } catch {
      return []
    }
  }

  static async createRoomType(propertyIdOrData: string | any, maybeData?: any): Promise<any> {
    const propertyId = typeof propertyIdOrData === 'string' ? propertyIdOrData : propertyIdOrData.propertyId
    const data = typeof propertyIdOrData === 'string' ? (maybeData || {}) : propertyIdOrData
    const slug = (data.name || 'room').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)
    const baseRate = Number(data.baseNightlyRate || data.baseRate) || 25000
    const inventory = Number(data.totalInventory || data.inventoryCount) || 5

    const res = await pool.query(
      `INSERT INTO room_types (
        property_id, name, slug, description, max_occupancy, adults_capacity,
        children_capacity, total_inventory, base_nightly_rate, weekend_nightly_rate,
        bed_configuration, room_size_sqft, amenities, photos
      )
      SELECT
        p.id, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      FROM properties p
      WHERE p.id::text = $1 OR p.slug = $1
      RETURNING *`,
      [
        propertyId,
        data.name,
        slug,
        data.description || '',
        Number(data.maxOccupancy) || 2,
        Number(data.adultsCapacity) || 2,
        Number(data.childrenCapacity) || 1,
        inventory,
        baseRate,
        data.weekendNightlyRate ? Number(data.weekendNightlyRate) : null,
        data.bedConfiguration || '1 King Bed',
        Number(data.roomSizeSqft) || 450,
        JSON.stringify(data.amenities || ['Ensuite marble bath', 'Ocean view private balcony']),
        JSON.stringify(data.photos || [])
      ]
    )
    return res.rows[0]
  }

  // --- INVENTORY HOLDS (Expiring temporary checkout holds) ---
  static async createInventoryHold(data: {
    propertyId: string
    roomTypeId?: string
    sessionId: string
    checkIn: string
    checkOut: string
    quantity?: number
    expiresMinutes?: number
  }): Promise<{ holdId: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + (data.expiresMinutes || 15) * 60 * 1000)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      // Clean up expired holds
      await client.query(`UPDATE inventory_holds SET status = 'expired' WHERE status = 'held' AND expires_at < now()`)

      const res = await client.query(
        `INSERT INTO inventory_holds (
          property_id, room_type_id, session_id, check_in, check_out, quantity, expires_at, status
        )
        SELECT
          p.id, $2, $3, $4, $5, $6, $7, 'held'
        FROM properties p
        WHERE p.id::text = $1 OR p.slug = $1
        RETURNING id, expires_at`,
        [
          data.propertyId,
          data.roomTypeId || null,
          data.sessionId,
          data.checkIn,
          data.checkOut,
          data.quantity || 1,
          expiresAt
        ]
      )
      await client.query('COMMIT')
      return { holdId: res.rows[0]?.id, expiresAt }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  // --- FINANCIAL LEDGER (Double-Entry Audit) ---
  static async recordLedgerEntry(entry: {
    bookingId?: string
    transactionType: string
    entryType: 'debit' | 'credit'
    amount: number
    currency?: string
    accountName: string
    description: string
    referenceId?: string
    metadata?: any
  }): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO financial_ledger_entries (
          booking_id, transaction_type, entry_type, amount, currency, account_name, description, reference_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          entry.bookingId || null,
          entry.transactionType,
          entry.entryType,
          entry.amount,
          entry.currency || 'INR',
          entry.accountName,
          entry.description,
          entry.referenceId || null,
          JSON.stringify(entry.metadata || {})
        ]
      )
    } catch (err: any) {
      console.warn('PostgreSQL ledger write fallback:', err.message)
    }
  }

  // --- USERS & LEDGER (Admin Oversight) ---
  static async getUsers(filters?: { role?: string; status?: string; search?: string }): Promise<any[]> {
    try {
      let sql = `
        SELECT u.id, u.email, u.full_name as "fullName", u.phone, u.status, u.created_at as "createdAt",
               COALESCE(
                 (SELECT r2.name FROM user_roles ur2 JOIN roles r2 ON ur2.role_id = r2.id WHERE ur2.user_id = u.id LIMIT 1),
                 'guest'
               ) as role,
               COALESCE(
                 (SELECT json_agg(r3.name) FROM user_roles ur3 JOIN roles r3 ON ur3.role_id = r3.id WHERE ur3.user_id = u.id),
                 '["guest"]'::json
               ) as roles,
               (SELECT count(*)::int FROM bookings b WHERE b.guest_id = u.id) as "bookingCount",
               COALESCE((SELECT sum(b.gross_total) FROM bookings b WHERE b.guest_id = u.id), 0)::numeric as "bookingValue"
        FROM users u
        WHERE 1=1
      `
      const params: any[] = []
      let idx = 1
      if (filters?.status) {
        sql += ` AND u.status = $${idx++}`
        params.push(filters.status)
      }
      if (filters?.search) {
        sql += ` AND (LOWER(u.full_name) LIKE $${idx} OR LOWER(u.email) LIKE $${idx})`
        params.push(`%${filters.search.toLowerCase()}%`)
        idx++
      }
      sql += ` ORDER BY u.created_at DESC`
      const res = await pool.query(sql, params)
      return res.rows
    } catch (err: any) {
      console.warn('getUsers query fallback:', err.message)
      return []
    }
  }

  static async updateUserStatus(userId: string, status: string, reason?: string, actorId?: string): Promise<boolean> {
    try {
      await pool.query(`UPDATE users SET status = $1, updated_at = NOW() WHERE id::text = $2`, [status, userId])
      if (actorId) {
        await pool.query(
          `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
           VALUES ($1, $2, 'user', $3, $4)`,
          [actorId, status === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED', userId, JSON.stringify({ reason: reason || 'Admin action' })]
        )
      }
      return true
    } catch {
      return false
    }
  }

  static async assignUserRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const roleRes = await pool.query(`SELECT id FROM roles WHERE name = $1`, [roleName])
      if (roleRes.rows.length === 0) return false
      const roleId = roleRes.rows[0].id
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, roleId]
      )
      return true
    } catch {
      return false
    }
  }

  static async revokeUserSessions(userId: string): Promise<boolean> {
    try {
      await pool.query(`DELETE FROM user_sessions WHERE user_id::text = $1`, [userId])
      return true
    } catch {
      return false
    }
  }

  static async getLedgerEntries(): Promise<any[]> {
    try {
      const res = await pool.query(
        `SELECT l.*, b.reference as booking_reference, p.name as property_name
         FROM financial_ledger_entries l
         LEFT JOIN bookings b ON l.booking_id = b.id
         LEFT JOIN properties p ON b.property_id = p.id
         ORDER BY l.created_at DESC
         LIMIT 60`
      )
      return res.rows
    } catch {
      return []
    }
  }

  // Helper row mapper
  private static mapRowToProperty(r: any): Property {
    return {
      id: r.id,
      ownerId: r.owner_id || 'usr-owner-01',
      slug: r.slug || r.id,
      name: r.name,
      tagline: r.tagline || 'Exclusive sanctuary curated by Maison Véla',
      description: r.description,
      city: r.city,
      region: r.region,
      country: r.country,
      address: `${r.city}, ${r.region}, ${r.country}`,
      coordinates: { lat: 15.584, lng: 73.778 },
      accommodationType: r.accommodation_type,
      category: r.category || 'Private Pool Villas',
      maxGuests: r.max_guests,
      bedrooms: r.bedrooms,
      bathrooms: Number(r.bathrooms),
      baseNightlyPrice: Number(r.base_nightly_price),
      cleaningFee: Number(r.cleaning_fee || 3500),
      currency: r.currency || 'INR',
      status: r.status,
      managementModel: r.management_model,
      averageRating: Number(r.average_rating || 4.95),
      reviewCount: 14,
      isFeatured: r.is_featured,
      isVerified: true,
      instantBookable: true,
      amenities: Array.isArray(r.amenities) ? r.amenities : [],
      images: Array.isArray(r.images) && r.images.length > 0
        ? r.images
        : [
            {
              id: 'img-1',
              url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
              altText: r.name,
              isCover: true,
              position: 0
            }
          ],
      houseRules: [
        'Check-in: 2:00 PM onwards · Check-out: 11:00 AM',
        'Valid government ID required for all staying guests upon arrival',
        'Carefully curbed noise levels in outdoor garden areas after 10:00 PM',
        'Private pool depth 4.5 ft — children require adult supervision at all times'
      ],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Moderate',
      minStayNights: 2,
      hostName: 'Maharaja Vikramaditya Estate',
      hostType: r.management_model === 'managed' ? 'Fully Serviced Luxury Estate' : 'Distinguished Host',
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString()
    }
  }
}
