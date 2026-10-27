import { spawn } from 'node:child_process'

const isWin = process.platform === 'win32'
const cmd = isWin ? 'npm.cmd' : 'npm'

console.log('🚀 [Maison Véla] Initializing Full-Stack Environment (Backend :4000 + Frontend :5173)...')

const serverProcess = spawn(cmd, ['run', 'server:dev'], {
  stdio: 'inherit',
  shell: true
})

const clientProcess = spawn(cmd, ['run', 'dev:client'], {
  stdio: 'inherit',
  shell: true
})

const cleanup = (code = 0) => {
  try {
    if (serverProcess && !serverProcess.killed) serverProcess.kill()
    if (clientProcess && !clientProcess.killed) clientProcess.kill()
  } catch {}
  process.exit(code)
}

process.on('SIGINT', () => cleanup(0))
process.on('SIGTERM', () => cleanup(0))
process.on('exit', () => cleanup(0))
