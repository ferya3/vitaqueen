# Motion map

Every animation in the project, what it costs, and what happens when the device
cannot afford it.

## The rules

1. **Content is authored visible.** `[data-reveal]` elements are fully opaque
   until `MotionProvider` puts `js-motion` on `<html>`. A failed chunk load
   degrades to "the page is simply visible", never to a blank screen.
2. **Motion code contains no JSX; components contain no timelines.** Hooks live
   in `src/animations`, wrappers in `src/components/motion`. Every GSAP hook runs
   inside `useGSAP` from `@gsap/react`, which scopes selectors to the component
   and reverts its tweens and ScrollTriggers on unmount.
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

On `high` the home hero mounts a WebGL field of drifting droplets behind the
illustrated bottle; every other tier gets the same hero without it. On `low` the
CSS caustics, light rays and bubbles are switched off as well.

## The catalogue

### Home

Deep, light, deep, light, deep: each section owns one motion idea.

| Section | Mechanism | Hook | Degrades to |
| --- | --- | --- | --- |
| Hero entrance | Word-split headline, staggered `yPercent`, bottle scale-in | `useHeroTimeline` | Everything visible, no transform |
| Hero ambience | Caustics, light rays, bubbles, ripples under the bottle, floating bottle; WebGL droplets on `high` | CSS, `BottleScene` | Static deep gradient |
| Hero pointer parallax | `gsap.quickSetter` on the ticker; media −14 px, bottle +26 px | `useHeroTimeline` + `usePointer` | Skipped on coarse pointers |
| Ticker | Two copies of the row, CSS translate by −50% (RTL +50%), paused on hover | `Marquee` | Static row |
| Statement | One sentence at display size; each word scrubbed from 14% to full opacity across the scroll | `Statement` (`useGSAP` + ScrollTrigger) | Full-strength sentence |
| Products | Pinned section, vertical scroll drives the row sideways (scrubbed) on `lg` + fine pointer; swipeable snap row elsewhere | `ProductShowcase` (`gsap.matchMedia`) | Native horizontal scroll |
| Numbers | Display-size figures count up when they enter (Framer Motion `animate`); mineral bars grow | `Stat`, `MineralChart` | Final values, server-rendered |
| Bento | Staggered reveal; each tile lights up under the cursor (`--mx`/`--my`) | `Reveal`, `Spotlight` | Static tiles |
| Contact | Round link floods with aqua from the centre on hover | CSS | Static |

ScrollTrigger positions are recalculated whenever the page height changes
(a `ResizeObserver` in `MotionProvider`), so late fonts and split headlines
never leave a scroll effect firing hundreds of pixels early.

### Inner pages

| Page | Mechanism |
| --- | --- |
| All | `PageHero` line reveal; `PageTransition` (Framer Motion) fades the body in on client navigations — opacity only, 450 ms, never on the first load |
| Factory | `ProcessSequence` — the eight production stages in one pinned ink slab, 0.55 viewports of scroll per stage, plus per-stage metrics from the CMS. Never pins on a coarse pointer |
| Source | Animated SVG route diagram: dashed stroke offset for flow, pulsing spring marker |
| Quality | Reveals only. This page is read, not watched — the numbers are the point |
| Products | `TiltCard` (Framer Motion springs) tilts each card toward the cursor with a moving glare; staggered grid reveal. Mouse only, off under reduced motion |

### Micro-interactions

| Effect | Where | Notes |
| --- | --- | --- |
| Magnetic buttons | `ButtonLink`, and `Button` with `magnetic` | `gsap.quickTo` inside `useGSAP`, precise pointers only |
| Sheen | Button hover (`sheen` variant) | A `::before` pseudo-element, so it survives `asChild`; hidden under `motion-reduce` |
| Count-up | `Stat` | Framer Motion `animate` once `useInView` fires. Final value is server-rendered, so a crawler and a no-JS visitor see the real number |
| Scroll progress | Header hairline | Written straight to the DOM on scroll; never re-renders React |
| Mobile menu | Opened from the header, closed from the menu or by navigation | Zustand store; Framer Motion `AnimatePresence` with staggered items |
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
