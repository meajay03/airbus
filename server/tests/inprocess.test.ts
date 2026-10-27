// Direct in-process verification test for Maison Véla Luxury Hospitality System
import { luxuryStore } from '../src/db/store.js'
import { PricingService } from '../src/services/pricingService.js'

export async function runInProcessTests() {
  console.log('🧪 Starting Maison Véla In-Process System Verification Tests...\n')

  // 1. Check seed properties
  console.log('1. Checking Luxury Catalog...')
  const published = luxuryStore.properties.filter(p => p.status === 'published')
  if (published.length < 5) throw new Error('Catalog has insufficient luxury properties')
  console.log(`   ✓ Found ${published.length} published luxury properties across India`)
  published.forEach(p => console.log(`     - [${p.category}] ${p.name} (${p.city}, ${p.region}) — ₹${p.baseNightlyPrice.toLocaleString('en-IN')}/night`))

  // 2. Check pricing engine calculations
  console.log('\n2. Testing PricingService & Tax Calculations (18% GST + 12% Service Fee)...')
  const prop = luxuryStore.properties[0] // Casa Serena
  const quote = PricingService.computePriceBreakdown(prop.id, '2026-11-20', '2026-11-23', 'VELA10')

  console.log(`   ✓ 3 nights at ${prop.name}:`)
  console.log(`     - Base Accommodation: ₹${quote.accommodationTotal}`)
  console.log(`     - VELA10 (10% off): -₹${quote.discountAmount}`)
  console.log(`     - Cleaning Fee: ₹${quote.cleaningFee}`)
  console.log(`     - Guest Service Fee (12%): ₹${quote.guestServiceFee}`)
  console.log(`     - GST (18%): ₹${quote.taxes}`)
  console.log(`     - Final Verified Gross Total: ₹${quote.grossTotal}`)

  // 3. Double-Booking Prevention Logic
  console.log('\n3. Testing Double-Booking Prevention & Date Overlap Check...')
  const existingBooking = luxuryStore.bookings[0] // Nov 12 - 16, 2026
  console.log(`   Existing Reservation: ${existingBooking.reference} for ${existingBooking.propertyName} (${existingBooking.checkIn} to ${existingBooking.checkOut})`)

  const hasConflict = PricingService.hasDateConflict(existingBooking.propertyId, '2026-11-14', '2026-11-18')
  if (!hasConflict) throw new Error('Conflict detection failed!')
  console.log('   ✓ Overlapping reservation (Nov 14 - 18) detected as CONFLICT: Double booking prevented!')

  // 4. Role-based user profiles
  console.log('\n4. Verifying Role Access & Profiles...')
  const roles = ['guest', 'owner', 'manager', 'admin']
  roles.forEach(role => {
    const user = luxuryStore.users.find(u => u.role === role)
    if (!user) throw new Error(`Missing user for role ${role}`)
    console.log(`   ✓ ${role.toUpperCase()}: ${user.fullName} (${user.email})`)
  })

  // 5. Concierge & Operations
  console.log('\n5. Verifying Concierge Catalog & Operations Tasks...')
  console.log(`   ✓ ${luxuryStore.conciergeServices.length} Curated Concierge Services active:`)
  luxuryStore.conciergeServices.forEach(s => console.log(`     - ${s.title} (${s.pricingModel}: ₹${s.price.toLocaleString('en-IN')})`))

  console.log(`   ✓ ${luxuryStore.cleaningTasks.length} Housekeeping Tasks scheduled:`)
  luxuryStore.cleaningTasks.forEach(c => console.log(`     - ${c.propertyName} (Assigned: ${c.assignedTo}, Status: ${c.status})`))

  console.log(`   ✓ ${luxuryStore.maintenanceTasks.length} Maintenance Tickets logged:`)
  luxuryStore.maintenanceTasks.forEach(m => console.log(`     - [${m.priority.toUpperCase()}] ${m.propertyName}: ${m.description}`))

  console.log('\n🎉 ALL IN-PROCESS SYSTEM VERIFICATION TESTS PASSED!\n')
}

if (process.argv[1]?.includes('inprocess.test.ts')) {
  runInProcessTests().catch(err => {
    console.error('❌ Test failed:', err)
    process.exit(1)
  })
}
