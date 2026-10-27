import React, { useState } from 'react'
import { Plus, Sparkles, Wrench, Camera, BedDouble, DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Property, Booking } from '../data/properties'
import './OwnerPortal.css'

interface RoomTypeRecord {
  id: string
  propertyName: string
  name: string
  bedConfiguration: string
  totalInventory: number
  availableToday: number
  baseNightlyRate: number
  mealPlan: string
  cancellationPolicy: string
}

interface OwnerPortalProps {
  properties: Property[]
  bookings: Booking[]
  onAddProperty: (newProp: Partial<Property>) => void
  onRequestService: (type: string, propertyName: string) => void
}

export const OwnerPortal: React.FC<OwnerPortalProps> = ({
  properties,
  bookings,
  onAddProperty,
  onRequestService
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'onboard' | 'inventory' | 'financials' | 'services'>('portfolio')
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1)

  // Room Types State (For Hotels & Multi-Unit Luxury Estates)
  const [roomTypes, setRoomTypes] = useState<RoomTypeRecord[]>([
    {
      id: 'rt-101',
      propertyName: properties[0]?.name || 'Casa Serena',
      name: 'Deluxe Heritage Suite',
      bedConfiguration: '1 King Bed',
      totalInventory: 6,
      availableToday: 4,
      baseNightlyRate: 35000,
      mealPlan: 'Breakfast Included',
      cancellationPolicy: 'Moderate (Free cancellation up to 5 days before check-in)'
    },
    {
      id: 'rt-102',
      propertyName: properties[0]?.name || 'Casa Serena',
      name: 'Royal Pavilion Suite with Plunge Pool',
      bedConfiguration: '1 Emperor Bed + 1 Daybed',
      totalInventory: 3,
      availableToday: 2,
      baseNightlyRate: 68000,
      mealPlan: 'Half Board (Breakfast & High Tea)',
      cancellationPolicy: 'Flexible (Free cancellation up to 48 hours before check-in)'
    },
    {
      id: 'rt-103',
      propertyName: properties[1]?.name || 'Villa Solarium',
      name: 'Master Ocean View Penthouse Suite',
      bedConfiguration: '2 King Beds',
      totalInventory: 2,
      availableToday: 1,
      baseNightlyRate: 85000,
      mealPlan: 'All Inclusive Bespoke Butler Care',
      cancellationPolicy: 'Strict (50% refund up to 7 days before check-in)'
    }
  ])

  // New Room Type Form State
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomRate, setNewRoomRate] = useState(42000)
  const [newRoomInventory, setNewRoomInventory] = useState(4)
  const [newRoomBed, setNewRoomBed] = useState('1 King Bed')
  const [newRoomMeal, setNewRoomMeal] = useState('Breakfast Included')
  const [newRoomProperty, setNewRoomProperty] = useState(properties[0]?.name || 'Estate')
  const [payoutRequested, setPayoutRequested] = useState(false)

  // Listing onboarding state
  const [newTitle, setNewTitle] = useState('')
  const [newTagline, setNewTagline] = useState('')
  const [newCity, setNewCity] = useState('Goa')
  const [newRegion, setNewRegion] = useState('Goa')
  const [newCategory, setNewCategory] = useState('Private Pool Villas')
  const [newMaxGuests, setNewMaxGuests] = useState(8)
  const [newBedrooms, setNewBedrooms] = useState(4)
  const [newBathrooms, setNewBathrooms] = useState(4.5)
  const [newBasePrice, setNewBasePrice] = useState(55000)
  const [newCleaningFee, setNewCleaningFee] = useState(3500)
  const [newModel, setNewModel] = useState<'marketplace' | 'managed'>('managed')
  const [newDescription, setNewDescription] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85')
  const [newAmenities, setNewAmenities] = useState<string[]>([
    'Private lap pool',
    'In-house chef on request',
    'High-speed Wi-Fi',
    'Tropical garden'
  ])

  const formatPrice = (price: number) => `₹${new Intl.NumberFormat('en-IN').format(price)}`

  // Calculate Owner portfolio metrics
  const totalGBV = bookings.reduce((sum, b) => sum + (b.priceBreakdown?.grossTotal || 0), 0)
  const ownerEarnings = bookings.reduce((sum, b) => {
    const commissionRate = 0.22 // managed model default
    const accommodation = (b.priceBreakdown?.accommodationTotal || 0) - (b.priceBreakdown?.discountAmount || 0)
    const hostShare = accommodation * (1 - commissionRate)
    return sum + hostShare + (b.priceBreakdown?.cleaningFee || 0)
  }, 0)

  const handleAddRoomType = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName) return
    const newRt: RoomTypeRecord = {
      id: `rt-${Date.now()}`,
      propertyName: newRoomProperty,
      name: newRoomName,
      bedConfiguration: newRoomBed,
      totalInventory: Number(newRoomInventory),
      availableToday: Number(newRoomInventory),
      baseNightlyRate: Number(newRoomRate),
      mealPlan: newRoomMeal,
      cancellationPolicy: 'Moderate'
    }
    setRoomTypes(prev => [newRt, ...prev])
    setNewRoomName('')
  }

  const handleUpdateAvailability = (id: string, delta: number) => {
    setRoomTypes(prev => prev.map(rt => {
      if (rt.id === id) {
        const nextVal = Math.max(0, Math.min(rt.totalInventory, rt.availableToday + delta))
        return { ...rt, availableToday: nextVal }
      }
      return rt
    }))
  }

  const handleSubmitNewListing = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle) return

    onAddProperty({
      name: newTitle,
      tagline: newTagline || 'Exclusive private sanctuary curated by Maison Véla',
      city: newCity,
      region: newRegion,
      category: newCategory,
      accommodationType: 'Luxury Villa',
      maxGuests: Number(newMaxGuests),
      bedrooms: Number(newBedrooms),
      bathrooms: Number(newBathrooms),
      baseNightlyPrice: Number(newBasePrice),
      cleaningFee: Number(newCleaningFee),
      managementModel: newModel,
      description: newDescription || 'An exquisite private villa built for generous hospitality and unhurried gatherings.',
      amenities: newAmenities,
      status: 'submitted',
      images: [
        {
          id: `img-${Date.now()}`,
          url: newImageUrl,
          altText: newTitle,
          isCover: true,
          position: 0
        }
      ]
    })

    setWizardStep(1)
    setActiveTab('portfolio')
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow"><span /> HOMEOWNER & OPERATOR PORTAL</span>
          <h1>Maharaja Vikramaditya Estate Portfolio</h1>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
            Partner ID: VELA-OWN-8801 · Verified Luxury Host · Active Agreements: 2
          </p>
        </div>
        <button
          className="btn-gold"
          onClick={() => setActiveTab('onboard')}
        >
          <Plus size={14} />
          <span>Onboard New Luxury Property</span>
        </button>
      </div>

      <div className="dash-metrics-grid">
        <div className="metric-card">
          <span>Gross Booking Value</span>
          <strong>{formatPrice(totalGBV)}</strong>
        </div>
        <div className="metric-card">
          <span>Net Host Earnings</span>
          <strong style={{ color: '#2e7d32' }}>{formatPrice(Math.round(ownerEarnings))}</strong>
        </div>
        <div className="metric-card">
          <span>Average Occupancy</span>
          <strong>74%</strong>
        </div>
        <div className="metric-card">
          <span>Portfolio Properties</span>
          <strong>{properties.length} Active</strong>
        </div>
      </div>

      <div className="dash-tabs">
        <button
          className={`dash-tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          My Luxury Portfolio ({properties.length})
        </button>
        <button
          className={`dash-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Hotel Room Inventory ({roomTypes.length})
        </button>
        <button
          className={`dash-tab-btn ${activeTab === 'financials' ? 'active' : ''}`}
          onClick={() => setActiveTab('financials')}
        >
          Financial Ledger & Payouts
        </button>
        <button
          className={`dash-tab-btn ${activeTab === 'onboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('onboard')}
        >
          Listing Submission Wizard
        </button>
        <button
          className={`dash-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Operational Support Requests
        </button>
      </div>

      {/* PORTFOLIO TAB */}
      {activeTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {properties.map(p => (
            <div
              key={p.id}
              className="dashboard-booking-card"
            >
              <img
                src={p.images[0]?.url}
                alt={p.name}
                className="dash-card-image"
              />

              <div className="dash-card-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span
                    style={{
                      background: p.status === 'published' ? '#e8f5e9' : '#fff3e0',
                      color: p.status === 'published' ? '#2e7d32' : '#e65100',
                      padding: '3px 8px',
                      fontSize: '8.5px',
                      fontWeight: 600,
                      letterSpacing: '1px'
                    }}
                  >
                    STATUS: {p.status.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: 'var(--paper)',
                      border: '1px solid var(--line)'
                    }}
                  >
                    {p.managementModel === 'managed' ? 'Managed Luxury Villa (22% Commission)' : 'Marketplace Listing (12% Commission)'}
                  </span>
                </div>

                <h3 style={{ font: '500 20px var(--serif)', margin: '0 0 4px' }}>{p.name}</h3>
                <p style={{ margin: '0 0 8px', fontSize: '11px', color: 'var(--muted)' }}>
                  {p.city}, {p.region} · {p.accommodationType}
                </p>

                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--ink-soft)' }}>
                  <span>{p.bedrooms} Bedrooms</span>
                  <span>{p.maxGuests} Max Guests</span>
                  <span>Rating: ★ {p.averageRating} ({p.reviewCount} reviews)</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block' }}>NIGHTLY RATE</span>
                <strong style={{ fontSize: '18px' }}>{formatPrice(p.baseNightlyPrice)}</strong>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
                  Cleaning: {formatPrice(p.cleaningFee)}
                </span>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      border: '1px solid var(--line-strong)',
                      padding: '6px 12px',
                      fontSize: '10px',
                      background: '#fff'
                    }}
                    onClick={() => onRequestService('Deep Cleaning & Turnover', p.name)}
                  >
                    Request Turnover
                  </button>
                  <button
                    style={{
                      border: '1px solid var(--line-strong)',
                      padding: '6px 12px',
                      fontSize: '10px',
                      background: '#fff'
                    }}
                    onClick={() => onRequestService('Maintenance Inspection', p.name)}
                  >
                    Maintenance
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HOTEL ROOM INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="metric-card">
              <span>Suite Categories</span>
              <strong>{roomTypes.length} Active</strong>
            </div>
            <div className="metric-card">
              <span>Total Inventory Keys</span>
              <strong>{roomTypes.reduce((s, r) => s + r.totalInventory, 0)} Units</strong>
            </div>
            <div className="metric-card">
              <span>Keys Available Today</span>
              <strong style={{ color: '#2e7d32' }}>{roomTypes.reduce((s, r) => s + r.availableToday, 0)} Units</strong>
            </div>
            <div className="metric-card">
              <span>Live Capacity Allocation</span>
              <strong>
                {Math.round((roomTypes.reduce((s, r) => s + r.availableToday, 0) / Math.max(1, roomTypes.reduce((s, r) => s + r.totalInventory, 0))) * 100)}% Open
              </strong>
            </div>
          </div>

          {/* Add New Room Type Form */}
          <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '24px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <BedDouble size={20} color="var(--gold-dark)" />
              <h3 style={{ font: '500 20px var(--serif)', margin: 0 }}>Register New Suite or Room Type</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 20px' }}>
              Configure individual room categories, key counts, and meal plan inclusions for multi-room boutique hotels and estates.
            </p>

            <form onSubmit={handleAddRoomType}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Assign to Property</label>
                  <select
                    value={newRoomProperty}
                    onChange={e => setNewRoomProperty(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', background: '#fff', fontSize: '12px' }}
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({p.city})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Suite / Room Name</label>
                  <input
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    placeholder="E.g., Royal Horizon Ocean Suite"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Bed Configuration</label>
                  <select
                    value={newRoomBed}
                    onChange={e => setNewRoomBed(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', background: '#fff', fontSize: '12px' }}
                  >
                    <option value="1 King Bed">1 King Bed</option>
                    <option value="2 Queen Beds">2 Queen Beds</option>
                    <option value="1 Emperor Bed + 1 Daybed">1 Emperor Bed + 1 Daybed</option>
                    <option value="2 King Beds (Family Suite)">2 King Beds (Family Suite)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Total Inventory Keys</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newRoomInventory}
                    onChange={e => setNewRoomInventory(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Base Nightly Rate (INR)</label>
                  <input
                    type="number"
                    step="1000"
                    min="5000"
                    value={newRoomRate}
                    onChange={e => setNewRoomRate(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Inclusions / Meal Plan</label>
                  <select
                    value={newRoomMeal}
                    onChange={e => setNewRoomMeal(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', background: '#fff', fontSize: '12px' }}
                  >
                    <option value="Breakfast Included">Breakfast Included (Bed & Breakfast)</option>
                    <option value="Half Board (Breakfast & High Tea)">Half Board (Breakfast & High Tea)</option>
                    <option value="Room Only (EP)">Room Only (European Plan)</option>
                    <option value="All Inclusive Bespoke Butler Care">All Inclusive Bespoke Butler Care</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-gold" style={{ padding: '10px 20px' }}>
                  <Plus size={14} />
                  <span>Add Room Type to Live Inventory</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Inventory Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Suite / Room Category</th>
                  <th>Property</th>
                  <th>Bedding</th>
                  <th>Total Keys</th>
                  <th>Available Today</th>
                  <th>Base Nightly Rate</th>
                  <th>Meal Plan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {roomTypes.map(rt => (
                  <tr key={rt.id}>
                    <td>
                      <strong style={{ display: 'block', color: 'var(--ink)' }}>{rt.name}</strong>
                      <span style={{ fontSize: '10px', color: 'var(--muted)' }}>SKU: {rt.id.toUpperCase()}</span>
                    </td>
                    <td>{rt.propertyName}</td>
                    <td>{rt.bedConfiguration}</td>
                    <td><strong>{rt.totalInventory} Keys</strong></td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateAvailability(rt.id, -1)}
                          style={{
                            width: '24px',
                            height: '24px',
                            border: '1px solid var(--line-strong)',
                            background: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px'
                          }}
                          title="Decrease available key"
                        >
                          -
                        </button>
                        <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 600, color: rt.availableToday > 0 ? '#2e7d32' : '#c62828' }}>
                          {rt.availableToday}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateAvailability(rt.id, 1)}
                          style={{
                            width: '24px',
                            height: '24px',
                            border: '1px solid var(--line-strong)',
                            background: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px'
                          }}
                          title="Increase available key"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <strong>{formatPrice(rt.baseNightlyRate)}</strong>
                      <span style={{ display: 'block', fontSize: '9px', color: 'var(--muted)' }}>excl. 18% GST</span>
                    </td>
                    <td>{rt.mealPlan}</td>
                    <td>
                      <span
                        style={{
                          background: rt.availableToday > 0 ? '#e8f5e9' : '#ffebee',
                          color: rt.availableToday > 0 ? '#2e7d32' : '#c62828',
                          padding: '3px 8px',
                          fontSize: '9px',
                          fontWeight: 600,
                          borderRadius: '2px',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {rt.availableToday > 0 ? 'INSTANT BOOKING' : 'SOLD OUT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FINANCIAL LEDGER & PAYOUTS TAB */}
      {activeTab === 'financials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Financial summary overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="metric-card">
              <span>Gross Booking Volume (GBV)</span>
              <strong>{formatPrice(totalGBV)}</strong>
            </div>
            <div className="metric-card">
              <span>Platform Service Commission</span>
              <strong style={{ color: '#e65100' }}>- {formatPrice(Math.round(totalGBV * 0.22))}</strong>
            </div>
            <div className="metric-card">
              <span>Net Host Payable Balance</span>
              <strong style={{ color: '#2e7d32' }}>{formatPrice(Math.round(ownerEarnings))}</strong>
            </div>
            <div className="metric-card">
              <span>Escrow Security Reserve</span>
              <strong>{formatPrice(Math.round(ownerEarnings * 0.1))}</strong>
            </div>
          </div>

          {/* Verified Host Payout Account & Action Card */}
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--line)',
              padding: '24px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldCheck size={18} color="#2e7d32" />
                <h4 style={{ margin: 0, font: '500 16px var(--serif)' }}>
                  Verified Host Banking Account (Razorpay Route / Stripe Connect)
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-soft)' }}>
                HDFC Bank Ltd · Corporate Escrow · Account: ••••••••••••4821 · IFSC: HDFC0000123 · Beneficiary: Maharaja Vikramaditya Estate Holdings LLP
              </p>
              <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '10px', color: 'var(--muted)' }}>
                GSTIN: 27AABCM9012F1Z4 · RBI Digital Escrow Mandate Active
              </span>
            </div>

            <div>
              {payoutRequested ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Settlement Queued — UTR Ref: RTGS-IN-889021</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-gold"
                  style={{ padding: '12px 24px', fontSize: '12px' }}
                  onClick={() => setPayoutRequested(true)}
                >
                  <DollarSign size={15} />
                  <span>Request Instant Settlement ({formatPrice(Math.round(ownerEarnings))})</span>
                </button>
              )}
            </div>
          </div>

          {/* Itemized Double-Entry Ledger Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ font: '500 18px var(--serif)', margin: 0 }}>Itemized Double-Entry Financial Ledger</h3>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  Immutable audit records of all guest charges, platform commissions, turnover reimbursements, and payouts.
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ledger Entry ID</th>
                    <th>Date & Time</th>
                    <th>Transaction Type</th>
                    <th>Reference / Property</th>
                    <th>Debit (INR)</th>
                    <th>Credit (INR)</th>
                    <th>Host Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, idx) => {
                    const gross = b.priceBreakdown?.grossTotal || 0
                    const commission = Math.round((b.priceBreakdown?.accommodationTotal || 0) * 0.22)
                    const netCredit = gross - commission

                    return (
                      <React.Fragment key={b.id || idx}>
                        <tr>
                          <td>
                            <code style={{ fontSize: '10.5px', color: 'var(--ink)' }}>LED-2026-00{idx + 1}A</code>
                          </td>
                          <td>{b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '26 Oct 2026'}</td>
                          <td>
                            <span style={{ color: '#2e7d32', fontWeight: 600 }}>GUEST_PAYMENT_CREDIT</span>
                          </td>
                          <td>
                            <strong>{b.propertyName}</strong>
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--muted)' }}>Ref: {b.reference}</span>
                          </td>
                          <td>—</td>
                          <td style={{ color: '#2e7d32', fontWeight: 600 }}>+ {formatPrice(gross)}</td>
                          <td>{formatPrice(gross)}</td>
                          <td>
                            <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', fontSize: '9px', fontWeight: 600 }}>
                              POSTED
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <code style={{ fontSize: '10.5px', color: 'var(--ink)' }}>LED-2026-00{idx + 1}B</code>
                          </td>
                          <td>{b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '26 Oct 2026'}</td>
                          <td>
                            <span style={{ color: '#e65100', fontWeight: 600 }}>PLATFORM_COMMISSION_DEBIT</span>
                          </td>
                          <td>
                            <span>Maison Véla Managed Fee (22%)</span>
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--muted)' }}>Ref: {b.reference}</span>
                          </td>
                          <td style={{ color: '#c62828', fontWeight: 600 }}>- {formatPrice(commission)}</td>
                          <td>—</td>
                          <td>{formatPrice(netCredit)}</td>
                          <td>
                            <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', fontSize: '9px', fontWeight: 600 }}>
                              POSTED
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <code style={{ fontSize: '10.5px', color: 'var(--ink)' }}>LED-2026-00{idx + 1}C</code>
                          </td>
                          <td>{b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '26 Oct 2026'}</td>
                          <td>
                            <span style={{ color: '#1565c0', fontWeight: 600 }}>HOST_PAYABLE_CREDIT</span>
                          </td>
                          <td>
                            <span>Net Retained Host Share</span>
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--muted)' }}>Ref: {b.reference}</span>
                          </td>
                          <td>—</td>
                          <td style={{ color: '#1565c0', fontWeight: 600 }}>+ {formatPrice(netCredit)}</td>
                          <td><strong>{formatPrice(netCredit)}</strong></td>
                          <td>
                            <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', fontSize: '9px', fontWeight: 600 }}>
                              ESCROW HELD
                            </span>
                          </td>
                        </tr>
                      </React.Fragment>
                    )
                  })}
                  {payoutRequested && (
                    <tr>
                      <td>
                        <code style={{ fontSize: '10.5px', color: 'var(--ink)' }}>LED-2026-DISBURSE</code>
                      </td>
                      <td>26 Oct 2026</td>
                      <td>
                        <span style={{ color: '#6a1b9a', fontWeight: 600 }}>PAYOUT_DISBURSED_DEBIT</span>
                      </td>
                      <td>
                        <strong>Disbursement to HDFC Bank (••••4821)</strong>
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--muted)' }}>UTR: RTGS-IN-889021</span>
                      </td>
                      <td style={{ color: '#c62828', fontWeight: 600 }}>- {formatPrice(Math.round(ownerEarnings))}</td>
                      <td>—</td>
                      <td><strong>₹0</strong></td>
                      <td>
                        <span style={{ background: '#fff3e0', color: '#e65100', padding: '2px 6px', fontSize: '9px', fontWeight: 600 }}>
                          SETTLING
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'onboard' && (
        <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '36px', maxWidth: '780px', margin: '0 auto' }}>
          <div className="checkout-steps">
            {[1, 2, 3, 4, 5].map(num => (
              <div key={num} className={`step-indicator ${wizardStep === num ? 'active' : ''}`}>
                <span className="step-num">{num}</span>
                <span>{num === 1 ? 'Basics' : num === 2 ? 'Capacity' : num === 3 ? 'Model & Price' : num === 4 ? 'Amenities' : 'Photos'}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmitNewListing}>
            {wizardStep === 1 && (
              <div>
                <h3 style={{ font: '400 24px var(--serif)', margin: '0 0 16px' }}>Property Basics</h3>
                <div className="form-group">
                  <label>Property Name</label>
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="E.g., Villa Aethelgard or Casa Mirador"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Editorial Tagline</label>
                  <input
                    value={newTagline}
                    onChange={e => setNewTagline(e.target.value)}
                    placeholder="E.g., A sun-drenched clifftop estate overlooking Chapora River"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>City / Location</label>
                    <input
                      value={newCity}
                      onChange={e => setNewCity(e.target.value)}
                      placeholder="Assagao, Morjim, Udaipur, etc."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>State / Region</label>
                    <input
                      value={newRegion}
                      onChange={e => setNewRegion(e.target.value)}
                      placeholder="Goa, Rajasthan, Maharashtra, etc."
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Curated Collection</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                    <option>Private Pool Villas</option>
                    <option>Beachfront Estates</option>
                    <option>Mountain Retreats</option>
                    <option>Royal Residences</option>
                    <option>Urban Penthouses</option>
                  </select>
                </div>
                <button type="button" className="reserve-btn-main" onClick={() => setWizardStep(2)}>
                  Next: Capacity & Rooms
                </button>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <h3 style={{ font: '400 24px var(--serif)', margin: '0 0 16px' }}>Capacity & Room Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Max Guests</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={newMaxGuests}
                      onChange={e => setNewMaxGuests(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bedrooms</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newBedrooms}
                      onChange={e => setNewBedrooms(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bathrooms</label>
                    <input
                      type="number"
                      step={0.5}
                      min={1}
                      max={20}
                      value={newBathrooms}
                      onChange={e => setNewBathrooms(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" style={{ border: '1px solid var(--line)', padding: '12px 20px' }} onClick={() => setWizardStep(1)}>
                    Back
                  </button>
                  <button type="button" className="reserve-btn-main" style={{ flex: 1 }} onClick={() => setWizardStep(3)}>
                    Next: Pricing & Commercial Model
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div>
                <h3 style={{ font: '400 24px var(--serif)', margin: '0 0 16px' }}>Commercial Model & Nightly Rates</h3>
                <div className="form-group">
                  <label>Select Partnership Model</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                    <div
                      style={{
                        border: newModel === 'managed' ? '2px solid var(--gold)' : '1px solid var(--line)',
                        background: newModel === 'managed' ? 'var(--gold-light)' : '#fff',
                        padding: '16px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setNewModel('managed')}
                    >
                      <strong style={{ display: 'block', fontSize: '13px' }}>Managed Luxury Villa (22%)</strong>
                      <small style={{ fontSize: '10.5px', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                        Maison Véla team manages guest check-in, 5-star linen turnover, housekeeping staff, maintenance, and concierge.
                      </small>
                    </div>

                    <div
                      style={{
                        border: newModel === 'marketplace' ? '2px solid var(--gold)' : '1px solid var(--line)',
                        background: newModel === 'marketplace' ? 'var(--gold-light)' : '#fff',
                        padding: '16px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setNewModel('marketplace')}
                    >
                      <strong style={{ display: 'block', fontSize: '13px' }}>Marketplace Listing (12%)</strong>
                      <small style={{ fontSize: '10.5px', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                        Owner conducts own check-ins and housekeeping; receives bookings through the platform.
                      </small>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Base Nightly Rate (INR)</label>
                    <input
                      type="number"
                      step={500}
                      value={newBasePrice}
                      onChange={e => setNewBasePrice(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cleaning Turnover Fee (INR)</label>
                    <input
                      type="number"
                      step={500}
                      value={newCleaningFee}
                      onChange={e => setNewCleaningFee(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" style={{ border: '1px solid var(--line)', padding: '12px 20px' }} onClick={() => setWizardStep(2)}>
                    Back
                  </button>
                  <button type="button" className="reserve-btn-main" style={{ flex: 1 }} onClick={() => setWizardStep(4)}>
                    Next: Amenities & Narrative
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div>
                <h3 style={{ font: '400 24px var(--serif)', margin: '0 0 16px' }}>Editorial Narrative & Amenities</h3>
                <div className="form-group">
                  <label>Full Property Story & Architectural Highlights</label>
                  <textarea
                    rows={4}
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Describe the architectural spirit, natural surroundings, and distinctive luxuries of the home..."
                  />
                </div>
                <div className="form-group">
                  <label>Key Amenities (comma separated)</label>
                  <input
                    value={newAmenities.join(', ')}
                    onChange={e => setNewAmenities(e.target.value.split(',').map(s => s.trim()))}
                    placeholder="Private pool, Private chef, Wine cellar, Ocean view"
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" style={{ border: '1px solid var(--line)', padding: '12px 20px' }} onClick={() => setWizardStep(3)}>
                    Back
                  </button>
                  <button type="button" className="reserve-btn-main" style={{ flex: 1 }} onClick={() => setWizardStep(5)}>
                    Next: Photography
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 5 && (
              <div>
                <h3 style={{ font: '400 24px var(--serif)', margin: '0 0 16px' }}>High-Resolution Photography</h3>
                <div className="form-group">
                  <label>Cover Photo URL (High-Resolution Architectural View)</label>
                  <input
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    required
                  />
                </div>
                <img
                  src={newImageUrl}
                  alt="Preview"
                  style={{ width: '100%', height: '220px', objectFit: 'cover', marginBottom: '20px', border: '1px solid var(--line)' }}
                />

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" style={{ border: '1px solid var(--line)', padding: '12px 20px' }} onClick={() => setWizardStep(4)}>
                    Back
                  </button>
                  <button type="submit" className="reserve-btn-main" style={{ flex: 1 }}>
                    Submit for Maison Véla Verification & Publishing
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* OPERATIONAL SUPPORT REQUESTS */}
      {activeTab === 'services' && (
        <div className="owner-services-grid">
          <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '24px', borderRadius: 'var(--radius-sm)' }}>
            <Camera size={24} color="var(--gold-dark)" style={{ marginBottom: '12px' }} />
            <h4 style={{ font: '500 18px var(--serif)', margin: '0 0 6px' }}>Editorial Photography</h4>
            <p style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Request our specialized architectural photographer and stylist to shoot day and twilight captures.
            </p>
            <button
              style={{ marginTop: '16px', background: 'var(--charcoal)', color: '#fff', padding: '8px 16px', fontSize: '11px' }}
              onClick={() => onRequestService('Editorial Photography Shoot', properties[0]?.name || 'Estate')}
            >
              Request Shoot
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '24px', borderRadius: 'var(--radius-sm)' }}>
            <Sparkles size={24} color="var(--gold-dark)" style={{ marginBottom: '12px' }} />
            <h4 style={{ font: '500 18px var(--serif)', margin: '0 0 6px' }}>Deep Linen & Turnover Service</h4>
            <p style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Full turnover sanitization, linen replenishment, and pool water conditioning ahead of arrival.
            </p>
            <button
              style={{ marginTop: '16px', background: 'var(--charcoal)', color: '#fff', padding: '8px 16px', fontSize: '11px' }}
              onClick={() => onRequestService('Deep Turnover Service', properties[0]?.name || 'Estate')}
            >
              Request Turnover
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '24px', borderRadius: 'var(--radius-sm)' }}>
            <Wrench size={24} color="var(--gold-dark)" style={{ marginBottom: '12px' }} />
            <h4 style={{ font: '500 18px var(--serif)', margin: '0 0 6px' }}>Preventive Maintenance</h4>
            <p style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              HVAC filtration check, generator load testing, water pressure balancing, and smart lock inspection.
            </p>
            <button
              style={{ marginTop: '16px', background: 'var(--charcoal)', color: '#fff', padding: '8px 16px', fontSize: '11px' }}
              onClick={() => onRequestService('Preventive Maintenance Audit', properties[0]?.name || 'Estate')}
            >
              Request Audit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
