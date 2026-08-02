# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Native is an Electron + React + TypeScript Minecraft launcher. Three processes, one shared
contract:

```
src/shared/     types.ts + ipc.ts — imported by main, preload AND renderer
src/main/       Electron main process
  core/         the engine: download, install, launch, java, loaders, manifest, mrpack, rules
  services/     one module per product domain (auth, accounts, instances, content,
                servers, worlds, screenshots, news, settings, updater, discord, …)
  workers/      io-worker.ts — hashing and zip off the main thread
  ipc.ts        typed handler registry; the only place ipcMain.handle is called
src/preload/    contextBridge → window.native
src/renderer/   React + Zustand + Tailwind + Framer Motion
```

## Commands

```bash
npm run dev              # electron-vite dev server + HMR
npm run typecheck        # tsc over node + web configs — run before committing
npx vitest run           # unit + integration + renderer (191 tests)
npm run build            # bundle main/preload/renderer
npm run e2e              # Playwright against the built app
npm run qa:visual        # screenshot every screen + perceptual diff, then qa-report.mjs
```

**The native-module ABI dance.** `better-sqlite3` must be compiled for the right runtime or
you get an opaque module-version error:

```bash
npm run rebuild:node      # BEFORE vitest
npm run rebuild:electron  # BEFORE running the app or Playwright
```

CI runs them in that order. If tests suddenly fail to load the DB, this is why.

## Conventions

**The IPC contract is single-source.** Channel names live only in `src/shared/ipc.ts`,
grouped by domain. Main registers handlers from it and preload invokes from it, so the two
sides cannot drift. Adding a feature means: type in `shared/types.ts` → channel in
`shared/ipc.ts` → handler in `main/ipc.ts` → binding in `preload/index.ts` → store/screen.

**Never block the renderer.** Downloads and installs run in main; hashing and extraction
run in the io worker; progress streams over IPC throttled to 10 Hz; log lines batch at
~15 Hz into a virtualized console. Preserve this when touching those paths.

**Animate transform and opacity only.** No layout-projection animations, no animating
width/height/top/left. Long lists are virtualized (`@tanstack/react-virtual`).

**Design tokens, not literals.** Colours, radii, spacing and motion come from
`design-system.md` via `tailwind.config.ts` and CSS variables. The visual-QA gate compares
against the committed baselines in `screenshots/baselines/`, so ad-hoc values show up as
perceptual diffs. Themes: `mono` (default), `mono-light`, `dark`, `light`, `oled`, `system`.

The `ref-*.png` captures in `screenshots/` are the historical design source behind
`design-system.md`, but are **not** scored against — the rebrand diverges from their
palette by design. After an intentional visual change, review every changed screen by eye,
then copy `qa-screenshots/<name>.png` over `screenshots/baselines/<name>.png`.

## Testing

Integration and E2E are **fully hermetic** — no network. A local fixture server
(`tests/integration/helpers/fixture-server.ts`) impersonates Mojang, Fabric, Modrinth, MSA
and news; all base URLs are `NATIVE_URL_*` env-overridable. The "game" is a small compiled
Java `FakeClient` that records its argv, so create → install → launch → crash is exercised
end to end without touching the internet or a real Minecraft.

Useful env hooks: `NATIVE_DATA_DIR` (isolates userData, including the single-instance
lock), `NATIVE_E2E=1` (skips tray + auto-update), `NATIVE_WIN_SIZE=1366x728` (exact window
geometry for visual QA), `NATIVE_UPDATER_DEV` (see `AUTO-UPDATES.md`).

## Releasing

See [`RELEASE.md`](RELEASE.md). Short version: `package.json` version must equal the tag,
push `v*`, CI does the rest. Runtime update behaviour is documented separately in
[`AUTO-UPDATES.md`](AUTO-UPDATES.md).

## Gotchas

- **`npm run rebuild:electron` can produce a binary this host can't load.** It fetches a
  prebuilt `better-sqlite3` linked against GLIBC 2.33; on older glibc the app dies with an
  opaque `SIGSEGV` at startup. Force a source build instead:
  `npm_config_build_from_source=true npx electron-rebuild -f -w better-sqlite3`.
- **The version in the titlebar is injected at build time** from `package.json` via a Vite
  `define` (`__APP_VERSION__`, declared in `src/renderer/src/assets.d.ts`). Don't hardcode it.
- **`website/updates/` is gitignored** except two force-added `.yml` feeds. Locally built
  installers pile up there and are not in the repo — don't "clean them from git history".
- **Release assets live in a second repo** (`navidu-sathsara/native-releases`). That is why
  the release job needs `RELEASE_TOKEN` and an explicit `target_commitish`.
- **`scripts/patch-nsis.mjs` runs on postinstall.** It patches `app-builder-lib` in
  `node_modules` and is a no-op unless `NSIS_UNINSTALLER_READER=true`; it only exists so
  ARM64 Linux hosts can build NSIS installers without wine. CI needs none of it.
- **CurseForge ships with a built-in API key** in `src/main/ipc.ts`, overridable via
  `NATIVE_CF_API_KEY`.
- **Microsoft auth needs no setup** — msmc drives the official launcher OAuth client.
  Don't add an Azure app-registration requirement; `NATIVE_MSA_CLIENT_ID` already covers
  orgs that want their own.
