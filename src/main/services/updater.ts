import { EventEmitter } from 'node:events'
import { app } from 'electron'
import type { CancellationToken, Logger } from 'electron-updater'
import type { UpdaterState } from '@shared/types'
import { log } from '../logger'

const RELEASES_REPO = 'navidu-sathsara/native-releases'
const RELEASES_URL = `https://github.com/${RELEASES_REPO}/releases`
const GITHUB_API = `https://api.github.com/repos/${RELEASES_REPO}`
type UpdateChannel = 'latest' | 'beta' | 'nightly'

interface GithubRelease {
  tag_name: string
  html_url: string
  body: string | null
  draft: boolean
  prerelease: boolean
  assets: { name: string; size: number; browser_download_url: string }[]
}

/** Forward electron-updater logs and expose its differential-download decision. */
function makeUpdaterLogger(onDelta: (mode: 'delta' | 'full', reason?: string) => void): Logger {
  const forward =
    (level: 'info' | 'warn' | 'error' | 'debug') =>
    (message?: unknown): void => {
      const msg = typeof message === 'string' ? message : String(message)
      if (msg.includes('Cannot download differentially')) {
        onDelta('full', msg.split('fallback to full download:').pop()?.trim() || 'unknown')
      } else if (msg.includes('Download block maps') || msg.includes('Differential download:')) {
        onDelta('delta')
      }
      log[level](message)
    }
  return {
    info: forward('info'),
    warn: forward('warn'),
    error: forward('error'),
    debug: forward('debug')
  }
}

/**
 * Patch-first updater backed by public GitHub Releases.
 *
 * 1. Poll GitHub release tags for the selected channel.
 * 2. Verify that the release contains the platform feed, payload and blockmap.
 * 3. Let electron-updater verify hashes/signatures and build a differential plan.
 * 4. Cancel any attempted full-installer fallback and send the user to GitHub
 *    instead. Native never silently downloads the complete setup executable.
 */
export class UpdaterService extends EventEmitter {
  private state: UpdaterState = { status: 'idle' }
  private timer: ReturnType<typeof setInterval> | null = null
  private firstCheckTimer: ReturnType<typeof setTimeout> | null = null
  private autoDownload = true
  private autoCheck = false
  private channel: UpdateChannel = 'latest'
  private updater: typeof import('electron-updater').autoUpdater | null = null
  private githubRelease: GithubRelease | null = null
  private newCancellationToken: (() => CancellationToken) | null = null
  private downloadToken: CancellationToken | null = null
  private blockedFullFallback = false
  private deltaMode: 'delta' | 'full' | null = null
  private deltaReason: string | null = null

