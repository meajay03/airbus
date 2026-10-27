import { pool } from '../server/src/db/postgres.js'
import { AuthService } from '../server/src/services/authService.js'
import { AnalyticsService } from '../server/src/services/analyticsService.js'
import fs from 'fs'

async function runTests() {
  console.log('================================================================');
  console.log('  MAISON VÉLA LUXURY HOSPITALITY — RBAC & ANALYTICS ACCEPTANCE  ');
  console.log('================================================================\n');

  let passed = 0
  let failed = 0

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`)
      passed++
    } else {
      console.error(`[FAIL] ${desc}`)
      failed++
    }
  }

  // TEST 1 & 2: user-profile-btn removal
  const headerContent = fs.readFileSync('src/components/Header.tsx', 'utf8')
  const headerCss = fs.readFileSync('src/components/Header.css', 'utf8')
  assert(!headerContent.includes('user-profile-btn'), '1. user-profile-btn removed from Header.tsx')
  assert(!headerCss.includes('.user-profile-btn'), '2. .user-profile-btn removed from Header.css')

  // TEST 3: AccountMenu exists
  const accountMenuExists = fs.existsSync('src/components/navigation/AccountMenu.tsx')
  assert(accountMenuExists, '3. AccountMenu component implemented')

  // TEST 4: PostgreSQL Migrations & RBAC
  const rolesRes = await pool.query('SELECT count(*)::int as c FROM roles')
  assert(rolesRes.rows[0].c === 6, `4. Exactly 6 Launch Roles exist in PostgreSQL (Found: ${rolesRes.rows[0].c})`)

  const permsRes = await pool.query('SELECT count(*)::int as c FROM permissions')
  assert(permsRes.rows[0].c >= 20, `5. Permissions count in PostgreSQL >= 20 (Found: ${permsRes.rows[0].c})`)

  const rolePermsRes = await pool.query('SELECT count(*)::int as c FROM role_permissions')
  assert(rolePermsRes.rows[0].c > 50, `6. Role Permissions mapping count in PostgreSQL > 50 (Found: ${rolePermsRes.rows[0].c})`)

  // TEST 7: Super Admin & Admin permission resolution
  const adminUser = await AuthService.validateToken('tok_demo_admin')
  assert(adminUser !== null && adminUser.permissions.includes('analytics.read'), '7. Admin has analytics.read permission')
  assert(adminUser !== null && adminUser.permissions.includes('users.suspend'), '8. Admin has users.suspend permission')

  // TEST 8: Guest privilege restriction
  const guestUser = await AuthService.validateToken('tok_demo_guest')
  assert(guestUser !== null && !guestUser.permissions.includes('analytics.financial.read'), '9. Guest does NOT have financial analytics permission')
  assert(guestUser !== null && !guestUser.permissions.includes('users.roles.manage'), '10. Guest does NOT have role management permission')

  // TEST 9: Analytics Service 22 Global KPIs
  const kpiData30d = await AnalyticsService.getExecutiveMetrics({ preset: '30d' })
  assert(kpiData30d.kpis.length === 22, `11. Exact 22 Global KPI Cards generated (Found: ${kpiData30d.kpis.length})`)

  // TEST 10: Date Filter Presets & Comparison Periods
  const kpiData7d = await AnalyticsService.getExecutiveMetrics({ preset: '7d' })
  assert(kpiData7d.dateRange.comparisonPeriod.includes('7 days'), '12. 7-day preset comparison period accurately resolves vs. previous 7 days')

  // TEST 11: Financial metric separation
  const gbv = kpiData30d.kpis.find(k => k.key === 'gbv')
  const recognizedRev = kpiData30d.kpis.find(k => k.key === 'recognizedRevenue')
  const hostCommission = kpiData30d.kpis.find(k => k.key === 'commissionRevenue')
  const hostPayable = kpiData30d.kpis.find(k => k.key === 'hostPayableBalance')

  assert(gbv !== undefined && recognizedRev !== undefined, '13. GBV and Recognized Platform Revenue are distinct metrics')
  assert(gbv!.value >= recognizedRev!.value, '14. GBV is greater than or equal to recognized platform take')
  assert(hostCommission !== undefined && hostPayable !== undefined, '15. Host Commissions and Host Payables are distinct ledger concepts')

  // TEST 12: Zero baseline division protection
  const testChange = AnalyticsService.computeChange(150, 0)
  assert(!isNaN(testChange.changePercentage) && isFinite(testChange.changePercentage), '16. Zero baseline returns finite number, never NaN or Infinity')

  // TEST 13: Time-series trend chart data
  const trends = await AnalyticsService.getTimeSeriesTrends({ preset: '30d' })
  assert(trends.length > 0 && typeof trends[0].gbv === 'number', '17. Dynamic time-series trends generated with real numeric points')

  // TEST 14: Audit Logging
  await AuthService.logAuditEvent('usr-admin-01', 'ACCEPTANCE_TEST_EVENT', 'system', 'test', { status: 'passed' })
  const auditRes = await pool.query("SELECT * FROM audit_logs WHERE action = 'ACCEPTANCE_TEST_EVENT' LIMIT 1")
  assert(auditRes.rows.length > 0, '18. Administrative audit logs recorded in PostgreSQL audit_logs table')

  // TEST 15: Protected Route & Permission Gate components exist
  assert(fs.existsSync('src/components/common/ProtectedRoute.tsx'), '19. ProtectedRoute component implemented')
  assert(fs.existsSync('src/components/admin/AdminLayout.tsx'), '20. Dedicated Company AdminLayout implemented')

  console.log(`\n================================================================`);
  console.log(`  SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================================================\n`);

  await pool.end().catch(() => {})
  process.exit(failed > 0 ? 1 : 0)
}

runTests()
