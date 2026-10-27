import { Router, Request, Response } from 'express'
import { luxuryStore } from '../db/store.js'

export const aiRouter = Router()

// POST /api/ai/concierge - Natural language luxury travel assistant
aiRouter.post('/concierge', (req: Request, res: Response) => {
  const { prompt } = req.body
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' })
  }

  const query = prompt.toLowerCase()

  // Match destinations
  let matchedProperties = [...luxuryStore.properties.filter(p => p.status === 'published')]

  if (query.includes('goa')) {
    matchedProperties = matchedProperties.filter(p => p.region.toLowerCase() === 'goa')
  } else if (query.includes('udaipur') || query.includes('rajasthan')) {
    matchedProperties = matchedProperties.filter(p => p.city.toLowerCase() === 'udaipur' || p.region.toLowerCase() === 'rajasthan')
  } else if (query.includes('landour') || query.includes('mussoorie') || query.includes('uttarakhand')) {
    matchedProperties = matchedProperties.filter(p => p.city.toLowerCase() === 'landour')
  } else if (query.includes('coonoor') || query.includes('nilgiri') || query.includes('tamil nadu')) {
    matchedProperties = matchedProperties.filter(p => p.city.toLowerCase() === 'coonoor')
  } else if (query.includes('mumbai') || query.includes('bandra')) {
    matchedProperties = matchedProperties.filter(p => p.city.toLowerCase() === 'mumbai')
  } else if (query.includes('alibaug')) {
    matchedProperties = matchedProperties.filter(p => p.city.toLowerCase() === 'alibaug')
  }

  // Match guests / group size
  const guestMatch = query.match(/(\d+)\s*(guests?|people|persons?|adults?)/)
  if (guestMatch) {
    const requiredGuests = parseInt(guestMatch[1], 10)
    matchedProperties = matchedProperties.filter(p => p.maxGuests >= requiredGuests)
  }

  // Match features / amenities
  if (query.includes('pool')) {
    matchedProperties = matchedProperties.filter(p => p.amenities.some(a => a.toLowerCase().includes('pool')))
  }
  if (query.includes('chef') || query.includes('cook') || query.includes('food')) {
    matchedProperties = matchedProperties.filter(p => p.amenities.some(a => a.toLowerCase().includes('chef') || a.toLowerCase().includes('dining')))
  }
  if (query.includes('beach') || query.includes('sea') || query.includes('ocean')) {
    matchedProperties = matchedProperties.filter(p => p.category === 'Beachfront Estates' || p.amenities.some(a => a.toLowerCase().includes('beach') || a.toLowerCase().includes('sea')))
  }
  if (query.includes('mountain') || query.includes('hills')) {
    matchedProperties = matchedProperties.filter(p => p.category === 'Mountain Retreats')
  }

  // Fallback to top 2 if filter eliminated everything
  if (matchedProperties.length === 0) {
    matchedProperties = luxuryStore.properties.slice(0, 2)
  }

  const topPick = matchedProperties[0]

  // Suggested itinerary creation
  let itinerary: { day: string; title: string; activities: string[] }[] = []

  if (topPick.region.toLowerCase() === 'goa') {
    itinerary = [
      {
        day: 'Day 1: Arrival & Coastal Welcome',
        title: 'Assagao Afternoon & Private Sunset Barbeque',
        activities: [
          'VIP Chauffeur arrival transfer with chilled refreshments',
          'Check-in at ' + topPick.name + ' and private pool acclimation',
          'Welcome multi-course dinner crafted by your resident private chef'
        ]
      },
      {
        day: 'Day 2: Coastal Horizons & Catamaran',
        title: 'Chartered Sunset Cruise on the Arabian Sea',
        activities: [
          'Garden breakfast with fresh tropical fruits and artisanal pastries',
          'Private 3-hour sunset catamaran charter with sommelier wines',
          'Evening cocktail salon on your villa veranda'
        ]
      },
      {
        day: 'Day 3: Slower Living & Culinary Arts',
        title: 'Spice Plantation Visit & In-Villa Dining',
        activities: [
          'Heritage walk through colonial quarter with our private guide',
          'Afternoon poolside massage and Ayurvedic sound bath',
          'Farewell banquet with locally sourced seafood'
        ]
      }
    ]
  } else if (topPick.city.toLowerCase() === 'udaipur') {
    itinerary = [
      {
        day: 'Day 1: Royal Arrival',
        title: 'Mewar Heritage Welcome & Pichola Twilight',
        activities: [
          'Arrival transfer in a vintage luxury automobile',
          'Garland welcome and private courtyard jharokha high tea',
          'Royal Rajputana dinner prepared by resident khansama'
        ]
      },
      {
        day: 'Day 2: Palatial Splendours',
        title: 'Private Boat to Jagmandir & City Palace Tour',
        activities: [
          'Private boat access across Lake Pichola with historian guide',
          'Rooftop sunset sitar concert at Haveli Nilaya'
        ]
      }
    ]
  } else {
    itinerary = [
      {
        day: 'Day 1: Arrival & Sanctuary Welcome',
        title: 'Forest Welcome & Fireside Supper',
        activities: [
          'Scenic mountain transfer through alpine groves',
          'Check-in and afternoon tea by the stone fireplace',
          'Multi-course regional dinner served under the mountain stars'
        ]
      },
      {
        day: 'Day 2: Nature & Well-being',
        title: 'Guided Morning Trail & In-Villa Wellness',
        activities: [
          'Guided estate ridge walk with private naturalist',
          'Afternoon reading in the cedar conservatory with single-origin teas',
          'Fireside tasting salon with artisanal cheeses'
        ]
      }
    ]
  }

  // Estimated budget based on 3 nights
  const estimatedStay = (topPick.baseNightlyPrice * 3)
  const estimatedCleaning = topPick.cleaningFee
  const estimatedService = Math.round(estimatedStay * 0.12)
  const estimatedTax = Math.round((estimatedStay + estimatedService) * 0.18)
  const estimatedTotal = estimatedStay + estimatedCleaning + estimatedService + estimatedTax

  const responseMessage = `I have curated the ideal luxury retreat matching your criteria. Based on your request, I highly recommend **${topPick.name}** in ${topPick.city}, ${topPick.region}.

Featuring ${topPick.bedrooms} bedrooms, capacity for up to ${topPick.maxGuests} guests, and amenities including ${topPick.amenities.slice(0, 3).join(', ')}. 

I have drafted a bespoke 3-day itinerary and estimated total trip budget below.`

  res.json({
    message: responseMessage,
    recommendedProperties: matchedProperties.slice(0, 3),
    featuredProperty: topPick,
    itinerary,
    estimatedBudget: {
      nights: 3,
      nightlyRate: topPick.baseNightlyPrice,
      totalAccommodation: estimatedStay,
      taxesAndFees: estimatedCleaning + estimatedService + estimatedTax,
      estimatedGrossTotal: estimatedTotal,
      currency: topPick.currency
    },
    suggestedConcierge: luxuryStore.conciergeServices.slice(0, 3)
  })
})
