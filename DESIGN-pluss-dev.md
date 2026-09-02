# Design System Inspired by pluss.dev

> Auto-extracted from `https://www.pluss.dev/` on 2026-09-02

## 1. Visual Theme & Atmosphere

Clean, minimal, and product-focused with deliberate use of whitespace.

The hero section leads with "web solutions with pluss.dev" followed by "Software development, UI/UX, AI automation".

**Key Characteristics:**
- system-ui as the heading font
- system-ui as the body font for all running text
- Heading weight 300, letter-spacing -1.8px
- Light/white background (#ffffff) as the primary canvas
- Primary accent `#2563eb` used for CTAs and brand highlights
- 8 shadow level(s) detected — tinted shadows
- Sharp corners (0-2px) for a precise, technical aesthetic
- Tags: light, sharp, accented, bold-typography, sans-serif

## 2. Color Palette & Roles

### Primary
- **Primary Accent** (`#2563eb`) · `--color-primary`: Brand color, CTA backgrounds, link text, interactive highlights.
- **Background** (`#ffffff`) · `--color-bg`: Page background, primary canvas.
- **Background Secondary** (`#f3f4f6`) · `--color-bg-secondary`: Cards, surfaces, alternating sections.

### Text
- **Text Primary** (`#020817`) · `--color-text`: Headings and body text.
- **Text Secondary** (`#374151`) · `--color-text-secondary`: Muted text, captions, placeholders.

### Borders & Surfaces
- **Border** (`#f3f4f6`) · `--color-border`: Dividers, outlines, input borders.

### Full Extracted Palette

| # | Hex | CSS Variable | Role | Area | Contrast |
|---|---|---|---|---|---|
| 1 | `#ffffff` | `--palette-1` | button | large | text-dark |
| 2 | `#f3f4f6` | `--palette-2` | section | large | text-dark |
| 3 | `#000000` | `--palette-3` | badge | medium | text-light |
| 4 | `#2563eb` | `--palette-4` | text-accent | small | text-light |
| 5 | `#374151` | `--palette-5` | text-accent | small | text-light |
| 6 | `#e5e7eb` | `--palette-6` | badge | small | text-dark |

## 3. Typography Rules

- **Heading Font:** `system-ui`, sans-serif
- **Body Font:** `system-ui`, sans-serif

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| H1 | system-ui | 72px | 300 | 72px | -1.8px |
| H2 | system-ui | 60px | 300 | 60px | -1.5px |
| H3 | system-ui | 30px | 300 | 36px | -0.75px |
| Body | system-ui | 20px | 400 | 28px | normal |
| Small | system-ui | 14px | 500 | 20px | normal |

### Type Scale

| Token | Size | Suggested Usage |
|---|---|---|
| Display | `72px` | headings |
| H1 | `60px` | headings |
| H2 | `48px` | headings |
| H3 | `36px` | headings |
| H4 | `30px` | headings |
| Body L | `24px` | body / supporting text |
| Body | `20px` | body / supporting text |
| Small | `18px` | body / supporting text |
| XS | `16px` | body / supporting text |
| Caption | `15px` | body / supporting text |

## 4. Component Stylings

### Primary Button

```css
.btn-primary {
  background: #000000;
  color: #ffffff;
  border-radius: 0px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}
```

### Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: #020817;
  border-radius: 0px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}
