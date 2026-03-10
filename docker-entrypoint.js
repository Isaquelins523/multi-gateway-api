import { execSync } from 'node:child_process'
import net from 'node:net'

const host = process.env.MYSQL_HOST || '127.0.0.1'
const port = parseInt(process.env.MYSQL_PORT || '3306', 10)
const maxAttempts = 30
const delayMs = 1000

function waitForMysql() {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    const timeout = setTimeout(() => {
      socket.destroy()
      reject(new Error('Connection timeout'))
    }, 3000)
    socket.connect(port, host, () => {
      clearTimeout(timeout)
      socket.destroy()
      resolve()
    })
    socket.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

async function waitForMysqlWithRetry() {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await waitForMysql()
      console.log('MySQL is ready.')
      return
    } catch (err) {
      if (attempt === maxAttempts) {
        console.error('MySQL did not become ready in time:', err.message)
        throw err
      }
      console.log(`Waiting for MySQL (${attempt}/${maxAttempts})...`)
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}

await waitForMysqlWithRetry()

if (process.env.MIGRATE === 'true') {
  console.log('Running migrations...')
  execSync('node ace.js migration:run --force', { stdio: 'inherit' })
}

if (process.env.SEED === 'true') {
  console.log('Running seeders...')
  execSync('node ace.js db:seed', { stdio: 'inherit' })
}

console.log('Starting server...')
await import('./bin/server.js')
