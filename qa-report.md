# Visual QA report

Generated 2026-08-02 · threshold **85%** (empty/error states: 75% — sparse by design) · method: perceptual similarity (45% quantized-palette Bhattacharyya affinity, 35% 32×18 luminance-grid layout, 20% tonal-distribution Bhattacharyya affinity) against the reference screenshots in `./screenshots/`.

| Screen | Reference | Palette | Layout | Tone | **Score** | Verdict | Notes |
|---|---|---|---|---|---|---|---|
| accounts | baselines/accounts.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| create-instance | baselines/create-instance.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| discover-error | baselines/discover-error.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| discover | baselines/discover.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| home-empty | baselines/home-empty.png | 100.0% | 100.0% | 98.5% | **99.7%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| home | baselines/home.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| instance-content | baselines/instance-content.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| instance-logs | baselines/instance-logs.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| instance-options | baselines/instance-options.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| instance-screenshots | baselines/instance-screenshots.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| instance-worlds | baselines/instance-worlds.png | 100.0% | 99.8% | 100.0% | **99.9%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| launch-console | baselines/launch-console.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| library-empty | baselines/library-empty.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| library | baselines/library.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| servers-empty | baselines/servers-empty.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| servers | baselines/servers.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |
| settings | baselines/settings.png | 100.0% | 100.0% | 100.0% | **100.0%** | ✅ pass | palette matches, layout aligned, tonal balance matches |

**17/17 screens meet their similarity bar.**