```

### Outline Button

```css
.btn-outline {
  background: transparent;
  color: #374151;
  border-radius: 0px;
  padding: 0px 24px;
  font-size: 14px;
  font-weight: 400;
  border: 0.8px solid rgb(229, 231, 235);
  cursor: pointer;
}
```

### Outline Button 2

```css
.btn-outline-2 {
  background: transparent;
  color: #000000;
  border-radius: 0px;
  padding: 24px 32px;
  font-size: 14px;
  font-weight: 500;
  border: 0.8px solid rgb(0, 0, 0);
  cursor: pointer;
}
```

### Outline Button 3

```css
.btn-outline-3 {
  background: transparent;
  color: #020817;
  border-radius: 0px;
  padding: 0px 0px;
  font-size: 16px;
  font-weight: 400;
  border: 0.8px solid rgb(229, 231, 235);
  cursor: pointer;
}
```

### Pill Button

```css
.btn-pill {
  background: #2563eb;
  color: #f8fafc;
  border-radius: 9999px;
  padding: 0px 0px;
  font-size: 14px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Card

```css
.card {
  background: #ffffff;
  border-radius: 0px;
  padding: 0px;
  box-shadow: rgba(0, 0, 0, 0.08) 0px 4px 24px -4px;
}
```

## 5. Layout Principles

- **Base spacing unit:** `6px` — use multiples (12px, 18px, 24px, etc.)

### Spacing Scale (extracted from real elements)

| Token | Value | Role |
|---|---|---|
| spacing-1 | `6px` | element |
| spacing-2 | `4px` | element |
| spacing-3 | `24px` | card |
| spacing-4 | `48px` | card |
| spacing-5 | `20px` | element |
| spacing-6 | `128px` | section |
| spacing-7 | `16px` | element |
| spacing-8 | `28px` | card |

### Border Radius Scale

| Token | Value | Element |
|---|---|---|

## 6. Depth & Elevation

| Level | Shadow | Usage |
|---|---|---|
| High | `rgba(0, 0, 0, 0.08) 0px 4px 24px -4px` | Modals, floating elements |
| Low | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0...` | Cards, subtle elevation |
| Low | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0...` | Cards, subtle elevation |
| Low | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0...` | Cards, subtle elevation |
| Low | `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px` | Cards, subtle elevation |


## 7. Do's and Don'ts

### Do
- Use `#ffffff` as the primary background color
- Use `system-ui` for all headings and `system-ui` for body text
- Use `#2563eb` as the single dominant accent/CTA color
- Maintain `6px` as the base spacing unit — all gaps should be multiples
- Keep corners sharp (0-2px radius) for a precise, technical feel
- Make headlines large and bold — typography is the hero element
- Apply the shadow system for elevation — use the extracted shadow values
- Use weight 300 for headings to match the brand's typographic voice

### Don't
- Don't use colors outside the extracted palette without justification
- Don't substitute system-ui/system-ui with generic alternatives
- Don't use irregular spacing — stick to 6px grid
- Don't use dark/black backgrounds — this is a light-themed design
- Don't use large border-radius — keep everything crisp and geometric
- Don't use pure black (#000000) for text — use `#020817` instead
- Don't add decorative elements not present in the original design — no badges, ribbons, banners, or ornaments unless the source site uses them
- Don't invent UI patterns the source site doesn't have — if the original has no NEW badge, don't add one just because a red is in the palette

## 8. Responsive Behavior

| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | < 640px | Single column, stack sections, reduce font sizes ~80% |
| Tablet | 640–1024px | 2-column where appropriate, maintain spacing ratios |
| Desktop | 1024–1440px | Full layout as designed |
| Wide | > 1440px | Max-width container, center content |

- Touch targets: minimum 44×44px on mobile
- Maintain 6px base unit across breakpoints — only scale multipliers

## 9. Agent Prompt Guide

### Quick Color Reference

```
Background:  #ffffff
Text:        #020817
Accent:      #2563eb
Border:      #f3f4f6
```

### Example Prompts

1. "Build a hero section with a `#ffffff` background, `system-ui` heading in `#020817`, and a `#2563eb` CTA button with 0px radius."
2. "Create a pricing card using background `#f3f4f6`, border `#f3f4f6`, `system-ui` for text, and 18px padding."
3. "Design a navigation bar — `#ffffff` background, `#020817` links, `#2563eb` for active state."
4. "Build a feature grid with 3 columns, 18px gap, each card using the card component style."
5. "Create a footer with `#020817` background, `#ffffff` text, and 12px padding."

### Iteration Guide

1. Start with layout structure (sections, grid, spacing)
2. Apply colors from the palette — background first, then text, then accents
3. Set typography — font families, sizes from the type scale, weights
4. Add components — buttons, cards, inputs using the specs above
5. Apply border-radius consistently across all elements
6. Add shadows for depth — use the extracted shadow values, not defaults
7. Check responsive behavior — test mobile and tablet layouts
8. Final pass — verify all colors match, spacing is consistent, fonts are correct

## 10. CSS Custom Properties

> 22 custom properties extracted from `:root` / `html` stylesheets.

### Spacing Variables

| Variable | Value |
|---|---|
| `--radius` | `0rem` |
| `--visit-bubble-inset` | `1.5rem` |
| `--visit-bubble-size` | `3.5rem` |

### Other Variables

| Variable | Value |
|---|---|
| `--background` | `0 0% 100%` |
| `--foreground` | `222.2 84% 4.9%` |
| `--card` | `0 0% 100%` |
| `--card-foreground` | `222.2 84% 4.9%` |
| `--popover` | `0 0% 100%` |
| `--popover-foreground` | `222.2 84% 4.9%` |
| `--primary` | `221.2 83.2% 53.3%` |
| `--primary-foreground` | `210 40% 98%` |
| `--secondary` | `210 40% 96%` |
| `--secondary-foreground` | `222.2 84% 4.9%` |
| `--muted` | `210 40% 96%` |
| `--muted-foreground` | `215.4 16.3% 46.9%` |
| `--accent` | `210 40% 96%` |
| `--accent-foreground` | `222.2 84% 4.9%` |
| `--destructive` | `0 84.2% 60.2%` |
| ... | *(4 more)* |
