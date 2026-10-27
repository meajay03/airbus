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
  tag?: string
}

export interface BookingPriceBreakdown {
  nights: number
  nightlyRate: number
  accommodationTotal: number
  cleaningFee: number
  guestServiceFee: number
  taxes: number
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
  checkIn: string
  checkOut: string
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

export type PlatformRole =
  | 'guest'
  | 'host'
  | 'property_manager'
  | 'support_agent'
  | 'admin'
  | 'super_admin'
  | 'owner'
  | 'manager'

export interface User {
  id: string
  email: string
  fullName: string
  phone?: string
  role: PlatformRole
  roles?: string[]
  permissions?: string[]
  status: 'active' | 'suspended' | 'pending'
  createdAt?: string
}
