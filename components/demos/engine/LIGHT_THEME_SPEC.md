# Postio app — light theme spec (match the marketing site)

Goal: re-theme the app's UI chrome from dark to the marketing site's **light, violet, Geist**
brand. Functionality unchanged. Canvas artwork renderers (`SlideCanvas`, `AnimatedCanvas`,
`ElementPreview`) are NOT touched — they render the user's design independently.

House rule: **no em-dashes** anywhere (copy OR comments). Use a hyphen, en-dash, or rephrase.

## Palette (Tailwind built-ins — zero config)
- **Brand** = `violet` (violet-600 `#7c3aed` = marketing brand-600). Primary `violet-600`, hover `violet-700`, tint bg `violet-50`, tint text `violet-700`, ring `violet-500`.
- **Ink / neutral** = `zinc`.
- Semantic: success `emerald`, warning `amber`, danger `red`/`rose`, info `sky`.

## Token map (dark class  →  light class)

### Surfaces
| dark | light |
|---|---|
| `bg-[#0c1322]` (page) | `bg-zinc-50` |
| `bg-[#0b1120]` (sidebar) | `bg-white` |
| `bg-[#141d30]` / `bg-white/[0.02]` / `bg-white/[0.03]` (panel/card) | `bg-white` |
| `bg-[#161f33]` (menu) | `bg-white` |
| `bg-[#1b2438]` (toast) | `bg-white` |
| `bg-black/30` (input) | `bg-white` |
| `bg-black/60` (modal scrim) | `bg-zinc-900/40 backdrop-blur-sm` |

### Borders
| dark | light |
|---|---|
| `border-white/10`, `border-white/12`, `border-white/8` | `border-zinc-200` |
| dashed `border-white/10` | `border-zinc-300` |
| `focus:border-indigo-400/60` | `focus:border-violet-400` (+ ring below) |

### Text
| dark | light |
|---|---|
| `text-white` (heading) | `text-zinc-900` |
| `text-white/90`, `/85` | `text-zinc-800` |
| `text-white/70`, `/65` | `text-zinc-600` |
| `text-white/55`, `/50`, `/45`, `/40` | `text-zinc-500` |
| `text-white/35`, `/30`, `/25` (placeholder/tertiary) | `text-zinc-400` |

### Brand accent (indigo → violet)
| dark | light |
|---|---|
| `bg-indigo-500` | `bg-violet-600` |
| `hover:bg-indigo-400` | `hover:bg-violet-700` |
| `text-indigo-300`, `text-indigo-200` | `text-violet-600` (hover `text-violet-700`) |
| `bg-indigo-500/20 text-indigo-200` (badge) | `bg-violet-50 text-violet-700` |
| `bg-indigo-500/5 border-indigo-400/20` (AiPanel) | `bg-violet-50 border-violet-200` |
| `focus-visible:ring-indigo-400/60` | `focus-visible:ring-violet-500` |
| active nav `bg-white/10 text-white` | `bg-violet-50 text-violet-700 font-semibold` |
| idle nav `text-white/60 hover:text-white hover:bg-white/5` | `text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100` |

### Hover surfaces
| dark | light |
|---|---|
| `hover:bg-white/10`, `hover:bg-white/5` | `hover:bg-zinc-100` |

### Semantic
| dark | light |
|---|---|
| `text-red-300` | `text-red-600` |
| `hover:bg-red-500/10` | `hover:bg-red-50` |
| `border-red-500/20` | `border-red-200` |
| success `#4ade80` | `text-emerald-600` |
| warn text `#fde68a` / `#fecf0a` | `text-amber-600` / `bg-amber-50` |
| export button `bg-[#fecf0a] text-[#002C6A]` | `bg-violet-600 text-white` (use the primary brand) |

### Shadows
- Cards/panels: add `shadow-sm shadow-zinc-900/[0.04]`.
- Menus / dialogs / toasts: `shadow-xl shadow-zinc-900/10` (replace `shadow-2xl shadow-black/50`).

### Radius (standardise)
- Buttons → `rounded-full` (marketing signature).
- Inputs/menu-items → `rounded-lg`.
- Cards/panels/dialogs → `rounded-2xl`.  Menu/toast → `rounded-xl`.

### Motion (marketing curve)
- Easing utility: `ease-[cubic-bezier(0.22,1,0.36,1)]`.
- Buttons: `transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]`.
- Interactive cards: `transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md`.
- Entrance (optional, reduced-motion safe): add class `eng-rise` (defined globally in EngineApp).

### Typography (Geist, no serif)
- The engine root sets `font-family: Geist`. Do NOT set font-family per element for UI.
- **Remove every** `style={{ fontFamily: 'Bitter, serif' }}` / `font-serif` on UI headings; replace with `font-bold tracking-tight` (Geist bold is the heading look). Brand/page titles: `font-bold tracking-tight text-zinc-900`.
- Canvas code that sets Inter/Bitter for *rendered artwork* stays as-is.
- Optional flourish: big page/hero titles may use the `eng-gradient` class (violet→sky gradient text) defined in EngineApp.

## Editors (GraphicEditor / AnimatedEditor / FreeformEditor)
- Editor chrome (toolbars, side panels, tabs, inputs) → light per the map.
- The **canvas stage backdrop** becomes a neutral studio surface: `bg-zinc-100` (was dark). Do not touch the artwork drawn on the canvas.

## Buttons — final primitive (already done in ui.tsx, match it)
- primary: `bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-600/20`
- subtle/secondary: `bg-white text-zinc-800 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 hover:ring-zinc-300`
- ghost: `text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100`
- danger: `text-red-600 hover:bg-red-50 ring-1 ring-inset ring-red-200`
- all: `rounded-full ... transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]`
