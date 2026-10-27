import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, ShieldCheck, Sparkles, ArrowRight, CheckCircle2,
  ChevronDown, Award, Calculator
} from 'lucide-react'
import './BecomeAHostPage.css'

interface BecomeAHostPageProps {
  onStartHosting: () => void
}

export const BecomeAHostPage: React.FC<BecomeAHostPageProps> = ({ onStartHosting }) => {
  const navigate = useNavigate()
  const [selectedCity, setSelectedCity] = useState('Goa')
  const [selectedBedrooms, setSelectedBedrooms] = useState(4)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Dynamic earnings estimator
  const baseRatePerBedroom: Record<string, number> = {
    Goa: 14000,
    Alibaug: 16500,
    Udaipur: 18000,
    Landour: 11000,
    Bengaluru: 9500
  }
  const estimatedNightly = (baseRatePerBedroom[selectedCity] || 12000) * (selectedBedrooms * 0.75)
  const estimatedMonthlyGross = Math.round(estimatedNightly * 20) // based on 67% occupancy
  const estimatedAnnualGross = estimatedMonthlyGross * 12

  const formatPrice = (val: number) => `₹${new Intl.NumberFormat('en-IN').format(val)}`

  const faqs = [
    {
      q: 'How does Maison Véla screen and verify prospective guests?',
      a: 'All reservation requests undergo strict digital identity verification and pre-arrival screening. For high-value villas and royal suites, security deposits and corporate or private references are validated prior to check-in.'
    },
    {
      q: 'What is the difference between Marketplace and Fully Serviced Managed partnerships?',
      a: 'Under the Marketplace arrangement (14% commission), hosts retain direct day-to-day oversight of check-in, cleaning, and guest communication. Under our Fully Managed model (22% commission), Maison Véla handles 24/7 guest concierges, linen laundry, professional turnovers, pool maintenance, and on-site hospitality staff.'
    },
    {
      q: 'How and when are host payouts processed?',
      a: 'Payouts are automatically reconciled and dispatched via direct NEFT/RTGS bank transfer within 24 hours of guest check-in. You receive an itemized downloadable statement covering gross booking value, platform commission, taxes, and cleaning reimbursements.'
    },
    {
      q: 'Can hotel managers submit multiple room types and inventory tiers?',
      a: 'Yes. Our platform fully supports luxury boutique hotels, palace resorts, and serviced estate wings with multiple room categories (Deluxe, Suite, Royal Pavilion), inventory quotas, meal plans, and real-time availability.'
    }
  ]

  const handleStartHostingAction = () => {
    onStartHosting()
    navigate('/owner/portal')
  }

  return (
    <main className="host-landing-page">
      {/* Editorial Hero */}
      <section className="host-hero">
        <div className="host-hero-content">
          <span className="eyebrow light-eyebrow">
            <span /> PARTNER WITH MAISON VÉLA
          </span>
          <h1>
            Your distinctive home,<br />
            <em>in exceptional hands.</em>
          </h1>
          <p>
            Join India’s preeminent curated luxury property marketplace. We connect discerning villa owners, heritage havelis, and boutique hotel operators with affluent, respectful travellers.
          </p>
          <div className="host-hero-ctas">
            <button className="btn-gold host-hero-btn" onClick={handleStartHostingAction}>
              <span>Start Hosting Today</span>
              <ArrowRight size={15} />
            </button>
            <a href="#estimator" className="host-secondary-link">
              Calculate Your Property’s Potential →
            </a>
          </div>
        </div>
        <div className="host-hero-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=85"
            alt="Sprawling private hill sanctuary at golden hour"
            className="host-hero-img"
          />
          <div className="hero-stat-badge">
            <Award size={18} color="var(--gold)" />
            <div>
              <strong>74% Average Occupancy</strong>
              <span>Across verified luxury partner portfolio</span>
            </div>
          </div>
        </div>
      </section>

      {/* Property Categories Supported */}
      <section className="host-categories-section">
        <div className="host-section-header">
          <span className="eyebrow"><span /> PORTFOLIO TIERS</span>
          <h2>Properties we celebrate.</h2>
          <p>From private oceanfront compounds to historic palaces and boutique design hotels.</p>
        </div>

        <div className="host-category-grid">
          <div className="host-cat-card">
            <Building2 size={24} className="cat-icon" />
            <h3>Private Pool Villas</h3>
            <p>Assagao, Alibaug, and coastal sanctuaries featuring dedicated pools and landscaped estates.</p>
          </div>
          <div className="host-cat-card">
            <Award size={24} className="cat-icon" />
            <h3>Boutique Luxury Hotels</h3>
            <p>Independent 10 to 40 room properties offering bespoke service, architectural merit, and fine dining.</p>
          </div>
          <div className="host-cat-card">
            <Sparkles size={24} className="cat-icon" />
            <h3>Heritage Havelis & Palaces</h3>
            <p>Historic royal residences in Udaipur, Jaipur, and Shekhawati preserved for contemporary luxury.</p>
          </div>
          <div className="host-cat-card">
            <ShieldCheck size={24} className="cat-icon" />
            <h3>Mountain & Coffee Retreats</h3>
            <p>Quiet sanctuaries in Landour, Coonoor, and Coorg nestled amidst tea hills and pine forests.</p>
          </div>
        </div>
      </section>

      {/* Dynamic Revenue Estimator */}
      <section className="host-estimator-section" id="estimator">
        <div className="estimator-card">
          <div className="estimator-copy">
            <span className="eyebrow"><span /> EARNINGS ESTIMATOR</span>
            <h2>Estimate your sanctuary's income.</h2>
            <p>Calculated using recent average daily rates (ADR) and seasonal occupancy trends across our network.</p>

            <div className="estimator-controls">
              <div className="estimator-field">
                <label>LOCATION / DESTINATION</label>
                <div className="city-pill-group">
                  {['Goa', 'Alibaug', 'Udaipur', 'Landour', 'Bengaluru'].map(city => (
                    <button
                      key={city}
                      type="button"
                      className={`city-pill ${selectedCity === city ? 'active' : ''}`}
                      onClick={() => setSelectedCity(city)}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              <div className="estimator-field">
                <label>BEDROOM CAPACITY: {selectedBedrooms} SUITES</label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={selectedBedrooms}
                  onChange={e => setSelectedBedrooms(Number(e.target.value))}
                  className="bedroom-slider"
                />
                <div className="slider-labels">
                  <span>2 Suites</span>
                  <span>4 Suites</span>
                  <span>6 Suites</span>
                  <span>8+ Suites</span>
                </div>
              </div>
            </div>
          </div>

          <div className="estimator-result-box">
            <div className="result-header">
              <Calculator size={20} color="var(--gold)" />
              <span>PROJECTED ANNUAL EARNINGS</span>
            </div>
            <div className="result-amount">
              <strong>{formatPrice(estimatedAnnualGross)}</strong>
              <small>estimated gross annual booking value</small>
            </div>
            <div className="result-breakdown">
              <div>
                <span>Estimated ADR</span>
                <strong>{formatPrice(Math.round(estimatedNightly))} / night</strong>
              </div>
              <div>
                <span>Monthly Forecast</span>
                <strong>{formatPrice(estimatedMonthlyGross)} / mo</strong>
              </div>
            </div>
            <button className="btn-gold btn-full" onClick={handleStartHostingAction}>
              Onboard This Property →
            </button>
            <span className="result-disclaimer">
              *Projections based on historical high-season & monsoon occupancy curves. Actual performance varies with marketing model and amenities.
            </span>
          </div>
        </div>
      </section>

      {/* Dual Partnership Models */}
      <section className="host-models-section">
        <div className="host-section-header">
          <span className="eyebrow"><span /> COMMERCIAL MODELS</span>
          <h2>Tailored to your operational style.</h2>
          <p>Choose the level of management engagement that fits your lifestyle.</p>
        </div>

        <div className="models-comparison-grid">
          <div className="model-box">
            <div className="model-tag">MARKETPLACE MODEL</div>
            <h3>Self-Managed Hosting</h3>
            <div className="model-rate">14% <span>platform commission</span></div>
            <ul className="model-perks">
              <li><CheckCircle2 size={16} /> Direct access to verified domestic and global guests</li>
              <li><CheckCircle2 size={16} /> Calendar, pricing rules, and blackout control</li>
              <li><CheckCircle2 size={16} /> Host team management and front-desk accounts</li>
              <li><CheckCircle2 size={16} /> Direct payment settlement within 24h of check-in</li>
            </ul>
            <button className="btn-outline-gold" onClick={handleStartHostingAction}>
              Select Marketplace
            </button>
          </div>

          <div className="model-box featured-model">
            <div className="model-badge-top">RECOMMENDED FOR ABSENTEE OWNERS</div>
            <div className="model-tag">MANAGED LUXURY CARE</div>
            <h3>Maison Véla Fully Serviced</h3>
            <div className="model-rate">22% <span>all-inclusive management</span></div>
            <ul className="model-perks">
              <li><CheckCircle2 size={16} /> Dedicated Head Housekeeper and on-demand butler</li>
              <li><CheckCircle2 size={16} /> Professional linen sterilization and turnover care</li>
              <li><CheckCircle2 size={16} /> Preventive maintenance and pool sanitation dispatches</li>
              <li><CheckCircle2 size={16} /> 24/7 AI & Human guest concierge for in-stay requests</li>
              <li><CheckCircle2 size={16} /> Curated professional architectural photography</li>
            </ul>
            <button className="btn-gold" onClick={handleStartHostingAction}>
              Apply for Managed Care
            </button>
          </div>
        </div>
      </section>

      {/* 4-Step Onboarding Workflow */}
      <section className="host-workflow-section">
        <div className="host-section-header">
          <span className="eyebrow"><span /> THE ONBOARDING PATH</span>
          <h2>From private sanctuary to verified stay.</h2>
        </div>

        <div className="steps-cards-row">
          <div className="step-card">
            <span className="step-num">01</span>
            <h4>Submit Property Profile</h4>
            <p>Tell us about your home’s architecture, suites, location coordinates, and private amenities.</p>
          </div>
          <div className="step-card">
            <span className="step-num">02</span>
            <h4>Verification & Compliance</h4>
            <p>Submit ownership title or business permit for confidential review by our audit team.</p>
          </div>
          <div className="step-card">
            <span className="step-num">03</span>
            <h4>Set Rates & Inventory</h4>
            <p>Define base nightly rates, seasonal multipliers, minimum stay, and room categories.</p>
          </div>
          <div className="step-card">
            <span className="step-num">04</span>
            <h4>Welcome Discerning Guests</h4>
            <p>Publish to our curated luxury collection and receive confirmed bookings with instant payouts.</p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="host-faq-section">
        <div className="host-section-header">
          <span className="eyebrow"><span /> COMMON QUESTIONS</span>
          <h2>Everything you need to know.</h2>
        </div>

        <div className="faq-accordion-list">
          {faqs.map((f, idx) => (
            <div key={idx} className="faq-item">
              <button
                className="faq-question-btn"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                aria-expanded={openFaq === idx}
              >
                <span>{f.q}</span>
                <ChevronDown size={16} className={`faq-chevron ${openFaq === idx ? 'rotated' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="faq-answer">
                  <p>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Bottom Banner */}
      <section className="host-final-cta">
        <div className="final-cta-box">
          <h2>Ready to welcome your first guests?</h2>
          <p>Join the Maison Véla collection of distinguished private homes and luxury hotels today.</p>
          <button className="btn-gold host-hero-btn" onClick={handleStartHostingAction}>
            <span>Start Onboarding Listing</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </main>
  )
}
