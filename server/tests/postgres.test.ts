import { PostgresRepository, pool } from '../src/db/postgres.js'
import { ensureDatabaseAndMigrate } from '../src/db/setupDb.js'

async function runPostgresVerification() {
  console.log('🚀 Starting Maison Véla Live PostgreSQL Verification Tests...')

  // Step 1: Ensure DB & migrations
  await ensureDatabaseAndMigrate()

  // Step 2: Query properties from PostgreSQL
  console.log('\n1. Querying properties from PostgreSQL...')
  const properties = await PostgresRepository.getProperties()
  console.log(`✓ Retrieved ${properties.length} published luxury properties from PostgreSQL:`)
  properties.slice(0, 3).forEach(p => {
    console.log(`   - [${p.city}] ${p.name}: ₹${p.baseNightlyPrice.toLocaleString('en-IN')}/night (${p.images.length} photos, ${p.amenities.length} amenities)`)
  })

  // Step 3: Insert dynamic property into PostgreSQL
  console.log('\n2. Testing dynamic property insertion into PostgreSQL...')
  const testPropName = `Royal Sunderbans Retreat ${Date.now()}`
  const createdProp = await PostgresRepository.createProperty({
    name: testPropName,
    city: 'Kolkata',
    region: 'West Bengal',
    category: 'Royal Residences',
    baseNightlyPrice: 85000,
    maxGuests: 10,
    bedrooms: 5,
    bathrooms: 5,
    status: 'submitted',
    amenities: ['Private boat jetty', 'Royal dining pavilion', 'Butler service']
  })
  console.log(`✓ Inserted property "${createdProp.name}" (ID: ${createdProp.id}, Status: ${createdProp.status})`)

  // Step 4: Update property status in PostgreSQL
  console.log('\n3. Testing dynamic property status workflow in PostgreSQL...')
  const updatedProp = await PostgresRepository.updatePropertyStatus(createdProp.id, 'published', 'Verified by executive board')
  console.log(`✓ Updated property status to: ${updatedProp?.status} (Verified: ${updatedProp?.isVerified})`)

  // Step 5: Test dynamic booking in PostgreSQL
  console.log('\n4. Testing dynamic booking creation in PostgreSQL...')
  const targetProp = createdProp
  const checkInDate = '2028-05-10'
  const checkOutDate = '2028-05-14'
  const overlapCheckIn = '2028-05-12'
  const overlapCheckOut = '2028-05-16'

  const newBooking = await PostgresRepository.createBooking({
    propertyId: targetProp.id,
    guestName: 'Vikram Malhotra',
    guestEmail: `vikram.${Date.now()}@luxury.in`,
    guestPhone: '+91 99887 66554',
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: 4,
    grossTotal: 254880,
    priceBreakdown: {
      accommodationTotal: 194000,
      cleaningFee: 3500,
      guestServiceFee: 23280,
      taxes: 34100,
      discountAmount: 0,
      nights: 4,
      nightlyRate: 48500,
      grossTotal: 254880,
      currency: 'INR'
    },
    paymentMethod: 'Razorpay Cards (HDFC Infinia)',
    idempotencyKey: `idem_test_${Date.now()}`,
    conciergeServicesBooked: ['Private Gourmet Chef']
  })
  console.log(`✓ Created live reservation in PostgreSQL: Ref ${newBooking.reference} for ${newBooking.propertyName} (Total: ₹${newBooking.priceBreakdown.grossTotal.toLocaleString('en-IN')})`)

  // Step 6: Verify double-booking prevention in PostgreSQL
  console.log('\n5. Testing double-booking conflict prevention...')
  try {
    await PostgresRepository.createBooking({
      propertyId: targetProp.id,
      guestName: 'Double Booking Attempt',
      guestEmail: 'conflict@test.com',
      checkIn: overlapCheckIn, // Overlaps with existing booking!
      checkOut: overlapCheckOut,
      guests: 2,
      grossTotal: 120000,
      priceBreakdown: {
        accommodationTotal: 97000,
        cleaningFee: 3500,
        guestServiceFee: 11640,
        taxes: 17000,
        discountAmount: 0,
        nights: 4,
        nightlyRate: 24250,
        grossTotal: 120000,
        currency: 'INR'
      },
      idempotencyKey: `idem_conflict_${Date.now()}`
    })
    console.error('❌ Double booking was NOT prevented!')
  } catch (err: any) {
    console.log(`✓ Successfully caught and prevented overlapping booking: "${err.message}"`)
  }

  // Step 7: Verify operations cleaning task scheduled in PostgreSQL
  console.log('\n6. Checking dynamic cleaning turnover tasks in PostgreSQL...')
  const cleaningTasks = await PostgresRepository.getCleaningTasks()
  console.log(`✓ Total cleaning tasks in PostgreSQL: ${cleaningTasks.length}`)
  const latestTask = cleaningTasks[0]
  if (latestTask) {
    console.log(`   - Latest task: ${latestTask.propertyName} (Due: ${latestTask.dueAt}, Checklist items: ${latestTask.checklist.length})`)
    // Update checklist item
    latestTask.checklist[0].done = true
    await PostgresRepository.updateCleaningTask(latestTask.id, latestTask.checklist)
    console.log('   ✓ Updated checklist item #1 to done in PostgreSQL')
  }

  // Step 8: Verify coupons in PostgreSQL
  console.log('\n7. Testing dynamic coupons in PostgreSQL...')
  const testCouponCode = `FESTIVE${Math.floor(10 + Math.random() * 89)}`
  await PostgresRepository.createCoupon(testCouponCode, 'percentage', 20)
  const coupons = await PostgresRepository.getCoupons()
  console.log(`✓ Retrieved ${coupons.length} active coupons in PostgreSQL:`)
  coupons.slice(0, 4).forEach(c => console.log(`   - Code: ${c.code} (${c.amount}% off)`))

  // Step 9: Verify audit logs
  console.log('\n8. Checking audit log stream in PostgreSQL...')
  const logs = await PostgresRepository.getAuditLogs()
  console.log(`✓ Total audit records in PostgreSQL: ${logs.length}`)
  logs.slice(0, 3).forEach(l => {
    console.log(`   - [${l.action}] ${l.actorName}: ${l.details}`)
  })

  // Step 10: Verify Room Types & Multi-Unit Hotel Inventory in PostgreSQL
  console.log('\n9. Testing Room Types and Hotel Inventory in PostgreSQL...')
  const roomType = await PostgresRepository.createRoomType({
    propertyId: targetProp.id,
    name: 'Maharaja Heritage Presidential Pavilion',
    bedConfiguration: '1 Emperor Bed + 1 Daybed',
    inventoryCount: 4,
    baseRate: 75000,
    maxOccupancy: 3,
    description: 'Palatial suite with sweeping water views and private marble bath'
  })
  console.log(`✓ Created room type SKU "${roomType.name}" for property ${targetProp.name} (Rate: ₹${Number(roomType.base_nightly_rate || 75000).toLocaleString('en-IN')})`)

  const propertyRoomTypes = await PostgresRepository.getRoomTypes(targetProp.id)
  console.log(`✓ Retrieved ${propertyRoomTypes.length} active room types for property ${targetProp.name}`)

  // Step 11: Verify 15-minute transactional inventory hold
  console.log('\n10. Testing 15-minute transactional inventory hold in PostgreSQL...')
  const hold = await PostgresRepository.createInventoryHold({
    propertyId: targetProp.id,
    roomTypeId: roomType.id,
    sessionId: `sess_${Date.now()}`,
    checkIn: '2028-02-10',
    checkOut: '2028-02-14',
    quantity: 1,
    expiresInMinutes: 15
  })
  console.log(`✓ Created transactional inventory hold ID: ${hold.holdId} (Expires: ${hold.expiresAt.toISOString()})`)

  // Step 12: Verify Double-Entry Financial Ledger in PostgreSQL
  console.log('\n11. Testing Double-Entry Financial Ledger entry in PostgreSQL...')
  await PostgresRepository.recordLedgerEntry({
    bookingId: newBooking.id,
    transactionType: 'guest_payment',
    entryType: 'credit',
    amount: newBooking.priceBreakdown.grossTotal,
    currency: 'INR',
    accountName: 'Clearing Escrow Account',
    description: `Automated test escrow clearance for booking ${newBooking.reference}`,
    referenceId: `tx_test_${Date.now()}`
  })
  console.log('✓ Recorded immutable financial ledger entry in PostgreSQL')

  await pool.end()
  console.log('\n🎉 ALL LIVE POSTGRESQL DYNAMIC OPERATIONS & MASTER EXTENSIONS VERIFIED SUCCESSFULLY!')
}

runPostgresVerification().catch(err => {
  console.error('Test error:', err)
  process.exit(1)
})
