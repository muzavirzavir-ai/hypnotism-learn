# Design Brief

## Direction

Deep Focus — a premium dark navy/black learning platform where indigo-to-violet light guides attention to study content, not chrome.

## Tone

Refined dark editorial-tech: deep navy surfaces, restrained indigo/violet accents, generous whitespace, and confident typography — calm and trustworthy for students and admins.

## Differentiation

A single indigo→violet gradient is the only "loud" element, used as a precise accent (active states, focus rings, hero headline) against near-black navy — the interface feels like a focused study instrument, not a generic SaaS dashboard.

## Color Palette

| Token      | OKLCH         | Role                                    |
| ---------- | ------------- | --------------------------------------- |
| background | 0.15 0.028 272 | Deep navy-black page base (dark)        |
| foreground | 0.96 0.008 270 | Near-white primary text                 |
| card       | 0.19 0.032 272 | Elevated navy surface for cards/panels  |
| primary    | 0.68 0.2 275   | Indigo — primary actions, links, focus  |
| accent     | 0.7 0.21 305   | Violet — highlights, active nav, badges |
| muted      | 0.24 0.036 272 | Recessed surfaces, secondary text bg    |
| success    | 0.72 0.16 158  | Unlocked/completed states               |
| warning    | 0.78 0.15 82   | Countdown/locked states                 |
| destructive| 0.62 0.2 22    | Errors, destructive actions             |

## Typography

- Display: Space Grotesk — headings, hero, section titles, numerals (technical confidence).
- Body: Plus Jakarta Sans — paragraphs, UI labels, forms, buttons (high legibility).
- Malayalam: Noto Sans Malayalam — all `:lang(ml)` / `[lang="ml"]` content (CDN, bundled fonts lack Malayalam glyphs).
- Mono: JetBrains Mono — codes, timers, countdowns.
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-4xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase text-muted-foreground`, body `text-base leading-relaxed`.

## Elevation & Depth

Layered navy surfaces (background → card → popover) separated by 1px `border` and a graded shadow scale (`shadow-subtle` → `shadow-elevated` → `shadow-floating`); depth comes from surface lightness steps, never from glow.

## Structural Zones

| Zone    | Background                | Border          | Notes                                                        |
| ------- | ------------------------- | --------------- | ------------------------------------------------------------ |
| Header  | `bg-card/80` + backdrop   | `border-b`      | Sticky, blurred; logo left, language switcher + auth right   |
| Content | `bg-background`           | —               | Alternating `bg-muted/30` sections; grid-fade texture on hero |
| Footer  | `bg-muted/40`             | `border-t`      | Educational/ethical disclaimer, links, language switch       |

## Spacing & Rhythm

Sections use `py-16 md:py-24` with `gap-6 md:gap-8` grids; cards use `p-5 md:p-6`; micro-spacing is `gap-2`/`gap-3`; content constrained to `max-w-7xl mx-auto px-4 md:px-6`.

## Component Patterns

- Buttons: `rounded-xl`, primary = indigo→violet gradient with white text, secondary = `bg-secondary` outline; hover lifts `-translate-y-0.5` + `shadow-elevated`.
- Cards: `rounded-2xl bg-card border shadow-subtle`, hover → `border-primary/40 shadow-elevated`; class cards feature a gradient top edge.
- Badges: pill `rounded-full`, tinted `bg-primary/15 text-primary` for info, `bg-success/15` for unlocked, `bg-warning/15` for locked.

## Motion

- Entrance: `animate-fade-up` (0.5s, staggered via inline delay) on hero and card grids; `animate-scale-in` for modals.
- Hover: `transition-smooth` (0.3s cubic-bezier) on color, border, and `-translate-y-0.5` lift.
- Decorative: slow `animate-float` on ambient gradient orbs; `animate-shimmer` on loading skeletons; respect `prefers-reduced-motion`.

## Constraints

- Mobile-first: single column → `md:grid-cols-2` → `lg:grid-cols-3`; touch targets ≥ 44px.
- Accessibility: AA+ contrast on all text, visible `ring-2 ring-ring` focus states, labeled inputs, full keyboard navigation.
- Bilingual: every user-facing string supports English/Malayalam; `[lang="ml"]` swaps to Noto Sans Malayalam with looser line-height.
- No public media URLs, no download buttons for protected content; disclaimer always present in footer.
- Never reference the design preview image from production code.

## Signature Detail

The "focus beam" — a soft indigo→violet radial glow behind the hero headline plus a masked grid texture, giving the landing page a deliberate spotlight-on-learning signature without any image asset.
