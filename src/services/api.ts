import { Property, Booking, BookingPriceBreakdown, CleaningTask, MaintenanceTask, User } from '../types/index'

const TOKEN_KEY = 'maison_vela_token'
const USER_KEY = 'maison_vela_user'

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {}
}

export const clearAuthSession = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {}
}

export const getStoredUser = (): User | null => {
  try {
    const token = getAuthToken()
    if (!token) return null
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const setStoredUser = (user: User): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {}
}

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export class LuxuryApiClient {
  static async getHealth() {
    const res = await fetch('/api/health')
    return res.json()
  }

  // --- AUTHENTICATION ---
  static async login(payload: { email: string; password: string }): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Authentication failed. Please check your credentials.')
    }
    const data = await res.json()
    if (data.token) setAuthToken(data.token)
    if (data.user) setStoredUser(data.user)
    return data
  }

  static async register(payload: {
    email: string
    fullName: string
    password?: string
    phone?: string
    role?: 'guest' | 'host' | 'property_manager' | 'support_agent' | 'admin' | 'super_admin' | 'owner' | 'manager'
  }): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Account creation failed. Please check your details.')
    }
    const data = await res.json()
    if (data.token) setAuthToken(data.token)
    if (data.user) setStoredUser(data.user)
    return data
  }

  static async getMe(): Promise<{ user: User }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    })
    if (!res.ok) throw new Error('Unauthenticated')
    return res.json()
  }

  static async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      })
    } catch {}
    clearAuthSession()
  }

  static async switchRole(role: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    })
    if (!res.ok) throw new Error('Failed to switch perspective')
    const data = await res.json()
    if (data.token) setAuthToken(data.token)
    if (data.user) setStoredUser(data.user)
    return data
  }

  // --- PROPERTIES ---
  static async getProperties(params?: {
    destination?: string
    guests?: number
    category?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
    includeAll?: boolean
  }): Promise<{ data: Property[]; total: number }> {
    const query = new URLSearchParams()
    if (params?.destination) query.set('destination', params.destination)
    if (params?.guests) query.set('guests', params.guests.toString())
    if (params?.category && params.category !== 'All stays') query.set('category', params.category)
    if (params?.minPrice) query.set('minPrice', params.minPrice.toString())
    if (params?.maxPrice) query.set('maxPrice', params.maxPrice.toString())
    if (params?.sort) query.set('sort', params.sort)
    if (params?.includeAll) query.set('includeAll', 'true')

    const res = await fetch(`/api/properties?${query.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch properties')
    return res.json()
  }

  static async getPropertyBySlug(slug: string): Promise<{ property: Property; similar: Property[] }> {
    const res = await fetch(`/api/properties/${slug}`)
    if (!res.ok) throw new Error('Property not found')
    return res.json()
  }

  static async createProperty(payload: Partial<Property>): Promise<{ property: Property; message: string }> {
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to submit property')
    }
    return res.json()
  }

  static async updatePropertyStatus(id: string, status: string, remarks?: string): Promise<{ property: Property }> {
    const res = await fetch(`/api/properties/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, remarks })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update property status')
    }
    return res.json()
  }

  // --- BOOKINGS ---
  static async getBookings(params?: { propertyId?: string; guestId?: string }): Promise<{ bookings: Booking[] }> {
    const query = new URLSearchParams()
    if (params?.propertyId) query.set('propertyId', params.propertyId)
    if (params?.guestId) query.set('guestId', params.guestId)

    const res = await fetch(`/api/bookings?${query.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch bookings')
    return res.json()
  }

  static async getBookingQuote(payload: {
    propertyId: string
    checkIn: string
    checkOut: string
    couponCode?: string
  }): Promise<{ quote: BookingPriceBreakdown; available: boolean }> {
    const res = await fetch('/api/bookings/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Failed to calculate booking quote')
    return res.json()
  }

  static async createBooking(payload: {
    propertyId: string
    guestId?: string
    guestName: string
    guestEmail: string
    guestPhone?: string
    checkIn: string
    checkOut: string
    guests: number
    couponCode?: string
    paymentMethod?: string
    idempotencyKey: string
    specialRequests?: string
    conciergeServicesBooked?: string[]
  }): Promise<{ booking: Booking; message: string }> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to confirm booking')
    }
    return res.json()
  }

  static async cancelBooking(bookingId: string, reason?: string) {
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    })
    return res.json()
  }

  // --- OPERATIONS ---
  static async getCleaningTasks(): Promise<{ tasks: CleaningTask[] }> {
    const res = await fetch('/api/operations/cleaning')
    if (!res.ok) throw new Error('Failed to fetch cleaning tasks')
    return res.json()
  }

  static async updateCleaningChecklist(taskId: string, checklistIndex: number, checklistDone?: boolean) {
    const res = await fetch(`/api/operations/cleaning/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistIndex, checklistDone })
    })
    return res.json()
  }

  static async getMaintenanceTasks(): Promise<{ tasks: MaintenanceTask[] }> {
    const res = await fetch('/api/operations/maintenance')
    if (!res.ok) throw new Error('Failed to fetch maintenance tasks')
    return res.json()
  }

  static async createMaintenanceTicket(payload: { propertyName: string; description: string; priority: string; costEstimate?: number }) {
    const res = await fetch('/api/operations/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return res.json()
  }

  // --- ADMIN & PROMOTIONS ---
  static async getAdminMetrics() {
    const res = await fetch('/api/admin/metrics')
    return res.json()
  }

  static async getAuditLogs() {
    const res = await fetch('/api/admin/audit-logs')
    return res.json()
  }

  static async getCoupons() {
    const res = await fetch('/api/admin/coupons')
    return res.json()
  }

  static async createCoupon(payload: { code: string; discountType: string; amount: number }) {
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return res.json()
  }

  static async getAdminUsers(params?: { role?: string; status?: string; search?: string }) {
    let url = '/api/admin/users'
    if (params) {
      const q = new URLSearchParams()
      if (params.role) q.append('role', params.role)
      if (params.status) q.append('status', params.status)
      if (params.search) q.append('search', params.search)
      url += `?${q.toString()}`
    }
    const res = await fetch(url, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch users')
    return res.json()
  }

  static async updateUserStatus(userId: string, status: string, reason?: string) {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, reason })
    })
    return res.json()
  }

  static async assignUserRole(userId: string, role: string) {
    const res = await fetch(`/api/admin/users/${userId}/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    })
    return res.json()
  }

  static async revokeUserSessions(userId: string) {
    const res = await fetch(`/api/admin/users/${userId}/revoke-sessions`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return res.json()
  }

  static async getAdminLedger() {
    const res = await fetch('/api/admin/ledger', { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch ledger')
    return res.json()
  }

  // --- ANALYTICS ---
  static async getAnalyticsOverview(params?: { preset?: string; startDate?: string; endDate?: string }) {
    let url = '/api/admin/analytics/overview'
    if (params) {
      const q = new URLSearchParams()
      if (params.preset) q.append('preset', params.preset)
      if (params.startDate) q.append('startDate', params.startDate)
      if (params.endDate) q.append('endDate', params.endDate)
      url += `?${q.toString()}`
    }
    const res = await fetch(url, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch analytics overview')
    return res.json()
  }

  static async getAnalyticsTrends(params?: { preset?: string }) {
    let url = '/api/admin/analytics/trends'
    if (params?.preset) url += `?preset=${params.preset}`
    const res = await fetch(url, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch analytics trends')
    return res.json()
  }

  static async getTopPropertiesAnalytics() {
    const res = await fetch('/api/admin/analytics/top-properties', { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch top properties analytics')
    return res.json()
  }

  static async getDestinationAnalytics() {
    const res = await fetch('/api/admin/analytics/destinations', { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch destination analytics')
    return res.json()
  }

  static async exportAnalyticsCSV(reportType: string = 'executive_kpis') {
    const res = await fetch(`/api/admin/analytics/export?reportType=${reportType}`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to export analytics report')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maison_vela_${reportType}_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  static async updateCommissions(rates: {
    marketplaceRate: number
    managedRate: number
    guestServiceFeeRate: number
    taxGstRate: number
  }) {
    const res = await fetch('/api/admin/commissions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rates)
    })
    return res.json()
  }

  // --- AI CONCIERGE ---
  static async askAIConcierge(prompt: string) {
    const res = await fetch('/api/ai/concierge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })
    if (!res.ok) throw new Error('Failed to query AI Concierge')
    return res.json()
  }
}
