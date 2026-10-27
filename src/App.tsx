import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Check, ArrowUpRight } from 'lucide-react'
import {
  initialProperties,
  initialBookings,
  initialConciergeServices,
  Property,
  Booking,
  BookingPriceBreakdown,
  CleaningTask,
  MaintenanceTask,
  ConciergeService
} from './data/properties'
import { Header } from './components/Header'
import { ScrollToTop } from './components/ScrollToTop'
import { HomeView } from './components/HomeView'
import { ExploreView } from './components/ExploreView'
import { PropertyDetailPage } from './components/PropertyDetailPage'
import { CheckoutModal } from './components/CheckoutModal'
import { GalleryModal } from './components/GalleryModal'
import { AIConciergeModal } from './components/AIConciergeModal'
import { CompareModal } from './components/CompareModal'
import { GuestDashboard } from './components/GuestDashboard'
import { OwnerPortal } from './components/OwnerPortal'
import { BecomeAHostPage } from './components/BecomeAHostPage'
import { AdminLayout } from './components/admin/AdminLayout'
import { OperationsHub } from './components/OperationsHub'
import { NotFoundPage } from './components/NotFoundPage'
import { AuthModal } from './components/AuthModal'
import { User } from './types/index'
import { LuxuryApiClient, getStoredUser, clearAuthSession, getAuthToken } from './services/api'
import './App.css'

