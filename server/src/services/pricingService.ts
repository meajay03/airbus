import { luxuryStore } from '../db/store.js'
import { BookingPriceBreakdown } from '../types/index.js'

export class PricingService {
  static calculateNights(checkIn: string, checkOut: string): number {
    const d1 = new Date(checkIn)
    const d2 = new Date(checkOut)
    const diffTime = d2.getTime() - d1.getTime()
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)))
  }

  static computePriceBreakdown(
    propertyId: string,
    checkIn: string,
    checkOut: string,
    couponCode?: string
  ): BookingPriceBreakdown {
    const property = luxuryStore.properties.find(p => p.id === propertyId)
    if (!property) throw new Error('Property not found')

    const nights = this.calculateNights(checkIn, checkOut)
    const nightlyRate = property.baseNightlyPrice
    const accommodationTotal = nightlyRate * nights
    const cleaningFee = property.cleaningFee || 3000

    // Configured platform service fee (12%)
    const guestServiceFee = Math.round(accommodationTotal * luxuryStore.commissionSettings.guestServiceFeeRate)

    // Validate discount code if supplied
    let discountAmount = 0
    if (couponCode) {
      const coupon = luxuryStore.coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.active)
      if (coupon) {
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round((accommodationTotal * coupon.amount) / 100)
        } else if (coupon.discountType === 'fixed') {
          discountAmount = coupon.amount
        }
      }
    }

    // 18% GST tax on taxable accommodation + service fee
    const taxableBase = Math.max(0, accommodationTotal - discountAmount) + guestServiceFee
    const taxes = Math.round(taxableBase * luxuryStore.commissionSettings.taxGstRate)

    const grossTotal = Math.max(0, accommodationTotal - discountAmount) + cleaningFee + guestServiceFee + taxes

    return {
      nights,
      nightlyRate,
      accommodationTotal,
      cleaningFee,
      guestServiceFee,
      taxes,
      discountAmount,
      grossTotal,
      currency: property.currency || 'INR'
    }
  }

  static hasDateConflict(propertyId: string, checkIn: string, checkOut: string, excludeBookingId?: string): boolean {
    const newStart = new Date(checkIn).getTime()
    const newEnd = new Date(checkOut).getTime()

    return luxuryStore.bookings.some(b => {
      if (b.propertyId !== propertyId) return false
      if (excludeBookingId && b.id === excludeBookingId) return false
      if (b.status === 'cancelled' || b.status === 'refunded') return false

      const existingStart = new Date(b.checkIn).getTime()
      const existingEnd = new Date(b.checkOut).getTime()

      return newStart < existingEnd && newEnd > existingStart
    })
  }
}
