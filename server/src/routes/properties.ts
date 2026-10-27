import { Router, Request, Response } from 'express'
import { luxuryStore, Property } from '../db/store.js'
import { PostgresRepository } from '../db/postgres.js'
import { requirePermission, requireResourceAccess } from '../middleware/auth.js'

export const propertiesRouter = Router()

// GET /api/properties - with search, filtering, and sorting
propertiesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      destination,
      guests,
      category,
      minPrice,
      maxPrice,
      sort,
      status = 'published',
      includeAll = 'false'
    } = req.query

    let list: Property[] = []

    try {
      list = await PostgresRepository.getProperties({
        destination: typeof destination === 'string' ? destination : undefined,
        guests: guests ? Number(guests) : undefined,
        category: typeof category === 'string' ? category : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort: typeof sort === 'string' ? sort : undefined,
        status: typeof status === 'string' ? status : 'published',
        includeAll: includeAll === 'true'
      })
    } catch (pgErr) {
      console.warn('PostgreSQL query fallback to in-memory store:', (pgErr as any)?.message)
      list = [...luxuryStore.properties]
      if (includeAll !== 'true') {
        list = list.filter(p => p.status === (status as string))
      }
    }

    const destinations = Array.from(new Set(list.map(p => `${p.city}, ${p.region}`)))

    res.json({
      data: list,
      total: list.length,
      destinations,
      categories: ['All stays', 'Private Pool Villas', 'Beachfront Estates', 'Mountain Retreats', 'Royal Residences', 'Urban Penthouses']
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch properties' })
  }
})

// GET /api/properties/:slugOrId
propertiesRouter.get('/:slugOrId', async (req: Request, res: Response) => {
  try {
    const slugOrId = Array.isArray(req.params.slugOrId) ? req.params.slugOrId[0] : req.params.slugOrId
    let property: Property | null = null

    try {
      property = await PostgresRepository.getPropertyByIdOrSlug(slugOrId)
    } catch {
      // fallback
    }

    if (!property) {
      property = luxuryStore.properties.find(p => p.slug === slugOrId || p.id === slugOrId) || null
    }

    if (!property) {
      return res.status(404).json({ error: 'Property not found' })
    }

    // Get reviews
    const reviews = luxuryStore.reviews.filter(r => r.propertyId === property!.id && r.status === 'approved')

    // Similar properties
    let allProps: Property[] = []
    try {
      allProps = await PostgresRepository.getProperties({ status: 'published' })
    } catch {
      allProps = luxuryStore.properties
    }

    const similar = allProps
      .filter(p => p.id !== property!.id && (p.category === property!.category || p.region === property!.region))
      .slice(0, 3)

    res.json({
      property,
      reviews,
      similar
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch property details' })
  }
})

// POST /api/properties (Owner listing submission)
propertiesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body
    if (!body.name || !body.city || !body.baseNightlyPrice) {
      return res.status(400).json({ error: 'Property name, city, and nightly rate are required' })
    }

    let createdProp: Property

    try {
      createdProp = await PostgresRepository.createProperty({
        name: body.name,
        tagline: body.tagline,
        description: body.description,
        city: body.city,
        region: body.region || body.city,
        country: body.country || 'India',
        accommodationType: body.accommodationType || 'Luxury Villa',
        category: body.category || 'Private Pool Villas',
        maxGuests: Number(body.maxGuests) || 6,
        bedrooms: Number(body.bedrooms) || 3,
        bathrooms: Number(body.bathrooms) || 3,
        baseNightlyPrice: Number(body.baseNightlyPrice),
        cleaningFee: Number(body.cleaningFee) || 3500,
        currency: 'INR',
        status: body.submitForReview ? 'under_review' : 'submitted',
        managementModel: body.managementModel || 'managed',
        amenities: body.amenities || ['Private pool', 'High-speed Wi-Fi', 'Housekeeping'],
        images: body.images && body.images.length > 0 ? body.images : [
          {
            id: `img-${Date.now()}`,
            url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
            altText: body.name,
            isCover: true,
            position: 0
          }
        ]
      })
    } catch (pgErr) {
      console.warn('PostgreSQL insert fallback:', (pgErr as any)?.message)
      const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)
      createdProp = {
        id: `prop-${Date.now()}`,
        ownerId: body.ownerId || 'usr-owner-01',
        slug,
        name: body.name,
        tagline: body.tagline || 'Exquisite private sanctuary',
        description: body.description || '',
        city: body.city,
        region: body.region || body.city,
        country: 'India',
        address: `${body.city}, India`,
        coordinates: { lat: 15.584, lng: 73.778 },
        accommodationType: body.accommodationType || 'Luxury Villa',
        category: body.category || 'Private Pool Villas',
        maxGuests: Number(body.maxGuests) || 6,
        bedrooms: Number(body.bedrooms) || 3,
        bathrooms: Number(body.bathrooms) || 3,
        baseNightlyPrice: Number(body.baseNightlyPrice),
        cleaningFee: Number(body.cleaningFee) || 3500,
        currency: 'INR',
        status: body.submitForReview ? 'under_review' : 'submitted',
        managementModel: body.managementModel || 'managed',
        averageRating: 5.0,
        reviewCount: 0,
        isFeatured: false,
        isVerified: false,
        instantBookable: true,
        amenities: body.amenities || ['Private lap pool', 'High-speed Wi-Fi'],
        images: body.images || [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85', altText: body.name, isCover: true, position: 0 }],
        houseRules: ['Check-in 2 PM, check-out 11 AM'],
        checkInTime: '14:00',
        checkOutTime: '11:00',
        cancellationPolicy: 'Moderate',
        minStayNights: 2,
        hostName: 'Maharaja Vikramaditya Estate',
        hostType: 'Managed Partner',
        createdAt: new Date().toISOString()
      }
    }

    luxuryStore.properties.unshift(createdProp)
    res.status(201).json({ message: 'Property submitted successfully', property: createdProp })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit property' })
  }
})

