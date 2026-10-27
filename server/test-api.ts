// Automated Verification Test for Maison Véla Luxury API
import app from './src/index.js'
import http from 'http'

async function runTests() {
  console.log('🧪 Starting Maison Véla System Verification Tests...\n')
  const server = http.createServer(app)

  await new Promise<void>((resolve) => server.listen(4001, () => resolve()))
  const baseUrl = 'http://localhost:4001'

  try {
    // 1. Health check test
    console.log('1. Testing GET /api/health...')
    const healthRes = await fetch(`${baseUrl}/api/health`)
    const healthData = await healthRes.json()
    if (healthRes.status !== 200 || healthData.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(healthData)}`)
    }
    console.log('   ✓ Health check passed:', healthData.brand)

    // 2. Property search and filtering
    console.log('\n2. Testing GET /api/properties (Search & Filters)...')
    const propRes = await fetch(`${baseUrl}/api/properties?destination=Goa&guests=4`)
    const propData = await propRes.json()
    if (!Array.isArray(propData.data) || propData.data.length === 0) {
      throw new Error('Property search failed to return Goa villas')
    }
    console.log(`   ✓ Found ${propData.data.length} luxury stays in Goa for 4+ guests`)

    // 3. Server-side Price Breakdown & Quote
    console.log('\n3. Testing POST /api/bookings/quote (Live Server Price Calculation)...')
    const testProp = propData.data[0]
    const quoteRes = await fetch(`${baseUrl}/api/bookings/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: testProp.id,
        checkIn: '2026-12-10',
        checkOut: '2026-12-14',
        couponCode: 'VELA10'
      })
    })
    const quoteData = await quoteRes.json()
    if (quoteRes.status !== 200 || !quoteData.quote || quoteData.quote.nights !== 4) {
      throw new Error(`Price quote failed: ${JSON.stringify(quoteData)}`)
    }
    console.log(`   ✓ Quote calculated for 4 nights at ${quoteData.property.name}:`)
    console.log(`     - Nightly: ₹${quoteData.quote.nightlyRate}`)
    console.log(`     - Accommodation: ₹${quoteData.quote.accommodationTotal}`)
    console.log(`     - Discount (VELA10): -₹${quoteData.quote.discountAmount}`)
    console.log(`     - Service Fee: ₹${quoteData.quote.guestServiceFee}`)
    console.log(`     - Taxes (GST 18%): ₹${quoteData.quote.taxes}`)
    console.log(`     - Gross Total: ₹${quoteData.quote.grossTotal}`)

    // 4. Booking creation with inventory hold
    console.log('\n4. Testing POST /api/bookings (Create Confirmed Reservation)...')
    const bookRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: testProp.id,
        guestId: 'usr-guest-01',
        guestName: 'Rohit Sharma',
        guestEmail: 'rohit@example.com',
        guestPhone: '+91 99887 76655',
        checkIn: '2026-12-10',
        checkOut: '2026-12-14',
        guests: 4,
        couponCode: 'VELA10',
        paymentMethod: 'Razorpay / NetBanking',
        idempotencyKey: 'idemp_test_998877'
      })
    })
    const bookData = await bookRes.json()
    if (bookRes.status !== 201 || !bookData.booking.reference) {
      throw new Error(`Booking failed: ${JSON.stringify(bookData)}`)
    }
    console.log(`   ✓ Reservation confirmed! Reference: ${bookData.booking.reference}`)

    // 5. Double-Booking Prevention Check
    console.log('\n5. Testing Double-Booking Prevention on Overlapping Dates...')
    const conflictRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: testProp.id,
        guestId: 'usr-guest-02',
        guestName: 'Priya Kapoor',
        guestEmail: 'priya@example.com',
        checkIn: '2026-12-11',
        checkOut: '2026-12-15',
        guests: 2
      })
    })
    if (conflictRes.status !== 409) {
      throw new Error(`Double booking was NOT prevented! Status: ${conflictRes.status}`)
    }
    console.log('   ✓ Overlapping reservation correctly rejected with 409 Conflict!')

    // 6. AI Luxury Travel Concierge
    console.log('\n6. Testing POST /api/ai/concierge (AI Natural Language Travel Assistant)...')
    const aiRes = await fetch(`${baseUrl}/api/ai/concierge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Find a private pool villa in Goa for 6 guests with a private chef'
      })
    })
    const aiData = await aiRes.json()
    if (aiRes.status !== 200 || !aiData.featuredProperty || !aiData.itinerary) {
      throw new Error(`AI assistant failed: ${JSON.stringify(aiData)}`)
    }
    console.log(`   ✓ AI Concierge selected: ${aiData.featuredProperty.name}`)
    console.log(`   ✓ Generated ${aiData.itinerary.length}-day bespoke itinerary`)
    console.log(`   ✓ Estimated 3-night gross trip budget: ₹${aiData.estimatedBudget.estimatedGrossTotal.toLocaleString('en-IN')}`)

    // 7. Executive Admin Financial Metrics
    console.log('\n7. Testing GET /api/admin/metrics (Financial & Platform Intelligence)...')
    const metricsRes = await fetch(`${baseUrl}/api/admin/metrics`)
    const metricsData = await metricsRes.json()
    if (metricsRes.status !== 200 || !metricsData.metrics.grossBookingValue) {
      throw new Error(`Admin metrics failed: ${JSON.stringify(metricsData)}`)
    }
    console.log(`   ✓ Gross Booking Value (GBV): ₹${metricsData.metrics.grossBookingValue.toLocaleString('en-IN')}`)
    console.log(`   ✓ Net Platform Revenue: ₹${metricsData.metrics.platformRevenue.toLocaleString('en-IN')}`)
    console.log(`   ✓ Host Payables: ₹${metricsData.metrics.hostPayables.toLocaleString('en-IN')}`)
    console.log(`   ✓ Occupancy Rate: ${metricsData.metrics.occupancyRate}%`)

    console.log('\n🎉 ALL 7 SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!\n')
  } finally {
    server.close()
  }
}

runTests().catch(err => {
  console.error('❌ Verification test error:', err)
  process.exit(1)
})
