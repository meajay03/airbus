import React from 'react'
import { Heart, Star, Users, BedDouble, Bath, Check } from 'lucide-react'
import { Property } from '../data/properties'
import './PropertyCard.css'

interface PropertyCardProps {
  property: Property
  onOpen: () => void
  saved: boolean
  onToggleSave: () => void
  isCompared?: boolean
  onToggleCompare?: () => void
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onOpen,
  saved,
  onToggleSave,
  isCompared = false,
  onToggleCompare
}) => {
  const formatPrice = (price: number) => `₹${new Intl.NumberFormat('en-IN').format(price)}`

  return (
    <article className="property-card">
      <div className="card-image-button">
        <img
          className="card-image"
          src={property.images[0]?.url || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80'}
          alt={`${property.name}, ${property.city}`}
          loading="lazy"
          onClick={onOpen}
          style={{ cursor: 'pointer' }}
        />
        <span className="image-tag">{property.tag || property.category}</span>

        {/* Save to wishlist button */}
        <button
          className={`save-button ${saved ? 'is-saved' : ''}`}
          aria-label={saved ? 'Remove from wishlist' : 'Save stay'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleSave()
          }}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>

        {/* Compare selector */}
        {onToggleCompare && (
          <label
            className="compare-checkbox"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isCompared}
              onChange={onToggleCompare}
            />
            <span>COMPARE</span>
          </label>
        )}
      </div>

      <div className="card-info" onClick={onOpen} style={{ cursor: 'pointer' }}>
        <div className="card-title-row">
          <span className="card-title">{property.name}</span>
          <span className="rating" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Star size={12} fill="currentColor" />
            <span>{property.averageRating.toFixed(2)}</span>
          </span>
        </div>

        <span className="card-location">
          {property.city}, {property.region} · {property.accommodationType}
        </span>

        <div className="card-facts">
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={12} /> {property.maxGuests} guests
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BedDouble size={12} /> {property.bedrooms} beds
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Bath size={12} /> {property.bathrooms} baths
          </span>
        </div>

        {property.isVerified && (
          <div style={{ marginTop: '8px', fontSize: '9px', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={11} /> Verified Luxury Standard
          </div>
        )}

        <span className="card-price">
          <strong>{formatPrice(property.baseNightlyPrice)}</strong> <span>/ night</span>
        </span>
      </div>
    </article>
  )
}
