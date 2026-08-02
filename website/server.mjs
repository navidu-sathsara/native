import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const host = process.env.HOST || '127.0.0.1'
const port = Number.parseInt(process.env.PORT || '8787', 10)

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
  ['.yml', 'text/yaml; charset=utf-8']
])

const privateFiles = new Set(['.assetsignore', '_headers', '_redirects', 'wrangler.jsonc'])
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://api.github.com; font-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
}

function writeHeaders(response, pathname, file, statusCode, size, modified) {
  const isAsset = pathname.startsWith('/assets/')
  response.writeHead(statusCode, {
    ...securityHeaders,
    'Cache-Control': isAsset ? 'public, max-age=86400' : 'no-cache',
    'Content-Length': size,
    'Content-Type': mimeTypes.get(extname(file).toLowerCase()) || 'application/octet-stream',
    'Last-Modified': modified.toUTCString()
  })
}

async function sendFile(request, response, pathname, file, statusCode = 200) {
  const metadata = await stat(file)
  if (!metadata.isFile()) throw new Error('Not a file')
  writeHeaders(response, pathname, file, statusCode, metadata.size, metadata.mtime)
  if (request.method === 'HEAD') return response.end()
  createReadStream(file)
    .on('error', (error) => {
      console.error('[native-website] stream error', error)
      if (!response.headersSent) response.writeHead(500)
      response.end()
    })
    .pipe(response)
}

async function handle(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { ...securityHeaders, Allow: 'GET, HEAD' })
    return response.end()
  }

  let url
  let pathname
  try {
    url = new URL(request.url, 'http://localhost')
    pathname = decodeURIComponent(url.pathname)
  } catch {
    response.writeHead(400, securityHeaders)
    return response.end('Bad request')
  }

  const relativePath = pathname.replace(/^\/+/, '')
  const segments = relativePath.split('/').filter(Boolean)
  if (
    segments.some((segment) => segment.startsWith('.')) ||
    segments.some((segment) => privateFiles.has(segment)) ||
    segments[0] === 'downloads'
  ) {
    return sendFile(request, response, pathname, join(root, '404.html'), 404)
  }

  let relativeFile = relativePath
  if (!relativeFile || pathname.endsWith('/')) relativeFile = join(relativeFile, 'index.html')

  const file = resolve(root, relativeFile)
  if (file !== root && !file.startsWith(`${root}${sep}`)) {
    return sendFile(request, response, pathname, join(root, '404.html'), 404)
  }

  try {
    const metadata = await stat(file)
    if (metadata.isDirectory()) {
      response.writeHead(308, { ...securityHeaders, Location: `${pathname}/${url.search}` })
      return response.end()
    }
    return sendFile(request, response, pathname, file)
  } catch {
    return sendFile(request, response, pathname, join(root, '404.html'), 404)
  }
}

const server = createServer((request, response) => {
  handle(request, response).catch((error) => {
    console.error('[native-website] request error', error)
    if (!response.headersSent) response.writeHead(500, securityHeaders)
    response.end()
  })
})

server.keepAliveTimeout = 65_000
server.headersTimeout = 66_000
server.listen(port, host, () => console.log(`[native-website] listening on http://${host}:${port}`))

function shutdown() {
  server.close((error) => process.exit(error ? 1 : 0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
