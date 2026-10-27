import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'var(--gold-light)',
        color: 'var(--gold-dark)',
        display: 'grid',
        placeItems: 'center',
        marginBottom: '20px'
      }}>
        <Compass size={32} />
      </div>

      <span className="eyebrow" style={{ justifyContent: 'center' }}>
        <span /> 404 PAGE NOT FOUND
      </span>

      <h1 style={{ font: '400 48px var(--serif)', margin: '18px 0 12px', color: 'var(--ink)' }}>
        Beyond the Map
      </h1>

      <p style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '460px', lineHeight: 1.8, marginBottom: '28px' }}>
        The page you are looking for has been relocated or is reserved for private correspondence. Allow us to guide you back to our curated sanctuaries.
      </p>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className="btn-gold"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={14} /> Return to Homepage
        </button>

        <button
          style={{
            border: '1px solid var(--line-strong)',
            background: '#fff',
            padding: '12px 22px',
            fontSize: '11px',
            letterSpacing: '0.6px',
            fontWeight: 500,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/explore')}
        >
          Explore All Stays
        </button>
      </div>
    </div>
  )
}
