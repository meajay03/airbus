import { AuthService } from '../src/services/authService.js'
import { pool } from '../src/db/postgres.js'
import { ensureDatabaseAndMigrate } from '../src/db/setupDb.js'

async function runAuthVerification() {
  console.log('🚀 Starting Live Authentication & Session Verification...')

  // Step 1: Ensure DB
  await ensureDatabaseAndMigrate()

  // Step 2: Password hashing & verification
  console.log('\n1. Testing cryptographic scrypt password hashing...')
  const plainPassword = 'SuperSecret2026!'
  const hash = AuthService.hashPassword(plainPassword)
  console.log(`✓ Password hashed with scrypt: ${hash.substring(0, 32)}...`)

  const matches = AuthService.verifyPassword(plainPassword, hash)
  const fails = AuthService.verifyPassword('WrongPassword', hash)
  if (!matches || fails) {
    throw new Error('scrypt password verification failed')
  }
  console.log('✓ scrypt password verification verified: valid password accepted, invalid password rejected')

  // Step 3: Insert user into PostgreSQL
  console.log('\n2. Testing user registration in PostgreSQL...')
  const testEmail = `auth.test.${Date.now()}@luxury.in`
  const testName = 'Devi Chandragupta'
  const testPhone = '+91 98765 43210'

  const userRes = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, phone, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING id, email, full_name, status`,
    [testEmail, hash, testName, testPhone]
  )
  const registeredUser = userRes.rows[0]
  console.log(`✓ Registered user in PostgreSQL: ID ${registeredUser.id}, Email: ${registeredUser.email}`)

  // Assign guest role
  const roleRes = await pool.query(`SELECT id FROM roles WHERE name = 'guest'`)
  if (roleRes.rows.length > 0) {
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [registeredUser.id, roleRes.rows[0].id]
    )
    console.log('✓ Assigned role "guest" in user_roles')
  }

  // Step 4: Create session in PostgreSQL
  console.log('\n3. Testing authenticated session creation in PostgreSQL...')
  const session = await AuthService.createSession({
    id: registeredUser.id,
    email: registeredUser.email,
    fullName: registeredUser.full_name,
    role: 'guest',
    status: 'active'
  })
  console.log(`✓ Generated Bearer session token: ${session.token.substring(0, 16)}... (Expires: ${session.expiresAt.toISOString()})`)

  // Step 5: Validate session token
  console.log('\n4. Testing session validation against PostgreSQL user_sessions...')
  const validatedUser = await AuthService.validateToken(session.token)
  if (!validatedUser || validatedUser.email !== testEmail) {
    throw new Error('Token validation failed')
  }
  console.log(`✓ Successfully validated token for user: ${validatedUser.fullName} (${validatedUser.email})`)

  // Step 6: Test logout / session invalidation
  console.log('\n5. Testing session invalidation (logout)...')
  const tokenHash = AuthService.hashToken(session.token)
  await pool.query(`DELETE FROM user_sessions WHERE token_hash = $1`, [tokenHash])
  const afterLogoutUser = await AuthService.validateToken(session.token)
  if (afterLogoutUser !== null) {
    throw new Error('Session was not properly invalidated after logout')
  }
  console.log('✓ Token successfully invalidated upon session termination')

  await pool.end()
  console.log('\n🎉 ALL AUTHENTICATION & SESSION VERIFICATION TESTS PASSED SUCCESSFULLY!')
  process.exit(0)
}

runAuthVerification().catch(err => {
  console.error('Authentication test failed:', err)
  process.exit(1)
})
