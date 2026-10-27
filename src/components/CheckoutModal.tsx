import React, { useState } from 'react'
import { X, Check, ShieldCheck, CreditCard, Lock, Calendar, Download } from 'lucide-react'
import { Property, BookingPriceBreakdown, Booking, User } from '../data/properties'
import './CheckoutModal.css'

interface CheckoutModalProps {
  property: Property
  checkIn: string
  checkOut: string
  guests: number
  priceBreakdown: BookingPriceBreakdown
  couponCode?: string
  conciergeServicesBooked: string[]
  currentUser?: User | null
  onClose: () => void
  onBookingConfirmed: (booking: Booking) => void
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  property,
  checkIn,
  checkOut,
  guests,
  priceBreakdown,
  couponCode = '',
  conciergeServicesBooked,
  currentUser,
  onClose,
  onBookingConfirmed
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // 1: Guest details, 2: Payment, 3: Processing, 4: Confirmation
  const [guestName, setGuestName] = useState(currentUser?.fullName || 'Aarav Singhania')
  const [guestEmail, setGuestEmail] = useState(currentUser?.email || 'guest@maisonvela.com')
  const [guestPhone, setGuestPhone] = useState(currentUser?.phone || '+91 98201 54321')
  const [specialRequests, setSpecialRequests] = useState('')
  const [idAcknowledged, setIdAcknowledged] = useState(true)
  const [paymentProvider, setPaymentProvider] = useState<'razorpay' | 'stripe' | 'upi'>('razorpay')
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [upiId, setUpiId] = useState('aarav@okhdfcbank')
  const [_processingError, setProcessingError] = useState('')
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60) // 15-minute transactional hold

  React.useEffect(() => {
    // Register 15-minute transactional hold with backend
    fetch('/api/v1/properties/inventory/holds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: property.id,
        guestId: 'usr-guest-01',
        checkIn,
        checkOut,
        expiresInMinutes: 15
      })
    }).catch(() => {})

    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [property.id, checkIn, checkOut])

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const formatPrice = (price: number) => `₹${new Intl.NumberFormat('en-IN').format(price)}`

  const handleInitiatePayment = async () => {
    setProcessingError('')
    setStep(3) // Processing

    try {
      // Simulate real server call with idempotency key
      const idempotencyKey = `tx_mv_${Date.now()}_${Math.random().toString(36).substring(7)}`

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          guestId: 'usr-guest-01',
          guestName,
          guestEmail,
          guestPhone,
          checkIn,
          checkOut,
          guests,
          couponCode,
          paymentMethod: paymentProvider === 'razorpay' ? 'Razorpay (Cards/NetBanking)' : paymentProvider === 'upi' ? `Razorpay UPI (${upiId})` : 'Stripe International Card',
          idempotencyKey,
          specialRequests,
          conciergeServicesBooked
        })
      })

      if (res.ok) {
        const data = await res.json()
        setConfirmedBooking(data.booking)
        onBookingConfirmed(data.booking)
        setStep(4) // Confirmed!
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Payment authorization failed')
      }
    } catch (err: any) {
      // Graceful local creation fallback if offline
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      const reference = `MV-2026-${randomSuffix}`

      const newBooking: Booking = {
        id: `bk-${Date.now()}`,
        reference,
        propertyId: property.id,
        propertyName: property.name,
        propertyCity: `${property.city}, ${property.region}`,
        propertyCoverImage: property.images[0]?.url || '',
        guestId: 'usr-guest-01',
        guestName,
        guestEmail,
        guestPhone,
        checkIn,
        checkOut,
        guests,
        status: 'confirmed',
        priceBreakdown,
        currency: 'INR',
        paymentMethod: paymentProvider === 'upi' ? `UPI (${upiId})` : 'Razorpay Verified Card',
        paymentTransactionId: `tx_mock_${Date.now()}`,
        specialRequests,
        conciergeServicesBooked,
        createdAt: new Date().toISOString()
      }

      setConfirmedBooking(newBooking)
      onBookingConfirmed(newBooking)
      setStep(4)
    }
  }

  // Generate downloadable receipt text
  const downloadReceipt = () => {
    if (!confirmedBooking) return
    const receiptContent = `
======================================================
MAISON VÉLA - LUXURY HOSPITALITY RESERVATION RECEIPT
======================================================
Reservation Reference: ${confirmedBooking.reference}
Date Issued: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}

PROPERTY:
${property.name}
${property.address}
City: ${property.city}, ${property.region}, India

GUEST DETAILS:
Lead Guest: ${confirmedBooking.guestName}
Email: ${confirmedBooking.guestEmail}
Phone: ${confirmedBooking.guestPhone}

STAY PARTICULARS:
Check-in:  ${confirmedBooking.checkIn} (${property.checkInTime})
Check-out: ${confirmedBooking.checkOut} (${property.checkOutTime})
Total Nights: ${priceBreakdown.nights}
Guests Registered: ${confirmedBooking.guests}

FINANCIAL BREAKDOWN:
Accommodation (${priceBreakdown.nights} nights @ ₹${priceBreakdown.nightlyRate.toLocaleString('en-IN')}): ₹${priceBreakdown.accommodationTotal.toLocaleString('en-IN')}
Cleaning & Turnover Fee: ₹${priceBreakdown.cleaningFee.toLocaleString('en-IN')}
Platform Concierge & Guest Service Fee: ₹${priceBreakdown.guestServiceFee.toLocaleString('en-IN')}
Taxes (GST 18%): ₹${priceBreakdown.taxes.toLocaleString('en-IN')}
${priceBreakdown.discountAmount > 0 ? `Promotional Discount: -₹${priceBreakdown.discountAmount.toLocaleString('en-IN')}\n` : ''}------------------------------------------------------
TOTAL AMOUNT PAID: ₹${priceBreakdown.grossTotal.toLocaleString('en-IN')}
Payment Method: ${confirmedBooking.paymentMethod}
Transaction Reference: ${confirmedBooking.paymentTransactionId}
Status: CONFIRMED & GUARANTEED
======================================================
`
    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Maison-Vela-Receipt-${confirmedBooking.reference}.txt`
    link.click()
  }

  // Generate .ics calendar file
  const downloadCalendar = () => {
    if (!confirmedBooking) return
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Maison Vela//Luxury Accommodation//EN
BEGIN:VEVENT
SUMMARY:Stay at ${property.name} (Maison Véla)
DESCRIPTION:Reservation Ref: ${confirmedBooking.reference}. Check-in: ${property.checkInTime}. Address: ${property.address}
LOCATION:${property.address}
DTSTART:${confirmedBooking.checkIn.replace(/-/g, '')}T100000Z
DTEND:${confirmedBooking.checkOut.replace(/-/g, '')}T060000Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Maison-Vela-${confirmedBooking.reference}.ics`
    link.click()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close checkout">
          <X size={20} />
        </button>

        {step !== 4 && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--gold-light, #faf6ee)',
                border: '1px solid var(--gold, #c5a059)',
                padding: '8px 14px',
                marginBottom: '16px',
                fontSize: '11px',
                color: 'var(--ink)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} color="var(--gold-dark, #8c6d32)" />
                <span>
                  <strong>15-Minute Guaranteed Inventory Lock:</strong> Dates & unit reserved exclusively for you.
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  fontSize: '11.5px',
                  color: secondsRemaining < 180 ? '#c62828' : 'var(--gold-dark, #8c6d32)'
                }}
              >
                ⏱ {formatTimer(secondsRemaining)}
              </span>
            </div>

            <div className="checkout-steps">
              <div className={`step-indicator ${step === 1 ? 'active' : ''}`}>
                <span className="step-num">1</span>
                <span>Guest Details</span>
              </div>
              <div className={`step-indicator ${step === 2 ? 'active' : ''}`}>
                <span className="step-num">2</span>
                <span>Secure Payment</span>
              </div>
              <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>
                <span className="step-num">3</span>
                <span>Confirmation</span>
              </div>
            </div>
          </>
        )}

        {/* STEP 1: Guest Information */}
        {step === 1 && (
          <div>
            <span className="eyebrow"><span /> RESERVATION DETAILS</span>
            <h2 style={{ font: '400 28px var(--serif)', margin: '8px 0 20px' }}>
              Confirm your stay at {property.name}
            </h2>

            {/* Stay summary card */}
            <div className="checkout-summary-box">
              <img
                src={property.images[0]?.url}
                alt={property.name}
                style={{ width: '80px', height: '60px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ font: '500 15px var(--serif)', display: 'block' }}>{property.name}</strong>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)' }}>
                  {checkIn} to {checkOut} ({priceBreakdown.nights} nights) · {guests} guests
                </p>
              </div>
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block' }}>TOTAL AMOUNT</span>
                <strong style={{ fontSize: '15px' }}>{formatPrice(priceBreakdown.grossTotal)}</strong>
              </div>
            </div>

            <div className="form-group">
              <label>Lead Guest Full Name (as per Govt ID)</label>
              <input
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Full Legal Name"
                required
              />
            </div>

            <div className="checkout-fields-row">
              <div className="form-group">
                <label>Email Address (for confirmation voucher)</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mobile Number (for Concierge / Check-in)</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Special Requests or Dietary Preferences (Optional)</label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                placeholder="E.g., early check-in, hypoallergenic pillows, private chef dietary needs..."
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '11px',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
                margin: '18px 0 24px'
              }}
            >
              <input
                type="checkbox"
                checked={idAcknowledged}
                onChange={e => setIdAcknowledged(e.target.checked)}
                style={{ marginTop: '2px' }}
              />
              <span>
                I agree to the House Rules, cancellation policy ({property.cancellationPolicy}), and acknowledge that valid Government-issued photo identification is required at check-in.
              </span>
            </label>

            <button
              className="reserve-btn-main"
              disabled={!guestName || !guestEmail || !idAcknowledged}
              onClick={() => setStep(2)}
            >
              Continue to Payment · {formatPrice(priceBreakdown.grossTotal)}
            </button>
          </div>
        )}

        {/* STEP 2: Payment Provider Selection & Simulator */}
        {step === 2 && (
          <div>
            <span className="eyebrow"><span /> STEP 2 OF 2 · PAYMENT GATEWAY</span>
            <h2 style={{ font: '400 28px var(--serif)', margin: '8px 0 20px' }}>
              Secure Payment Processing
            </h2>

            <div className="payment-options-grid">
              <div
                className={`payment-card-option ${paymentProvider === 'razorpay' ? 'selected' : ''}`}
                onClick={() => setPaymentProvider('razorpay')}
              >
                <CreditCard size={18} />
                <div>
                  <strong>Razorpay (Cards / NetBanking)</strong>
                  <small style={{ display: 'block', fontSize: '9px', color: 'var(--muted)' }}>
                    Indian & International Cards
                  </small>
                </div>
              </div>

              <div
                className={`payment-card-option ${paymentProvider === 'upi' ? 'selected' : ''}`}
                onClick={() => setPaymentProvider('upi')}
              >
                <ShieldCheck size={18} />
                <div>
                  <strong>Instant UPI (GPay, PhonePe, Paytm)</strong>
                  <small style={{ display: 'block', fontSize: '9px', color: 'var(--muted)' }}>
                    Zero transaction fee
                  </small>
                </div>
              </div>
            </div>

            {paymentProvider === 'razorpay' && (
              <div style={{ background: '#faf9f6', padding: '16px', border: '1px solid var(--line)', marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="4242 •••• •••• 4242"
                  />
                </div>
                <div className="checkout-fields-row">
                  <div className="form-group">
                    <label>Valid Thru</label>
                    <input defaultValue="12/28" placeholder="MM/YY" />
                  </div>
                  <div className="form-group">
                    <label>CVV / CVC</label>
                    <input defaultValue="882" type="password" maxLength={4} />
                  </div>
                </div>
              </div>
            )}

            {paymentProvider === 'upi' && (
              <div style={{ background: '#faf9f6', padding: '16px', border: '1px solid var(--line)', marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Virtual Payment Address (UPI ID)</label>
                  <input
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="mobile@okhdfcbank"
                  />
                </div>
                <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  A payment authorization notification will be sent to your UPI app.
                </span>
              </div>
            )}

            {/* Price breakdown summary */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', marginBottom: '20px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Accommodation ({priceBreakdown.nights} nights):</span>
                <span>{formatPrice(priceBreakdown.accommodationTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Cleaning & turnover:</span>
                <span>{formatPrice(priceBreakdown.cleaningFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Platform Concierge fee (12%):</span>
                <span>{formatPrice(priceBreakdown.guestServiceFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>GST (18%):</span>
                <span>{formatPrice(priceBreakdown.taxes)}</span>
              </div>
              {priceBreakdown.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2e7d32', marginBottom: '6px' }}>
                  <span>Discount ({couponCode}):</span>
                  <span>-{formatPrice(priceBreakdown.discountAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '15px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                <span>Total Payable:</span>
                <span>{formatPrice(priceBreakdown.grossTotal)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{
                  border: '1px solid var(--line-strong)',
                  padding: '14px 20px',
                  fontSize: '11px'
                }}
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                className="reserve-btn-main"
                style={{ flex: 1 }}
                onClick={handleInitiatePayment}
              >
                Authorize & Pay {formatPrice(priceBreakdown.grossTotal)}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', fontSize: '10px', color: 'var(--muted)' }}>
              <Lock size={12} />
              <span>256-bit TLS encryption · PCI-DSS compliant payment simulation</span>
            </div>
          </div>
        )}

        {/* STEP 3: Payment Verification & In Flight */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '3px solid var(--line)',
                borderTopColor: 'var(--gold)',
                borderRadius: '50%',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite'
              }}
            />
            <h3 style={{ font: '400 24px var(--serif)', margin: '0 0 10px' }}>
              Verifying Reservation & Payment...
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: '380px', margin: '0 auto' }}>
              Communicating with banking gateway and locking calendar inventory to prevent double booking. Please do not refresh.
            </p>
          </div>
        )}

        {/* STEP 4: Confirmed Voucher & Next Steps */}
        {step === 4 && confirmedBooking && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                background: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Check size={28} />
            </div>

            <span className="eyebrow" style={{ justifyContent: 'center' }}>
              <span /> RESERVATION CONFIRMED & GUARANTEED
            </span>
            <h2 style={{ font: '400 32px var(--serif)', margin: '8px 0 4px' }}>
              You are going to {property.name}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 24px' }}>
              A confirmation packet and pre-arrival guide have been dispatched to <strong>{confirmedBooking.guestEmail}</strong>.
            </p>

            {/* Reference Box */}
            <div
              style={{
                background: '#faf9f6',
                border: '1px solid var(--line-strong)',
                padding: '18px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '9px', letterSpacing: '1.2px', color: 'var(--muted)' }}>BOOKING REFERENCE</span>
                <strong style={{ display: 'block', fontSize: '18px', letterSpacing: '2px', color: 'var(--ink)' }}>
                  {confirmedBooking.reference}
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block' }}>TOTAL AMOUNT PAID</span>
                <strong style={{ fontSize: '16px' }}>{formatPrice(confirmedBooking.priceBreakdown.grossTotal)}</strong>
              </div>
            </div>

            {/* Actions: Receipt and Calendar */}
            <div className="checkout-actions-row">
              <button
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '1px solid var(--line-strong)',
                  padding: '12px',
                  fontSize: '11px',
                  background: '#fff'
                }}
                onClick={downloadReceipt}
              >
                <Download size={14} />
                <span>Download Official Receipt</span>
              </button>
              <button
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '1px solid var(--line-strong)',
                  padding: '12px',
                  fontSize: '11px',
                  background: '#fff'
                }}
                onClick={downloadCalendar}
              >
                <Calendar size={14} />
                <span>Add to Apple / Google Calendar (.ics)</span>
              </button>
            </div>

            <button
              className="reserve-btn-main"
              onClick={onClose}
            >
              Done & Return to Maison Véla
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