  async init(opts: {
    autoCheck: boolean
    autoDownload: boolean
    channel: UpdateChannel
  }): Promise<void> {
    this.autoDownload = opts.autoDownload
    this.autoCheck = opts.autoCheck
    this.channel = opts.channel

    if (!app.isPackaged && !process.env.NATIVE_UPDATER_DEV) {
      this.setState({ status: 'unsupported', reason: 'dev-build' })
      return
    }
    if (process.platform === 'linux' && !process.env.APPIMAGE && !process.env.NATIVE_UPDATER_DEV) {
      this.setState({
        status: 'unsupported',
        reason: 'This install (deb/system package) updates through your package manager.'
      })
      return
    }

    try {
      const imported = await import('electron-updater')
      const updaterModule = imported.autoUpdater
        ? imported
        : (imported as unknown as { default: typeof imported }).default
      const autoUpdater = updaterModule.autoUpdater
      this.updater = autoUpdater
      const Token = updaterModule.CancellationToken
      this.newCancellationToken = Token ? () => new Token() : null

      autoUpdater.logger = makeUpdaterLogger((mode, reason) => {
        this.deltaMode = mode
        this.deltaReason = reason ?? null
        if (mode === 'full') {
          log.info(`[updater] blocked full-installer fallback (${reason})`)
          // This callback runs immediately before electron-updater starts the
          // fallback request, so cancellation prevents the full setup download.
          if (this.downloadToken) {
            this.blockedFullFallback = true
            this.downloadToken.cancel()
          }
        } else {
          log.info('[updater] downloading changed blocks only')
        }
      })
      autoUpdater.autoDownload = false
      autoUpdater.autoInstallOnAppQuit = true
      autoUpdater.disableDifferentialDownload = false
      autoUpdater.disableWebInstaller = true
      autoUpdater.fullChangelog = false
      this.setChannel(opts.channel)

      if (process.env.NATIVE_UPDATER_DEV) {
        autoUpdater.forceDevUpdateConfig = true
        autoUpdater.allowDowngrade = true
        if (process.env.NATIVE_UPDATER_DEV.includes('/')) {
          autoUpdater.updateConfigPath = process.env.NATIVE_UPDATER_DEV
        }
      }

      autoUpdater.on('checking-for-update', () => this.setState({ status: 'checking' }))
      autoUpdater.on('update-not-available', () => this.setState({ status: 'idle' }))
      autoUpdater.on('update-available', (info) => {
        const release = this.githubRelease
        const notes = releaseNotes(info.releaseNotes) || release?.body || ''
        const size = info.files.reduce((total, file) => total + (file.size ?? 0), 0)
        this.setState({
          status: 'available',
          version: info.version,
          tag: release?.tag_name ?? `v${info.version}`,
          notes,
          size,
          releaseUrl: release?.html_url ?? RELEASES_URL,
          downloadMode: 'patch'
        })
        if (this.autoDownload) void this.download()
      })
      autoUpdater.on('download-progress', (progress) => {
        if (this.state.status !== 'available' && this.state.status !== 'downloading') return
        const previous = this.state
        this.setState({
          status: 'downloading',
          version: previous.version,
          tag: previous.tag,
          notes: previous.notes,
          size: previous.size,
          releaseUrl: previous.releaseUrl,
          downloadMode: 'patch',
          progress: {
            percent: progress.percent,
            bytesPerSecond: progress.bytesPerSecond,
            transferred: progress.transferred,
            total: progress.total
          }
        })
      })
      autoUpdater.on('update-downloaded', (info) => {
        const release = this.githubRelease
        const previous =
          this.state.status === 'available' || this.state.status === 'downloading' ? this.state : null
        const notes = releaseNotes(info.releaseNotes) || release?.body || previous?.notes || ''
        const size = info.files.reduce((total, file) => total + (file.size ?? 0), 0)
        this.setState({
          status: 'ready',
          version: info.version,
          tag: release?.tag_name ?? previous?.tag ?? `v${info.version}`,
          notes,
          size,
          releaseUrl: release?.html_url ?? previous?.releaseUrl ?? RELEASES_URL,
          downloadMode: 'patch',
          deltaMode: this.deltaMode,
          deltaReason: this.deltaReason
        })
      })
      autoUpdater.on('error', (err) => {
        log.warn(`[updater] ${err.message}`)
        if (!this.blockedFullFallback) {
          this.setState({ status: 'error', error: err.message })
        }
      })

      this.configureAutoCheck(this.autoCheck, 8000)
    } catch (err) {
      this.setState({ status: 'error', error: errorMessage(err) })
    }
  }

  getState(): UpdaterState {
    return this.state
  }

  async check(): Promise<void> {
    if (!this.updater) return
    this.setState({ status: 'checking' })
    try {
      // Integration tests deliberately use a local generic feed.
      if (!process.env.NATIVE_UPDATER_DEV) {
        const release = await withRetries(() => fetchGithubRelease(this.channel), 3)
        if (!release || !isNewerGithubTag(release.tag_name, app.getVersion())) {
          this.githubRelease = null
          this.setState({ status: 'idle' })
          return
        }
        this.githubRelease = release

        const version = release.tag_name.replace(/^v/, '')
        const missing = requiredReleaseAssets(process.platform, process.arch, this.channel, version).filter(
          (name) => !release.assets.some((asset) => asset.name === name)
        )
        if (missing.length > 0) {
          this.setState({
            status: 'manual',
            version,
            tag: release.tag_name,
            notes: release.body ?? '',
            releaseUrl: release.html_url,
            reason: `Patch assets are incomplete (${missing.join(', ')})`
          })
          return
        }
      }
      await withRetries(() => this.updater!.checkForUpdates(), 3)
    } catch (err) {
      this.setState({ status: 'error', error: errorMessage(err) })
    }
  }

  async download(): Promise<void> {
    if (!this.updater || this.state.status !== 'available') return
    const available = this.state
    this.deltaMode = null
    this.deltaReason = null
    this.blockedFullFallback = false
    const token = this.newCancellationToken?.() ?? null
    this.downloadToken = token
    try {
      // Differential progress is actual network transfer, not reconstructed
      // installer size. Do not retry: a failed delta plan is deterministic.
      await this.updater.downloadUpdate(token ?? undefined)
    } catch (err) {
      if (this.blockedFullFallback) {
        this.setState({
          status: 'manual',
          version: available.version,
          tag: available.tag,
          notes: available.notes,
          releaseUrl: available.releaseUrl,
          reason: this.deltaReason || 'A differential patch could not be created for this installation.'
        })
      } else {
        this.setState({ status: 'error', error: errorMessage(err) })
      }
    } finally {
      this.downloadToken = null
    }
  }

  install(): void {
    if (this.state.status === 'ready') this.updater?.quitAndInstall(true, true)
  }

  setAutoDownload(value: boolean): void {
    this.autoDownload = value
  }

