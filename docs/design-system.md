# Design system — "Glass"

Every value below is declared once, in `apps/web/src/app/globals.css` under
`@theme`. Components consume tokens (`text-ink-900`, `ease-water`, `section-y`,
`glass`) and never raw hex or magic numbers. Changing the brand means editing
that one block.

This is the second system. The first one was navy-dominant, editorial and very
airy: dark full-bleed bands, a full-viewport hero, thin display type and a lot
of empty space between things. It photographed well and read as cold, sparse
and generic. What replaced it inverts almost every one of those decisions.

## The idea

The page is a pale aurora — three fixed radial gradients on the `<body>` — and
everything on it is a translucent panel floating over that gradient. There is
no second colour scheme: the header, the hero, the cards and the footer are all
the same light material, so nothing has to switch theme as you scroll.

## Colour

| Family | Role | Share of the page |
| --- | --- | --- |
| `ground` | The aurora itself: `#f2fafd` and its neighbours. Never a flat grey. | The ground |
| `aqua` | The brand voice. Primary buttons, active nav, mineral bars, accents. Turquoise, not navy blue. | Sparing but loud |
| `ink` | Deep teal-slate for type. `ink-900` (`#0f2a3a`) is as dark as the system goes. | All the text |
| `mint` | The quiet second accent: "verified", sustainability, success states. | Rare |

Rules that carry the look:

- **Glass is a material, not a colour.** `glass`, `glass-strong` and
  `glass-ink` are a gradient plus `backdrop-filter` plus a 1px inset white
  highlight along the top edge. The highlight is what reads as a physical
  edge; without it the panel is just flat opacity.
- **One dark surface, used on purpose.** `glass-ink` appears on the factory
  production line, the source characteristics panel and the product minerals
  panel — nowhere else. A dark band is a moment, not a default.
- **Never pure `#ffffff` on a large surface.** Panels are white *at 52–90%*
  over the gradient, which is why they have depth at all.
- **Radii are the loudest signal.** `--radius-xl` (2rem) and `--radius-2xl`
  (2.5rem) on every panel; pills on every button and tag.

Semantic aliases (`--color-canvas`, `--color-body`, `--color-heading`,
`--color-hairline`) exist so a component says what it means rather than which
shade it happens to use.

On the `low` device tier `backdrop-filter` is dropped entirely — same layout, a
fraction of the paint cost.

## Typography

Two faces, bound to `--font-brand-display` / `--font-brand-sans` on `<html>`
according to the locale's script.

| Script | Face | Why |
| --- | --- | --- |
| Latin, Cyrillic | **Plus Jakarta Sans** | Geometric with slightly rounded terminals, which is what the rounded glass panels need. Variable, 400–800 in one file. |
| Persian, Arabic | **Vazirmatn** | Proper Persian digits, correct joining, a full weight range, and an open licence. |

Both are self-hosted by `next/font/google`, so there is no runtime request to a
third-party font host and `font-src` in the CSP stays `'self'`.

The scale is deliberately **denser** than the previous one: `--text-base` is
15px, `--text-5xl` tops out at 3.75rem rather than 5rem, and headings are
`font-weight: 600` (700 for Arabic script) instead of light. Hierarchy comes
from weight and colour, not from size alone — thin 5rem type over an empty
screen was the single thing that made the old design feel unfinished.

**Script-specific corrections.** Display sizes are tuned to Latin metrics.
Arabic-script faces carry more vertical mass at the same point size, so
`globals.css` sets `line-height: 1.25`, weight `700` and zero tracking for
`:lang(fa)` and `:lang(ar)` headings, and drops the negative tracking that
suits Jakarta and ruins Vazirmatn.

## Spacing and layout

| Token | Value | Used for |
| --- | --- | --- |
| `--container-shell` | `78rem` | Maximum content width (`.shell`) |
| `--spacing-gutter` | `clamp(1.125rem, 3.5vw, 3.5rem)` | Horizontal padding everywhere |
| `--spacing-section` | `clamp(3rem, 6.5vw, 7rem)` | Vertical rhythm (`.section-y`) |

Both the shell and the section rhythm are smaller than in the first system
(88rem / 11rem). Content sits closer together and panels do the separating that
whitespace used to do alone.

`<Section>` owns vertical rhythm and background tone and nothing else. If a
component is setting its own `padding-block`, it is doing the section's job.

Everything uses logical properties — `padding-inline`, `text-start`, `end-0`,
`ms-*` — so RTL is a `dir` attribute rather than a stylesheet fork.

## Motion tokens

