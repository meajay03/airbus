import React, { useState } from 'react'
import { Sparkles, X, Send, ArrowRight, Users } from 'lucide-react'
import { Property, ConciergeService } from '../data/properties'
import './AIConciergeModal.css'

interface AIConciergeModalProps {
  onClose: () => void
  onSelectProperty: (property: Property) => void
  properties: Property[]
  conciergeServices: ConciergeService[]
}

interface ChatMessage {
  id: string
  sender: 'ai' | 'user'
  text: string
  recommendation?: {
    property: Property
    itinerary: { day: string; title: string; activities: string[] }[]
    estimatedBudget: {
      nights: number
      nightlyRate: number
      totalAccommodation: number
      taxesAndFees: number
      estimatedGrossTotal: number
      currency: string
    }
  }
}

export const AIConciergeModal: React.FC<AIConciergeModalProps> = ({
  onClose,
  onSelectProperty,
  properties
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: 'Good day. I am your Maison Véla Travel Concierge. Tell me about your upcoming escape — destination, guest count, or special wishes such as private chefs, beachfront settings, or alpine hideaways.'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const samplePrompts = [
    'Private pool villa in Goa for 6 with a private chef',
    'Royal palace in Udaipur for an anniversary trip',
    'Cozy mountain timber retreat with fireplace in Landour'
  ]

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputValue
    if (!textToSend.trim() || loading) return

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend
    }

    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setLoading(true)

    try {
      // Attempt backend API call
      const res = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend })
      })

      if (res.ok) {
        const data = await res.json()
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.message,
          recommendation: {
            property: data.featuredProperty,
            itinerary: data.itinerary,
            estimatedBudget: data.estimatedBudget
          }
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        throw new Error('API fallback')
      }
    } catch {
      // Local client-side intelligence fallback
      const q = textToSend.toLowerCase()
      let matched = properties[0]

      if (q.includes('goa') || q.includes('beach') || q.includes('pool')) {
        matched = properties.find(p => p.slug.includes('casa-serena') || p.city.toLowerCase() === 'assagao') || properties[0]
      } else if (q.includes('udaipur') || q.includes('royal') || q.includes('palace')) {
        matched = properties.find(p => p.slug.includes('haveli-nilaya')) || properties[0]
      } else if (q.includes('landour') || q.includes('mountain') || q.includes('fire')) {
        matched = properties.find(p => p.slug.includes('pahadi-house')) || properties[0]
      }

      const stay3Nights = matched.baseNightlyPrice * 3
      const fees = Math.round(stay3Nights * 0.12) + Math.round((stay3Nights + Math.round(stay3Nights * 0.12)) * 0.18) + matched.cleaningFee

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `I have curated the ideal luxury retreat matching your criteria: **${matched.name}** in ${matched.city}, ${matched.region}. It accommodates up to ${matched.maxGuests} guests with ${matched.bedrooms} bedrooms, private pool, and verified hospitality staff.`,
        recommendation: {
          property: matched,
          itinerary: [
            {
              day: 'Day 1: Arrival & Welcome',
              title: 'Sanctuary Arrival & Private Sunset Dinner',
              activities: ['Chauffeured arrival transfer', 'Private pool acclimation', 'Multi-course welcome dinner by resident chef']
            },
            {
              day: 'Day 2: Coastal / Nature Immersion',
              title: 'Curated Excursion & In-Villa Sunset Salon',
              activities: ['Champagne cruise / estate walk', 'In-villa sound therapy massage', 'Evening wine tasting']
            }
          ],
          estimatedBudget: {
            nights: 3,
            nightlyRate: matched.baseNightlyPrice,
            totalAccommodation: stay3Nights,
            taxesAndFees: fees,
            estimatedGrossTotal: stay3Nights + fees,
            currency: 'INR'
          }
        }
      }
      setMessages(prev => [...prev, aiMsg])
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => `₹${new Intl.NumberFormat('en-IN').format(price)}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window ai-modal-window" onClick={e => e.stopPropagation()}>
        <div className="ai-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="#aa8a5c" />
            <div>
              <strong style={{ font: '400 18px var(--serif)', letterSpacing: '0.5px' }}>
                Maison Véla Travel Concierge
              </strong>
              <small style={{ display: 'block', fontSize: '9px', color: '#c5c0b4', letterSpacing: '1px' }}>
                AI LUXURY STAY ADVISOR · REAL INVENTORY BACKED
              </small>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#fff' }} aria-label="Close concierge">
            <X size={20} />
          </button>
        </div>

        <div className="ai-chat-body">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{msg.text}</p>

              {msg.recommendation && (
                <div
                  style={{
                    marginTop: '16px',
                    background: '#ffffff',
                    border: '1px solid var(--line)',
                    padding: '16px',
                    borderRadius: '2px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                    <img
                      src={msg.recommendation.property.images[0]?.url}
                      alt={msg.recommendation.property.name}
                      style={{ width: '90px', height: '65px', objectFit: 'cover' }}
                    />
                    <div>
                      <h4 style={{ margin: '0 0 2px', font: '500 16px var(--serif)' }}>
                        {msg.recommendation.property.name}
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {msg.recommendation.property.city}, {msg.recommendation.property.region} · {formatPrice(msg.recommendation.property.baseNightlyPrice)} / night
                      </span>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '10px', marginTop: '4px', color: 'var(--ink-soft)' }}>
                        <span><Users size={11} /> Up to {msg.recommendation.property.maxGuests} guests</span>
                        <span>★ {msg.recommendation.property.averageRating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Curated Itinerary */}
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '9px', letterSpacing: '1px', fontWeight: 600, color: 'var(--gold-dark)', display: 'block', marginBottom: '6px' }}>
                      SUGGESTED BESPOKE ITINERARY
                    </span>
                    {msg.recommendation.itinerary.map(item => (
                      <div key={item.day} style={{ marginBottom: '6px', fontSize: '11px' }}>
                        <strong>{item.day}:</strong> {item.title}
                      </div>
                    ))}
                  </div>

                  {/* Estimated Trip Budget */}
                  <div style={{ background: 'var(--paper)', padding: '10px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block' }}>ESTIMATED 3-NIGHT TOTAL (INCL. TAXES & FEES)</span>
                      <strong style={{ fontSize: '14px' }}>{formatPrice(msg.recommendation.estimatedBudget.estimatedGrossTotal)}</strong>
                    </div>
                    <button
                      style={{
                        background: 'var(--charcoal)',
                        color: '#fff',
                        padding: '8px 14px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => {
                        onSelectProperty(msg.recommendation!.property)
                        onClose()
                      }}
                    >
                      <span>Explore & Book</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble ai" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
              Maison Véla Concierge is checking villa availability, chef schedules and composing your bespoke itinerary...
            </div>
          )}
        </div>

        {/* Quick Sample Prompts */}
        <div style={{ background: '#faf9f6', padding: '8px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {samplePrompts.map(prompt => (
            <button
              key={prompt}
              style={{
                fontSize: '9.5px',
                padding: '4px 10px',
                border: '1px solid var(--line-strong)',
                background: '#fff',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
                color: 'var(--ink-soft)'
              }}
              onClick={() => handleSend(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          className="ai-input-form"
          onSubmit={e => {
            e.preventDefault()
            handleSend()
          }}
        >
          <input
            placeholder="Ask about properties, chef services, group stays, or custom travel plans..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
          <button
            type="submit"
            style={{
              background: 'var(--charcoal)',
              color: '#fff',
              padding: '0 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px'
            }}
          >
            <span>Send</span>
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  )
}
