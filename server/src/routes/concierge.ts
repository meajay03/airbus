import { Router, Request, Response } from 'express'
import { luxuryStore } from '../db/store.js'

export const conciergeRouter = Router()

// GET /api/concierge/services
conciergeRouter.get('/services', (_req: Request, res: Response) => {
  res.json({ services: luxuryStore.conciergeServices })
})

// POST /api/concierge/requests
conciergeRouter.post('/requests', (req: Request, res: Response) => {
  const { bookingReference, serviceId, preferredDate, specialInstructions, guestName } = req.body

  const service = luxuryStore.conciergeServices.find(s => s.id === serviceId)
  if (!service) {
    return res.status(404).json({ error: 'Concierge service not found' })
  }

  // Find booking if provided
  if (bookingReference) {
    const booking = luxuryStore.bookings.find(b => b.reference === bookingReference)
    if (booking && !booking.conciergeServicesBooked.includes(service.title)) {
      booking.conciergeServicesBooked.push(service.title)
    }
  }

  const note = specialInstructions ? ` (Special note: ${specialInstructions})` : ''

  // Audit log
  luxuryStore.auditLogs.unshift({
    id: `log-${Date.now()}`,
    actorId: 'usr-guest-01',
    actorName: guestName || 'Guest Requester',
    action: 'CONCIERGE_REQUEST',
    entityType: 'SERVICE_REQUEST',
    entityId: serviceId,
    details: `Booked concierge: ${service.title} for Ref ${bookingReference || 'General Inquiry'} on ${preferredDate || 'flexible dates'}.${note}`,
    timestamp: new Date().toISOString()
  })

  res.status(201).json({
    message: `Your request for ${service.title} has been received by Maison Véla Concierge.`,
    requestId: `req-cnr-${Date.now()}`,
    service
  })
})
