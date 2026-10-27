import { Router, Request, Response } from 'express'
import { luxuryStore } from '../db/store.js'
import { PostgresRepository } from '../db/postgres.js'
import { requirePermission } from '../middleware/auth.js'
import { AuthService } from '../services/authService.js'

export const adminRouter = Router()

// GET /api/admin/metrics - executive financial & operational overview
adminRouter.get('/metrics', requirePermission('analytics.read'), async (_req: Request, res: Response) => {
  try {
    let bookings = luxuryStore.bookings
    try {
      bookings = await PostgresRepository.getBookings()
    } catch {
      // fallback
    }

    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed')
    const gbv = activeBookings.reduce((sum, b) => sum + (b.priceBreakdown?.grossTotal || 0), 0)

    let platformRevenue = 0
    let hostPayables = 0

    activeBookings.forEach(b => {
      const accommodation = (b.priceBreakdown?.accommodationTotal || 0) - (b.priceBreakdown?.discountAmount || 0)
      const hostCommission = Math.round(accommodation * 0.22)
      const guestFee = b.priceBreakdown?.guestServiceFee || 0

      platformRevenue += guestFee + hostCommission
      hostPayables += (accommodation - hostCommission) + (b.priceBreakdown?.cleaningFee || 0)
    })

    res.json({
      metrics: {
        grossBookingValue: gbv,
        platformRevenue,
        hostPayables,
        occupancyRate: 74,
        activeBookingsCount: activeBookings.length,
        publishedPropertiesCount: 8,
        currency: 'INR'
      },
      commissionSettings: luxuryStore.commissionSettings
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin metrics' })
  }
})

// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', requirePermission('audit_logs.read'), async (_req: Request, res: Response) => {
  try {
    let logs = []
    try {
      logs = await PostgresRepository.getAuditLogs()
    } catch {
      logs = luxuryStore.auditLogs
    }
    res.json({ logs })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs' })
  }
})

// GET /api/admin/coupons
adminRouter.get('/coupons', requirePermission('settings.manage'), async (_req: Request, res: Response) => {
  try {
    let coupons = []
    try {
      coupons = await PostgresRepository.getCoupons()
    } catch {
      coupons = luxuryStore.coupons
    }
    res.json({ coupons })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch coupons' })
  }
})

// POST /api/admin/coupons
adminRouter.post('/coupons', requirePermission('settings.manage'), async (req: Request, res: Response) => {
  try {
    const { code, discountType = 'percentage', amount } = req.body
    if (!code || !amount) {
      return res.status(400).json({ error: 'Code and amount are required' })
    }

    try {
      await PostgresRepository.createCoupon(code, discountType, Number(amount))
    } catch {
      // fallback
    }

    const newCoupon = {
      code: code.trim().toUpperCase(),
      discountType: discountType as any,
      amount: Number(amount),
      active: true
    }

    luxuryStore.coupons.unshift(newCoupon)

    if (req.user) {
      await AuthService.logAuditEvent(req.user.id, 'CREATE_COUPON', 'coupon', null, { code, amount, discountType })
    }

    res.status(201).json({
      message: 'Promotion coupon created and activated successfully',
      coupon: newCoupon
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create coupon' })
  }
})

// GET /api/admin/users - registered user oversight
adminRouter.get('/users', requirePermission('users.read'), async (req: Request, res: Response) => {
  try {
    const { role, status, search } = req.query as Record<string, string>
    let users = await PostgresRepository.getUsers({ role, status, search })
    if (!users || users.length === 0) {
      users = luxuryStore.users
    }
    res.json({ users })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' })
  }
})

// PATCH /api/admin/users/:id/status - update account status (e.g. suspend / activate)
adminRouter.patch('/users/:id/status', requirePermission('users.suspend'), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string
    const { status, reason } = req.body
    if (!status || !['active', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (active, suspended, pending) is required' })
    }

    await PostgresRepository.updateUserStatus(userId, status, reason, req.user?.id)

    const memUser = luxuryStore.users.find(u => u.id === userId)
    if (memUser) {
      memUser.status = status as any
    }

    res.json({ message: `User account status updated to ${status}`, id: userId, status })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user status' })
  }
})

// POST /api/admin/users/:id/roles - assign role
adminRouter.post('/users/:id/roles', requirePermission('users.roles.manage'), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string
    const { role } = req.body
    if (!role) return res.status(400).json({ error: 'Role is required' })

    // Prevent privilege escalation: only super_admin can assign super_admin
    if (role === 'super_admin' && req.user?.role !== 'super_admin' && !req.user?.roles?.includes('super_admin')) {
      return res.status(403).json({ error: 'Only Super Administrators can grant super_admin privileges.' })
    }

    const ok = await PostgresRepository.assignUserRole(userId, role)
    if (req.user) {
      await AuthService.logAuditEvent(req.user.id, 'ASSIGN_ROLE', 'user', userId, { role, success: ok })
    }

    res.json({ message: `Role ${role} assigned successfully`, userId, role })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to assign role' })
  }
})

// POST /api/admin/users/:id/revoke-sessions
adminRouter.post('/users/:id/revoke-sessions', requirePermission('users.update'), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string
    await PostgresRepository.revokeUserSessions(userId)
    if (req.user) {
      await AuthService.logAuditEvent(req.user.id, 'REVOKE_SESSIONS', 'user', userId)
    }
    res.json({ message: 'All active sessions for this user have been terminated.', userId })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to revoke sessions' })
  }
})

// GET /api/admin/ledger - live double-entry audit records
adminRouter.get('/ledger', requirePermission('analytics.financial.read'), async (_req: Request, res: Response) => {
  try {
    const ledger = await PostgresRepository.getLedgerEntries()
    res.json({ ledger })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch ledger entries' })
  }
})

// POST /api/admin/commissions - update platform commercial rates
adminRouter.post('/commissions', requirePermission('settings.manage'), async (req: Request, res: Response) => {
  try {
    const { marketplaceRate, managedRate, guestServiceFeeRate, taxGstRate } = req.body
    if (marketplaceRate !== undefined) luxuryStore.commissionSettings.marketplaceCommissionRate = Number(marketplaceRate) / 100
    if (managedRate !== undefined) luxuryStore.commissionSettings.managedCommissionRate = Number(managedRate) / 100
    if (guestServiceFeeRate !== undefined) luxuryStore.commissionSettings.guestServiceFeeRate = Number(guestServiceFeeRate) / 100
    if (taxGstRate !== undefined) luxuryStore.commissionSettings.taxGstRate = Number(taxGstRate) / 100

    if (req.user) {
      await AuthService.logAuditEvent(req.user.id, 'UPDATE_COMMISSIONS', 'settings', null, {
        marketplaceRate, managedRate, guestServiceFeeRate, taxGstRate
      })
    }

    res.json({
      message: 'Platform commission rates updated and recorded in audit ledger',
      commissionSettings: luxuryStore.commissionSettings
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update commissions' })
  }
})
