# Releasing Native

How a tag becomes an installed update. Two halves: **publish** (CI builds artifacts and
update feeds) and **consume** (`electron-updater` inside the app reads those feeds).

- Source: [`navidu-sathsara/native`](https://github.com/navidu-sathsara/native)
- Public artifacts + update feeds: [`navidu-sathsara/native-releases`](https://github.com/navidu-sathsara/native-releases)

The two repos are deliberately separate: the feed repo holds only a README and release
assets, so cloning the source never drags down hundreds of megabytes of installers.

## Cutting a release

```bash
# Version in package.json MUST equal the tag — prepare-release-metadata.mjs
# rejects a mismatch, and electron-builder names artifacts from package.json.
git tag v3.8.0 && git push origin v3.8.0
```

Channel is derived from the tag suffix, everywhere and consistently:

| Tag | Channel | Feed names | GitHub release |
|---|---|---|---|
| `v3.8.0` | `latest` | `latest*.yml` | latest, not prerelease |
| `v3.8.0-beta.1` | `beta` | `beta*.yml` | prerelease |
| `v3.8.0-nightly.1` | `nightly` | `nightly*.yml` | prerelease |

Any other prerelease suffix is rejected rather than silently treated as stable.

## The pipeline

`.github/workflows/ci.yml`, five jobs in sequence:

```
test ──▶ package ──▶ release ──▶ verify-release ──▶ bridge-legacy-feed
(3 OS)   (6 targets)  (tagged)     (tagged)          (stable tags only)
```

**test** — `ubuntu-24.04`, `windows-2025`, `macos-15`. Gate order matches local dev:
typecheck → `rebuild:node` → vitest (unit + integration + renderer) → build →
`rebuild:electron` → Playwright E2E → visual QA. Runs on every push and PR.

**package** — six jobs: `{linux, windows, mac} × {x64, arm64}`, each building with
`--publish never`. Linux ARM64 cross-packages on the x64 runner because electron-builder's
`.deb` toolchain (fpm) is x64-only. Each job ends by staging its metadata (below).

**release** — downloads all six artifact sets, merges the feeds, and creates the GitHub
Release in the *feed* repo.

**verify-release** — an independent check against the public API (see below).

**bridge-legacy-feed** — stable tags only; mirrors feeds to the website for pre-3.1.0
installs.

## Why feed merging exists

electron-builder writes one `latest*.yml` per build, so six parallel jobs would each
produce a feed that overwrites the others — the last writer would win and half the
platforms would be unreachable. Two scripts fix this:

1. `scripts/stage-release-metadata.mjs` — in each package job, copies that job's feed to a
   collision-free `release-meta-<platform>-<arch>.yml`.
2. `scripts/prepare-release-metadata.mjs` — in the release job, reads all six and writes
   four real feeds, validating that every required artifact is present and that each
   staged doc actually describes the tagged version:

| Feed | Serves | Preferred payload |
|---|---|---|
| `<channel>.yml` | Windows, both arches | `-x64.exe` |
| `<channel>-linux.yml` | Linux x64 | `-x86_64.AppImage` |
| `<channel>-linux-arm64.yml` | Linux ARM64 | `-arm64.AppImage` |
| `<channel>-mac.yml` | macOS, both arches | `-x64.zip` |

Windows and macOS each carry both architectures in one feed; electron-updater picks the
matching entry at runtime. Linux is split because AppImage updates resolve per-arch.

## verify-release is a real gate

`scripts/verify-release.mjs` runs against the public GitHub API with no credentials, so it
sees exactly what a user's app sees. It fails the build unless:

- all 16 required assets exist with the exact expected names (installers, blockmaps, DMGs,
  ZIPs, AppImages, and the four feeds);
- every feed's `version:` matches the tag;
- every feed contains its preferred payload pattern;
- every `url:` in every feed points at an asset that is actually published — this is what
  catches a half-uploaded release;
- no asset is zero-length, and each downloads anonymously (HEAD returning 302 or 2xx).

If this job is red, **do not** announce the release: the feeds are live but inconsistent,
and apps may already be trying to update against them.

## Windows: two non-obvious hacks

**Delta updates depend on a 7-Zip filter.** `ELECTRON_BUILDER_7Z_FILTER: BCJ` is set in
the package job. 7-Zip 21.x's BCJ2 encoder is multithreaded: it splits input into
thread-sized blocks whose boundaries shift when any upstream byte changes, so the
differential downloader found almost no reusable blocks and re-fetched ~74% of the
installer every release. Single-stream BCJ is deterministic — ~97% block reuse, taking
update downloads from ~68 MB to ~3 MB, at a cost of 6–8 MB on the one-time full installer.
Removing this line silently makes every update huge; nothing fails, so watch the
`deltaMode` reported in the app instead.

**Signing invalidates the hashes.** SignPath signs on its own HSM *after* electron-builder
has hashed the unsigned exe and written the blockmap. Signing mutates the file, so every
update would fail sha512 verification. `scripts/repack-signed-win.mjs` rebuilds the
blockmap with electron-builder's own `buildBlockMap` and rewrites the feed's sha512/size
from the signed binary. It uses targeted line edits rather than a YAML round-trip, which
would reorder keys and change the quoting electron-updater expects.

All SignPath steps are gated on `SIGNPATH_API_TOKEN`; with no secret, CI produces working
unsigned builds.

## Required configuration

| Secret / var | Needed for | Consequence if missing |
|---|---|---|
| `RELEASE_TOKEN` | **Required.** Cross-repo write to `native-releases` | Release job fails; nothing publishes |
| `SIGNPATH_*` (token, org, project, policy, artifact config) | Windows signing | Unsigned builds, still publishable |
| `WIN_CSC_LINK` + `WIN_CSC_KEY_PASSWORD` | Windows signing via cert | Unsigned |
| `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` | macOS signing + notarization | Unsigned; Gatekeeper warns |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT_NAME` | Explicit Wrangler deploy | **The deploy job becomes a no-op** — it echoes that the Git integration will handle it, and passes green either way |

`RELEASE_TOKEN` should be a fine-grained PAT scoped to `native-releases` only, with
Contents: write. It must not be the default `GITHUB_TOKEN`, which cannot write to another
repository.

## Two failure modes that cost real time

**`400 Invalid target_commitish`.** The release is created in `native-releases` while the
tag lives in `native`, so `action-gh-release`'s default `target_commitish` (this repo's
SHA) is not a valid ref in the target. The workflow pins `target_commitish: main`. It also
means **the feed repo must have at least one commit** — an empty repo has no branch for
the release to anchor to, and every attempt 400s.

**Bulk-pushing tags triggers the full matrix per tag.** Pushing N historical tags queues
roughly 9N jobs and would republish old versions. Disable Actions first
(`gh api -X PUT repos/OWNER/REPO/actions/permissions -F enabled=false`), push, then
re-enable.

## The website

The site is plain static HTML under `website/` with **no build step**. `website/wrangler.jsonc`
configures it as a Cloudflare Workers static-asset project; the Git integration should use
root directory `website`, an **empty** build command, and `npx wrangler deploy`.

Do not set the build command to `npm run build` — that builds the Electron app.

`website/.assetsignore` excludes the locally built installers that accumulate in
`website/updates/`, while still shipping the two update feeds below.

### The legacy website feed

Apps installed from 3.1.0 onward read GitHub Releases directly. Older installs point at
`https://nativelaunch.xyz/updates/`, so `bridge-legacy-feed` re-downloads the freshly
published `latest.yml` and `latest-linux-arm64.yml`, rewrites their relative URLs to
absolute `native-releases` download URLs, commits them to `website/updates/` on `main`,
and deploys.

`website/updates/` is otherwise gitignored — only those two `.yml` files are force-added
(`git add -f`), which is why local installer builds accumulating there never reach a clone.

### Known-broken: the site is not deploying

As of 2026-08-02 `nativelaunch.xyz` still serves a ~3.4.0-era build. The Pages Git
integration broke when the repos moved off the renamed `ikie-cli` account (see below), and
because no `CLOUDFLARE_*` secrets are configured the workflow's fallback branch just echoes
a message and exits 0. Every `website/**` commit since the move is in git but not live.

Unblocking needs one of:

1. Connect a Cloudflare Workers project to `navidu-sathsara/native` with the settings above, or
2. Add the three `CLOUDFLARE_*` secrets so CI deploys explicitly — this is the better
   option, since a failed deploy then fails the job instead of passing silently.

## Repository history

Both repos previously lived under the `ikie-cli` account, which was renamed and its repos
deleted. Everything was restored from the local clone and republished under
`navidu-sathsara` (v3.8.0 rebuilt from source, all six platforms).

One consequence is permanent: **binaries shipped before the move have the old feed URL
compiled in.** They query `github.com/ikie-cli/native-releases`, get a 404, and will never
see another update. If that handle is ever claimed by a third party, those installs would
fetch update metadata from whoever controls it — electron-updater validates sha512 against
the feed itself, so a hostile feed is not detectable client-side, and builds are unsigned
unless SignPath is configured. Claiming `ikie-cli` (as a user or an organization) and
mirroring the feeds there is the only way to recover or protect those users.

Before changing owner again, update all of: `package.json` (`homepage`, `repository`),
`electron-builder.yml` (`publish.owner`), `.github/workflows/ci.yml` (release
`repository:`, the `verify-release.mjs` argument, and `release_url`),
`scripts/verify-release.mjs` (default repo), `README.md`, `website/index.html`,
`website/download/index.html`, and `website/updates/*.yml`.

---

## Historical: 3.4.0 verification checklist

Point-in-time record, verified 2026-07-22 on the runners of the day
(`ubuntu-22.04` / `windows-2022`; CI has since moved to `ubuntu-24.04` / `windows-2025` /
`macos-15`). Retained for provenance — it is not a live checklist.

- [x] **Design system extracted and applied consistently** — every surface/typography/radius/
      motion token was pixel-sampled from `./screenshots/` into `design-system.md`, encoded in
      `tailwind.config.ts` + `tokens` CSS variables, and enforced by the perceptual QA gate.
- [x] **All 9 core features implemented and reachable in UI** — auth (msmc popup OAuth —
      zero-setup, entitlement gate, refresh, safeStorage, offline profiles, multi-account), version
      management (manifest, parallel/resumable/sha1-verified downloads with speed & ETA),
      mod loaders (Fabric/Quilt via meta profiles, Forge/NeoForge via headless installer,
      Java 8/17/21 auto-match with Adoptium download), instances (CRUD/duplicate, RAM
      sliders, JVM args, resolution, icons, content manager, screenshots gallery, worlds
      backup/delete), servers (SLP ping + quick join), home dashboard (recents + news +
      quick launch), settings (Java detect/download/override, defaults, launch behavior,
      themes, language scaffold), launch flow (validation, live console, crash report
      capture, playtime), auto-updates.
- [x] **Auto-updater tested end-to-end** — `e2e/updater.spec.ts` runs the app against a
      local generic-provider feed: detects v99.9.9 → background-downloads with progress →
      "restart to apply". The install step itself was empirically verified:
      `autoInstallOnAppQuit` replaced the packaged 0.1.0 AppImage with the downloaded
      new-version file on quit (old version → new version on disk).
- [x] **Windows installer & Ubuntu package build cleanly** — AppImage built & boot-tested on
      this machine (`dist/Native-*-arm64.AppImage`, logs healthy under Xvfb). The `.deb` and
      Windows NSIS targets build in CI — this dev box is arm64 and lacks the x86 `fpm`/Wine
      toolchains, which is an environment limit, not a config one.
- [x] **All animations smooth at 60fps, no blocking on download/IO** — transform/opacity-only
      animation policy (audited; the tab pill uses a measured-transform glide, no layout
      projections), virtualized mod/log lists, lazy-loaded screens, downloads/hash/zip run
      in the main process + worker thread with 10 Hz progress IPC and ~15 Hz log batching;
      cold start measured at **~950 ms** (3-run mean, 4-core arm64 under Xvfb) vs the 2 s
      budget.
- [x] **All tests green** — 191 vitest tests (unit + integration + renderer stores; hermetic
      fixture server for Mojang/Fabric/Modrinth/CurseForge/MSA endpoints; real compiled Java client for
      the download→install→launch→crash pipeline) and the Playwright E2E suite
      (create → loader → mod → launch → process spawn verified → stop; options persistence
      across restart; servers; accounts; settings; updater).
- [x] **Full screenshot QA pass** — 17/17 screens ≥ their similarity bar (85%; empty/error
      states 75% — sparse by design) against the reference screenshots. Method + scores in
      [`qa-report.md`](qa-report.md); captures in `qa-screenshots/`.
- [x] **macOS packages in CI** — GitHub-hosted Intel and Apple Silicon runners build x64
      and ARM64 DMGs. Builds remain unsigned until Apple signing/notarization secrets are
      configured; code paths are rule-based per OS and `osx` is handled throughout.
