// In-memory relational luxury hospitality data store
// Provides full zero-config execution and testing, and maps to the PostgreSQL database schema.

export interface User {
  id: string
  email: string
  fullName: string
  phone: string
  role: 'guest' | 'host' | 'property_manager' | 'support_agent' | 'admin' | 'super_admin' | 'owner' | 'manager' | 'staff'
  status: 'active' | 'suspended' | 'pending'
  createdAt: string
}

export interface PropertyMedia {
  id: string
  url: string
  altText: string
  isCover: boolean
  position: number
}

export interface Property {
  id: string
  ownerId: string
  slug: string
  name: string
  tagline: string
  description: string
  city: string
  region: string
  country: string
  address: string
  coordinates: { lat: number; lng: number }
  accommodationType: string
  category: string
  maxGuests: number
  bedrooms: number
  bathrooms: number
  baseNightlyPrice: number
  cleaningFee: number
  currency: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'published' | 'rejected' | 'suspended'
  managementModel: 'marketplace' | 'managed'
  averageRating: number
  reviewCount: number
  isFeatured: boolean
  isVerified: boolean
  instantBookable: boolean
  amenities: string[]
  images: PropertyMedia[]
  houseRules: string[]
  checkInTime: string
  checkOutTime: string
  cancellationPolicy: 'Flexible' | 'Moderate' | 'Strict'
  minStayNights: number
  hostName: string
  hostType: string
  createdAt: string
}

export interface BookingPriceBreakdown {
  nights: number
  nightlyRate: number
  accommodationTotal: number
  cleaningFee: number
  guestServiceFee: number
  taxes: number // 18% GST on accommodation + service
  discountAmount: number
  grossTotal: number
  currency: string
}

export interface Booking {
  id: string
  reference: string
  propertyId: string
  propertyName: string
  propertyCity: string
  propertyCoverImage: string
  guestId: string
  guestName: string
  guestEmail: string
  guestPhone: string
  checkIn: string // YYYY-MM-DD
  checkOut: string // YYYY-MM-DD
  guests: number
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | 'refunded'
  priceBreakdown: BookingPriceBreakdown
  currency: string
  paymentMethod: string
  paymentTransactionId: string
  specialRequests?: string
  conciergeServicesBooked: string[]
  createdAt: string
  cancellationReason?: string
  refundAmount?: number
}

export interface ConciergeService {
  id: string
  title: string
  category: 'Dining' | 'Transport' | 'Wellness' | 'Experiences' | 'Staff'
  description: string
  price: number
  currency: string
  pricingModel: 'per_day' | 'per_person' | 'fixed'
  image: string
  duration: string
  includedDetails: string[]
}

export interface CleaningTask {
  id: string
  propertyId: string
  propertyName: string
  bookingReference?: string
  assignedTo: string
  dueAt: string
  status: 'pending' | 'in_progress' | 'completed' | 'verified'
  checklist: { task: string; done: boolean }[]
  notes?: string
}

export interface MaintenanceTask {
  id: string
  propertyId: string
  propertyName: string
  reportedBy: string
  assignedTo?: string
  description: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved'
  costEstimate?: number
  createdAt: string
}

export interface Review {
  id: string
  bookingId: string
  propertyId: string
  guestId: string
  guestName: string
  rating: number
  ratingsBreakdown: {
    cleanliness: number
    accuracy: number
    location: number
    communication: number
    value: number
  }
  comment: string
  hostReply?: string
  status: 'approved' | 'pending' | 'rejected'
  createdAt: string
}

export interface Coupon {
  code: string
  discountType: 'percentage' | 'fixed'
  amount: number
  minNights?: number
  minTotal?: number
  active: boolean
}

export interface AuditLog {
  id: string
  actorId: string
  actorName: string
  action: string
  entityType: string
  entityId: string
  details: string
  timestamp: string
}

export interface ConversationMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  text: string
  timestamp: string
}

export interface Conversation {
  id: string
  bookingReference: string
  propertyName: string
  guestId: string
  guestName: string
  ownerId: string
  messages: ConversationMessage[]
  updatedAt: string
}

