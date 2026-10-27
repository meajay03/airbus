import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Check, MapPin, Search,
  CalendarDays, Users
} from 'lucide-react'
import { Property } from '../data/properties'
import { PropertyCard } from './PropertyCard'

interface HomeViewProps {
  properties: Property[]
  savedPropertyIds: string[]
  onToggleSave: (id: string) => void
  comparedPropertyIds: string[]
  onToggleCompare: (id: string) => void
  conciergeServices?: any
  onOpenProperty: (property: Property) => void
  onSwitchRole?: (role: 'guest' | 'owner' | 'manager' | 'admin') => void
  showToast: (msg: string) => void
}

export const HomeView: React.FC<HomeViewProps> = ({
  properties,
  savedPropertyIds,
  onToggleSave,
  comparedPropertyIds,
  onToggleCompare,
  onOpenProperty,
  showToast
}) => {
  const navigate = useNavigate()
  const [activeDestination, setActiveDestination] = useState('')
  const [activeCategory, setActiveCategory] = useState('All stays')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = new URLSearchParams()
    if (activeDestination.trim()) query.set('destination', activeDestination.trim())
    if (activeCategory && activeCategory !== 'All stays') query.set('category', activeCategory)
    navigate(`/explore?${query.toString()}`)
  }

  const collections = [
    { title: 'Private Pool Villas', subtitle: 'ASSAGAO & ALIBAUG', count: '14 Sanctuaries', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=85' },
    { title: 'Beachfront Estates', subtitle: 'MORJIM & GOA COAST', count: '9 Sanctuaries', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85' },
    { title: 'Mountain Retreats', subtitle: 'LANDOUR & COONOOR', count: '11 Sanctuaries', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85' },
    { title: 'Royal Residences', subtitle: 'UDAIPUR & JAIPUR', count: '6 Sanctuaries', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85' }
  ]

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=2400&q=90"
          alt="Sunlit private villa framed by tropical palms"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="eyebrow light-eyebrow">
            <span /> STAYS WITH A SENSE OF PLACE
          </span>
          <h1>
            Extraordinary Stays.<br />
            <em>Exceptional</em> Experiences.
          </h1>
          <p>
            A considered collection of private luxury villas, heritage havelis, and beachfront estates across India, chosen for their soul and generous hospitality.
          </p>
          <button
            className="hero-link"
            onClick={() => navigate('/explore')}
          >
            Discover the collection <ArrowRight size={15} />
          </button>
        </div>
        <div className="hero-caption">
          <span>01 / 08</span>
          <span>CASA SERENA · ASSAGAO, GOA</span>
          <span>VERIFIED LUXURY COLLECTION</span>
        </div>
      </section>

      {/* Quick Search Bar */}
      <section className="search-wrap">
        <form className="search-panel" onSubmit={handleSearchSubmit}>
          <label className="search-field">
            <MapPin size={16} />
            <span className="field-copy">
              <span className="field-label">DESTINATION</span>
              <input
                aria-label="Destination"
                placeholder="Goa, Udaipur, Landour..."
                value={activeDestination}
                onChange={e => setActiveDestination(e.target.value)}
              />
            </span>
          </label>

          <label className="search-field">
            <CalendarDays size={16} />
            <span className="field-copy">
              <span className="field-label">CHECK IN</span>
              <input type="text" placeholder="Add dates" onFocus={e => (e.currentTarget.type = 'date')} />
            </span>
          </label>

          <label className="search-field">
            <CalendarDays size={16} />
            <span className="field-copy">
              <span className="field-label">CHECK OUT</span>
              <input type="text" placeholder="Add dates" onFocus={e => (e.currentTarget.type = 'date')} />
            </span>
          </label>

          <label className="search-field">
            <Users size={16} />
            <span className="field-copy">
              <span className="field-label">GUESTS</span>
              <select defaultValue="2 guests">
                <option>2 guests</option>
                <option>4 guests</option>
                <option>6 guests</option>
                <option>8+ guests</option>
              </select>
            </span>
          </label>

          <button type="submit" className="search-submit">
            <Search size={14} />
            <span>Search Stays</span>
          </button>
        </form>
      </section>

      {/* Featured Luxury Villas Section */}
      <section className="section" id="featured">
        <div className="section-wrap">
          <div className="section-heading">
            <div>
              <span className="eyebrow"><span /> CURATED SANCTUARIES</span>
              <h2 className="section-title">Places you’ll remember.</h2>
            </div>
            <div className="heading-side">
              <p className="section-subtitle">
                Each home in our collection is handpicked, privately hosted, and verified for architectural elegance and thoughtful comfort.
              </p>
              <button
                className="view-all-link"
                onClick={() => navigate('/explore')}
              >
                View all stays ({properties.length}) <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="property-grid">
            {properties.slice(0, 4).map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                onOpen={() => onOpenProperty(property)}
                saved={savedPropertyIds.includes(property.id)}
                onToggleSave={() => onToggleSave(property.id)}
                isCompared={comparedPropertyIds.includes(property.id)}
                onToggleCompare={() => onToggleCompare(property.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Curated Collections Showcase */}
      <section className="collections-section" id="collections">
        <div className="collection-top">
          <div>
            <span className="eyebrow"><span /> SIGNATURE THEMES</span>
            <h2>Travel with intention.</h2>
          </div>
          <button
            className="text-link"
            onClick={() => navigate('/explore')}
          >
            Explore all categories <ArrowRight size={14} />
          </button>
        </div>

        <div className="collection-grid">
          {collections.map(c => (
            <button
              key={c.title}
              className="collection-card"
              onClick={() => {
                setActiveCategory(c.title)
                navigate(`/explore?category=${encodeURIComponent(c.title)}`)
              }}
            >
              <img src={c.image} alt={c.title} loading="lazy" />
              <div className="collection-overlay" />
              <div className="collection-copy">
                <small>{c.subtitle}</small>
                <strong>{c.title}</strong>
                <span>{c.count} <ArrowRight size={12} /></span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Editorial Philosophy */}
      <section className="editorial">
        <div className="editorial-photo">
          <img
            src="https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=85"
            alt="Thoughtful architecture in warm natural light"
            loading="lazy"
          />
          <span className="photo-stamp">
            THE VÉLA<br />POINT OF VIEW
          </span>
        </div>

        <div className="editorial-copy">
          <span className="eyebrow"><span /> A MORE PERSONAL WAY TO TRAVEL</span>
          <h2>Luxury lives in<br /><em>the little things.</em></h2>
          <p>
            The right home changes everything. Each stay in our collection is chosen for its character, cared for by people who know it best, and made memorable in all the ways that matter.
          </p>
          <div className="editorial-values">
            <div>
              <span>01</span>
              <strong>Considered homes</strong>
              <small>Selected for architectural soul, not scale.</small>
            </div>
            <div>
              <span>02</span>
              <strong>People who care</strong>
              <small>Warmth, with every detail and turnover in hand.</small>
            </div>
            <div>
              <span>03</span>
              <strong>Room to be yourself</strong>
              <small>Space to travel at your own unhurried pace.</small>
            </div>
          </div>
          <button
            className="text-link"
            onClick={() => navigate('/explore')}
          >
            Explore all verified stays <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Notes from the Journal */}
      <section className="journal-section" id="journal">
        <div className="journal-heading">
          <div>
            <span className="eyebrow"><span /> NOTES FROM THE JOURNAL</span>
            <h2>Go a little <em>further.</em></h2>
          </div>
        </div>

        <div className="journal-grid">
          <article>
            <img
              src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85"
              alt="Misty mountain valley"
              loading="lazy"
            />
            <span>THE SLOW EDIT · 6 MIN READ</span>
            <h3>In the hills, there is time enough.</h3>
          </article>
          <article>
            <img
              src="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1000&q=85"
              alt="Colourful coastal village"
              loading="lazy"
            />
            <span>PLACES · 4 MIN READ</span>
            <h3>A long weekend on the Konkan coast.</h3>
          </article>
          <article>
            <img
              src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1000&q=85"
              alt="Ocean waves meeting the shore"
              loading="lazy"
            />
            <span>THE ART OF STAYING · 5 MIN READ</span>
            <h3>What it means to really switch off.</h3>
          </article>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter">
        <span className="eyebrow"><span /> A LETTER, NOW AND THEN</span>
        <h2>A little more <em>room to wander.</em></h2>
        <p>New places, thoughtful stories, and the occasional reason to go.</p>
        {newsletterSubscribed ? (
          <div className="newsletter-success">
            <Check size={16} /> You are on the private guest list.
          </div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault()
              setNewsletterSubscribed(true)
              showToast('Subscribed to Maison Véla correspondence.')
            }}
          >
            <input type="email" placeholder="Your email address" required />
            <button type="submit">Sign me up <ArrowRight size={15} /></button>
          </form>
        )}
      </section>
    </main>
  )
}
