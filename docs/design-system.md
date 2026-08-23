# Design system

Every value below is declared once, in `apps/web/src/app/globals.css` under
`@theme`. Components consume tokens (`text-abyss-900`, `ease-water`,
`section-y`) and never raw hex or magic numbers. Changing the brand means
editing that one block.

## Colour

The brief warned against making the site "all blue", and it was right: a
mineral water site painted entirely in aqua reads as a template. The palette is
four families, used in very different quantities.

| Family | Role | Share of the page |
| --- | --- | --- |
| `abyss` | Deep navy. Every hero, every dark band, all display type on light. | The anchor |
| `aqua` | Water blue. Accents, active states, the motion tells, the mineral bars. | Sparing |
| `mineral` | Natural green. Sustainability and confirmation states only. | Rare |
| `mist` | Off-whites and greys. Page ground, borders, secondary text. | Most of it |

Two rules that carry most of the "premium" feel:

- **Never `#ffffff` on a large surface.** The canvas is `mist-50` (`#fbfcfd`).
  Pure white next to a deep navy band looks like an unstyled page.
- **Glass is a material, not a colour.** The `glass` and `glass-light`
  utilities are a gradient plus `backdrop-filter`, and they are what makes the
  fourth item in the palette — "glass / water" — an actual thing rather than a
  mood word.

Semantic aliases (`--color-canvas`, `--color-ink`, `--color-line`) exist so a
component says what it means rather than which shade it happens to use.

## Typography

Two faces, bound to `--font-brand-display` / `--font-brand-sans` on `<html>`
according to the locale's script.

| Script | Face | Why |
| --- | --- | --- |
| Latin, Cyrillic | **Manrope** | Geometric, wide apertures, a variable axis that covers 300–700 in one file. Holds up at display sizes. |
| Persian, Arabic | **Vazirmatn** | Proper Persian digits, correct joining, a full weight range, and an open licence. |

Both are self-hosted by `next/font/google`, so there is no runtime request to a
third-party font host and `font-src` in the CSP stays `'self'`.

The scale is written **mobile first**: every step's `clamp()` minimum is the
size a 360 px phone gets, and it grows to its cap at 1440 px and holds there.
The `vw` coefficient of each step is the slope between those two anchors, so the
whole scale grows at one rate and the hierarchy holds at every width between —
no breakpoint overrides, and nothing that keeps inflating on a 2560 px display.

| Token | 360 px | 1440 px and wider | Typical use |
| --- | --- | --- | --- |
| `--text-hero` | 40 px | 88 px | Home hero only |
| `--text-6xl` | 36 px | 68 px | Oversized numerals |
| `--text-5xl` | 32 px | 56 px | Page hero, closing CTA |
| `--text-4xl` | 28 px | 44 px | Section headings |
| `--text-3xl` | 24 px | 34 px | Sub-headings, card titles |
| `--text-2xl` | 20 px | 28 px | Lead-ins |
| `--text-xl` | 18 px | 22 px | Large body |
| `--text-lg` … `--text-2xs` | fixed | fixed | Body and labels |

Below `--text-xl` nothing scales with the viewport. Body copy that grows with
the window is a readability problem, not a feature: 16 px stays 16 px.

**Script-specific corrections.** Display sizes are tuned to Latin metrics.
Arabic-script faces carry more vertical mass at the same point size, so
`globals.css` redefines `--text-hero`, `--text-6xl`, `--text-5xl` and
`--leading-display` on `html:lang(fa)` and `html:lang(ar)` — roughly a 9 % step
down and a looser line — and drops the negative tracking that suits Manrope and
ruins Vazirmatn. Without this the Persian hero clips its own descenders.

The correction lives on the *tokens*, not on `h1`. A `text-hero` utility beats
any base-layer rule, so a base-layer `font-size` for `:lang(fa)` never reaches
the hero it was written for; setting the variable does.

## Spacing and layout

| Token | Value | Used for |
| --- | --- | --- |
| `--container-shell` | `88rem` | Maximum content width (`.shell`) |
| `--spacing-gutter` | `clamp(1.25rem, 4vw, 4.5rem)` | Horizontal padding everywhere |
| `--spacing-section` | `clamp(5rem, 11vw, 11rem)` | Vertical rhythm (`.section-y`) |

`<Section>` owns vertical rhythm and background tone and nothing else. If a
component is setting its own `padding-block`, it is doing the section's job.

Everything uses logical properties — `padding-inline`, `text-start`, `end-0`,
`ms-*` — so RTL is a `dir` attribute rather than a stylesheet fork.

**Touch targets are the mobile default, and the compact version is the
override.** The header controls and the footer link columns carry `min-h-11`
(44 px) or their own vertical padding on a phone and shed it at `lg`, rather
than the other way round. Inline links inside a sentence — breadcrumbs, prose
— are exempt, as they are in WCAG 2.5.8.

## Motion tokens

Durations and curves live in the same `@theme` block as the colours, so the CSS
transitions, the GSAP timelines and the Motion components all move with the same
physical character. `motionTokens` in `src/animations/gsap.ts` mirrors them for
JavaScript.

| Token | Value | Character |
| --- | --- | --- |
| `--ease-water` | `cubic-bezier(0.22, 1, 0.36, 1)` | The default. Fast out, long settle. |
| `--ease-drop` | `cubic-bezier(0.16, 1, 0.3, 1)` | Sharper. Entrances. |
| `--ease-swell` | `cubic-bezier(0.65, 0, 0.35, 1)` | Symmetric. Masks and wipes. |
| `--duration-fast` → `--duration-cinematic` | 220 ms → 1200 ms | Four steps, no in-between values |

## Components

Primitives in `components/ui`:

| Component | Notes |
| --- | --- |
| `Section` / `Shell` | Vertical rhythm and tone. `scroll-mt-24` keeps anchors clear of the fixed header. |
| `Button` / `ButtonLink` | Four variants, three sizes, a magnetic cursor effect on precise pointers, and a sheen that crosses on hover. The magnetic ref sits on a wrapper, so it does not depend on how `next-intl` forwards refs. |
| `Eyebrow` | The small tracked label that opens a section. Sets the editorial rhythm more than any other single element. |
| `DataTable` | Tabular figures, its own `overflow-x` container. A six-column analysis sheet must never make the page scroll sideways. |
| `MineralBar` | Bars scale against the largest value in the set, not an absolute maximum — otherwise sodium at 8 mg/L is an invisible sliver and the chart says nothing. |
| `MediaLayer` | The 3D → video → still ladder. See the motion map. |
| `WaterBackdrop` | Generated background art: gradients, a wave field and fine grain, in five variants. |
| `BottleGlyph` | Vector product stand-in whose silhouette derives from the actual volume, so the range reads as a range. |
| `SeedNotice` | Marks figures as sample data. Never suppress it to make a screenshot look finished. |

## RTL

Handled in three places, and all three are necessary:

1. **Layout** — logical properties throughout; `dir` is set on `<html>` from the
   locale.
2. **Iconography** — `ArrowIcon` flips with `rtl:-scale-x-100`; a right-pointing
   arrow means "back" in Persian.
3. **Motion** — reveal directions read `document.documentElement.dir`, the
   horizontal product track travels the other way, and text splitting degrades
   from characters to words so Arabic glyph joining survives. That last one is
   the bug nobody catches in review: splitting `آب خالص` per character renders
   it as disconnected letters.
