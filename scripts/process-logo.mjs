#!/usr/bin/env node
/**
 * Process a soft/glowy AI-generated logo PNG into the full Native icon set.
 * - crops to the alpha bounding box (+ padding)
 * - applies an alpha gamma boost so the soft glow survives tiny sizes
 * - box-resamples to the icon ladder, writes .ico, tray, renderer asset
 *
 * Usage: node scripts/process-logo.mjs <source.png>
 */
import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = process.argv[2]
if (!src) {
  console.error('usage: node scripts/process-logo.mjs <source.png>')
  process.exit(1)
}

const png = PNG.sync.read(readFileSync(src))
const { width: W, height: H, data } = png

// ---- 1. alpha bounding box ----
const THRESH = 8
let minX = W, minY = H, maxX = 0, maxY = 0
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > THRESH) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}
if (minX > maxX) {
  console.error('image is fully transparent')
  process.exit(1)
}

// square crop around the content, 8% padding
const bw = maxX - minX + 1
const bh = maxY - minY + 1
const side = Math.ceil(Math.max(bw, bh) * 1.16)
const cx = (minX + maxX) / 2
const cy = (minY + maxY) / 2
const x0 = Math.round(cx - side / 2)
const y0 = Math.round(cy - side / 2)

// ---- 2. crop + alpha gamma boost (a' = a^0.4 keeps glow, hardens core) ----
// RGB is also lifted toward white so the silver mark reads on dark surfaces.
const GAMMA = 0.28
const BRIGHT = 1.6
const cropped = new PNG({ width: side, height: side })
for (let y = 0; y < side; y++) {
  for (let x = 0; x < side; x++) {
    const sx = x0 + x, sy = y0 + y
    const di = (y * side + x) * 4
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) { cropped.data[di + 3] = 0; continue }
    const si = (sy * W + sx) * 4
    cropped.data[di] = Math.min(255, Math.round(data[si] * BRIGHT))
    cropped.data[di + 1] = Math.min(255, Math.round(data[si + 1] * BRIGHT))
    cropped.data[di + 2] = Math.min(255, Math.round(data[si + 2] * BRIGHT))
    cropped.data[di + 3] = Math.round(255 * Math.pow(data[si + 3] / 255, GAMMA))
  }
}

// ---- 3. box resample (premultiplied to avoid halo fringing) ----
function resize(srcPng, size) {
  const out = new PNG({ width: size, height: size })
  const sw = srcPng.width
  const scale = sw / size
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xs = x * scale, xe = (x + 1) * scale
      const ys = y * scale, ye = (y + 1) * scale
      let r = 0, g = 0, b = 0, a = 0, n = 0
      for (let sy = Math.floor(ys); sy < Math.min(sw, Math.ceil(ye)); sy++) {
        for (let sx = Math.floor(xs); sx < Math.min(sw, Math.ceil(xe)); sx++) {
          const i = (sy * sw + sx) * 4
          const al = srcPng.data[i + 3] / 255
          r += srcPng.data[i] * al
          g += srcPng.data[i + 1] * al
          b += srcPng.data[i + 2] * al
          a += al
          n++
        }
      }
      const o = (y * size + x) * 4
      if (a > 0) {
        out.data[o] = Math.round(r / a)
        out.data[o + 1] = Math.round(g / a)
        out.data[o + 2] = Math.round(b / a)
        out.data[o + 3] = Math.round((a / n) * 255)
      }
    }
  }
  return out
}

function buildIco(images) {
  const count = images.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)
  const dir = Buffer.alloc(16 * count)
  let offset = 6 + 16 * count
  images.forEach((img, i) => {
    const base = i * 16
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, base + 0)
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, base + 1)
    dir.writeUInt8(0, base + 2)
    dir.writeUInt8(0, base + 3)
    dir.writeUInt16LE(1, base + 4)
    dir.writeUInt16LE(32, base + 6)
    dir.writeUInt32LE(img.data.length, base + 8)
    dir.writeUInt32LE(offset, base + 12)
    offset += img.data.length
  })
  return Buffer.concat([header, dir, ...images.map((img) => img.data)])
}

// ---- 4. write the set ----
mkdirSync(join(root, 'build', 'icons'), { recursive: true })
writeFileSync(join(root, 'build', 'icon.png'), PNG.sync.write(resize(cropped, 512)))
for (const s of [16, 24, 32, 48, 64, 128, 256, 512, 1024]) {
  writeFileSync(join(root, 'build', 'icons', `${s}x${s}.png`), PNG.sync.write(resize(cropped, s)))
}
const icoSizes = [16, 24, 32, 48, 64, 128, 256]
writeFileSync(
  join(root, 'build', 'icon.ico'),
  buildIco(icoSizes.map((size) => ({ size, data: readFileSync(join(root, 'build', 'icons', `${size}x${size}.png`)) })))
)
copyFileSync(join(root, 'build', 'icon.png'), join(root, 'resources', 'icon.png'))
copyFileSync(join(root, 'build', 'icons', '32x32.png'), join(root, 'resources', 'tray.png'))
copyFileSync(join(root, 'build', 'icon.png'), join(root, 'src', 'renderer', 'src', 'assets', 'icon.png'))

console.log(`cropped ${W}x${H} -> ${side}x${side} @ (${x0},${y0}), full icon set written`)
