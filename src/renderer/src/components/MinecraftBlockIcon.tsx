import { useId } from 'react'
import { cn } from '@/lib/util'
import grassTop from '@/assets/minecraft/blocks/grass_block_top.png'
import grassSide from '@/assets/minecraft/blocks/grass_block_side.png'
import grassSideOverlay from '@/assets/minecraft/blocks/grass_block_side_overlay.png'
import dirt from '@/assets/minecraft/blocks/dirt.png'
import stone from '@/assets/minecraft/blocks/stone.png'
import cobblestone from '@/assets/minecraft/blocks/cobblestone.png'
import oakLog from '@/assets/minecraft/blocks/oak_log.png'
import oakLogTop from '@/assets/minecraft/blocks/oak_log_top.png'
import oakPlanks from '@/assets/minecraft/blocks/oak_planks.png'
import bricks from '@/assets/minecraft/blocks/bricks.png'
import sand from '@/assets/minecraft/blocks/sand.png'
import snow from '@/assets/minecraft/blocks/snow.png'
import deepslate from '@/assets/minecraft/blocks/deepslate.png'
import obsidian from '@/assets/minecraft/blocks/obsidian.png'
import diamondOre from '@/assets/minecraft/blocks/diamond_ore.png'
import redstoneOre from '@/assets/minecraft/blocks/redstone_ore.png'
import amethyst from '@/assets/minecraft/blocks/amethyst_block.png'

export type MinecraftBlock = {
  id: string
  name: string
  top: string
  side: string
  right?: string
  sideOverlay?: string
  grassTint?: boolean
}

/** Genuine vanilla textures extracted from Mojang's official client package. */
export const MINECRAFT_BLOCKS: MinecraftBlock[] = [
  { id: 'grass', name: 'Grass Block', top: grassTop, side: grassSide, sideOverlay: grassSideOverlay, grassTint: true },
  { id: 'dirt', name: 'Dirt', top: dirt, side: dirt },
  { id: 'stone', name: 'Stone', top: stone, side: stone },
  { id: 'cobblestone', name: 'Cobblestone', top: cobblestone, side: cobblestone },
  { id: 'oak-log', name: 'Oak Log', top: oakLogTop, side: oakLog },
  { id: 'oak-planks', name: 'Oak Planks', top: oakPlanks, side: oakPlanks },
  { id: 'bricks', name: 'Bricks', top: bricks, side: bricks },
  { id: 'sand', name: 'Sand', top: sand, side: sand },
  { id: 'snow', name: 'Snow Block', top: snow, side: snow },
  { id: 'deepslate', name: 'Deepslate', top: deepslate, side: deepslate },
  { id: 'obsidian', name: 'Obsidian', top: obsidian, side: obsidian },
  { id: 'diamond-ore', name: 'Diamond Ore', top: diamondOre, side: diamondOre },
  { id: 'redstone-ore', name: 'Redstone Ore', top: redstoneOre, side: redstoneOre },
  { id: 'amethyst', name: 'Amethyst Block', top: amethyst, side: amethyst }
]

type FaceProps = {
  texture: string
  transform: string
  overlay?: string
  tint?: boolean
  tintId: string
}

function Face({ texture, transform, overlay, tint, tintId }: FaceProps): React.JSX.Element {
  const common = {
    x: 0,
    y: 0,
    width: 16,
    height: 16,
    transform,
    preserveAspectRatio: 'none' as const,
    style: { imageRendering: 'pixelated' as const }
  }

  return (
    <>
      <image href={texture} {...common} filter={tint ? `url(#${tintId})` : undefined} />
      {overlay && <image href={overlay} {...common} filter={`url(#${tintId})`} />}
    </>
  )
}

/**
 * Pixel-perfect isometric projection of three vanilla 16x16 block faces.
 * The affine transforms map each source texel directly onto a cube face;
 * there are no invented colors or painted texture details.
 */
export function MinecraftBlockIcon({
  block,
  size = 48,
  className
}: {
  block: MinecraftBlock
  size?: number
  className?: string
}): React.JSX.Element {
  const rawId = useId()
  const tintId = `${rawId.replace(/:/g, '')}-grass-tint`
  const right = block.right ?? block.side

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('shrink-0 overflow-visible drop-shadow-[0_5px_4px_rgba(0,0,0,0.34)]', className)}
      role="img"
      aria-label={block.name}
      shapeRendering="crispEdges"
    >
      <defs>
        {/* Approximate the plains biome grass multiplier used by the game. */}
        <filter id={tintId} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values=".52 0 0 0 0  0 .95 0 0 0  0 0 .42 0 0  0 0 0 1 0"
          />
        </filter>
      </defs>

      {/* left, right, then top keeps shared pixel edges clean at tiny sizes */}
      <Face
        texture={block.side}
        overlay={block.sideOverlay}
        transform="matrix(1.6875 .96875 0 1.6875 5 18.5)"
        tintId={tintId}
      />
      <path d="M5 18.5 32 34v27L5 45.5Z" fill="rgba(0,0,0,.10)" />

      <Face
        texture={right}
        overlay={block.sideOverlay}
        transform="matrix(1.6875 -.96875 0 1.6875 32 34)"
        tintId={tintId}
      />
      <path d="M32 34 59 18.5v27L32 61Z" fill="rgba(0,0,0,.27)" />

      <Face
        texture={block.top}
        transform="matrix(1.6875 .96875 -1.6875 .96875 32 3)"
        tint={block.grassTint}
        tintId={tintId}
      />

      <path
        d="M32 3 59 18.5v27L32 61 5 45.5v-27ZM5 18.5 32 34l27-15.5M32 34v27"
        fill="none"
        stroke="rgba(3,7,14,.44)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function getMinecraftBlock(icon: string | null): MinecraftBlock | null {
  if (!icon?.startsWith('block:')) return null
  const id = icon.slice('block:'.length)
  return MINECRAFT_BLOCKS.find((block) => block.id === id) ?? null
}