// Global In-Memory Store
class LuxuryHospitalityStore {
  users: User[] = [
    {
      id: 'usr-guest-01',
      email: 'guest@maisonvela.com',
      fullName: 'Aarav Singhania',
      phone: '+91 98201 54321',
      role: 'guest',
      status: 'active',
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'usr-host-01',
      email: 'host@maisonvela.com',
      fullName: 'Maharaja Vikramaditya & Sunita Verma',
      phone: '+91 98110 87654',
      role: 'host',
      status: 'active',
      createdAt: '2026-01-10T08:30:00Z',
    },
    {
      id: 'usr-owner-01',
      email: 'owner@maisonvela.com',
      fullName: 'Maharaja Vikramaditya',
      phone: '+91 98110 87654',
      role: 'host',
      status: 'active',
      createdAt: '2026-01-10T08:30:00Z',
    },
    {
      id: 'usr-manager-01',
      email: 'manager@maisonvela.com',
      fullName: 'Devika Mehra',
      phone: '+91 97170 33445',
      role: 'property_manager',
      status: 'active',
      createdAt: '2026-01-12T09:00:00Z',
    },
    {
      id: 'usr-support-01',
      email: 'support@maisonvela.com',
      fullName: 'Karan Malhotra (Concierge Support)',
      phone: '+91 98330 22114',
      role: 'support_agent',
      status: 'active',
      createdAt: '2026-01-14T09:00:00Z',
    },
    {
      id: 'usr-admin-01',
      email: 'admin@maisonvela.com',
      fullName: 'Maison Véla Platform Admin',
      phone: '+91 99990 11223',
      role: 'admin',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'usr-super-01',
      email: 'superadmin@maisonvela.com',
      fullName: 'Maison Véla Super Administrator',
      phone: '+91 99990 99999',
      role: 'super_admin',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ]

  properties: Property[] = [
    {
      id: 'prop-casa-serena',
      ownerId: 'usr-owner-01',
      slug: 'casa-serena-goa',
      name: 'Casa Serena',
      tagline: 'A quiet sanctuary set behind heritage laterite walls in Assagao',
      description: 'A serene luxury sanctuary set behind 18th-century laterite stone walls. Casa Serena opens into a tranquil private courtyard where frangipani blossoms shade a 15-metre lap pool. Hand-carved teak woodwork, Portuguese encaustic tiles, and custom brass light fixtures marry vintage Goan heritage with discreet modern elegance. Fully serviced with an in-house private chef, butler, and housekeeping team.',
      city: 'Assagao',
      region: 'Goa',
      country: 'India',
      address: 'Badem Road, Assagao, North Goa 403507',
      coordinates: { lat: 15.5898, lng: 73.7732 },
      accommodationType: 'Private pool villa',
      category: 'Private Pool Villas',
      maxGuests: 10,
      bedrooms: 5,
      bathrooms: 5.5,
      baseNightlyPrice: 48500,
      cleaningFee: 3500,
      currency: 'INR',
      status: 'published',
      managementModel: 'managed',
      averageRating: 4.98,
      reviewCount: 38,
      isFeatured: true,
      isVerified: true,
      instantBookable: true,
      amenities: [
        'Private lap pool',
        'In-house private chef',
        'Butler service',
        'Heritage veranda',
        'High-speed fiber Wi-Fi',
        'Central climate control',
        'Lush tropical garden',
        'Artisanal cocktail bar',
        'Sonos sound system',
        '24/7 Gated security',
      ],
      images: [
        { id: 'cs-1', url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=85', altText: 'Casa Serena exterior pool and sun deck', isCover: true, position: 0 },
        { id: 'cs-2', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85', altText: 'Sunlit living salon and arched doorways', isCover: false, position: 1 },
        { id: 'cs-3', url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85', altText: 'Master suite with private veranda', isCover: false, position: 2 },
        { id: 'cs-4', url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1600&q=85', altText: 'Open dining pavilion overlooking gardens', isCover: false, position: 3 },
      ],
      houseRules: [
        'No smoking inside residential pavilions',
        'Music permitted at conversational volumes after 10 PM',
        'Pets welcome with prior concierge arrangement',
        'Check-in: 3:00 PM · Check-out: 11:00 AM',
      ],
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Moderate',
      minStayNights: 2,
      hostName: 'Véla Managed Private Collection',
      hostType: 'Superhost & Managed Partner',
      createdAt: '2026-01-05T12:00:00Z',
    },
    {
      id: 'prop-the-blue-house',
      ownerId: 'usr-owner-01',
      slug: 'the-blue-house-anjuna',
      name: 'The Blue House',
      tagline: 'Restored 19th-century Portuguese estate amidst swaying coconut groves',
      description: 'Framed by indigo-washed facade and sweeping terracotta roofs, The Blue House is a soulful tribute to Goa’s coastal charm. Generous high ceilings, antique colonial furniture, a sun-dappled courtyard plunge pool, and an open-air verandah made for leisurely breakfast banquets crafted with ingredients from the estate organic garden.',
      city: 'Anjuna',
      region: 'Goa',
      country: 'India',
      address: 'Near St. Michael Church, Anjuna, Goa 403509',
      coordinates: { lat: 15.5804, lng: 73.7428 },
      accommodationType: 'Heritage estate',
      category: 'Private Pool Villas',
      maxGuests: 8,
      bedrooms: 4,
      bathrooms: 4.0,
      baseNightlyPrice: 62000,
      cleaningFee: 4000,
      currency: 'INR',
      status: 'published',
      managementModel: 'managed',
      averageRating: 4.96,
      reviewCount: 29,
      isFeatured: true,
      isVerified: true,
      instantBookable: true,
      amenities: [
        'Courtyard plunge pool',
        'Organic garden-to-table breakfast',
        'Heritage high ceilings',
        'Colonial veranda',
        'Pet friendly grounds',
        'Wine cellar',
        'High-speed Wi-Fi',
        'Bespoke bath amenities',
      ],
      images: [
        { id: 'bh-1', url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85', altText: 'The Blue House courtyard and pool', isCover: true, position: 0 },
        { id: 'bh-2', url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1600&q=85', altText: 'Sunlit living room with antique decor', isCover: false, position: 1 },
        { id: 'bh-3', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85', altText: 'Dining room under wooden rafters', isCover: false, position: 2 },
      ],
      houseRules: [
        'Respect historic architectural woodwork and antique decor',
        'Quiet hours from 10:30 PM',
        'Check-in: 2:00 PM · Check-out: 11:00 AM',
      ],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Moderate',
      minStayNights: 2,
      hostName: 'Sunita Verma',
      hostType: 'Private Owner',
      createdAt: '2026-01-08T10:00:00Z',
    },
    {
      id: 'prop-casa-del-mar',
      ownerId: 'usr-owner-01',
      slug: 'casa-del-mar-morjim',
      name: 'Casa del Mar',
      tagline: 'Private beachfront architectural estate on Morjim shore',
      description: 'Directly kissing the soft sands of Morjim turtle beach, Casa del Mar is a bold modernist beachfront estate. Floor-to-ceiling panoramic glass walls capture golden Arabian Sea sunsets, while an infinity pool dissolves into the ocean horizon. Includes a dedicated seafood chef, sunset cocktail deck, and private beach loungers.',
      city: 'Morjim',
      region: 'Goa',
      country: 'India',
      address: 'Turtle Beach Way, Morjim, Goa 403512',
      coordinates: { lat: 15.6179, lng: 73.7335 },
      accommodationType: 'Beachfront villa',
      category: 'Beachfront Estates',
      maxGuests: 12,
      bedrooms: 6,
      bathrooms: 6.5,
      baseNightlyPrice: 78500,
      cleaningFee: 5000,
      currency: 'INR',
      status: 'published',
      managementModel: 'managed',
      averageRating: 4.93,
      reviewCount: 44,
      isFeatured: true,
      isVerified: true,
      instantBookable: true,
      amenities: [
        'Direct beach access',
        'Heated oceanfront infinity pool',
        'Gourmet private chef',
        'Rooftop sunset lounge',
        'Private screening cinema',
        'Steam and sauna suite',
        'Full housekeeping staff',
        'Paddleboards & water gear',
      ],
      images: [
        { id: 'cdm-1', url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85', altText: 'Infinity pool overlooking Morjim beach', isCover: true, position: 0 },
        { id: 'cdm-2', url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=85', altText: 'Coastal terrace in twilight', isCover: false, position: 1 },
        { id: 'cdm-3', url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85', altText: 'Oceanfront bedroom with sea views', isCover: false, position: 2 },
      ],
      houseRules: [
        'Footwear rinsed after beach return',
        'Parties subject to prior approval',
        'Check-in: 3:00 PM · Check-out: 12:00 PM',
      ],
      checkInTime: '15:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Strict',
      minStayNights: 3,
      hostName: 'Véla Signature Properties',
      hostType: 'Managed Luxury Operator',
      createdAt: '2026-01-11T14:20:00Z',
    },
    {
      id: 'prop-haveli-nilaya',
      ownerId: 'usr-owner-01',
      slug: 'haveli-nilaya-udaipur',
      name: 'Haveli Nilaya',
      tagline: 'Palatial 7-suite royal residence overlooking Lake Pichola',
      description: 'Perched along the historic lakeside slopes of Udaipur, Haveli Nilaya offers an intimate glimpse into the royal heritage of Mewar. Marble pillars, hand-painted gold leaf murals, secluded jharokhas with shimmering water vistas, and a tranquil courtyard pool scented by jasmine. Catered by traditional royal khansamas and personal butlers.',
      city: 'Udaipur',
      region: 'Rajasthan',
      country: 'India',
      address: 'Lal Ghat Waterfront, Udaipur, Rajasthan 313001',
      coordinates: { lat: 24.5764, lng: 73.6835 },
      accommodationType: 'Palace residence',
      category: 'Royal Residences',
      maxGuests: 14,
      bedrooms: 7,
      bathrooms: 8.0,
      baseNightlyPrice: 92500,
      cleaningFee: 6500,
      currency: 'INR',
      status: 'published',
      managementModel: 'managed',
      averageRating: 4.99,
      reviewCount: 52,
      isFeatured: true,
      isVerified: true,
      instantBookable: false,
      amenities: [
        'Lake Pichola water views',
        'Private royal butler service',
        'Royal Rajasthani banquet chef',
        'Heritage courtyard plunge pool',
        'Vintage car airport transfers',
        'Private rooftop observatory',
        'Traditional spa therapy room',
        'Cultural music performances on request',
      ],
      images: [
        { id: 'hn-1', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85', altText: 'Marble courtyard and arched pavilion', isCover: true, position: 0 },
        { id: 'hn-2', url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85', altText: 'Royal suite bedroom with lake vista', isCover: false, position: 1 },
        { id: 'hn-3', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85', altText: 'Rooftop terrace overlooking Lake Pichola', isCover: false, position: 2 },
      ],
      houseRules: [
        'Preserve historic marble fixtures and heritage tapestries',
        'Shoes removed in sanctum courtyard',
        'Check-in: 2:00 PM · Check-out: 11:00 AM',
      ],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Strict',
      minStayNights: 2,
      hostName: 'Maharaja Vikramaditya',
      hostType: 'Royal Custodian',
      createdAt: '2026-01-02T16:00:00Z',
    },
    {
      id: 'prop-the-pahadi-house',
      ownerId: 'usr-owner-01',
      slug: 'the-pahadi-house-landour',
      name: 'The Pahadi House',
      tagline: 'Warm deodar-wood mountain refuge above the clouds in Landour',
      description: 'Nestled on an alpine ridge in the cantonment woods of Landour, The Pahadi House is crafted from aged cedar and local stone. Panoramic Himalayan snow-peak views from every picture window, crackling wood fireplaces in every bedroom, an extensive private library, and hearty hill-style comfort dining.',
      city: 'Landour',
      region: 'Uttarakhand',
      country: 'India',
      address: 'Upper Chukkar, Landour Cantonment, Mussoorie 248179',
      coordinates: { lat: 30.4578, lng: 78.0931 },
      accommodationType: 'Mountain retreat',
      category: 'Mountain Retreats',
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 3.5,
      baseNightlyPrice: 39500,
      cleaningFee: 2500,
      currency: 'INR',
      status: 'published',
      managementModel: 'marketplace',
      averageRating: 4.97,
      reviewCount: 31,
      isFeatured: true,
      isVerified: true,
      instantBookable: true,
      amenities: [
        'Panoramic Himalayan snow views',
        'Stone wood-burning fireplaces',
        'Estate-grown tea & breakfast',
        'Curated mountain library',
        'Telescope for stargazing',
        'Heated stone flooring',
        'Forest walking trail access',
      ],
      images: [
        { id: 'ph-1', url: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1600&q=85', altText: 'Mountain timber chalet exterior in mist', isCover: true, position: 0 },
        { id: 'ph-2', url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1600&q=85', altText: 'Fireplace seating area with snow views', isCover: false, position: 1 },
        { id: 'ph-3', url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85', altText: 'Cozy cedar bedroom suite', isCover: false, position: 2 },
      ],
      houseRules: [
        'Only eco-safe logs used in fireplaces',
        'Smoking strictly prohibited due to forest fire regulations',
        'Check-in: 1:00 PM · Check-out: 11:00 AM',
      ],
      checkInTime: '13:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Flexible',
      minStayNights: 2,
      hostName: 'Col. Rajesh Bakshi (Retd.)',
      hostType: 'Owner Host',
      createdAt: '2026-01-14T09:15:00Z',
    },
    {
      id: 'prop-the-glasshouse',
      ownerId: 'usr-owner-01',
      slug: 'the-glasshouse-coonoor',
      name: 'The Glasshouse',
      tagline: 'Modernist glass-walled colonial bungalow amid rolling tea gardens',
      description: 'Suspended over emerald Nilgiri tea hills, The Glasshouse seamlessly combines floor-to-ceiling glass architecture with 1920s plantation grandeur. Savor freshly plucked organic Nilgiri single-estate teas on the cantilevered lawn, followed by four-course fireside dinners.',
      city: 'Coonoor',
      region: 'Tamil Nadu',
      country: 'India',
      address: 'Sim’s Park Ridge, Coonoor, Nilgiris 643101',
      coordinates: { lat: 11.3530, lng: 76.7959 },
      accommodationType: 'Plantation bungalow',
      category: 'Mountain Retreats',
      maxGuests: 8,
      bedrooms: 4,
      bathrooms: 3.5,
      baseNightlyPrice: 44000,
      cleaningFee: 3000,
      currency: 'INR',
      status: 'published',
      managementModel: 'managed',
      averageRating: 4.95,
      reviewCount: 22,
      isFeatured: false,
      isVerified: true,
      instantBookable: true,
      amenities: [
        '360° Nilgiri tea estate views',
        'Floor-to-ceiling glass pavilions',
        'Private tea estate tours',
        'Fire pit & outdoor barbeque',
        'Gourmet Anglo-Indian chef',
        'Botanical garden walks',
      ],
      images: [
        { id: 'gh-1', url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1600&q=85', altText: 'Glass conservatory overlooking tea fields', isCover: true, position: 0 },
        { id: 'gh-2', url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85', altText: 'Verandah tea tasting setup', isCover: false, position: 1 },
      ],
      houseRules: [
        'Tea plant clipping strictly forbidden',
        'Check-in: 2:00 PM · Check-out: 11:00 AM',
      ],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Moderate',
      minStayNights: 2,
      hostName: 'Véla Heritage Estates',
      hostType: 'Managed Partner',
      createdAt: '2026-01-16T11:00:00Z',
    },
    {
      id: 'prop-penthouse-amber',
      ownerId: 'usr-owner-01',
      slug: 'penthouse-amber-mumbai',
      name: 'Penthouse Amber',
      tagline: 'Duplex sky residence with private plunge pool above Bandra Bandstand',
      description: 'An exclusive duplex sky mansion commanding uninterrupted views of the Bandra coastline and Mumbai city lights. Features 22-foot double-height ceilings, Italian travertine finishes, a glass-sided heated terrace plunge pool, private elevator access, and 24-hour concierge.',
      city: 'Mumbai',
      region: 'Maharashtra',
      country: 'India',
      address: 'Bandstand Promenade, Bandra West, Mumbai 400050',
      coordinates: { lat: 19.0434, lng: 72.8197 },
      accommodationType: 'City penthouse',
      category: 'Urban Penthouses',
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 3.5,
      baseNightlyPrice: 68500,
      cleaningFee: 4500,
      currency: 'INR',
      status: 'published',
      managementModel: 'managed',
      averageRating: 4.91,
      reviewCount: 26,
      isFeatured: false,
      isVerified: true,
      instantBookable: true,
      amenities: [
        'Private rooftop terrace pool',
        'Arabian sea & city skyline views',
        'Private high-speed elevator',
        '24/7 Dedicated building concierge',
        'Sub-Zero and Miele chef’s kitchen',
        'Two secure basement car parks',
        'State-of-the-art gym access',
      ],
      images: [
        { id: 'pa-1', url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1600&q=85', altText: 'Skyline view from duplex penthouse terrace', isCover: true, position: 0 },
        { id: 'pa-2', url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85', altText: 'Double height living room with marble flooring', isCover: false, position: 1 },
      ],
      houseRules: [
        'Commercial film or photography shoots require prior written license',
        'No loud outdoor terrace music after 11 PM',
        'Check-in: 3:00 PM · Check-out: 12:00 PM',
      ],
      checkInTime: '15:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Strict',
      minStayNights: 1,
      hostName: 'Sanjay Raheja',
      hostType: 'Owner Host',
      createdAt: '2026-01-18T15:30:00Z',
    },
    {
      id: 'prop-villa-solarium',
      ownerId: 'usr-owner-01',
      slug: 'villa-solarium-alibaug',
      name: 'Villa Solarium',
      tagline: 'Brutalist concrete and teak villa with 20m lap pool in Awas, Alibaug',
      description: 'An architectural marvel framed by organic mango orchards just 10 minutes from Mandwa Jetty. Villa Solarium features board-formed architectural concrete, warm Burmese teak shutters, lush reflection ponds, and an open dining pavilion served by a resident culinary team.',
      city: 'Alibaug',
      region: 'Maharashtra',
      country: 'India',
      address: 'Awas Beach Road, Alibaug, Maharashtra 402201',
      coordinates: { lat: 18.7758, lng: 72.8712 },
      accommodationType: 'Private pool villa',
      category: 'Private Pool Villas',
      maxGuests: 12,
      bedrooms: 5,
      bathrooms: 5.5,
      baseNightlyPrice: 58000,
      cleaningFee: 4000,
      currency: 'INR',
      status: 'published',
      managementModel: 'managed',
      averageRating: 4.95,
      reviewCount: 19,
      isFeatured: true,
      isVerified: true,
      instantBookable: true,
      amenities: [
        '20-metre lap pool with submerged daybeds',
        'Private speed boat transfer coordination',
        'Orchard dining pavilion',
        'Outdoor rain showers',
        'Alibaug seafood chef',
        'Yoga deck & landscaped lawn',
      ],
      images: [
        { id: 'vs-1', url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85', altText: 'Pool pavilion and teak structure', isCover: true, position: 0 },
        { id: 'vs-2', url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=85', altText: 'Sunlit living gallery', isCover: false, position: 1 },
      ],
      houseRules: [
        'Speedboat transfers can be scheduled with concierge',
        'Smoking in designated outdoor garden areas only',
        'Check-in: 2:00 PM · Check-out: 11:00 AM',
      ],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Moderate',
      minStayNights: 2,
      hostName: 'Véla Signature Properties',
      hostType: 'Managed Luxury Operator',
      createdAt: '2026-01-20T17:00:00Z',
    },
  ]

  bookings: Booking[] = [
    {
      id: 'bk-2026-0811',
      reference: 'MV-2026-9041',
      propertyId: 'prop-casa-serena',
      propertyName: 'Casa Serena',
      propertyCity: 'Assagao, Goa',
      propertyCoverImage: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
      guestId: 'usr-guest-01',
      guestName: 'Aarav Singhania',
      guestEmail: 'guest@maisonvela.com',
      guestPhone: '+91 98201 54321',
      checkIn: '2026-11-12',
      checkOut: '2026-11-16',
      guests: 6,
      status: 'confirmed',
      priceBreakdown: {
        nights: 4,
        nightlyRate: 48500,
        accommodationTotal: 194000,
        cleaningFee: 3500,
        guestServiceFee: 23280,
        taxes: 39110,
        discountAmount: 19400, // VELA10 promo applied
        grossTotal: 240490,
        currency: 'INR',
      },
      currency: 'INR',
      paymentMethod: 'Razorpay / UPI',
      paymentTransactionId: 'pay_rzp_mock_98231',
      specialRequests: 'Please arrange private chef for coastal seafood dinner on arrival night.',
      conciergeServicesBooked: ['Private Chef Banquet', 'Luxury Chauffeur Transfer'],
      createdAt: '2026-10-20T14:10:00Z',
    },
    {
      id: 'bk-2026-0722',
      reference: 'MV-2026-7249',
      propertyId: 'prop-haveli-nilaya',
      propertyName: 'Haveli Nilaya',
      propertyCity: 'Udaipur, Rajasthan',
      propertyCoverImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
      guestId: 'usr-guest-01',
      guestName: 'Aarav Singhania',
      guestEmail: 'guest@maisonvela.com',
      guestPhone: '+91 98201 54321',
      checkIn: '2026-09-04',
      checkOut: '2026-09-07',
      guests: 4,
      status: 'completed',
      priceBreakdown: {
        nights: 3,
        nightlyRate: 92500,
        accommodationTotal: 277500,
        cleaningFee: 6500,
        guestServiceFee: 33300,
        taxes: 55944,
        discountAmount: 0,
        grossTotal: 373244,
        currency: 'INR',
      },
      currency: 'INR',
      paymentMethod: 'Stripe International Card',
      paymentTransactionId: 'ch_mock_stripe_77123',
      conciergeServicesBooked: ['Sunset Lake Cruise & Sitar Player'],
      createdAt: '2026-08-15T09:25:00Z',
    },
  ]

  conciergeServices: ConciergeService[] = [
    {
      id: 'svc-private-chef',
      title: 'Private Gourmet Chef & Khansama',
      category: 'Dining',
      description: 'Dedicated Michelin-caliber or authentic regional culinary master crafting customized multi-course menus tailored to your dietary preferences with freshest local produce.',
      price: 9500,
      currency: 'INR',
      pricingModel: 'per_day',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      duration: 'Full Day (Breakfast, Lunch & Dinner)',
      includedDetails: ['Custom menu consultation', 'Table styling & full pantry provisioning', 'Dedicated culinary assistant & clean-up'],
    },
    {
      id: 'svc-chauffeur',
      title: 'Luxury Mercedes / Land Cruiser Chauffeur',
      category: 'Transport',
      description: 'Chauffeured luxury SUV or sedan for airport transfers, regional discovery, and private excursions with an English-fluent hospitality driver.',
      price: 14000,
      currency: 'INR',
      pricingModel: 'per_day',
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
      duration: '8 Hours / 80 Kilometers',
      includedDetails: ['Chilled bottled spring water & hand towels', 'Flight tracking & VIP tarmac pick-up', 'Fuel, tolls and parking included'],
    },
    {
      id: 'svc-yacht-charter',
      title: 'Private Catamaran / Sunset Yacht Charter',
      category: 'Experiences',
      description: 'Set sail on the azure coastal waters with your private captain and crew. Indulge in sunset champagne toasts and artisanal charcuterie boards.',
      price: 45000,
      currency: 'INR',
      pricingModel: 'fixed',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
      duration: '3-Hour Sunset Cruise',
      includedDetails: ['Certified master captain & hospitality steward', 'Chilled Prosecco, mocktails & gourmet mezze platter', 'Snorkeling equipment and safety gear'],
    },
    {
      id: 'svc-sommelier-tasting',
      title: 'In-Villa Sommelier & Wine Pairing Salon',
      category: 'Dining',
      description: 'An intimate guided tasting of exceptional Old and New World vintages paired with artisanal cheeses and charcuterie.',
      price: 18500,
      currency: 'INR',
      pricingModel: 'fixed',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      duration: '2.5 Hours',
      includedDetails: ['Five premium curated international reserve wines', 'Artisanal cheese & charcuterie board', 'Riedel crystal glassware'],
    },
    {
      id: 'svc-wellness-spa',
      title: 'Holistic Ayurvedic Spa & Yoga Master',
      category: 'Wellness',
      description: 'Morning sunrise Pranayama and Hatha yoga session on your private pool deck, followed by bespoke herbal Abhyanga therapies.',
      price: 11000,
      currency: 'INR',
      pricingModel: 'per_person',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
      duration: '2 Hours',
      includedDetails: ['Certified yoga master instruction', 'Organic herbal warm oil therapy', 'Ayurvedic wellness consultation'],
    },
  ]

  cleaningTasks: CleaningTask[] = [
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
        { task: 'Air purification cycle in all 5 guest suites', done: false },
      ],
      notes: 'Guest prefers hypoallergenic down-alternative pillows in Master Suite 1.',
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
        { task: 'Inspect AC filters and dehumidifiers', done: true },
      ],
    },
  ]

  maintenanceTasks: MaintenanceTask[] = [
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
      createdAt: '2026-10-24T11:00:00Z',
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
      createdAt: '2026-10-23T16:00:00Z',
    },
  ]

  reviews: Review[] = [
    {
      id: 'rev-01',
      bookingId: 'bk-2026-0722',
      propertyId: 'prop-haveli-nilaya',
      guestId: 'usr-guest-01',
      guestName: 'Aarav Singhania',
      rating: 5,
      ratingsBreakdown: { cleanliness: 5, accuracy: 5, location: 5, communication: 5, value: 5 },
      comment: 'An utterly breathtaking experience. The morning mist rising over Lake Pichola seen from our jharokha was pure magic. Chef Ranveer’s Dal Baati and Laal Maas banquet was the best meal we had in Rajasthan. Maison Véla’s concierge service made every detail seamless.',
      hostReply: 'Thank you Aarav for your kind words. It was an honor hosting you at our family haveli. We look forward to welcoming you back.',
      status: 'approved',
      createdAt: '2026-09-08T11:20:00Z',
    },
    {
      id: 'rev-02',
      bookingId: 'bk-past-882',
      propertyId: 'prop-casa-serena',
      guestId: 'usr-guest-02',
      guestName: 'Eleanor Vance (London)',
      rating: 5,
      ratingsBreakdown: { cleanliness: 5, accuracy: 5, location: 5, communication: 5, value: 5 },
      comment: 'Casa Serena is even more captivating in reality than the photographs. The gardens are pristine, the pool temperature was ideal, and the quiet rhythm of Assagao made this a true retreat. Truly unmatched hospitality.',
      status: 'approved',
      createdAt: '2026-08-20T15:45:00Z',
    },
  ]

  coupons: Coupon[] = [
    { code: 'VELA10', discountType: 'percentage', amount: 10, minNights: 2, active: true },
    { code: 'ROYAL15', discountType: 'percentage', amount: 15, minNights: 3, active: true },
    { code: 'WELCOME5000', discountType: 'fixed', amount: 5000, minTotal: 50000, active: true },
  ]

  auditLogs: AuditLog[] = [
    {
      id: 'log-01',
      actorId: 'usr-admin-01',
      actorName: 'Admin Executive',
      action: 'APPROVE_PROPERTY',
      entityType: 'PROPERTY',
      entityId: 'prop-casa-del-mar',
      details: 'Approved luxury beachfront estate after verified site audit & document verification.',
      timestamp: '2026-01-11T14:30:00Z',
    },
    {
      id: 'log-02',
      actorId: 'usr-guest-01',
      actorName: 'Aarav Singhania',
      action: 'CREATE_BOOKING',
      entityType: 'BOOKING',
      entityId: 'bk-2026-0811',
      details: 'Booked Casa Serena (Nov 12 - 16, 2026), Gross: ₹2,40,490 via UPI.',
      timestamp: '2026-10-20T14:10:00Z',
    },
  ]

  conversations: Conversation[] = [
    {
      id: 'conv-01',
      bookingReference: 'MV-2026-9041',
      propertyName: 'Casa Serena',
      guestId: 'usr-guest-01',
      guestName: 'Aarav Singhania',
      ownerId: 'usr-owner-01',
      updatedAt: '2026-10-21T10:15:00Z',
      messages: [
        {
          id: 'msg-1',
          senderId: 'usr-guest-01',
          senderName: 'Aarav Singhania',
          senderRole: 'guest',
          text: 'Hello Sunita, we are arriving around 4:30 PM on Nov 12. Could the chef prepare a light Goan fish curry for our welcome dinner?',
          timestamp: '2026-10-21T09:45:00Z',
        },
        {
          id: 'msg-2',
          senderId: 'usr-owner-01',
          senderName: 'Maharaja Vikramaditya & Sunita Verma',
          senderRole: 'owner',
          text: 'Dear Aarav, wonderful! Chef Anand will source fresh Kingfish from the Mapusa market that morning. We will have chilled fresh coconut water ready on your arrival.',
          timestamp: '2026-10-21T10:15:00Z',
        },
      ],
    },
  ]

  // Platform commissions configuration
  commissionSettings = {
    marketplaceCommissionRate: 0.12, // 12% for unmanaged listings
    managedCommissionRate: 0.22, // 22% for fully managed luxury villas
    guestServiceFeeRate: 0.12, // 12% guest service fee
    taxGstRate: 0.18, // 18% GST
  }
}

export const luxuryStore = new LuxuryHospitalityStore()
