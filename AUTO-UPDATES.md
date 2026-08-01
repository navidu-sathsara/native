# Auto-updates (runtime)

How the running app finds, downloads, and applies an update. For how those updates get
published, see [`RELEASE.md`](RELEASE.md).

Everything lives in `src/main/services/updater.ts` (`UpdaterService`), a thin
`EventEmitter` around `electron-updater` that exists to make the updater's behaviour
explicit, observable, and testable.

## State machine

`UpdaterState` is a discriminated union in `src/shared/types.ts`:

```
idle ──▶ checking ──▶ available ──▶ downloading ──▶ ready
                 └──▶ idle (up to date)
  any ──▶ error          (recoverable; current install untouched)
  init ──▶ unsupported   (terminal; this install can never self-update)
```

`ready` additionally carries `deltaMode` (`'delta' | 'full' | null`) and, when full,
`deltaReason`.

## Init guards run before electron-updater is touched

`init()` short-circuits to `unsupported` in two cases, so the app never presents an update
path that cannot work:

- **Not packaged** → `reason: 'dev-build'`.
- **Linux without `$APPIMAGE`** → a `.deb`/system install, which cannot rewrite itself.
  The UI surfaces this as "updates through your package manager".

`NATIVE_UPDATER_DEV` overrides both. When set it also enables `forceDevUpdateConfig` and
`allowDowngrade` — a dev build reports Electron's version, so real feed versions look like
downgrades and would otherwise be ignored. If the value contains `/` it is treated as a
path to a feed config (`updateConfigPath`). This is how the E2E suite drives a real
updater against a local feed.

## Orchestration is explicit

```ts
autoUpdater.autoDownload = false        // we decide, per the user's setting
autoUpdater.autoInstallOnAppQuit = true // a ready update applies on quit
```

`autoDownload` is deliberately off: `update-available` fires, and only then does the
service call `download()` itself if `autoUpdateDownload` is enabled. This keeps the
"available → user clicks Update now" path and the "silently prefetch" path on the same
code, and makes the download observable rather than something electron-updater starts on
its own.

**Scheduling** — first check 8 s after window creation, then every 4 hours. Both timers
are `unref()`d so they can never hold the process alive at quit. `check()` and `download()`
each retry 3× with a 1 s/2 s backoff, so one flaky response doesn't surface an error card.

## Delta diagnostics

electron-updater reports its differential-download decision *only* through the logger it
is handed. `makeUpdaterLogger()` wraps our logger and watches for two distinctive lines:

| Line | Meaning |
|---|---|
| `Download block maps` | attempting a differential (delta) download |
| `Cannot download differentially, fallback to full download: <reason>` | full download, with reason |

Those populate `deltaMode` / `deltaReason` on the `ready` state, which is the only
practical way to tell whether the Windows delta path is actually working. A regression
here is silent — updates still succeed, they just become ~20× larger. See the
`ELECTRON_BUILDER_7Z_FILTER` note in [`RELEASE.md`](RELEASE.md).

A plain forwarding object is used rather than cloning electron-log's prototype, because
electron-updater's `Logger` type only needs `{ info, warn, error, debug }`.

## IPC and UI

Four handlers plus one push channel, registered in `src/main/ipc.ts`:

```
updater:state      → getState()
updater:check      → check()
updater:download   → download()
updater:install    → quitAndInstall(true, true)   // only from 'ready'
updater:state-changed  (main → renderer, on every transition)
```

The renderer store (`src/renderer/src/stores/data.ts`) subscribes and resets
`dismissed: false` on every state change, so dismissing the "available" card does not
suppress the later "ready" card.

`src/renderer/src/components/UpdateToast.tsx` renders four of the six states — `available`
(notes + Update now), `downloading` (percent, speed, ETA), `ready` (Restart now / On next
launch), `error` (retry). `idle` and `unsupported` are intentionally invisible; the
`unsupported` reason is shown in Settings instead.

Release notes arrive as HTML and are flattened through `sanitizeNotes()` before display
(assigned to a detached element, read back as `textContent`, truncated to 500 chars).

## Settings apply live

Three settings, all applied without a restart (`src/main/ipc.ts`):

| Setting | Effect |
|---|---|
| `autoUpdateCheck` | starts/stops the 8 s + 4 h timers immediately |
| `autoUpdateDownload` | whether `update-available` auto-triggers a download |
| `updateChannel` | `latest` / `beta` / `nightly`; also sets `allowPrerelease` |

Changing the channel in Settings fires an immediate re-check, so switching to `beta`
surfaces a beta build without waiting for the next 4-hour tick.

## Tests

| Suite | Covers |
|---|---|
| `tests/unit/updater-service.test.ts` | state transitions in isolation |
| `e2e/updater.spec.ts` | full cycle against a local generic-provider feed |
| `e2e/updater-delta.spec.ts` | differential download path |
| `e2e/updater-live.spec.ts` | the real published feed |

The E2E stands up an HTTP server advertising version 99.9.9 backed by a genuine packaged
AppImage, and drives detect → progress → `ready`. It deliberately stops at `ready`:
`quitAndInstall` would replace the very binary under test. The install step has been
verified manually — `autoInstallOnAppQuit` swapped a packaged AppImage for the downloaded
one on quit. The specs skip when no AppImage has been packaged (`npm run package:linux`).
