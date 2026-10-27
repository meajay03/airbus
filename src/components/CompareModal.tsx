import React from 'react'
import { X, Check, ArrowRight } from 'lucide-react'
import { Property } from '../data/properties'
import './CompareModal.css'

interface CompareModalProps {
  properties: Property[]
  onClose: () => void
  onSelectProperty: (property: Property) => void
}

export const CompareModal: React.FC<CompareModalProps> = ({
  properties,
  onClose,
  onSelectProperty
}) => {
  const formatPrice = (price: number) => `₹${new Intl.NumberFormat('en-IN').format(price)}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close comparison">
          <X size={20} />
        </button>

        <span className="eyebrow"><span /> MAISON VÉLA PORTFOLIO COMPARISON</span>
        <h2 style={{ font: '400 32px var(--serif)', margin: '12px 0 24px' }}>
          Compare Luxury Stays
        </h2>

        {properties.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            No properties selected for comparison. Select "Compare" on any property card to view side-by-side details.
          </p>
        ) : (
          <div className="compare-grid">
            {properties.map(p => (
              <div key={p.id} className="compare-col">
                <img src={p.images[0]?.url} alt={p.name} />
                <h3 style={{ font: '500 18px var(--serif)', margin: '0 0 4px' }}>{p.name}</h3>
                <span style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
                  {p.city}, {p.region}
                </span>

                <div className="compare-row-val">
                  <strong style={{ fontSize: '14px' }}>{formatPrice(p.baseNightlyPrice)}</strong> / night
                </div>
                <div className="compare-row-val">
                  {p.maxGuests} Guests · {p.bedrooms} Beds · {p.bathrooms} Baths
                </div>
                <div className="compare-row-val">
                  Rating: ★ <strong>{p.averageRating}</strong> ({p.reviewCount} reviews)
                </div>
                <div className="compare-row-val">
                  Type: {p.accommodationType} ({p.managementModel === 'managed' ? 'Fully Managed' : 'Marketplace'})
                </div>
                <div className="compare-row-val">
                  Pool: {p.amenities.some(a => a.toLowerCase().includes('pool')) ? (
                    <span style={{ color: '#2e7d32', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> Private Pool
                    </span>
                  ) : 'Not listed'}
                </div>
                <div className="compare-row-val">
                  Chef: {p.amenities.some(a => a.toLowerCase().includes('chef') || a.toLowerCase().includes('dining')) ? (
                    <span style={{ color: '#2e7d32', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> Available
                    </span>
                  ) : 'On request'}
                </div>

                <button
                  style={{
                    marginTop: '16px',
                    background: 'var(--charcoal)',
                    color: '#fff',
                    padding: '10px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onClick={() => {
                    onSelectProperty(p)
                    onClose()
                  }}
                >
                  <span>View Details</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
