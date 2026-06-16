const { spawn } = require('child_process')
const electron = require('electron')
const path = require('path')

const VITE_URL = 'http://localhost:5173'

async function main() {
  const vite = await import('vite')
  const server = await vite.createServer({
    configFile: path.resolve(__dirname, '../vite.config.ts')
  })
  await server.listen()

  const env = { ...process.env, VITE_DEV_SERVER_URL: VITE_URL }
  const proc = spawn(electron, [path.resolve(__dirname, 'main.js')], { env })
  proc.stdout.on('data', d => console.log('[ELECTRON]', d.toString()))
  proc.stderr.on('data', d => console.error('[ELECTRON ERR]', d.toString()))
  proc.on('exit', () => server.close().then(() => process.exit(0)))
}

main().catch(e => { console.error(e); process.exit(1) })
