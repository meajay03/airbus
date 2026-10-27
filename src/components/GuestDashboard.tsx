import React, { useState } from 'react'
import { Calendar, MapPin, Users, Heart, Send, AlertCircle, ArrowRight } from 'lucide-react'
import { Booking, Property } from '../data/properties'
import './GuestDashboard.css'

interface GuestDashboardProps {
  bookings: Booking[]
  savedPropertyIds: string[]
  properties: Property[]
  onOpenProperty: (property: Property) => void
  onCancelBooking: (bookingId: string) => void
}

export const GuestDashboard: React.FC<GuestDashboardProps> = ({
  bookings,
  savedPropertyIds,
  properties,
  onOpenProperty,
  onCancelBooking
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'wishlist' | 'messages'>('upcoming')
  const [selectedBookingForMessage, setSelectedBookingForMessage] = useState<Booking | null>(bookings[0] || null)
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: string; text: string; time: string }[]>([
    {
      id: 'm1',
      sender: 'Aarav Singhania',
      text: 'Good evening! Could we arrange an airport pickup from Dabolim around 3:30 PM?',
      time: '10:15 AM'
    },
    {
      id: 'm2',
      sender: 'Devika Mehra (Maison Véla Concierge)',
      text: 'Good evening Aarav! Absolutely. Our Mercedes chauffeur will be waiting at arrivals with chilled spring water and towels. We look forward to welcoming you.',
      time: '10:30 AM'
    }
  ])
  const [messageInput, setMessageInput] = useState('')
  const [showCancelModal, setShowCancelModal] = useState<Booking | null>(null)

  const formatPrice = (price: number) => `₹${new Intl.NumberFormat('en-IN').format(price)}`

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending_payment')
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')
  const savedProperties = properties.filter(p => savedPropertyIds.includes(p.id))

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    setChatMessages(prev => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        sender: 'Aarav Singhania',
        text: messageInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
    setMessageInput('')
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow"><span /> GUEST PRIVILEGE PORTAL</span>
          <h1>Welcome, Aarav</h1>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
            Maison Véla Privilege Member · aarav@singhania.com · +91 98201 54321
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block' }}>MEMBERSHIP STATUS</span>
            <strong style={{ fontSize: '13px', color: 'var(--gold-dark)', letterSpacing: '1px' }}>
              PRIVILEGE ELITE
            </strong>
          </div>
        </div>
      </div>

      <div className="dash-tabs">
        <button
          className={`dash-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming Escapes ({upcomingBookings.length})
        </button>
        <button
          className={`dash-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past Stays & Receipts ({pastBookings.length})
        </button>
        <button
          className={`dash-tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          Saved Wishlists ({savedProperties.length})
        </button>
        <button
          className={`dash-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Concierge & Host Messages
        </button>
      </div>

      {/* UPCOMING STAYS */}
      {activeTab === 'upcoming' && (
        <div>
          {upcomingBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
              <p>You have no upcoming stays currently scheduled.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {upcomingBookings.map(b => (
                <div
                  key={b.id}
                  className="dashboard-booking-card"
                >
                  <img
                    src={b.propertyCoverImage}
                    alt={b.propertyName}
                    className="dash-card-image"
                  />

                  <div className="dash-card-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span
                        style={{
                          background: '#e8f5e9',
                          color: '#2e7d32',
                          padding: '3px 8px',
                          fontSize: '8.5px',
                          fontWeight: 600,
                          letterSpacing: '1px'
                        }}
                      >
                        CONFIRMED RESERVATION
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>
                        REF: <strong>{b.reference}</strong>
                      </span>
                    </div>

                    <h3 style={{ font: '500 20px var(--serif)', margin: '0 0 4px' }}>
                      {b.propertyName}
                    </h3>
                    <p style={{ margin: '0 0 10px', fontSize: '11.5px', color: 'var(--muted)' }}>
                      <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {b.propertyCity}
                    </p>

                    <div style={{ display: 'flex', gap: '18px', fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                      <span>
                        <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        {b.checkIn} to {b.checkOut} ({b.priceBreakdown.nights} nights)
                      </span>
                      <span>
                        <Users size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        {b.guests} Guests
                      </span>
                    </div>

                    {b.conciergeServicesBooked.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '10.5px', color: 'var(--gold-dark)' }}>
                        ★ Included Experiences: {b.conciergeServicesBooked.join(', ')}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block' }}>TOTAL PAID</span>
                      <strong style={{ fontSize: '16px' }}>{formatPrice(b.priceBreakdown.grossTotal)}</strong>
                    </div>

                    <button
                      style={{
                        border: '1px solid var(--line-strong)',
                        padding: '8px 14px',
                        fontSize: '10px',
                        background: '#fff'
                      }}
                      onClick={() => {
                        setSelectedBookingForMessage(b)
                        setActiveTab('messages')
                      }}
                    >
                      Message Host
                    </button>

                    <button
                      style={{
                        color: 'var(--danger)',
                        fontSize: '10px',
                        textDecoration: 'underline'
                      }}
                      onClick={() => setShowCancelModal(b)}
                    >
                      Cancel Reservation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAST STAYS */}
      {activeTab === 'past' && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Property</th>
                <th>Dates</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pastBookings.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.reference}</strong></td>
                  <td>{b.propertyName} ({b.propertyCity})</td>
                  <td>{b.checkIn} to {b.checkOut}</td>
                  <td>{b.paymentMethod}</td>
                  <td><strong>{formatPrice(b.priceBreakdown.grossTotal)}</strong></td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        fontSize: '9px',
                        background: b.status === 'completed' ? '#e8f5e9' : '#ffebee',
                        color: b.status === 'completed' ? '#2e7d32' : '#c62828'
                      }}
                    >
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SAVED WISHLIST */}
      {activeTab === 'wishlist' && (
        <div>
          {savedProperties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
              <Heart size={32} style={{ marginBottom: '12px' }} />
              <p>Your wishlist is currently empty. Explore the collection and save your favorite stays.</p>
            </div>
          ) : (
            <div className="property-grid">
              {savedProperties.map(p => (
                <div
                  key={p.id}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--line)',
                    padding: '16px',
                    cursor: 'pointer'
                  }}
                  onClick={() => onOpenProperty(p)}
                >
                  <img
                    src={p.images[0]?.url}
                    alt={p.name}
                    style={{ width: '100%', height: '180px', objectFit: 'cover', marginBottom: '12px' }}
                  />
                  <h4 style={{ font: '500 18px var(--serif)', margin: '0 0 4px' }}>{p.name}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{p.city}, {p.region}</span>
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--line)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{formatPrice(p.baseNightlyPrice)}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View Villa <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MESSAGES */}
      {activeTab === 'messages' && (
        <div className="messages-layout-grid">
          {/* Booking / Host list */}
          <div className="messages-sidebar">
            <span style={{ fontSize: '8.5px', letterSpacing: '1.2px', color: 'var(--muted)', display: 'block', marginBottom: '12px' }}>
              STAY CONVERSATIONS
            </span>
            {bookings.map(b => (
              <div
                key={b.id}
                style={{
                  padding: '10px',
                  background: selectedBookingForMessage?.id === b.id ? 'var(--gold-light)' : 'transparent',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  borderLeft: selectedBookingForMessage?.id === b.id ? '2px solid var(--gold)' : '2px solid transparent'
                }}
                onClick={() => setSelectedBookingForMessage(b)}
              >
                <strong style={{ fontSize: '12px', display: 'block' }}>{b.propertyName}</strong>
                <small style={{ color: 'var(--muted)', fontSize: '10px' }}>Ref: {b.reference}</small>
              </div>
            ))}
          </div>

          {/* Conversation view */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '16px' }}>
              <strong style={{ font: '500 16px var(--serif)' }}>
                {selectedBookingForMessage ? selectedBookingForMessage.propertyName : 'Host Support'}
              </strong>
              <small style={{ display: 'block', color: 'var(--muted)', fontSize: '10px' }}>
                Direct encrypted channel with homeowner & dedicated Maison Véla concierge
              </small>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'Aarav Singhania' ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    background: msg.sender === 'Aarav Singhania' ? 'var(--charcoal)' : '#faf9f6',
                    color: msg.sender === 'Aarav Singhania' ? '#fff' : 'var(--ink)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)'
                  }}
                >
                  <span style={{ fontSize: '9px', opacity: 0.8, display: 'block', marginBottom: '4px' }}>
                    {msg.sender} · {msg.time}
                  </span>
                  <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6 }}>{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <input
                style={{ flex: 1, border: '1px solid var(--line)', padding: '10px 14px', fontSize: '12px' }}
                placeholder="Type instructions or questions for host / concierge..."
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
              />
              <button
                type="submit"
                style={{ background: 'var(--charcoal)', color: '#fff', padding: '0 18px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}
              >
                <span>Send</span>
                <Send size={12} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CANCELLATION & REFUND MODAL */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(null)}>
          <div className="modal-window" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', marginBottom: '14px' }}>
              <AlertCircle size={22} />
              <h3 style={{ font: '500 20px var(--serif)', margin: 0 }}>Cancel Stay Reservation</h3>
            </div>

            <p style={{ fontSize: '12.5px', lineHeight: 1.7, color: 'var(--muted)' }}>
              Are you sure you wish to cancel reservation <strong>{showCancelModal.reference}</strong> at {showCancelModal.propertyName}?
            </p>

            <div style={{ background: '#faf9f6', border: '1px solid var(--line)', padding: '14px', margin: '16px 0', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Original Gross Total:</span>
                <span>{formatPrice(showCancelModal.priceBreakdown.grossTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2e7d32', fontWeight: 600 }}>
                <span>Estimated Refund (95% net):</span>
                <span>{formatPrice(Math.round(showCancelModal.priceBreakdown.grossTotal * 0.95))}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{ flex: 1, border: '1px solid var(--line)', padding: '12px', fontSize: '11px' }}
                onClick={() => setShowCancelModal(null)}
              >
                Keep Reservation
              </button>
              <button
                style={{ flex: 1, background: 'var(--danger)', color: '#fff', padding: '12px', fontSize: '11px' }}
                onClick={() => {
                  onCancelBooking(showCancelModal.id)
                  setShowCancelModal(null)
                }}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
