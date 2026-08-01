#!/usr/bin/env node
/**
 * Rebuild every Native logo target from the approved transparent brand master.
 * The source stays raster so all outputs preserve the exact four-shard mark.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const master = join(root, 'resources', 'branding', 'native-mark.png')
const processor = join(root, 'scripts', 'process-logo.mjs')

if (!existsSync(master)) {
  console.error(`brand master not found: ${master}`)
  process.exit(1)
}

const result = spawnSync(process.execPath, [processor, master], {
  cwd: root,
  stdio: 'inherit'
})
if (result.status !== 0) process.exit(result.status ?? 1)

const websiteAssets = join(root, 'website', 'assets')
mkdirSync(websiteAssets, { recursive: true })
copyFileSync(master, join(websiteAssets, 'native-mark.png'))
copyFileSync(join(root, 'build', 'icons', '64x64.png'), join(websiteAssets, 'favicon.png'))
copyFileSync(join(root, 'build', 'icons', '256x256.png'), join(websiteAssets, 'icon-256.png'))

writeFileSync(
  join(root, 'resources', 'logo.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254"><image width="1254" height="1254" href="branding/native-mark.png"/></svg>\n'
)
writeFileSync(
  join(websiteAssets, 'logo.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254"><image width="1254" height="1254" href="native-mark.png"/></svg>\n'
)

console.log('abstract Native mark synced to app, taskbar, installer, tray, macOS, Linux, renderer and website assets')
