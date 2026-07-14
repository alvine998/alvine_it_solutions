# AGENTS.md

This file tells any AI coding agent (Claude Code, Cursor, Copilot, etc.) how to
work in this repository. Follow it exactly. When in doubt, prefer the choice
that is *specific to this project* over the generic default.

## Stack

- **Runtime / package manager: Bun.** Never use npm, yarn, or pnpm.
  - Install: `bun install`
  - Dev server: `bun run dev`
  - Build: `bun run build`
  - Preview build: `bun run preview`
  - Add a dependency: `bun add <pkg>` / `bun add -d <pkg>` for dev deps
  - Do not commit `package-lock.json` or `yarn.lock`. Only `bun.lockb` /
    `bun.lock` should exist. If you find an npm/yarn lockfile, delete it.
  - Do not add scripts that call `npm`/`npx` internally — use `bunx`.
- **Framework:** React + Vite.
- **Smooth scroll:** [Lenis](https://github.com/darkroomengineering/lenis)
  (`bun add lenis`). One Lenis instance, initialized once, driven by
  `requestAnimationFrame`, and torn down on unmount. Never instantiate a
  second Lenis instance in a nested component.
- **Parallax / scroll-linked motion:** built on top of Lenis's scroll value
  (or `lenis.on('scroll', ...)`), not a second competing scroll library.
  Prefer transforms driven by `translate3d`/`scale` via CSS custom properties
  or a lightweight animation lib (e.g. Motion/Framer Motion or GSAP with
  ScrollTrigger) — pick one and use it consistently, do not mix multiple
  animation libraries for the same effect.

## The one hard rule: this must not look AI-generated

The person building this site explicitly wants something that reads as
*designed*, not templated. Before writing any UI code, stop and think like a
small studio's design lead making one deliberate, opinionated choice for
*this* project — not a safe default that would work for any brief.

### Patterns to actively avoid

AI-generated design currently clusters around a small set of tells. Do not
default to these unless the user's brief explicitly asks for them:

- Warm cream background (`#F4F1EA`-ish) + high-contrast serif display +
  terracotta/clay accent (`#D97757`-ish).
- Near-black background with a single bright acid-green or vermilion accent.
- Broadsheet layout: hairline rules, zero border-radius, dense
  newspaper-style columns "because it looks editorial."
- Generic hero formula: big number + small label + supporting stats +
  gradient accent, used regardless of what the site is actually about.
- Numbered section markers (01 / 02 / 03) used as decoration rather than
  because the content is genuinely sequential.
- Overused stock combos: Inter/Poppins for everything, `rounded-2xl` +
  drop-shadow on every card, indigo-to-purple gradients, generic glassmorphism.
- Motion for motion's sake: fade-up-on-scroll applied uniformly to every
  section. Parallax should be *chosen*, not sprinkled.

### What to do instead

1. **Ground it in the actual subject.** Before touching layout, name in one
   sentence what this site is about, who it's for, and the one job the page
   does. Pull colors, type, and motion ideas from that subject's own world —
   its materials, references, vernacular — not from a generic "modern SaaS"
   template.
2. **Design in tokens first.** Before generating components, define:
   - **Color** — 4–6 named hex values, chosen for the subject, not a
     preset palette.
   - **Type** — a characterful display face used with restraint + a
     complementary body face (+ a utility/mono face if needed). Avoid
     defaulting to the same pairing every project.
   - **Layout** — a one- or two-sentence layout concept, sanity-checked
     with a quick ASCII wireframe before coding.
   - **Signature** — the one memorable element this page will be
     recognized by (a specific parallax moment, an unusual hero
     construction, a distinctive scroll behavior). Spend the "boldness
     budget" there and keep the rest disciplined and quiet.
3. **Self-critique before building.** Ask: if I ran a similar prompt for a
   different client, would I land somewhere similar? If yes, revise. Only
   move to code once the plan feels specific to this brief.
4. **Motion is deliberate, not decorative.** Every scroll-linked / parallax
   effect should have a reason tied to content (depth, hierarchy, pacing of
   a narrative) — not applied uniformly "because Lenis is installed."
   Respect `prefers-reduced-motion`: provide a reduced/disabled-motion path
   for Lenis and all parallax layers.
5. **Copy is design material.** Write copy specific to the real
   content/subject, in plain active voice, not generic marketing filler
   ("Empowering the future of X"). If real content isn't provided yet, ask
   or draft something concrete and specific rather than placeholder-sounding
   text.

## Project conventions

- **Components:** functional components + hooks only. No class components.
- **Styling:** pick one system up front (CSS Modules, vanilla CSS with
  custom properties, or Tailwind) and stay consistent — don't mix.
- **File structure:**
  ```
  src/
    components/       # reusable UI
    sections/          # page-level sections (Hero, About, etc.)
    hooks/             # e.g. useLenis, useParallax
    lib/                # non-React utilities
    styles/            # tokens, globals
  ```
- **Lenis setup:** centralize in a single `hooks/useLenis.ts` (or
  `lib/lenis.ts`) that other components/hooks read from — don't re-init
  per-component.
- **Accessibility floor (non-negotiable even in a bold design):**
  - Visible keyboard focus states.
  - Sufficient color contrast for body text.
  - `prefers-reduced-motion` disables/simplifies parallax and Lenis easing.
  - Semantic HTML first; ARIA only to fill real gaps.
- **Performance:** parallax/scroll listeners must be rAF-throttled (Lenis
  already does this — hook into its `scroll` event rather than adding raw
  `window.addEventListener('scroll', ...)` listeners).

## Before opening a PR / finishing a task

- [ ] Ran with Bun (`bun install`, `bun run dev`) — no npm/yarn artifacts.
- [ ] Design choices (color/type/layout/signature) can each be justified by
      the subject of the site, not "that's what looked good in a template."
- [ ] Checked the page against the "patterns to avoid" list above.
- [ ] Lenis instance is singular, cleaned up on unmount.
- [ ] Parallax respects `prefers-reduced-motion`.
- [ ] Mobile viewport checked — parallax degrades gracefully on touch
      devices (avoid heavy scroll-jacking on mobile).