  setAutoCheck(value: boolean): void {
    this.autoCheck = value
    this.configureAutoCheck(value, 0)
  }

  setChannel(channel: UpdateChannel): void {
    this.channel = channel
    this.githubRelease = null
    if (!this.updater) return
    this.updater.channel = channel
    this.updater.allowPrerelease = channel !== 'latest'
  }

  private setState(state: UpdaterState): void {
    this.state = state
    this.emit('state', state)
  }

  private configureAutoCheck(enabled: boolean, firstDelayMs: number): void {
    if (this.firstCheckTimer) clearTimeout(this.firstCheckTimer)
    if (this.timer) clearInterval(this.timer)
    this.firstCheckTimer = null
    this.timer = null
    if (!enabled || !this.updater) return

    this.firstCheckTimer = setTimeout(() => {
      this.firstCheckTimer = null
      void this.check()
    }, firstDelayMs)
    this.firstCheckTimer.unref?.()
    this.timer = setInterval(() => void this.check(), 4 * 60 * 60 * 1000)
    this.timer.unref?.()
  }
}

/** Read the newest published GitHub Release for the selected tag channel. */
async function fetchGithubRelease(channel: UpdateChannel): Promise<GithubRelease | null> {
  const endpoint =
    channel === 'latest' ? `${GITHUB_API}/releases/latest` : `${GITHUB_API}/releases?per_page=50`
  const response = await fetch(endpoint, {
    headers: {
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': `Native/${app.getVersion()}`
    },
    signal: AbortSignal.timeout(15_000)
  })
  // A repository with no published releases yet is simply up to date.
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`GitHub Releases returned HTTP ${response.status}`)
  const payload = (await response.json()) as GithubRelease | GithubRelease[]
  if (!Array.isArray(payload)) return payload.draft ? null : payload
  const candidates = payload.filter(
    (release) =>
      !release.draft &&
      releaseMatchesChannel(release.tag_name, channel) &&
      (channel === 'latest' ? !release.prerelease : release.prerelease)
  )
  return candidates.reduce<GithubRelease | null>(
    (newest, release) =>
      !newest || isNewerGithubTag(release.tag_name, newest.tag_name) ? release : newest,
    null
  )
}

export function releaseMatchesChannel(tag: string, channel: UpdateChannel): boolean {
  const prerelease = parseVersion(tag)?.prerelease[0] ?? null
  return channel === 'latest' ? prerelease === null : prerelease === channel
}

export function isNewerGithubTag(tag: string, current: string): boolean {
  const next = parseVersion(tag)
  const installed = parseVersion(current)
  if (!next || !installed) return false
  for (let index = 0; index < 3; index++) {
    if (next.core[index] !== installed.core[index]) return next.core[index] > installed.core[index]
  }
  if (next.prerelease.length === 0) return installed.prerelease.length > 0
  if (installed.prerelease.length === 0) return false
  const length = Math.max(next.prerelease.length, installed.prerelease.length)
  for (let index = 0; index < length; index++) {
    const a = next.prerelease[index]
    const b = installed.prerelease[index]
    if (a === b) continue
    if (a === undefined) return false
    if (b === undefined) return true
    const an = /^\d+$/.test(a) ? Number(a) : null
    const bn = /^\d+$/.test(b) ? Number(b) : null
    if (an !== null && bn !== null) return an > bn
    if (an !== null) return false
    if (bn !== null) return true
    return a > b
  }
  return false
}

function parseVersion(value: string): { core: [number, number, number]; prerelease: string[] } | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(value.trim())
  if (!match) return null
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4]?.split('.') ?? []
  }
}

export function requiredReleaseAssets(
  platform: NodeJS.Platform,
  arch: string,
  channel: UpdateChannel,
  version: string
): string[] {
  if (platform === 'win32') {
    const installer = `Native-Setup-${version}-${arch}.exe`
    return [`${channel}.yml`, installer, `${installer}.blockmap`]
  }
  if (platform === 'darwin') {
    const archive = `Native-${version}-${arch}.zip`
    return [`${channel}-mac.yml`, archive, `${archive}.blockmap`]
  }
  const linuxArch = arch === 'x64' ? 'x86_64' : arch
  const feed = `${channel}-linux${arch === 'x64' ? '' : `-${arch}`}.yml`
  return [feed, `Native-${version}-${linuxArch}.AppImage`]
}

function releaseNotes(notes: unknown): string {
  if (typeof notes === 'string') return notes
  if (!Array.isArray(notes)) return ''
  return notes
    .map((entry) => (entry && typeof entry === 'object' && 'note' in entry ? String(entry.note) : ''))
    .filter(Boolean)
    .join('\n\n')
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function withRetries<T>(operation: () => Promise<T>, attempts: number): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_000))
      }
    }
  }
  throw lastError
}
