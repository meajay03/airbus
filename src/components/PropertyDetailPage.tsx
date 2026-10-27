import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Property, BookingPriceBreakdown, ConciergeService } from '../data/properties'
import { DetailView } from './DetailView'
import { LuxuryApiClient } from '../services/api'
import { ArrowLeft } from 'lucide-react'

interface PropertyDetailPageProps {
  properties: Property[]
  savedPropertyIds: string[]
  onToggleSave: (id: string) => void
  onOpenGallery: (index: number) => void
  onOpenCheckout: (
    property: Property,
    checkIn: string,
    checkOut: string,
    guests: number,
    priceBreakdown: BookingPriceBreakdown,
    couponCode: string,
    conciergeServices: string[]
  ) => void
  conciergeServices: ConciergeService[]
}

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = ({
  properties,
  savedPropertyIds,
  onToggleSave,
  onOpenGallery,
  onOpenCheckout,
  conciergeServices
}) => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return

    // 1. Check in local properties array
    const found = properties.find(p => p.slug === slug || p.id === slug)
    if (found) {
      setProperty(found)
      setLoading(false)
      return
    }

    // 2. Fetch live from PostgreSQL backend if not in memory
    setLoading(true)
    LuxuryApiClient.getPropertyBySlug(slug)
      .then(res => {
        if (res.property) {
          setProperty(res.property)
        }
      })
      .catch(err => {
        console.error('Error fetching property from PostgreSQL:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug, properties])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="eyebrow"><span /> MAISON VÉLA PORTFOLIO</span>
        <h2 style={{ font: '400 28px var(--serif)', marginTop: '14px', color: 'var(--ink)' }}>
          Retrieving Sanctuary Details...
        </h2>
      </div>
    )
  }

  if (!property) {
    return (
      <div style={{ minHeight: '60vh', padding: '80px 24px', textAlign: 'center' }}>
        <span className="eyebrow" style={{ justifyContent: 'center' }}><span /> 404 NOT FOUND</span>
        <h2 style={{ font: '400 36px var(--serif)', margin: '16px 0 12px' }}>Sanctuary Not Found</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px' }}>
          The requested luxury property "{slug}" could not be located in our active portfolio.
        </p>
        <button
          className="btn-gold"
          onClick={() => navigate('/explore')}
        >
          <ArrowLeft size={14} /> Return to The Collection
        </button>
      </div>
    )
  }

  const similar = properties.filter(p => p.id !== property.id && (p.category === property.category || p.region === property.region)).slice(0, 3)

  return (
    <DetailView
      property={property}
      saved={savedPropertyIds.includes(property.id)}
      onToggleSave={() => onToggleSave(property.id)}
      onBack={() => navigate(-1)}
      onOpenGallery={onOpenGallery}
      onOpenCheckout={(checkIn, checkOut, guests, priceBreakdown, couponCode, conciergeServs) => {
        onOpenCheckout(property, checkIn, checkOut, guests, priceBreakdown, couponCode, conciergeServs)
      }}
      similarProperties={similar}
      onOpenProperty={(p) => {
        navigate(`/properties/${p.slug || p.id}`)
      }}
      conciergeServices={conciergeServices}
    />
  )
}
