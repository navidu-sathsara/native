import { afterEach, describe, expect, it, vi } from 'vitest'

const autoUpdater = vi.hoisted(() => ({
  logger: null as unknown,
  autoDownload: true,
  autoInstallOnAppQuit: false,
  forceDevUpdateConfig: false,
  allowDowngrade: false,
  allowPrerelease: false,
  channel: 'latest',
  updateConfigPath: '',
  on: vi.fn(),
  checkForUpdates: vi.fn(async () => null),
  downloadUpdate: vi.fn(async (_token?: { cancelled?: boolean }) => [] as string[]),
  quitAndInstall: vi.fn()
}))

const FakeCancellationToken = vi.hoisted(
  () =>
    class FakeCancellationToken {
      cancelled = false
      cancel(): void {
        this.cancelled = true
      }
    }
)

vi.mock('electron-updater', () => ({ autoUpdater, CancellationToken: FakeCancellationToken }))

import {
  isNewerGithubTag,
  releaseMatchesChannel,
  requiredReleaseAssets,
  UpdaterService
} from '../../src/main/services/updater'

describe('UpdaterService automatic checks', () => {
  afterEach(() => {
    delete process.env.NATIVE_UPDATER_DEV
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('delays the startup check and applies runtime toggle changes immediately', async () => {
    vi.useFakeTimers()
    process.env.NATIVE_UPDATER_DEV = '1'
    const service = new UpdaterService()
    await service.init({ autoCheck: true, autoDownload: true, channel: 'latest' })
    expect(service.getState()).toEqual({ status: 'idle' })

    await vi.advanceTimersByTimeAsync(7_999)
    expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1)

    service.setAutoCheck(false)
    await vi.advanceTimersByTimeAsync(8 * 60 * 60 * 1000)
    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1)

    service.setAutoCheck(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(2)
  })

  it('orders stable and prerelease GitHub tags semantically', () => {
    expect(isNewerGithubTag('v3.9.0', '3.8.9')).toBe(true)
    expect(isNewerGithubTag('v3.8.0', '3.8.0')).toBe(false)
    expect(isNewerGithubTag('v3.8.0-beta.10', '3.8.0-beta.9')).toBe(true)
    expect(isNewerGithubTag('v3.8.0-beta.2', '3.8.0-beta.10')).toBe(false)
    expect(isNewerGithubTag('v3.8.0', '3.8.0-beta.10')).toBe(true)
    expect(isNewerGithubTag('not-a-version', '3.8.0')).toBe(false)
  })

  it('keeps GitHub release channels isolated', () => {
    expect(releaseMatchesChannel('v3.9.0', 'latest')).toBe(true)
    expect(releaseMatchesChannel('v3.9.0-beta.2', 'beta')).toBe(true)
    expect(releaseMatchesChannel('v3.9.0-nightly.12', 'nightly')).toBe(true)
    expect(releaseMatchesChannel('v3.9.0-nightly.12', 'beta')).toBe(false)
    expect(releaseMatchesChannel('v3.9.0-beta.2', 'latest')).toBe(false)
  })

  it('requires platform payloads and differential blockmaps', () => {
    expect(requiredReleaseAssets('win32', 'x64', 'latest', '3.9.0')).toEqual([
      'latest.yml',
      'Native-Setup-3.9.0-x64.exe',
      'Native-Setup-3.9.0-x64.exe.blockmap'
    ])
    expect(requiredReleaseAssets('darwin', 'arm64', 'beta', '3.9.0-beta.1')).toEqual([
      'beta-mac.yml',
      'Native-3.9.0-beta.1-arm64.zip',
      'Native-3.9.0-beta.1-arm64.zip.blockmap'
    ])
    expect(requiredReleaseAssets('linux', 'x64', 'nightly', '3.9.0-nightly.1')).toEqual([
      'nightly-linux.yml',
      'Native-3.9.0-nightly.1-x86_64.AppImage'
    ])
  })

  it('cancels instead of silently falling back to a full installer', async () => {
    process.env.NATIVE_UPDATER_DEV = '1'
    const service = new UpdaterService()
    await service.init({ autoCheck: false, autoDownload: false, channel: 'latest' })

    const availableHandler = autoUpdater.on.mock.calls.find(([event]) => event === 'update-available')?.[1]
    expect(availableHandler).toBeTypeOf('function')
    availableHandler({ version: '3.9.0', releaseNotes: '', files: [{ size: 90_000_000 }] })

    let tokenWasCancelled = false
    autoUpdater.downloadUpdate.mockImplementationOnce(async (token?: { cancelled?: boolean }) => {
      ;(autoUpdater.logger as { error: (message: string) => void }).error(
        'Cannot download differentially, fallback to full download: old blockmap unavailable'
      )
      tokenWasCancelled = Boolean(token?.cancelled)
      throw new Error('cancelled')
    })

    await service.download()
    expect(tokenWasCancelled).toBe(true)
    expect(service.getState()).toMatchObject({
      status: 'manual',
      version: '3.9.0',
      reason: 'old blockmap unavailable'
    })
  })
})