// PATCH /api/properties/:id/status (Approval, rejection, publishing — requires properties.publish)
propertiesRouter.patch('/:id/status', requirePermission('properties.publish'), async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const { status, remarks } = req.body

    let updated: Property | null = null
    try {
      updated = await PostgresRepository.updatePropertyStatus(id, status, remarks)
    } catch {
      // fallback
    }

    const inMem = luxuryStore.properties.find(p => p.id === id || p.slug === id)
    if (inMem) {
      inMem.status = status as any
      if (status === 'approved' || status === 'published') inMem.isVerified = true
    }

    if (!updated && !inMem) {
      return res.status(404).json({ error: 'Property not found' })
    }

    res.json({ message: `Property status updated to ${status}`, property: updated || inMem })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update property status' })
  }
})

// PATCH /api/properties/:id (Host / Property Manager estate content update — enforces resource ownership)
propertiesRouter.patch('/:id', requireResourceAccess('property'), async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const updates = req.body
    const inMem = luxuryStore.properties.find(p => p.id === id || p.slug === id)
    if (inMem) {
      Object.assign(inMem, updates)
    }
    res.json({ message: 'Property updated successfully', property: inMem })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update property' })
  }
})

// GET /api/properties/:id/room-types
propertiesRouter.get('/:id/room-types', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const roomTypes = await PostgresRepository.getRoomTypes(id)
    res.json({ roomTypes })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch room types' })
  }
})

// POST /api/properties/:id/room-types (Requires ownership or assigned manager access)
propertiesRouter.post('/:id/room-types', requireResourceAccess('property'), async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const body = req.body
    if (!body.name || !body.baseNightlyRate) {
      return res.status(400).json({ error: 'Room type name and base rate are required' })
    }
    const created = await PostgresRepository.createRoomType(id, body)
    res.status(201).json({ message: 'Room type created successfully', roomType: created })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create room type' })
  }
})

// POST /api/properties/inventory/holds (Temporary 15-minute transactional hold)
propertiesRouter.post('/inventory/holds', async (req: Request, res: Response) => {
  try {
    const { propertyId, roomTypeId, sessionId, checkIn, checkOut, quantity } = req.body
    if (!propertyId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Property ID, check-in, and check-out dates are required' })
    }
    const hold = await PostgresRepository.createInventoryHold({
      propertyId,
      roomTypeId,
      sessionId: sessionId || `sess_${Date.now()}`,
      checkIn,
      checkOut,
      quantity: quantity || 1
    })
    res.status(201).json({
      message: 'Inventory held successfully for checkout',
      holdId: hold.holdId,
      expiresAt: hold.expiresAt
    })
  } catch (err: any) {
    res.status(409).json({ error: err.message || 'Failed to lock inventory. Dates may be unavailable.' })
  }
})
