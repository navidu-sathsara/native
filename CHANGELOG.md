# Changelog

Notable changes per release. Versions match the `v*` tags that drive
[the release pipeline](RELEASE.md).

## 3.9.0 — 2026-08-02

The launcher-remake branch landed, then this release rebalanced the instance workspace,
hardened the downloader, and repaired the test gates the remake left red.

### Instance workspace

The instance screen previously spent roughly 320 px of vertical space on chrome — a
back-link row, a `min-h-[129px]` hero, and a separate 64 px stats strip — before any
content appeared, which left the actual mod/world/log lists cramped.

- Replaced the hero + stats strip with a single compact header row: back button, icon tile,
  instance name, and a sub-line carrying loader mark, version, playtime, and a
  not-installed warning when relevant.
- Launch, options, and open-folder actions moved inline into that header row.
- Tabs (Content · Worlds · Screenshots · Files · Logs) became a pill group; Options is a
  peer tab rather than a separate mode.
- Net result: content starts far higher on the page at every window size.

### Downloads

Two real progress-accounting bugs, plus hardening against dead connections.

- **Unknown-size files no longer skew progress.** Sizes discovered from `content-length`
  are tracked per item, so a retry can't double-count them and a skipped already-present
  file still lands in `doneBytes`. Previously a task could finish reporting less than 100%.
- **Connect and stall watchdogs** (15 s / 30 s). A socket that opens but stops producing
  bytes is aborted and resumed from its `.part` file rather than hanging a worker forever.
- **Permanent failures fail fast.** 4xx responses other than 408/429/503 abort immediately
  instead of burning all 4 attempts; the same applies to unrecoverable filesystem errors
  (`ENOSPC`, `EACCES`, `EPERM`, `EROFS`, `EISDIR`).
- **`Retry-After` is honoured**, clamped to 15 s so a hostile or broken header can't stall
  an install.
- **Human-readable failures** — "disk is full", "DNS lookup failed — check your internet
  connection" — instead of raw errno strings.
- Removed a duplicated fetch path: a server that ignores `Range` now resets the running
  hash and restarts through the normal streaming code.

### Typography

- UI face is now **Geist** (`@fontsource-variable/geist`), with Inter kept as the bundled
  fallback and JetBrains Mono unchanged for logs and versions. See
  [`design-system.md`](design-system.md) §2.

### Fixes

- **Restored the running-game chip** in the titlebar. The remake deleted it, leaving no way
  to stop a running game or jump to its logs from outside the instance screen.
- **Restored the Discover back button**, which the remake also dropped — entering Discover
  from an instance was a dead end.
- The titlebar version is injected from `package.json` at build time rather than hardcoded,
  so it can no longer drift (it was reading 3.8.0).

### Testing and QA

- **Visual QA now scores against Native's own baselines** in `screenshots/baselines/`
  instead of the Modrinth reference captures. The rebrand diverges from that palette by
  design, so the old mapping reported 0/25 and could never pass. It is now a true
  regression check: 17/17.
- **E2E updater spec fixed.** The fake feed omitted `blockMapSize`, so electron-updater
  computed `fileSize - (blockMapSize + 4)` as `NaN` and threw `ERR_OUT_OF_RANGE`; the
  fixture server also ignored `Range`. Both fixed — it now advertises the real block-map
  size and serves 206 with `content-range`.
- Two new download integration tests cover fail-fast 404s and progress accounting for
  unknown-size files.

### Website

- `website/wrangler.jsonc` + `.assetsignore` added so the site can deploy as a Cloudflare
  Workers static-asset project. See [`README.md` § Website deploys](README.md#website-deploys).
