import { _electron as electron } from '@playwright/test'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../qa-screenshots')
mkdirSync(outDir, { recursive: true })

const seed = {
  settings: { theme: 'mono' },
  accounts: [
    { id: 'off-1', type: 'offline', username: 'TestPlayer', uuid: 'e5af59f4-0000-3000-8000-000000000001', active: true }
  ],
  instances: [
    { id: 'seed-fabric', name: 'Fabulously Optimized', icon: 'builtin:cube', mcVersion: '1.21.4', loader: 'fabric', loaderVersion: '0.16.9', installed: true, lastPlayedAt: Date.now() - 49_000, totalPlayMs: 2 * 3600_000 },
    { id: 'seed-vanilla', name: 'Hoplite', icon: 'builtin:sword', mcVersion: '1.21.1', loader: 'vanilla', installed: true, lastPlayedAt: Date.now() - 3 * 3600_000, totalPlayMs: 45 * 60_000 },
    { id: 'seed-neo', name: 'Create: Above & Beyond', icon: 'builtin:zap', mcVersion: '1.21.1', loader: 'neoforge', loaderVersion: '21.1.80', installed: true, lastPlayedAt: Date.now() - 3600_000, totalPlayMs: 26 * 3600_000 },
    { id: 'seed-quilt', name: 'Skyblock Isles', icon: 'builtin:tree', mcVersion: '1.21.4', loader: 'quilt', loaderVersion: '0.27.1', installed: true, lastPlayedAt: Date.now() - 26 * 3600_000, totalPlayMs: 12 * 3600_000 },
    { id: 'seed-forge', name: 'RLCraft Revival', icon: 'builtin:gem', mcVersion: '1.20.1', loader: 'forge', loaderVersion: '47.3.0', installed: true, lastPlayedAt: Date.now() - 3 * 86_400_000, totalPlayMs: 58 * 3600_000 }
  ]
}

const dataDir = mkdtempSync(join(tmpdir(), 'native-shot-'))
const seedFile = join(dataDir, 'seed.json')
writeFileSync(seedFile, JSON.stringify(seed))

const app = await electron.launch({
  args: [join(__dirname, '../out/main/index.js'), '--no-sandbox', '--disable-gpu-sandbox'],
  env: {
    ...process.env,
    NATIVE_DATA_DIR: dataDir,
    NATIVE_E2E: '1',
    NATIVE_SEED: seedFile,
    NATIVE_AVATAR_BASE: 'http://127.0.0.1:1'
  },
  timeout: 60_000
})
app.process().stdout?.on('data', (d) => process.stdout.write(`[app] ${d}`))
app.process().stderr?.on('data', (d) => process.stdout.write(`[app err] ${d}`))
const page = await app.firstWindow({ timeout: 60_000 })
await page.waitForLoadState('domcontentloaded')
await page.waitForSelector('[data-testid="screen-home"]', { timeout: 20_000 })
await page.waitForTimeout(800)
await page.screenshot({ path: join(outDir, 'check-home.png') })

// Library grid
await page.click('[aria-label="Library"]')
await page.waitForSelector('[data-testid="screen-library"]', { timeout: 10_000 })
await page.waitForTimeout(800)
await page.screenshot({ path: join(outDir, 'check-library.png') })

// Library list view
await page.click('[aria-label="List view"]')
await page.waitForTimeout(500)
await page.screenshot({ path: join(outDir, 'check-library-list.png') })

await app.close()
console.log('screenshots saved')
