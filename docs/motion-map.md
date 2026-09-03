# Motion map

Every animation in the project, what it costs, and what happens when the device
cannot afford it.

## The rules

1. **Content is authored visible.** `[data-reveal]` elements are fully opaque
   until `MotionProvider` puts `js-motion` on `<html>`. A failed chunk load
   degrades to "the page is simply visible", never to a blank screen.
2. **Motion code contains no JSX; components contain no timelines.** Hooks live
   in `src/animations`, wrappers in `src/components/motion`.
3. **One scroll loop.** Lenis is driven from GSAP's ticker, so smooth scroll and
   every ScrollTrigger share a single `requestAnimationFrame`.
4. **`prefers-reduced-motion` is honoured at the top of every hook**, not
   patched on afterwards. Reduced motion also forces the device tier to `low`.
5. **Nothing pins on a phone.** Pinned sections fall back to per-panel triggers
   below `lg` and on coarse pointers. A tall pinned section a thumb cannot
   escape is a trap, not an effect.

## Device tiers

`useDeviceTier()` measures once per load — memory, cores, pointer type, WebGL
support, Save-Data, reduced-motion — and publishes the result on
`<html data-tier>` so CSS can drop heavy layers without waiting for React.

| Tier | Gets | Chosen when |
| --- | --- | --- |
| `high` | WebGL bottle scene, full timelines, smooth scroll | ≥ 8 GB, ≥ 8 cores, precise pointer, WebGL available |
| `medium` | Video backgrounds, full timelines, smooth scroll | Everything in between, and every touch device |
| `low` | Static art, CSS transitions only, native scrolling | ≤ 2 GB or ≤ 2 cores, Save-Data, 2G, or reduced motion |

The ladder in `MediaLayer` is **3D → video → still**, and only one rung is ever
mounted. A weak laptop is never asked to composite a WebGL canvas behind a video
behind an image.

## The catalogue

### Home

The home page is five sections — hero, products, source, quality, contact — so
the motion budget is spent on five moments rather than eleven.

| Section | Mechanism | Hook | Degrades to |
| --- | --- | --- | --- |
| Hero entrance | Word-split headline, staggered `yPercent`, subject scale-in | `useHeroTimeline` | Everything visible, no transform |
| Hero pointer parallax | `gsap.quickSetter` on the ticker; media −14 px, subject +26 px | `useHeroTimeline` + `usePointer` | Skipped on coarse pointers |
| Hero scroll-out | Media drifts −6% once the block's bottom enters the viewport | `useHeroTimeline` | Static |
| Products | Staggered grid reveal, card lift on hover | `Reveal` | CSS transition on `data-revealed` |
| Source | Mineral bars grow on width transition; animated SVG route diagram | `MineralChart`, `SourceMap` | Bars render at final width |
| Quality | Staggered pillar reveal | `Reveal` | Visible |
| Contact | Static panel over a generated backdrop | — | Static |

The hero is no longer a full-viewport band pinned to the top of the document,
so its scroll-out trigger starts at `bottom bottom` rather than `top top` — with
the old trigger the copy began fading the instant the page loaded.

### Inner pages

| Page | Mechanism |
| --- | --- |
| All | `PageHero` line reveal; `PageTransition` fades the body across routes (opacity + 12 px, 450 ms) |
| Factory | `ProcessSequence` — the eight production stages in one pinned ink slab, 0.55 viewports of scroll per stage, plus per-stage metrics from the CMS. Never pins on a coarse pointer |
| Source | Animated SVG route diagram: dashed stroke offset for flow, pulsing spring marker |
| Quality | Reveals only. This page is read, not watched — the numbers are the point |
| Products | Card lift on hover, staggered grid reveal |

### Micro-interactions

| Effect | Where | Notes |
| --- | --- | --- |
| Magnetic buttons | Every `Button` / `ButtonLink` | `gsap.quickTo`, precise pointers only |
| Sheen | Button hover | Pure CSS, hidden under `motion-reduce` |
| Count-up | `Stat` | Final value is server-rendered, so a crawler and a no-JS visitor see the real number |
| Scroll progress | Header hairline | Written straight to the DOM on scroll; never re-renders React |
| Header state | The floating pill gains its glass material and contracts past 24 px | `useSyncExternalStore`, re-renders only when the boolean flips |

## The WebGL scene

`components/three/BottleScene.tsx` is the only WebGL in the project.

- Procedural geometry: a `LatheGeometry` bottle, a liquid inner surface, a cap,
  and a 140-point droplet field. No glTF, no HDR environment map, no external
  asset — the whole scene is a few kilobytes of code, which is genuinely cheaper
  than the 4K video it replaces.
- `dpr` is capped at 1.75: a 3× retina panel does not need nine times the
  fragments.
- Randomness is seeded, so the scene is identical on every render and between
  runs. `Math.random()` during render would make the component impure.
- Loaded with `next/dynamic` and `ssr: false`, and only mounted on `high`.
- Marked `aria-hidden`: the headline carries the meaning, the bottle is
  decoration.

When the brand bottle is properly modelled, swap the procedural mesh for the
glTF. The component boundary was drawn for that.

## Text splitting and script

`src/animations/splitting.ts` exists because splitting is not script-neutral.

Arabic-script languages shape glyphs from context. Wrapping each character in
its own element breaks the joins, and `آب خالص` renders as loose, wrong letters.
So `resolveSplitType()` downgrades `chars` to `words` when the text contains
Arabic-script characters. Word and line splitting are always safe, because words
are separated by spaces and spaces never join.

The hero splits to words only, for the same reason.

## Performance notes

- Splitting runs after `document.fonts.ready`. Splitting before the webfont
  settles measures the fallback metrics, and the lines re-wrap mid-animation.
- `ScrollTrigger.refresh()` runs on fonts-ready and on window load, because both
  change layout after first paint and pinned sections would otherwise measure
  the wrong heights.
- Route changes reset the scroll position and refresh triggers; stale triggers
  from the previous page are the classic Lenis + App Router bug.
- Anything animated on every frame — pointer parallax, scroll progress, count-up
  — writes to the DOM directly. Re-rendering React sixty times a second to move
  a bottle twelve pixels would be an expensive way to do nothing.
