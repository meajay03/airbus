import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { luxuryStore } from '../db/store.js'
import { AuthService, AuthUser } from '../services/authService.js'
import { pool } from '../db/postgres.js'

export const authRouter = Router()

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const RegisterSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(6).optional().default('vela2026'),
  phone: z.string().optional(),
  role: z.enum(['guest', 'host']).optional().default('guest')
})

// Current user profile & effective permissions
authRouter.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const authenticatedUser = await AuthService.validateToken(token)
    if (authenticatedUser) {
      return res.json({ user: authenticatedUser })
    }
  }

  if (req.user) {
    return res.json({ user: req.user })
  }

  // Active role session header support
  const roleHeader = req.headers['x-user-role'] as string
  if (roleHeader) {
    const testUser = await AuthService.validateToken(`tok_demo_${roleHeader}`)
    if (testUser) {
      return res.json({ user: testUser })
    }
  }

  // Unauthenticated visitor
  res.json({ user: null })
})

authRouter.post('/login', async (req: Request, res: Response) => {
  const parse = LoginSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: 'Valid email and password are required' })
  }
  const { email, password } = parse.data

  let user: AuthUser | undefined = undefined

  if (pool) {
    try {
      const dbRes = await pool.query(
        `SELECT u.id, u.email, u.password_hash, u.full_name, u.phone, u.status
         FROM users u
         WHERE lower(u.email) = lower($1)`,
        [email]
      )
      if (dbRes.rows.length > 0) {
        const row = dbRes.rows[0]
        const isValid = AuthService.verifyPassword(password, row.password_hash)
        if (isValid) {
          if (row.status === 'suspended') {
            return res.status(403).json({
              error: 'Your account has been suspended by the platform administration.'
            })
          }

          // Fetch all roles for user
          const roleRes = await pool.query(
            `SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1`,
            [row.id]
          )
          const roles = roleRes.rows.map(r => r.name)
          if (roles.length === 0) roles.push('guest')
          const primaryRole = roles.includes('super_admin') ? 'super_admin'
            : roles.includes('admin') ? 'admin'
            : roles.includes('host') ? 'host'
            : roles.includes('owner') ? 'owner'
            : roles[0]

          const permissions = await AuthService.resolveEffectivePermissions(row.id, roles)

          user = {
            id: row.id,
            email: row.email,
            fullName: row.full_name,
            phone: row.phone,
            role: primaryRole,
            roles,
            permissions,
            status: row.status
          }
        }
      }
    } catch (err: any) {
      console.warn('PostgreSQL login fallback to store:', err.message)
    }
  }

  // Fallback to memory store if not found in PostgreSQL or DB offline
  if (!user) {
    const storeUser = luxuryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (storeUser && (password === 'vela2026' || password === 'demo123')) {
      const roles = [storeUser.role]
      const permissions = await AuthService.resolveEffectivePermissions(storeUser.id, roles)
      user = {
        id: storeUser.id,
        email: storeUser.email,
        fullName: storeUser.fullName,
        phone: storeUser.phone,
        role: storeUser.role,
        roles,
        permissions,
        status: storeUser.status
      }
    }
  }

  if (!user) {
    // Log failed login attempt
    await AuthService.logAuditEvent(null, 'LOGIN_FAILED', 'user', null, { email, reason: 'Invalid credentials' })
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const session = await AuthService.createSession(user)

  // Log successful login
  await AuthService.logAuditEvent(user.id, 'LOGIN_SUCCESS', 'user', user.id, { email: user.email, role: user.role })

  res.json({
    message: `Signed in as ${user.fullName}`,
    user,
    token: session.token,
    expiresAt: session.expiresAt
  })
})

authRouter.post('/register', async (req: Request, res: Response) => {
  const parse = RegisterSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.issues.map(i => i.message).join(', ') })
  }
  const { email, fullName, password, phone, role } = parse.data

  // Check if email already exists in PostgreSQL
  if (pool) {
    try {
      const checkRes = await pool.query(`SELECT id FROM users WHERE lower(email) = lower($1)`, [email])
      if (checkRes.rows.length > 0) {
        return res.status(409).json({ error: 'An account with this email already exists' })
      }
    } catch (err: any) {
      console.warn('PostgreSQL register email check error:', err.message)
    }
  }

  const existing = luxuryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const passwordHash = AuthService.hashPassword(password)
  let userId = `usr-${Date.now().toString().slice(-6)}`
  const assignedRole = role || 'guest'

  if (pool) {
    try {
      const insertRes = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, phone, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING id`,
        [email, passwordHash, fullName, phone || null]
      )
      if (insertRes.rows.length > 0) {
        userId = insertRes.rows[0].id
        const roleIdRes = await pool.query(`SELECT id FROM roles WHERE name = $1`, [assignedRole])
        if (roleIdRes.rows.length > 0) {
          await pool.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, roleIdRes.rows[0].id]
          )
        }
      }
    } catch (err: any) {
      console.warn('PostgreSQL register fallback:', err.message)
    }
  }

  const roles = [assignedRole]
  const permissions = await AuthService.resolveEffectivePermissions(userId, roles)

  const newUser: AuthUser = {
    id: userId,
    email,
    fullName,
    phone: phone || '',
    role: assignedRole,
    roles,
    permissions,
    status: 'active'
  }

  luxuryStore.users.push({
    ...newUser,
    createdAt: new Date().toISOString()
  } as any)

  const session = await AuthService.createSession(newUser)
  await AuthService.logAuditEvent(newUser.id, 'USER_REGISTERED', 'user', newUser.id, { email, role: assignedRole })

  res.status(201).json({
    message: 'Account created successfully',
    user: newUser,
    token: session.token
  })
})

authRouter.post('/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const tokenHash = AuthService.hashToken(token)
    if (pool) {
      try {
        await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash])
      } catch {}
    }
  }
  if (req.user) {
    await AuthService.logAuditEvent(req.user.id, 'USER_LOGOUT', 'user', req.user.id)
  }
  res.json({ message: 'Signed out successfully' })
})

authRouter.post('/switch-role', async (req: Request, res: Response) => {
  const { role } = req.body
  const targetUser = luxuryStore.users.find(u => u.role === role) || luxuryStore.users[0]
  const roles = [role]
  const permissions = await AuthService.resolveEffectivePermissions(targetUser.id, roles)
  const fullUser: AuthUser = {
    id: targetUser.id,
    email: targetUser.email,
    fullName: targetUser.fullName,
    phone: targetUser.phone,
    role: role,
    roles,
    permissions,
    status: targetUser.status
  }
  res.json({
    message: `Perspective switched to ${fullUser.fullName} (${role.toUpperCase()})`,
    user: fullUser,
    token: `tok_demo_${targetUser.id}`
  })
})
