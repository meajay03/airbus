import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, SlidersHorizontal, MapPin, Map as MapIcon,
  LayoutGrid, Sparkles, Check, ArrowRight
} from 'lucide-react'
import { Property } from '../data/properties'
import { PropertyCard } from './PropertyCard'
import './ExploreView.css'

interface ExploreViewProps {
  properties: Property[]
  onOpenProperty?: (property: Property) => void
  savedPropertyIds: string[]
  onToggleSave: (id: string) => void
  comparedPropertyIds: string[]
  onToggleCompare: (id: string) => void
  onOpenCompareModal: () => void
  onBackToHome?: () => void
  initialCategory?: string
  initialDestination?: string
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  properties,
  onOpenProperty,
  savedPropertyIds,
  onToggleSave,
  comparedPropertyIds,
  onToggleCompare,
  onOpenCompareModal,
  onBackToHome,
  initialCategory = 'All stays',
  initialDestination = ''
}) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const urlDest = searchParams.get('destination') || initialDestination
  const urlCat = searchParams.get('category') || initialCategory

  const [destinationQuery, setDestinationQuery] = useState(urlDest)
  const [selectedCategory, setSelectedCategory] = useState(urlCat)
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recommended')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

  useEffect(() => {
    const d = searchParams.get('destination')
    const c = searchParams.get('category')
    if (d !== null) setDestinationQuery(d)
    if (c !== null) setSelectedCategory(c)
  }, [searchParams])

  // Filter states
  const [maxPrice, setMaxPrice] = useState(100000)
  const [minBedrooms, setMinBedrooms] = useState(0)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const categories = [
    'All stays',
    'Private Pool Villas',
    'Beachfront Estates',
    'Mountain Retreats',
    'Royal Residences',
    'Urban Penthouses'
  ]

  const availableAmenities = [
    'Private pool',
    'Chef on request',
    'Beach access',
    'Mountain views',
    'Fireplace',
    'Butler service',
    'Pet friendly'
  ]

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
  }

  // Filtered properties
  const filteredProperties = useMemo(() => {
    let list = properties.filter(p => {
      // Category
      if (selectedCategory !== 'All stays' && p.category !== selectedCategory) return false

      // Destination search
      if (destinationQuery.trim()) {
        const q = destinationQuery.toLowerCase().trim()
        const match =
          p.name.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.region.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
        if (!match) return false
      }

      // Max price
      if (p.baseNightlyPrice > maxPrice) return false

      // Min bedrooms
      if (minBedrooms > 0 && p.bedrooms < minBedrooms) return false

      // Verified status
      if (verifiedOnly && !p.isVerified) return false

      // Amenities filter
      if (selectedAmenities.length > 0) {
        const hasAll = selectedAmenities.every(req =>
          p.amenities.some(a => a.toLowerCase().includes(req.toLowerCase()))
        )
        if (!hasAll) return false
      }

      return true
    })

    // Sorting
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.baseNightlyPrice - b.baseNightlyPrice)
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.baseNightlyPrice - a.baseNightlyPrice)
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.averageRating - a.averageRating)
    } else if (sortBy === 'capacity') {
      list.sort((a, b) => b.maxGuests - a.maxGuests)
    } else {
      // Recommended: featured first, then rating
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || b.averageRating - a.averageRating)
    }

    return list
  }, [
    properties,
    selectedCategory,
    destinationQuery,
    maxPrice,
    minBedrooms,
    verifiedOnly,
    selectedAmenities,
    sortBy
  ])

  const formatPrice = (price: number) => `₹${new Intl.NumberFormat('en-IN').format(price)}`

  return (
    <main className="explore-page">
      <button className="back-link" onClick={() => onBackToHome ? onBackToHome() : navigate('/')} aria-label="Back to home">
        <ArrowLeft size={15} />
        <span>Back to Maison Véla</span>
      </button>

      <div className="explore-intro">
        <span className="eyebrow"><span /> THE MAISON VÉLA CURATED COLLECTION</span>
        <h1>Somewhere <em>Extraordinary.</em></h1>
        <p>
          Distinctive private villas, royal estates, and beachfront sanctuaries chosen for their soul, craftsmanship, and discreet hospitality.
        </p>
      </div>

      {/* Advanced Filter Bar */}
      <div className="explore-filters-bar">
        {/* Category Pills & View Switcher */}
        <div className="filter-row-top">
          <div className="category-pills">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="view-switchers">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={14} />
              <span>Grid View</span>
            </button>
            <button
              className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              <MapIcon size={14} />
              <span>Map View</span>
            </button>
          </div>
        </div>

        {/* Detailed Controls: Destination, Max Price, Bedrooms, Amenities, Sort */}
        <div className="filter-row-details">
          {/* Destination Search */}
          <div className="filter-select-group" style={{ flex: 1, minWidth: '180px' }}>
            <MapPin size={14} color="var(--gold-dark)" />
            <input
              style={{
                border: '1px solid var(--line)',
                padding: '6px 12px',
                fontSize: '11px',
                width: '100%',
                borderRadius: 'var(--radius-sm)'
              }}
              placeholder="Filter destination (Goa, Udaipur, Landour...)"
              value={destinationQuery}
              onChange={e => setDestinationQuery(e.target.value)}
            />
          </div>

          {/* Max Price Slider */}
          <div className="filter-select-group">
            <span>Budget Up To:</span>
            <strong>{formatPrice(maxPrice)}</strong>
            <input
              type="range"
              min={30000}
              max={120000}
              step={5000}
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              style={{ width: '90px' }}
            />
          </div>

          {/* Bedrooms Selector */}
          <div className="filter-select-group">
            <span>Suites:</span>
            <select
              value={minBedrooms}
              onChange={e => setMinBedrooms(Number(e.target.value))}
            >
              <option value={0}>Any Bedrooms</option>
              <option value={3}>3+ Bedrooms</option>
              <option value={4}>4+ Bedrooms</option>
              <option value={5}>5+ Bedrooms</option>
              <option value={6}>6+ Bedrooms</option>
            </select>
          </div>

          {/* Verified Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
            />
            <span>Verified Luxury Only</span>
          </label>

          {/* Sorting */}
          <div className="filter-select-group" style={{ marginLeft: 'auto' }}>
            <SlidersHorizontal size={14} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="recommended">Curated For You</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Guest Rated</option>
              <option value="capacity">Largest Capacity</option>
            </select>
          </div>
        </div>

        {/* Amenity Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '10px' }}>
          <span style={{ fontSize: '9px', letterSpacing: '1px', color: 'var(--muted)', fontWeight: 600 }}>
            AMENITIES:
          </span>
          <div className="amenity-chips">
            {availableAmenities.map(amenity => (
              <button
                key={amenity}
                className={`amenity-chip ${selectedAmenities.includes(amenity) ? 'active' : ''}`}
                onClick={() => toggleAmenity(amenity)}
              >
                {selectedAmenities.includes(amenity) && <Check size={11} style={{ display: 'inline', marginRight: '3px' }} />}
                {amenity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Count */}
      <div style={{ marginBottom: '20px', fontSize: '12px', color: 'var(--muted)' }}>
        Showing <strong>{filteredProperties.length}</strong> extraordinary stays matching your preferences
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div>
          {filteredProperties.length === 0 ? (
            <div className="empty-state">
              <Sparkles size={28} color="var(--gold-dark)" />
              <h2>A little more room to wander?</h2>
              <p>We couldn’t find stays matching all applied criteria. Try broadening your budget or destination search.</p>
              <button
                className="text-link"
                onClick={() => {
                  setSelectedCategory('All stays')
                  setDestinationQuery('')
                  setMaxPrice(120000)
                  setMinBedrooms(0)
                  setSelectedAmenities([])
                  setVerifiedOnly(false)
                }}
              >
                Reset all filters <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="property-grid">
              {filteredProperties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onOpen={() => onOpenProperty ? onOpenProperty(property) : navigate(`/properties/${property.slug || property.id}`)}
                  saved={savedPropertyIds.includes(property.id)}
                  onToggleSave={() => onToggleSave(property.id)}
                  isCompared={comparedPropertyIds.includes(property.id)}
                  onToggleCompare={() => onToggleCompare(property.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* INTERACTIVE MAP VIEW */}
      {viewMode === 'map' && (
        <div className="interactive-map-view">
          {/* Left: Scrollable Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '720px', overflowY: 'auto', paddingRight: '8px' }}>
            {filteredProperties.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                onOpen={() => onOpenProperty ? onOpenProperty(property) : navigate(`/properties/${property.slug || property.id}`)}
                saved={savedPropertyIds.includes(property.id)}
                onToggleSave={() => onToggleSave(property.id)}
                isCompared={comparedPropertyIds.includes(property.id)}
                onToggleCompare={() => onToggleCompare(property.id)}
              />
            ))}
          </div>

          {/* Right: Architectural Map Preview */}
          <div className="map-canvas-mock">
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(255,255,255,0.92)', padding: '6px 12px', fontSize: '10px', borderRadius: 'var(--radius-sm)' }}>
                INDIA LUXURY SANCTUARIES · INTERACTIVE GEO MAPPING
              </div>

              {/* Pins placed relative to coordinates */}
              {filteredProperties.map(p => {
                const topPct = 20 + ((p.coordinates.lat - 11) / (31 - 11)) * 60
                const leftPct = 15 + ((p.coordinates.lng - 72) / (79 - 72)) * 70

                return (
                  <button
                    key={p.id}
                    className="map-pin-marker"
                    style={{
                      bottom: `${topPct}%`,
                      left: `${leftPct}%`
                    }}
                    onClick={() => onOpenProperty ? onOpenProperty(p) : navigate(`/properties/${p.slug || p.id}`)}
                    title={`${p.name} (${p.city})`}
                  >
                    {formatPrice(p.baseNightlyPrice)}
                  </button>
                )
              })}

              <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(255,255,255,0.9)', padding: '6px 10px', fontSize: '9px', color: 'var(--muted)' }}>
                Coordinates calibrated for privacy buffer
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Comparison Pill */}
      {comparedPropertyIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--charcoal)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '2px',
            boxShadow: 'var(--shadow-modal)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            zIndex: 50
          }}
        >
          <span style={{ fontSize: '11px' }}>
            <strong>{comparedPropertyIds.length}</strong> {comparedPropertyIds.length === 1 ? 'property' : 'properties'} selected
          </span>
          <button
            style={{
              background: 'var(--gold)',
              color: '#fff',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 600
            }}
            onClick={onOpenCompareModal}
          >
            Compare Now
          </button>
        </div>
      )}
    </main>
  )
}
