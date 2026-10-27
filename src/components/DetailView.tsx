import React, { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft, Heart, Star, Users, BedDouble, Bath, Check, MapPin,
  ShieldCheck, Sparkles, ChevronDown, Minus, Plus, Calendar,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { Property, BookingPriceBreakdown, ConciergeService } from '../data/properties'
import './DetailView.css'

interface DetailViewProps {
  property: Property
  saved: boolean
  onToggleSave: () => void
  onBack: () => void
  onOpenGallery: (index: number) => void
  onOpenCheckout: (
    checkIn: string,
    checkOut: string,
    guests: number,
    priceBreakdown: BookingPriceBreakdown,
    couponCode: string,
    conciergeServices: string[]
  ) => void
  similarProperties: Property[]
  onOpenProperty: (property: Property) => void
  conciergeServices?: ConciergeService[]
}

export const DetailView: React.FC<DetailViewProps> = ({
  property,
  saved,
  onToggleSave,
  onBack,
  onOpenGallery,
  onOpenCheckout,
  similarProperties,
  onOpenProperty
}) => {
  // Booking widget state
  const [checkIn, setCheckIn] = useState('2026-11-20')
  const [checkOut, setCheckOut] = useState('2026-11-23')
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [activeDateField, setActiveDateField] = useState<'checkIn' | 'checkOut'>('checkIn')
  const [viewDate, setViewDate] = useState(() => new Date(2026, 10, 1)) // Nov 2026 default
  const dateDropdownRef = useRef<HTMLDivElement>(null)

  const [adults, setAdults] = useState(Math.min(2, property.maxGuests))
  const [children, setChildren] = useState(0)
  const [guests, setGuests] = useState(Math.min(2, property.maxGuests))
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false)
  const guestDropdownRef = useRef<HTMLDivElement>(null)
  const [couponCode, setCouponCode] = useState('VELA10')
  const [appliedCoupon, setAppliedCoupon] = useState('VELA10')
  const [couponDiscount, setCouponDiscount] = useState(10) // 10%
  const [selectedConcierge] = useState<string[]>([])
  const [selectedRoomCategory, setSelectedRoomCategory] = useState<string>('entire')

  const suiteOptions = [
    {
      id: 'entire',
      name: `Entire ${property.accommodationType || 'Sanctuary'}`,
      desc: `${property.bedrooms} Bedrooms · Exclusive Grounds · Full Butler Care`,
      price: property.baseNightlyPrice
    },
    {
      id: 'pavilion',
      name: 'Royal Master Pavilion Suite',
      desc: '1 Emperor Bed · Private Plunge Pool · Breakfast Included',
      price: Math.round(property.baseNightlyPrice * 0.72)
    },
    {
      id: 'heritage',
      name: 'Courtyard Heritage Suite',
      desc: '1 King Bed · Garden Vista · Breakfast Included',
      price: Math.round(property.baseNightlyPrice * 0.52)
    }
  ]

  const activeSuite = suiteOptions.find(s => s.id === selectedRoomCategory) || suiteOptions[0]

  const toDateString = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return { date: 'Select date', day: 'Add dates' }
    const parts = dateStr.split('-').map(Number)
    if (parts.length !== 3) return { date: dateStr, day: '' }
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    if (isNaN(d.getTime())) return { date: dateStr, day: '' }
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const day = d.toLocaleDateString('en-US', { weekday: 'long' })
    return { date, day }
  }

  const addDaysToDate = (dateStr: string, days: number) => {
    const parts = dateStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2] + days)
    return toDateString(d.getFullYear(), d.getMonth(), d.getDate())
  }

  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleDaySelect = (dayNum: number) => {
    const selectedStr = toDateString(currentYear, currentMonth, dayNum)
    if (activeDateField === 'checkIn') {
      setCheckIn(selectedStr)
      if (selectedStr >= checkOut) {
        setCheckOut(addDaysToDate(selectedStr, 3))
      }
      setActiveDateField('checkOut')
    } else {
      if (selectedStr > checkIn) {
        setCheckOut(selectedStr)
        setDateDropdownOpen(false)
      } else {
        setCheckIn(selectedStr)
        setCheckOut(addDaysToDate(selectedStr, 2))
        setActiveDateField('checkOut')
      }
    }
  }

  const handleAdultsChange = (newVal: number) => {
    const clamped = Math.max(1, Math.min(property.maxGuests - children, newVal))
    setAdults(clamped)
    setGuests(clamped + children)
  }

  const handleChildrenChange = (newVal: number) => {
    const clamped = Math.max(0, Math.min(property.maxGuests - adults, newVal))
    setChildren(clamped)
    setGuests(adults + clamped)
  }

  const handleQuickSelectGuests = (count: number) => {
    const clamped = Math.max(1, Math.min(property.maxGuests, count))
    setAdults(clamped)
    setChildren(0)
    setGuests(clamped)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(target)) {
        setGuestDropdownOpen(false)
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(target)) {
        setDateDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGuestDropdownOpen(false)
        setDateDropdownOpen(false)
      }
    }
    if (guestDropdownOpen || dateDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [guestDropdownOpen, dateDropdownOpen])

  const formatPrice = (price: number) => `₹${new Intl.NumberFormat('en-IN').format(price)}`

  // Calculate nights
  const d1 = new Date(checkIn)
  const d2 = new Date(checkOut)
  const diffTime = d2.getTime() - d1.getTime()
  const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)))

  // Calculate pricing breakdown
  const nightlyRate = activeSuite.price
  const accommodationTotal = nightlyRate * nights
  const cleaningFee = property.cleaningFee || 3500
  const guestServiceFee = Math.round(accommodationTotal * 0.12)
  const discountAmount = appliedCoupon ? Math.round((accommodationTotal * couponDiscount) / 100) : 0
  const taxableBase = Math.max(0, accommodationTotal - discountAmount) + guestServiceFee
  const taxes = Math.round(taxableBase * 0.18)
  const grossTotal = Math.max(0, accommodationTotal - discountAmount) + cleaningFee + guestServiceFee + taxes

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    const code = couponCode.trim().toUpperCase()
    if (code === 'VELA10') {
      setAppliedCoupon('VELA10')
      setCouponDiscount(10)
    } else if (code === 'ROYAL15') {
      setAppliedCoupon('ROYAL15')
      setCouponDiscount(15)
    } else if (code === 'WELCOME5000') {
      setAppliedCoupon('WELCOME5000')
      setCouponDiscount(8)
    } else {
      setAppliedCoupon('')
      setCouponDiscount(0)
    }
  }

  const handleReserve = () => {
    const breakdown: BookingPriceBreakdown = {
      nights,
      nightlyRate,
      accommodationTotal,
      cleaningFee,
      guestServiceFee,
      taxes,
      discountAmount,
      grossTotal,
      currency: 'INR'
    }

    onOpenCheckout(checkIn, checkOut, guests, breakdown, appliedCoupon, selectedConcierge)
  }

  return (
    <main className="detail-page">
      <button className="back-link" onClick={onBack} aria-label="Back to collection">
        <ArrowLeft size={15} />
        <span>Back to The Collection</span>
      </button>

      {/* Heading */}
      <div className="detail-header">
        <div>
          <span className="eyebrow"><span /> {property.tag || property.category}</span>
          <h1>{property.name}</h1>
          <div className="detail-header-sub">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} color="var(--gold-dark)" />
              {property.address}
            </span>
            <span>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--gold-dark)' }}>
              <Star size={13} fill="currentColor" />
              <strong>{property.averageRating.toFixed(2)}</strong> ({property.reviewCount} verified reviews)
            </span>
            {property.isVerified && (
              <span className="badge-verified">
                <ShieldCheck size={12} />
                <span>VERIFIED LUXURY STAY</span>
              </span>
            )}
          </div>
        </div>

        <button
          className={`detail-save ${saved ? 'is-saved' : ''}`}
          onClick={onToggleSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid var(--line-strong)',
            padding: '10px 16px',
            background: '#fff',
            fontSize: '11px'
          }}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} color={saved ? '#c94a4a' : 'currentColor'} />
          <span>{saved ? 'Saved in Wishlist' : 'Save Stay'}</span>
        </button>
      </div>

      {/* Gallery */}
      <div className="detail-gallery">
        <img
          src={property.images[0]?.url}
          alt={property.name}
          onClick={() => onOpenGallery(0)}
        />
        <div className="gallery-subgrid">
          {property.images.slice(1, 3).map((img, idx) => (
            <img
              key={img.id || idx}
              src={img.url}
              alt=""
              onClick={() => onOpenGallery(idx + 1)}
            />
          ))}
        </div>
        <button className="gallery-view-all-btn" onClick={() => onOpenGallery(0)}>
          <Sparkles size={14} color="var(--gold-dark)" />
          <span>View all {property.images.length} high-res photographs</span>
        </button>
      </div>

      {/* Detail Layout */}
      <div className="detail-layout">
        <article className="detail-main">
          {/* Quick facts */}
          <div className="property-quick-facts">
            <span><Users size={16} /> Up to {property.maxGuests} guests</span>
            <span><BedDouble size={16} /> {property.bedrooms} private suites</span>
            <span><Bath size={16} /> {property.bathrooms} bathrooms</span>
            <span><ShieldCheck size={16} /> {property.managementModel === 'managed' ? 'Fully Serviced by Maison Véla' : 'Marketplace Partner'}</span>
          </div>

          {/* Narrative */}
          <h2 style={{ font: '400 30px var(--serif)', margin: '28px 0 14px' }}>
            {property.tagline}
          </h2>
          <p className="detail-description">{property.description}</p>

          {/* Verified Amenities */}
          <h3 className="detail-section-title">Considered Amenities</h3>
          <div className="amenities-full-grid">
            {property.amenities.map(amenity => (
              <div key={amenity} className="amenity-item">
                <Check size={16} />
                <span>{amenity}</span>
              </div>
            ))}
          </div>

          {/* Host Profile */}
          <h3 className="detail-section-title">Your Host & Care Team</h3>
          <div className="host-profile-card">
            <div className="host-avatar">
              {property.hostName.charAt(0)}
            </div>
            <div className="host-info">
              <h4>Hosted by {property.hostName}</h4>
              <p>{property.hostType} · Response rate: 100% · Dedicated local butler on call</p>
              <p style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                "We take profound joy in sharing this private home with travellers who appreciate calm, architecture, and considered Indian hospitality."
              </p>
            </div>
          </div>

          {/* House Rules & Policies */}
          <h3 className="detail-section-title">House Rules & Policies</h3>
          <div className="detail-rules-box">
            <div>
              <strong style={{ fontSize: '12px', display: 'block', marginBottom: '10px' }}>ARRIVAL & DEPARTURE</strong>
              <ul className="rules-list">
                <li>Check-in: After {property.checkInTime}</li>
                <li>Check-out: By {property.checkOutTime}</li>
                <li>Digital lock keycode delivered 24 hours prior to arrival</li>
              </ul>
            </div>
            <div>
              <strong style={{ fontSize: '12px', display: 'block', marginBottom: '10px' }}>ESTATE GUIDELINES</strong>
              <ul className="rules-list">
                {property.houseRules.map((rule, idx) => (
                  <li key={idx}><Check size={13} color="var(--gold-dark)" /> {rule}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Location Map Preview */}
          <h3 className="detail-section-title">Location & Neighbourhood</h3>
          <div className="detail-location-box">
            <MapPin size={28} color="var(--gold-dark)" style={{ marginBottom: '8px' }} />
            <h4 style={{ font: '500 18px var(--serif)', margin: '0 0 4px' }}>{property.city}, {property.region}</h4>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 12px' }}>
              Coordinates: {property.coordinates.lat}° N, {property.coordinates.lng}° E
            </p>
            <small style={{ fontSize: '10px', color: 'var(--muted-light)', display: 'block', maxWidth: '420px', margin: '0 auto' }}>
              Exact estate gate directions and private road access details are shared immediately upon confirmed reservation to protect homeowner security.
            </small>
          </div>

          {/* Guest Reviews & Ratings Breakdown */}
          <h3 className="detail-section-title">Guest Impressions</h3>
          <div className="reviews-breakdown-box">
            <div className="review-score-hero">
              <strong>{property.averageRating.toFixed(2)}</strong>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--gold-dark)', display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(n => <Star key={n} size={14} fill="currentColor" />)}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                  Overall guest rating based on {property.reviewCount} verified stays
                </span>
              </div>
            </div>

            <div className="review-criteria-grid">
              <div className="criteria-bar">
                <span>Cleanliness & Linen Standard</span>
                <strong>5.0 / 5.0</strong>
              </div>
              <div className="criteria-bar">
                <span>Accuracy of Photography</span>
                <strong>4.9 / 5.0</strong>
              </div>
              <div className="criteria-bar">
                <span>Concierge & Communication</span>
                <strong>5.0 / 5.0</strong>
              </div>
              <div className="criteria-bar">
                <span>Setting & Location</span>
                <strong>4.9 / 5.0</strong>
              </div>
            </div>

            <div className="reviews-list">
              <div className="review-card">
                <div className="review-header">
                  <span>Eleanor Vance (London)</span>
                  <span style={{ color: 'var(--muted)', fontWeight: 400 }}>August 2026 · Verified Stay</span>
                </div>
                <p className="review-comment">
                  "{property.name} exceeded every expectation. The staff was unobtrusive yet anticipated every need, from sunrise tea to late evening fireside dining. An extraordinary sanctuary."
                </p>
                <div className="review-reply">
                  <strong>Response from Host:</strong> "Thank you Eleanor, it was a pleasure hosting your family. We hope to welcome you back next season."
                </div>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <span>Kabir & Riya Mehta (Mumbai)</span>
                  <span style={{ color: 'var(--muted)', fontWeight: 400 }}>September 2026 · Verified Stay</span>
                </div>
                <p className="review-comment">
                  "From the private pool to the culinary creations of the resident chef, everything was pristine. The true luxury here was the complete peace."
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Sticky Booking Card */}
        <aside>
          <div className="booking-sticky-card">
            <div className="booking-card-rate">
              <div>
                <strong>{formatPrice(nightlyRate)}</strong>
                <span> / night</span>
              </div>
              <span style={{ color: 'var(--gold-dark)', fontSize: '11px' }}>
                ★ {property.averageRating.toFixed(2)}
              </span>
            </div>

            {/* Suite & Accommodation Category Selection */}
            <div
              style={{
                marginBottom: '14px',
                border: '1px solid var(--line)',
                background: '#faf9f6',
                padding: '10px 12px'
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '9px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: '6px',
                  fontWeight: 600
                }}
              >
                SUITE & ACCOMMODATION OPTION
              </label>
              <select
                value={selectedRoomCategory}
                onChange={e => setSelectedRoomCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '11.5px',
                  border: '1px solid var(--line-strong)',
                  background: '#fff',
                  color: 'var(--ink)'
                }}
              >
                {suiteOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} — {formatPrice(opt.price)}/nt
                  </option>
                ))}
              </select>
              <span style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
                {activeSuite.desc}
              </span>
            </div>

            {/* Dates & Guests */}
            <div className="booking-dates-picker">
              <div className="booking-dates-row" ref={dateDropdownRef}>
                <div
                  className={`date-input-cell ${dateDropdownOpen && activeDateField === 'checkIn' ? 'active-cell' : ''}`}
                  onClick={() => {
                    setActiveDateField('checkIn')
                    setDateDropdownOpen(true)
                    setGuestDropdownOpen(false)
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={dateDropdownOpen && activeDateField === 'checkIn'}
                >
                  <div className="date-cell-header">
                    <label>CHECK IN</label>
                    <Calendar size={11} className="date-cell-icon" />
                  </div>
                  <div className="date-cell-display">
                    <span className="date-main-text">{formatDateDisplay(checkIn).date}</span>
                    <span className="date-sub-text">{formatDateDisplay(checkIn).day}</span>
                  </div>
                </div>

                <div
                  className={`date-input-cell ${dateDropdownOpen && activeDateField === 'checkOut' ? 'active-cell' : ''}`}
                  onClick={() => {
                    setActiveDateField('checkOut')
                    setDateDropdownOpen(true)
                    setGuestDropdownOpen(false)
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={dateDropdownOpen && activeDateField === 'checkOut'}
                >
                  <div className="date-cell-header">
                    <label>CHECK OUT</label>
                    <Calendar size={11} className="date-cell-icon" />
                  </div>
                  <div className="date-cell-display">
                    <span className="date-main-text">{formatDateDisplay(checkOut).date}</span>
                    <span className="date-sub-text">{formatDateDisplay(checkOut).day}</span>
                  </div>
                </div>

                {/* Date Dropdown Popover */}
                {dateDropdownOpen && (
                  <div className="date-dropdown-popover" role="dialog" aria-label="Select reservation dates">
                    <div className="date-popover-header">
                      <button
                        type="button"
                        className="date-nav-btn"
                        onClick={handlePrevMonth}
                        aria-label="Previous month"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <span className="date-month-title">{monthName}</span>
                      <button
                        type="button"
                        className="date-nav-btn"
                        onClick={handleNextMonth}
                        aria-label="Next month"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>

                    <div className="date-calendar-weekdays">
                      <span>Su</span>
                      <span>Mo</span>
                      <span>Tu</span>
                      <span>We</span>
                      <span>Th</span>
                      <span>Fr</span>
                      <span>Sa</span>
                    </div>

                    <div className="date-calendar-grid">
                      {/* Empty slots before first day */}
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="date-day-slot empty" />
                      ))}

                      {/* Month Days */}
                      {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map(dayNum => {
                        const dateStr = toDateString(currentYear, currentMonth, dayNum)
                        const isStart = dateStr === checkIn
                        const isEnd = dateStr === checkOut
                        const isInRange = dateStr > checkIn && dateStr < checkOut
                        const isSingle = isStart && checkIn === checkOut

                        let slotClass = 'date-day-slot'
                        if (isStart) slotClass += ' range-start'
                        if (isEnd) slotClass += ' range-end'
                        if (isInRange) slotClass += ' in-range'
                        if (isSingle) slotClass += ' single-day-selected'

                        return (
                          <div key={dayNum} className={slotClass}>
                            <button
                              type="button"
                              className={`date-day-btn ${isStart || isEnd ? 'selected-endpoint' : ''}`}
                              onClick={() => handleDaySelect(dayNum)}
                            >
                              {dayNum}
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {/* Stay Range Meta */}
                    <div className="date-range-meta">
                      <div>
                        <strong>{nights} {nights === 1 ? 'Night' : 'Nights'}</strong> Stay
                        <span style={{ margin: '0 6px', color: 'var(--line-strong)' }}>•</span>
                        <span>{formatDateDisplay(checkIn).date} – {formatDateDisplay(checkOut).date}</span>
                      </div>
                      <span className="date-nights-badge">SELECTED</span>
                    </div>

                    {/* Actions Footer */}
                    <div className="date-popover-actions">
                      <button
                        type="button"
                        className="date-clear-btn"
                        onClick={() => {
                          const todayStr = '2026-11-20'
                          setCheckIn(todayStr)
                          setCheckOut(addDaysToDate(todayStr, 3))
                          setActiveDateField('checkIn')
                        }}
                      >
                        Reset to default
                      </button>
                      <button
                        type="button"
                        className="date-apply-btn"
                        onClick={() => setDateDropdownOpen(false)}
                      >
                        Apply Dates
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="guest-select-cell" ref={guestDropdownRef}>
                <label id="guest-picker-label">GUESTS</label>
                <button
                  type="button"
                  className={`guest-dropdown-trigger ${guestDropdownOpen ? 'active' : ''}`}
                  onClick={() => {
                    setGuestDropdownOpen(!guestDropdownOpen)
                    setDateDropdownOpen(false)
                  }}
                  aria-expanded={guestDropdownOpen}
                  aria-haspopup="dialog"
                  aria-labelledby="guest-picker-label"
                >
                  <div className="guest-trigger-left">
                    <span className="guest-current-val">
                      {guests} {guests === 1 ? 'Guest' : 'Guests'}
                    </span>
                    <span className="guest-capacity-meta">
                      {adults} {adults === 1 ? 'Adult' : 'Adults'}{children > 0 ? `, ${children} ${children === 1 ? 'Child' : 'Children'}` : ''} • Max {property.maxGuests}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`guest-chevron-icon ${guestDropdownOpen ? 'rotated' : ''}`}
                  />
                </button>

                {guestDropdownOpen && (
                  <div className="guest-dropdown-menu" role="dialog" aria-modal="false">
                    {/* Adults row */}
                    <div className="guest-counter-item">
                      <div className="guest-counter-text">
                        <span className="guest-counter-title">Adults</span>
                        <span className="guest-counter-desc">Ages 13 and above</span>
                      </div>
                      <div className="guest-stepper">
                        <button
                          type="button"
                          className="guest-stepper-btn"
                          disabled={adults <= 1}
                          onClick={() => handleAdultsChange(adults - 1)}
                          aria-label="Decrease adults"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="guest-stepper-num">{adults}</span>
                        <button
                          type="button"
                          className="guest-stepper-btn"
                          disabled={adults + children >= property.maxGuests}
                          onClick={() => handleAdultsChange(adults + 1)}
                          aria-label="Increase adults"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Children row */}
                    <div className="guest-counter-item">
                      <div className="guest-counter-text">
                        <span className="guest-counter-title">Children</span>
                        <span className="guest-counter-desc">Ages 2–12</span>
                      </div>
                      <div className="guest-stepper">
                        <button
                          type="button"
                          className="guest-stepper-btn"
                          disabled={children <= 0}
                          onClick={() => handleChildrenChange(children - 1)}
                          aria-label="Decrease children"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="guest-stepper-num">{children}</span>
                        <button
                          type="button"
                          className="guest-stepper-btn"
                          disabled={adults + children >= property.maxGuests}
                          onClick={() => handleChildrenChange(children + 1)}
                          aria-label="Increase children"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Capacity notice */}
                    <div className="guest-dropdown-notice">
                      <span>This private sanctuary accommodates up to <strong>{property.maxGuests} guests</strong>.</span>
                    </div>

                    {/* Quick Select Presets */}
                    <div className="guest-quick-presets">
                      <span className="guest-presets-label">QUICK SELECT</span>
                      <div className="guest-preset-chips">
                        {[1, 2, Math.min(4, property.maxGuests), property.maxGuests]
                          .filter((v, i, a) => a.indexOf(v) === i && v <= property.maxGuests)
                          .map(num => (
                            <button
                              key={num}
                              type="button"
                              className={`guest-preset-chip ${guests === num && children === 0 ? 'active' : ''}`}
                              onClick={() => handleQuickSelectGuests(num)}
                            >
                              {num} {num === 1 ? 'Guest' : 'Guests'}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="guest-dropdown-actions">
                      <span className="guest-total-summary">
                        Total: <strong>{guests} {guests === 1 ? 'Guest' : 'Guests'}</strong>
                      </span>
                      <button
                        type="button"
                        className="guest-dropdown-close-btn"
                        onClick={() => setGuestDropdownOpen(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="coupon-input-wrap">
              <input
                placeholder="PROMO CODE (VELA10)"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
              />
              <button type="submit" className="coupon-btn">
                Apply
              </button>
            </form>

            {/* Transparent Price Breakdown */}
            <div className="price-breakdown-list">
              <div className="price-breakdown-item">
                <span>{formatPrice(property.baseNightlyPrice)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                <span>{formatPrice(accommodationTotal)}</span>
              </div>
              <div className="price-breakdown-item">
                <span>Turnover & linen service</span>
                <span>{formatPrice(cleaningFee)}</span>
              </div>
              <div className="price-breakdown-item">
                <span>Platform Concierge & care fee (12%)</span>
                <span>{formatPrice(guestServiceFee)}</span>
              </div>
              <div className="price-breakdown-item">
                <span>Applicable GST (18%)</span>
                <span>{formatPrice(taxes)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="price-breakdown-item discount">
                  <span>Promotional Privilege ({appliedCoupon})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
            </div>

            <div className="price-total-row">
              <span>Total Payable</span>
              <span>{formatPrice(grossTotal)}</span>
            </div>

            <button className="reserve-btn-main" onClick={handleReserve}>
              Reserve Stay · {formatPrice(grossTotal)}
            </button>

            <p className="booking-safe-notice">
              You won't be charged yet. Dates and inventory are locked securely in real-time.
            </p>
          </div>
        </aside>
      </div>

      {/* Similar Stays */}
      {similarProperties.length > 0 && (
        <section style={{ marginTop: '80px', borderTop: '1px solid var(--line)', paddingTop: '60px' }}>
          <span className="eyebrow"><span /> SIMILAR HOMES IN THE COLLECTION</span>
          <h2 style={{ font: '400 32px var(--serif)', margin: '12px 0 28px' }}>
            You May Also Appreciate
          </h2>
          <div className="property-grid">
            {similarProperties.map(p => (
              <div
                key={p.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  padding: '16px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  onOpenProperty(p)
                }}
              >
                <img
                  src={p.images[0]?.url}
                  alt={p.name}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', marginBottom: '12px' }}
                />
                <h4 style={{ font: '500 17px var(--serif)', margin: '0 0 4px' }}>{p.name}</h4>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{p.city}, {p.region}</span>
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--line)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{formatPrice(p.baseNightlyPrice)}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--gold-dark)' }}>Explore Villa →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
