import { Request, Response, NextFunction } from 'express'
import { AuthService, AuthUser } from '../services/authService.js'
import { pool } from '../db/postgres.js'

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

/**
 * Extract bearer token and authenticate user session
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const authenticatedUser = await AuthService.validateToken(token)
    if (authenticatedUser) {
      if (authenticatedUser.status === 'suspended') {
        return res.status(403).json({
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: 'Your account has been suspended. Please contact marketplace governance.'
          }
        })
      }
      req.user = authenticatedUser
      return next()
    }
  }

  // Active role session header support for testing/previewing
  const roleHeader = req.headers['x-user-role'] as string
  if (roleHeader) {
    const testUser = await AuthService.validateToken(`tok_demo_${roleHeader}`)
    if (testUser) {
      req.user = testUser
      return next()
    }
  }

  // Anonymous visitor
  req.user = undefined
  next()
}

/**
 * Middleware: Requires an active, authenticated session
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required. Please sign in.'
      }
    })
  }

  if (req.user.status === 'suspended') {
    return res.status(403).json({
      error: {
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Please contact marketplace governance.'
      }
    })
  }

  next()
}

/**
 * Middleware: Requires one of the specified roles
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' }
      })
    }

    const hasRole = allowedRoles.some(r =>
      req.user!.roles?.includes(r) || req.user!.role === r || req.user!.roles?.includes('super_admin')
    )

    if (!hasRole) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`
        }
      })
    }
    next()
  }
}

/**
 * Middleware: Requires a specific granular RBAC permission
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' }
      })
    }

    // Super Admin has all permissions
    if (req.user.role === 'super_admin' || req.user.roles?.includes('super_admin')) {
      return next()
    }

    const hasPermission = req.user.permissions?.includes(permission)
    if (!hasPermission) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Missing required permission: ${permission}`
        }
      })
    }
    next()
  }
}

/**
 * Middleware: Enforces resource-level ownership (e.g. host can only see their properties/bookings/finances)
 */
export function requireResourceAccess(resourceType: 'property' | 'booking') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' }
      })
    }

    // Admins and super admins have platform-wide access
    if (
      req.user.role === 'admin' ||
      req.user.role === 'super_admin' ||
      req.user.roles?.includes('admin') ||
      req.user.roles?.includes('super_admin') ||
      req.user.permissions?.includes('properties.publish')
    ) {
      return next()
    }

    const resourceId = req.params.id || req.params.propertyId || req.params.bookingId
    if (!resourceId) return next()

    try {
      if (resourceType === 'property') {
        if (!pool) return next()
        // Check ownership or property management assignment
        const checkRes = await pool.query(
          `SELECT owner_id FROM properties WHERE id::text = $1 OR slug = $1`,
          [resourceId]
        )
        if (checkRes.rows.length === 0) {
          return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Property not found.' } })
        }
        const ownerId = checkRes.rows[0].owner_id
        if (ownerId && (ownerId === req.user.id || req.user.id.includes(ownerId) || ownerId.includes(req.user.id))) {
          return next()
        }

        // Check if assigned as hotel manager / property manager
        const mgrCheck = await pool.query(
          `SELECT 1 FROM property_managers WHERE (property_id::text = $1) AND user_id::text = $2`,
          [resourceId, req.user.id]
        )
        if (mgrCheck.rows.length > 0) {
          return next()
        }

        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied: You do not own or manage this property.'
          }
        })
      }

      if (resourceType === 'booking') {
        if (!pool) return next()
        const bRes = await pool.query(
          `SELECT b.guest_id, p.owner_id 
           FROM bookings b
           JOIN properties p ON b.property_id = p.id
           WHERE b.id::text = $1 OR b.reference = $1`,
          [resourceId]
        )
        if (bRes.rows.length === 0) {
          return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reservation not found.' } })
        }
        const row = bRes.rows[0]
        if (
          row.guest_id === req.user.id ||
          row.owner_id === req.user.id ||
          req.user.id.includes(row.guest_id) ||
          req.user.id.includes(row.owner_id)
        ) {
          return next()
        }

        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied: You are not authorized to view this reservation.'
          }
        })
      }
    } catch (err: any) {
      console.warn('Resource check error:', err.message)
    }

    next()
  }
}