Durations and curves live in the same `@theme` block as the colours, so the CSS
transitions, the GSAP timelines and the Motion components all move with the
same physical character. `motionTokens` in `src/animations/gsap.ts` mirrors them
for JavaScript.

| Token | Value | Character |
| --- | --- | --- |
| `--ease-water` | `cubic-bezier(0.22, 1, 0.36, 1)` | The default. Fast out, long settle. |
| `--ease-drop` | `cubic-bezier(0.16, 1, 0.3, 1)` | Sharper. Entrances. |
| `--ease-swell` | `cubic-bezier(0.65, 0, 0.35, 1)` | Symmetric. Masks and wipes. |
| `--duration-fast` → `--duration-cinematic` | 200 ms → 1100 ms | Four steps, no in-between values |

## Components

Primitives in `components/ui`:

| Component | Notes |
| --- | --- |
| `Section` / `Shell` / `SectionHead` | Vertical rhythm and tone; `SectionHead` fixes eyebrow → title → lede order and spacing so no two sections drift apart. `tone="deep"` renders a rounded ink slab inside the shell rather than a full-bleed dark band. |
| `Button` / `ButtonLink` | `primary` is the only saturated fill in the system; `secondary` is glass so it sits on the aurora instead of punching a hole in it. Magnetic cursor effect on precise pointers; the magnetic ref sits on a wrapper, so it does not depend on how `next-intl` forwards refs. |
| `Card` | The one surface. `glass` by default, `solid` where a blur behind small text would cost legibility, `dark` for the inverse pane. |
| `Eyebrow` | A tinted pill, not a hairline rule — on a gradient ground a thin rule reads as an artefact. |
| `DataTable` | Below `sm` each row becomes its own block (heading + label/value pairs); from `sm` up, a real table inside a glass panel. A six-column analysis sheet must never make the page scroll sideways. |
| `MineralBar` | Bars scale against the largest value in the set, not an absolute maximum — otherwise sodium at 8 mg/L is an invisible sliver and the chart says nothing. |
| `MediaLayer` | The 3D → video → still ladder. See the motion map. |
| `WaterBackdrop` | Generated background art: light gradients plus a wave field, in five variants. |
| `BottleGlyph` | Vector product stand-in whose silhouette derives from the actual volume, so the range reads as a range. Also the hero's still, tagged `tier-poster` so it disappears the moment the WebGL bottle is allowed to mount. |
| `SeedNotice` | Marks figures as sample data. Never suppress it to make a screenshot look finished. |

## Page structure

The home page is five sections, roughly five screens:

    Hero → Products → Source → Quality & sustainability → Contact

The previous home page was eleven blocks and fourteen screens on a phone: a
journey sequence, five scroll-driven story chapters, then the same content
again as teasers. Anything that did not earn its screen height now lives on its
own page, where a visitor who wants it can find it.

## Small screens

Every clamp in the scale has two ends, and the small end decides what a phone
gets.

| | Rule |
| --- | --- |
| `--spacing-section` | 48px on a phone. Vertical rhythm is proportional to the viewport, and a phone's viewport is 844px tall. |
| Display sizes | Every `--text-*` minimum is a phone value first. A headline that fills the screen is not impact, it is an obstacle. |
| Body copy | `text-lg` (17px) is a desktop measure. Paragraphs are 15px until `sm`. |
| Header | A floating pill, 60px at rest and 56px once scrolled. `scroll-mt` follows it so anchors still clear it. |
| Hero | Two columns on `lg`, one stacked column below, and the media card is a 4:3 banner rather than half a screen of decoration. |
| Menu | Opaque, not translucent: a blurred page behind a menu makes the menu's own labels harder to read in daylight. |
| Tables | Below `sm` a row becomes a block — see `DataTable`. |
| Form fields | Held at 16px on small screens. Safari zooms the viewport when a focused input is smaller, and does not zoom back. |
| Pinned sequences | `usePinnedSequence` refuses to pin on a coarse pointer at all; pinning a tall section traps a thumb. |

## RTL

Handled in three places, and all three are necessary:

1. **Layout** — logical properties throughout; `dir` is set on `<html>` from the
   locale.
2. **Iconography** — `ArrowIcon` flips with `rtl:-scale-x-100`; a right-pointing
   arrow means "back" in Persian.
3. **Motion** — reveal directions read `document.documentElement.dir` and text
   splitting degrades from characters to words so Arabic glyph joining
   survives. That last one is the bug nobody catches in review: splitting
   `آب خالص` per character renders it as disconnected letters. The same
   constraint rules out nested markup inside a split line — `SplitText`
   rebuilds the DOM, so a gradient-clipped `<span>` inside a headline line
   silently becomes invisible text.
