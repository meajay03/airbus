// Re-export test suite from tests/inprocess.test.ts
import { runInProcessTests } from './tests/inprocess.test.js'

runInProcessTests().catch(err => {
  console.error('❌ Verification test failed:', err)
  process.exit(1)
})