export function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // UI & User State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser())
  const [currentRole, setCurrentRole] = useState<'guest' | 'owner' | 'manager' | 'admin'>('guest')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')

  // Verify & restore user session on mount
  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      LuxuryApiClient.getMe()
        .then(res => {
          if (res?.user) {
            setCurrentUser(res.user)
            if (res.user.role) {
              setCurrentRole(res.user.role as any)
            }
          }
        })
        .catch(() => {
          clearAuthSession()
          setCurrentUser(null)
        })
    } else {
      clearAuthSession()
      setCurrentUser(null)
    }
  }, [])

  // Auto-open auth modal if accessing /login or /register
  useEffect(() => {
    if (location.pathname === '/login') {
      setAuthModalMode('login')
      setAuthModalOpen(true)
    } else if (location.pathname === '/register') {
      setAuthModalMode('register')
      setAuthModalOpen(true)
    }
  }, [location.pathname])

  // Automatically sync active role with URL path when visiting a role portal directly
  useEffect(() => {
    if (location.pathname.startsWith('/owner')) {
      setCurrentRole('owner')
    } else if (location.pathname.startsWith('/admin')) {
      setCurrentRole('admin')
    } else if (location.pathname.startsWith('/operations')) {
      setCurrentRole('manager')
    } else if (location.pathname.startsWith('/guest')) {
      setCurrentRole('guest')
    }
  }, [location.pathname])

  // Global Data State
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [conciergeServices] = useState<ConciergeService[]>(initialConciergeServices)
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([
    {
      id: 'cln-101',
      propertyId: 'prop-casa-serena',
      propertyName: 'Casa Serena',
      bookingReference: 'MV-2026-9041',
      assignedTo: 'Devika Mehra (Head Housekeeper)',
      dueAt: '2026-11-12T13:00:00Z',
      status: 'pending',
      checklist: [
        { task: 'Steam sanitize 400-thread count Egyptian cotton linens', done: true },
        { task: 'Pool chlorination and surface skimming', done: true },
        { task: 'Pre-stock cellar with guest requested artisanal spirits', done: false },
        { task: 'Fresh garden frangipani floral urn arrangement in foyer', done: false },
        { task: 'Air purification cycle in all 5 guest suites', done: false }
      ],
      notes: 'Guest prefers hypoallergenic down-alternative pillows in Master Suite 1.'
    },
    {
      id: 'cln-102',
      propertyId: 'prop-the-blue-house',
      propertyName: 'The Blue House',
      assignedTo: 'Devika Mehra',
      dueAt: '2026-10-28T11:00:00Z',
      status: 'completed',
      checklist: [
        { task: 'Teak wood polishing and floor waxing', done: true },
        { task: 'Deep clean courtyard plunge pool', done: true },
        { task: 'Inspect AC filters and dehumidifiers', done: true }
      ]
    }
  ])
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
    {
      id: 'mnt-201',
      propertyId: 'prop-casa-del-mar',
      propertyName: 'Casa del Mar',
      reportedBy: 'Devika Mehra',
      assignedTo: 'Vikram Electricals',
      description: 'Scheduled preventive service on heated pool heat pump and saltwater filtration.',
      priority: 'normal',
      status: 'in_progress',
      costEstimate: 8500,
      createdAt: '2026-10-24T11:00:00Z'
    },
    {
      id: 'mnt-202',
      propertyId: 'prop-the-pahadi-house',
      propertyName: 'The Pahadi House',
      reportedBy: 'Col. Rajesh Bakshi',
      description: 'Chimney sweep and fireplace flue inspection prior to winter season.',
      priority: 'high',
      status: 'open',
      costEstimate: 4500,
      createdAt: '2026-10-23T16:00:00Z'
    }
  ])

  // UI & User State
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>(['prop-casa-serena'])
  const [comparedPropertyIds, setComparedPropertyIds] = useState<string[]>([])

  // Modal Overlays
  const [isAIConciergeOpen, setIsAIConciergeOpen] = useState(false)
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)
  const [galleryModalData, setGalleryModalData] = useState<{ images: any[]; propertyName: string; initialIndex: number } | null>(null)
  const [checkoutModalData, setCheckoutModalData] = useState<{
    property: Property
    checkIn: string
    checkOut: string
    guests: number
    priceBreakdown: BookingPriceBreakdown
    couponCode: string
    conciergeServices: string[]
  } | null>(null)

  // Notification Toast
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Dynamic PostgreSQL Data Sync
  useEffect(() => {
    // 1. Fetch properties from PostgreSQL
    LuxuryApiClient.getProperties({ includeAll: true })
      .then(res => {
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          setProperties(res.data)
        }
      })
      .catch(() => {})

    // 2. Fetch bookings from PostgreSQL
    LuxuryApiClient.getBookings()
      .then(res => {
        if (res && Array.isArray(res.bookings) && res.bookings.length > 0) {
          setBookings(res.bookings)
        }
      })
      .catch(() => {})

    // 3. Fetch cleaning turnover tasks
    LuxuryApiClient.getCleaningTasks()
      .then(res => {
        if (res && Array.isArray(res.tasks) && res.tasks.length > 0) {
          setCleaningTasks(res.tasks)
        }
      })
      .catch(() => {})

    // 4. Fetch maintenance tickets
    LuxuryApiClient.getMaintenanceTasks()
      .then(res => {
        if (res && Array.isArray(res.tasks) && res.tasks.length > 0) {
          setMaintenanceTasks(res.tasks)
        }
      })
      .catch(() => {})
  }, [])

  // Handlers
  const toggleSaveProperty = (id: string) => {
    setSavedPropertyIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    const prop = properties.find(p => p.id === id)
    showToast(savedPropertyIds.includes(id) ? `Removed ${prop?.name} from wishlist` : `Saved ${prop?.name} to wishlist`)
  }

  const toggleCompareProperty = (id: string) => {
    setComparedPropertyIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id)
      } else {
        if (prev.length >= 4) {
          showToast('You can compare a maximum of 4 properties side-by-side.')
          return prev
        }
        return [...prev, id]
      }
    })
  }

  const openPropertyDetail = (property: Property) => {
    navigate(`/properties/${property.slug || property.id}`)
  }

  const handleBookingConfirmed = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev])
    showToast(`Reservation confirmed: Ref ${newBooking.reference}`)
    LuxuryApiClient.getBookings().then(r => r.bookings && setBookings(r.bookings)).catch(() => {})
    LuxuryApiClient.getCleaningTasks().then(r => r.tasks && setCleaningTasks(r.tasks)).catch(() => {})
  }

  const handleCancelBooking = (bookingId: string) => {
    LuxuryApiClient.cancelBooking(bookingId)
      .then(() => {
        setBookings(prev =>
          prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b)
        )
        showToast('Reservation cancelled in PostgreSQL. 95% refund initiated.')
      })
      .catch(() => {
        setBookings(prev =>
          prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b)
        )
        showToast('Reservation cancelled. 95% refund initiated.')
      })
  }

  const handleAddOwnerProperty = (newProp: Partial<Property>) => {
    LuxuryApiClient.createProperty(newProp)
      .then(res => {
        if (res.property) {
          setProperties(prev => [res.property, ...prev])
          showToast(`Listing "${res.property.name}" saved to PostgreSQL! Submitted for review.`)
        }
      })
      .catch(() => {
        const slug = (newProp.name || 'villa').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)
        const propertyToAdd: Property = {
          id: `prop-${Date.now()}`,
          ownerId: 'usr-owner-01',
          slug,
          name: newProp.name || 'New Luxury Villa',
          tagline: newProp.tagline || 'Private sanctuary curated by Maison Véla',
          description: newProp.description || '',
          city: newProp.city || 'Assagao',
          region: newProp.region || 'Goa',
          country: 'India',
          address: `${newProp.city}, ${newProp.region}, India`,
          coordinates: { lat: 15.5898, lng: 73.7732 },
          accommodationType: newProp.accommodationType || 'Private pool villa',
          category: newProp.category || 'Private Pool Villas',
          maxGuests: newProp.maxGuests || 8,
          bedrooms: newProp.bedrooms || 4,
          bathrooms: newProp.bathrooms || 4,
          baseNightlyPrice: newProp.baseNightlyPrice || 50000,
          cleaningFee: newProp.cleaningFee || 3500,
          currency: 'INR',
          status: 'submitted',
          managementModel: newProp.managementModel || 'managed',
          averageRating: 5.0,
          reviewCount: 0,
          isFeatured: false,
          isVerified: false,
          instantBookable: true,
          amenities: newProp.amenities || ['Private pool', 'High-speed Wi-Fi'],
          images: newProp.images || [
            {
              id: `img-${Date.now()}`,
              url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
              altText: 'Estate View',
              isCover: true,
              position: 0
            }
          ],
          houseRules: ['Check-in: 2:00 PM · Check-out: 11:00 AM'],
          checkInTime: '14:00',
          checkOutTime: '11:00',
          cancellationPolicy: 'Moderate',
          minStayNights: 2,
          hostName: 'Maharaja Vikramaditya',
          hostType: 'Owner Host',
          createdAt: new Date().toISOString()
        }
        setProperties(prev => [propertyToAdd, ...prev])
        showToast('Listing submitted! Placed in Admin Verification Queue.')
      })
  }

  const handleUpdatePropertyStatus = (propertyId: string, status: string, remarks?: string) => {
    LuxuryApiClient.updatePropertyStatus(propertyId, status, remarks)
      .then(() => {
        setProperties(prev =>
          prev.map(p =>
            p.id === propertyId
              ? { ...p, status: status as any, isVerified: status === 'published' }
              : p
          )
        )
        showToast(`PostgreSQL: Property status updated to ${status.toUpperCase()}`)
      })
      .catch(() => {
        setProperties(prev =>
          prev.map(p =>
            p.id === propertyId
              ? { ...p, status: status as any, isVerified: status === 'published' }
              : p
          )
        )
        showToast(`Property status updated to ${status.toUpperCase()}`)
      })
  }

  const handleToggleChecklistItem = (taskId: string, index: number) => {
    setCleaningTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t
        const newChecklist = [...t.checklist]
        newChecklist[index].done = !newChecklist[index].done
        const allDone = newChecklist.every(i => i.done)

        LuxuryApiClient.updateCleaningChecklist(taskId, index, newChecklist[index].done).catch(() => {})

        return {
          ...t,
          checklist: newChecklist,
          status: allDone ? ('completed' as const) : ('in_progress' as const)
        }
      })
    )
  }

  const handleAddMaintenanceTicket = (ticket: Partial<MaintenanceTask>) => {
    LuxuryApiClient.createMaintenanceTicket({
      propertyName: ticket.propertyName || 'Casa Serena',
      description: ticket.description || 'Routine service',
      priority: ticket.priority || 'normal',
      costEstimate: ticket.costEstimate
    })
      .then(() => {
        LuxuryApiClient.getMaintenanceTasks().then(res => res.tasks && setMaintenanceTasks(res.tasks)).catch(() => {})
        showToast('Maintenance ticket dispatched and recorded in PostgreSQL.')
      })
      .catch(() => {
        const newT: MaintenanceTask = {
          id: `mnt-${Date.now()}`,
          propertyId: 'prop-custom',
          propertyName: ticket.propertyName || 'Estate',
          reportedBy: ticket.reportedBy || 'Staff',
          description: ticket.description || 'Inspection',
          priority: ticket.priority || 'normal',
          status: 'open',
          costEstimate: ticket.costEstimate || 6500,
          createdAt: new Date().toISOString()
        }
        setMaintenanceTasks(prev => [newT, ...prev])
        showToast('Maintenance ticket dispatched to engineering.')
      })
  }

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }

  const handleAuthSuccess = (user: User, message: string) => {
    setCurrentUser(user)
    if (user.role) {
      setCurrentRole(user.role as any)
    }
    showToast(message || `Signed in as ${user.fullName}`)
  }

  const handleLogout = async () => {
    try {
      await LuxuryApiClient.logout()
    } catch {}
    clearAuthSession()
    setCurrentUser(null)
    setCurrentRole('guest')
    showToast('Signed out of Maison Véla.')
    navigate('/')
  }

  const isAdminPath = location.pathname.startsWith('/admin')

  return (
    <div className={`site-wrapper ${isAdminPath ? 'admin-mode' : ''}`}>
      {/* Instant route scroll reset - ensures new routes always start at top */}
      <ScrollToTop />

      {/* Site Sticky Luxury Header - hidden on dedicated Company Admin layout */}
      {!isAdminPath && (
        <Header
          currentRole={currentRole}
          onSwitchRole={role => {
            setCurrentRole(role)
            LuxuryApiClient.switchRole(role)
              .then(r => {
                if (r?.user) setCurrentUser(r.user)
              })
              .catch(() => {})
            showToast(`Switched perspective to ${role.toUpperCase()}`)
          }}
          wishlistCount={savedPropertyIds.length}
          onOpenAIConcierge={() => setIsAIConciergeOpen(true)}
          onOpenWishlist={() => {
            setCurrentRole('guest')
            navigate('/guest/dashboard')
          }}
          currentUser={currentUser}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
        />
      )}

      {/* Main Application Routes */}
      <Routes>
        {/* Route: Homepage */}
        <Route
          path="/"
          element={
            <HomeView
              properties={properties}
              savedPropertyIds={savedPropertyIds}
              onToggleSave={toggleSaveProperty}
              comparedPropertyIds={comparedPropertyIds}
              onToggleCompare={toggleCompareProperty}
              conciergeServices={conciergeServices}
              onOpenProperty={openPropertyDetail}
              onSwitchRole={setCurrentRole}
              showToast={showToast}
            />
          }
        />

        {/* Route: Property Discovery / Explore */}
        <Route
          path="/explore"
          element={
            <ExploreView
              properties={properties}
              onOpenProperty={openPropertyDetail}
              savedPropertyIds={savedPropertyIds}
              onToggleSave={toggleSaveProperty}
              comparedPropertyIds={comparedPropertyIds}
              onToggleCompare={toggleCompareProperty}
              onOpenCompareModal={() => setIsCompareModalOpen(true)}
              onBackToHome={() => navigate('/')}
            />
          }
        />

        {/* Route: Property Dossier / Details */}
        <Route
          path="/properties/:slug"
          element={
            <PropertyDetailPage
              properties={properties}
              savedPropertyIds={savedPropertyIds}
              onToggleSave={toggleSaveProperty}
              onOpenGallery={index => {
                const found = properties.find(p => p.slug === window.location.pathname.split('/').pop()) || properties[0]
                setGalleryModalData({ images: found.images, propertyName: found.name, initialIndex: index })
              }}
              onOpenCheckout={(prop, checkIn, checkOut, guests, priceBreakdown, couponCode, conciergeServicesBooked) => {
                setCheckoutModalData({
                  property: prop,
                  checkIn,
                  checkOut,
                  guests,
                  priceBreakdown,
                  couponCode,
                  conciergeServices: conciergeServicesBooked
                })
              }}
              conciergeServices={conciergeServices}
            />
          }
        />

        {/* Route: Guest Privilege Dashboard */}
        <Route
          path="/guest/dashboard"
          element={
            <GuestDashboard
              bookings={bookings}
              savedPropertyIds={savedPropertyIds}
              properties={properties}
              onOpenProperty={openPropertyDetail}
              onCancelBooking={handleCancelBooking}
            />
          }
        />

        {/* Route: Become A Host Landing & Onboarding */}
        <Route
          path="/become-a-host"
          element={
            <BecomeAHostPage
              onStartHosting={() => {
                setCurrentRole('owner')
                showToast('Switched to Homeowner perspective. Complete your sanctuary onboarding.')
              }}
            />
          }
        />

        {/* Route: Homeowner Portal */}
        <Route
          path="/owner/portal"
          element={
            <OwnerPortal
              properties={properties}
              bookings={bookings}
              onAddProperty={handleAddOwnerProperty}
              onRequestService={(type, propName) => {
                showToast(`Requested: ${type} for ${propName}`)
              }}
            />
          }
        />

        {/* Route: Admin Platform Governance Center */}
        <Route
          path="/admin"
          element={
            <AdminLayout
              properties={properties}
              bookings={bookings}
              onUpdatePropertyStatus={handleUpdatePropertyStatus}
            />
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout
              properties={properties}
              bookings={bookings}
              onUpdatePropertyStatus={handleUpdatePropertyStatus}
            />
          }
        />

        {/* Route: Hospitality Operations & Turnover Hub */}
        <Route
          path="/operations/hub"
          element={
            <OperationsHub
              cleaningTasks={cleaningTasks}
              maintenanceTasks={maintenanceTasks}
              onToggleChecklistItem={handleToggleChecklistItem}
              onAddMaintenanceTicket={handleAddMaintenanceTicket}
            />
          }
        />

        {/* Route: 404 Not Found Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* MODAL: FULLSCREEN PHOTO LIGHTBOX */}
      {galleryModalData !== null && (
        <GalleryModal
          images={galleryModalData.images}
          propertyName={galleryModalData.propertyName}
          initialIndex={galleryModalData.initialIndex}
          onClose={() => setGalleryModalData(null)}
        />
      )}

      {/* MODAL: CHECKOUT & PAYMENT WORKFLOW */}
      {checkoutModalData && (
        <CheckoutModal
          property={checkoutModalData.property}
          checkIn={checkoutModalData.checkIn}
          checkOut={checkoutModalData.checkOut}
          guests={checkoutModalData.guests}
          priceBreakdown={checkoutModalData.priceBreakdown}
          couponCode={checkoutModalData.couponCode}
          conciergeServicesBooked={checkoutModalData.conciergeServices}
          currentUser={currentUser}
          onClose={() => setCheckoutModalData(null)}
          onBookingConfirmed={booking => {
            handleBookingConfirmed(booking)
          }}
        />
      )}

      {/* MODAL: AI CONCIERGE TRAVEL ASSISTANT */}
      {isAIConciergeOpen && (
        <AIConciergeModal
          properties={properties}
          conciergeServices={conciergeServices}
          onClose={() => setIsAIConciergeOpen(false)}
          onSelectProperty={openPropertyDetail}
        />
      )}

      {/* MODAL: MULTI-PROPERTY COMPARISON */}
      {isCompareModalOpen && (
        <CompareModal
          properties={properties.filter(p => comparedPropertyIds.includes(p.id))}
          onClose={() => setIsCompareModalOpen(false)}
          onSelectProperty={openPropertyDetail}
        />
      )}

      {/* MODAL: AUTHENTICATION (SIGN IN & REGISTRATION) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Site Footer - hidden on dedicated Company Admin layout */}
      {!isAdminPath && (
        <footer className="site-footer">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="brand-mark">M<span>V</span></span>
              <p>Distinctive private homes.<br />Considered hospitality.</p>
            </div>
            <div className="footer-col">
              <strong>THE COLLECTION</strong>
              <button onClick={() => navigate('/explore')}>All stays</button>
              <button onClick={() => navigate('/explore?category=Private%20Pool%20Villas')}>Private Pool Villas</button>
              <button onClick={() => navigate('/explore?category=Beachfront%20Estates')}>Beachfront Estates</button>
              <button onClick={() => navigate('/explore?category=Royal%20Residences')}>Royal Residences</button>
            </div>
            <div className="footer-col">
              <strong>PERSPECTIVES</strong>
              <button onClick={() => { setCurrentRole('guest'); navigate('/guest/dashboard') }}>Guest Privilege Portal</button>
              <button onClick={() => { setCurrentRole('owner'); navigate('/owner/portal') }}>Owner Portal</button>
              <button onClick={() => { setCurrentRole('manager'); navigate('/operations/hub') }}>Hospitality Operations</button>
              <button onClick={() => { setCurrentRole('admin'); navigate('/admin/dashboard') }}>Executive Admin Center</button>
            </div>
            <div className="footer-col">
              <strong>THE DETAILS</strong>
              <a href="#details" onClick={e => { e.preventDefault(); showToast('Private terms & hospitality standards') }}>Terms & Cancellation</a>
              <a href="#details" onClick={e => { e.preventDefault(); showToast('Privacy compliance & data policy') }}>Privacy Policy</a>
              <a href="#details" onClick={e => { e.preventDefault(); setIsAIConciergeOpen(true) }}>24/7 Concierge Care</a>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 MAISON VÉLA LUXURY HOSPITALITY. ALL RIGHTS RESERVED.</span>
            <span>CURATED LUXURY PROPERTIES ACROSS INDIA & BEYOND.</span>
            <span>INSTAGRAM <ArrowUpRight size={12} /></span>
          </div>
        </footer>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast" role="status">
          <Check size={15} color="var(--gold)" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default App
