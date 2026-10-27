import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { PropertyMedia } from '../data/properties'
import './GalleryModal.css'

interface GalleryModalProps {
  images: PropertyMedia[]
  propertyName: string
  initialIndex?: number
  onClose: () => void
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  images,
  propertyName,
  initialIndex = 0,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const currentImage = images[currentIndex] || images[0]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(18, 18, 16, 0.96)',
        zIndex: 110,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff',
          marginBottom: '16px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <strong style={{ font: '400 18px var(--serif)' }}>{propertyName}</strong>
          <span style={{ fontSize: '11px', color: '#c5c2b8', marginLeft: '12px' }}>
            {currentIndex + 1} of {images.length}
          </span>
        </div>
        <button onClick={onClose} style={{ color: '#fff' }} aria-label="Close gallery">
          <X size={24} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: '20px',
            color: '#fff',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'grid',
            placeItems: 'center'
          }}
          aria-label="Previous photograph"
        >
          <ChevronLeft size={24} />
        </button>

        <img
          src={currentImage?.url}
          alt={currentImage?.altText || propertyName}
          style={{
            maxWidth: '90%',
            maxHeight: '80vh',
            objectFit: 'contain'
          }}
        />

        <button
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '20px',
            color: '#fff',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'grid',
            placeItems: 'center'
          }}
          aria-label="Next photograph"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Thumbnail Bar */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          paddingTop: '16px',
          overflowX: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {images.map((img, idx) => (
          <img
            key={img.id || idx}
            src={img.url}
            alt=""
            style={{
              width: '64px',
              height: '48px',
              objectFit: 'cover',
              cursor: 'pointer',
              border: currentIndex === idx ? '2px solid var(--gold)' : '2px solid transparent',
              opacity: currentIndex === idx ? 1 : 0.6
            }}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </div>
  )
}
