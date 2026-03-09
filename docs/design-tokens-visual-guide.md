# Design Tokens Visual Guide

## Color Palette

### Background Hierarchy

```
┌─────────────────────────────────────┐
│ Primary (#0a0a0a)                   │ ← Main background
│ ⚫ Darkest - Almost black           │
│ Use: Full-page backgrounds          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Secondary (#171717)                 │ ← Sidebar, panels
│ ⚫ Dark - Zinc 900                   │
│ Use: Navigation, sidebars           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Tertiary (#262626)                  │ ← Inputs, cards
│ ⚫ Medium - Zinc 800                 │
│ Use: Input backgrounds, card bg     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Elevated (#1f1f1f)                  │ ← Cards, modals
│ ⚫ Light - Zinc 900/800 mix          │
│ Use: Cards, panels, modals          │
└─────────────────────────────────────┘
```

### Text Hierarchy

```
text-primary: #fafafa (Zinc 50)
███████████████████████████████
Use: Headlines, important text
Contrast on elevated: 16.5:1 (AAA)

text-secondary: #a1a1aa (Zinc 400)
███████████████████████████████
Use: Body text, descriptions
Contrast on elevated: 4.8:1 (AA)

text-tertiary: #71717a (Zinc 500)
███████████████████████████████
Use: Secondary labels, metadata
Contrast on elevated: 3.1:1 (AAA large)

text-muted: #52525b (Zinc 600)
███████████████████████████████
Use: Disabled text, placeholders
Contrast on elevated: 2.4:1 (AAA large)
```

### Accent Colors

```
Primary (Brand):
┌─────────────────────────────────────┐
│ #8b5cf6 (Violet 500)               │
│ ████████████                        │
│ Use: Primary buttons, links, brand  │
│                                    │
│ Hover: #7c3aed (Violet 600)        │
│ ██████████                         │
└─────────────────────────────────────┘

Secondary:
┌─────────────────────────────────────┐
│ #3b82f6 (Blue 500)                 │
│ ████████████                        │
│ Use: Secondary actions, info        │
└─────────────────────────────────────┘

Success:
┌─────────────────────────────────────┐
│ #10b981 (Emerald 500)              │
│ ████████████                        │
│ Use: Success states, confirmations  │
└─────────────────────────────────────┘

Warning:
┌─────────────────────────────────────┐
│ #f59e0b (Amber 500)                 │
│ ████████████                        │
│ Use: Warnings, demo mode badges     │
└─────────────────────────────────────┘

Error:
┌─────────────────────────────────────┐
│ #ef4444 (Red 500)                   │
│ ████████████                        │
│ Use: Errors, destructive actions    │
└─────────────────────────────────────┘
```

### Border Colors

```
border-default: #27272a (Zinc 800)
███████████████████████████████
Use: Default borders, dividers

border-subtle: #1e1e1e (Zinc 900)
███████████████████████████████
Use: Subtle borders, card borders

border-focus: #8b5cf6 (Violet 500)
███████████████████████████████
Use: Focus rings, active states
```

---

## Typography Scale

### Font Families

```
Primary Font: Inter
┌─────────────────────────────────────┐
│ Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj       │
│ The quick brown fox jumps over      │
│ the lazy dog. 1234567890            │
│                                    │
│ Weights: 400, 500, 600, 700        │
└─────────────────────────────────────┘

Monospace Font: JetBrains Mono
┌─────────────────────────────────────┐
│ const greeting = "Hello World";    │
│ function greet() {                 │
│   console.log(greeting);           │
│ }                                  │
│                                    │
│ Weights: 400, 500                  │
└─────────────────────────────────────┘
```

### Type Scale

```
Display (text-4xl font-bold) - 32px
███████████████████████████████
AI Orchestrator

Heading 1 (text-2xl font-semibold) - 24px
███████████████████████████████
Multi-Agent Workflows

Heading 2 (text-xl font-semibold) - 20px
███████████████████████████████
Provider Configuration

Heading 3 (text-lg font-medium) - 18px
███████████████████████████████
Available Models

Body (text-sm) - 14px
███████████████████████████████
Chat with AI models from OpenAI, Anthropic, and more.

Small (text-xs) - 12px
███████████████████████████████
Version 0.1.0 • 2 results

Tiny (custom text-[10px]) - 10px
███████████████████████████████
LABEL
```

---

## Spacing Scale

```
gap-1: 4px (tight)
┌────┐

gap-2: 8px (compact)
┌────────┐

gap-3: 12px (comfortable)
┌──────────────┐

gap-4: 16px (default)
┌──────────────────────┐

gap-6: 24px (spacious)
┌──────────────────────────────┐

gap-8: 32px (section separation)
┌──────────────────────────────────────┐
```

---

## Border Radius

```
rounded-sm: 2px (subtle)
┌─────────┐

rounded-md: 6px (default)
┌─────────┐

rounded-lg: 8px (cards)
┌─────────┐

rounded-xl: 12px (prominent)
┌─────────┐

rounded-2xl: 16px (modals)
┌─────────┐
```

---

## Shadows

```
shadow-sm: Subtle elevation
┌─────────────┐
│ Card        │ ← Light shadow
└─────────────┘

shadow-md: Medium elevation
┌─────────────┐
│ Dropdown    │ ← Medium shadow
└─────────────┘

shadow-lg: Large elevation
┌─────────────┐
│ Modal       │ ← Large shadow
└─────────────┘

shadow-xl: Extra large elevation
┌─────────────┐
│ Toast       │ ← Extra large shadow
└─────────────┘

Custom: Accent glow
┌─────────────┐
│ Card        │ ← Purple glow shadow
└─────────────┘
shadow-lg shadow-accent-primary/25
```

---

## Component Examples

### Buttons

```
Primary Button:
┌──────────────────────────────┐
│ 🚀 Send Message             │ ← Gradient + icon
└──────────────────────────────┘
bg-accent-primary hover:bg-accent-primary-hover
shadow-lg shadow-accent-primary/25

Secondary Button:
┌──────────────────────────────┐
│ 📋 View Details             │ ← Tertiary background
└──────────────────────────────┘
bg-tertiary hover:bg-border-default

Ghost Button:
┌──────────────────────────────┐
│ ✏️ Edit                     │ ← No background
└──────────────────────────────┘
hover:bg-tertiary text-text-secondary
```

### Inputs

```
Default Input:
┌──────────────────────────────┐
│ Type a message...           │ ← Tertiary bg
└──────────────────────────────┘
bg-tertiary border-border-subtle

Focused Input:
┌──────────────────────────────┐
││ Type a message...          │ ← Purple ring
└──────────────────────────────┘
focus:ring-2 focus:ring-accent-primary/50
```

### Cards

```
Default Card:
┌──────────────────────────────┐
│ 📊 Metric Card              │
│ ────────────────────────────│
│ 1,234 tokens                │
└──────────────────────────────┘
bg-elevated border-border-subtle

Hover Card:
┌──────────────────────────────┐
│ 📊 Metric Card              │ ← Purple border
│ ────────────────────────────│
│ 1,234 tokens                │
└──────────────────────────────┘
hover:border-accent-primary/50
```

### Badges

```
Default Badge:
┌──────────────┐
│ OpenAI       │ ← Tertiary bg
└──────────────┘
bg-tertiary text-text-secondary

Accent Badge:
┌──────────────┐
│ • Selected   │ ← Purple bg
└──────────────┘
bg-accent-primary/10 text-accent-primary

Success Badge:
┌──────────────┐
│ ✓ Complete   │ ← Green bg
└──────────────┘
bg-accent-success/10 text-accent-success

Warning Badge:
┌──────────────┐
│ ⚠️ Demo Mode │ ← Amber bg
└──────────────┘
bg-accent-warning/10 text-accent-warning

Error Badge:
┌──────────────┐
│ ✕ Error     │ ← Red bg
└──────────────┘
bg-accent-error/10 text-accent-error
```

---

## Gradients

```
Brand Gradient:
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
from-accent-primary to-accent-primary-hover

Usage:
- Buttons (primary)
- Icons (brand elements)
- Text highlights
- Avatars

Text Gradient:
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
from-accent-primary to-accent-secondary

Usage:
- Page titles
- Headlines
- Brand text
```

---

## Animation Timings

```
transition-150 (150ms): Fast
├─ Hover states
├─ Focus states
└─ Color changes

transition-200 (200ms): Default
├─ Layout changes
├─ Card interactions
└─ Most transitions

transition-300 (300ms): Slow
├─ Sidebar collapse
├─ Modal open/close
└─ Page transitions
```

---

## Icon Sizes

```
w-4 h-4: Small (16px)
📊 ← Inline icons, buttons

w-5 h-5: Default (20px)
📊 ← Standard icons, navigation

w-6 h-6: Large (24px)
📊 ← Headers, large buttons
```

---

## Color Combinations

### High Contrast (AAA)
```
#fafafa on #1f1f1f (16.5:1)
███████████████████████████████
Primary text on elevated

#8b5cf6 on #ffffff (5.2:1)
███████████████████████████████
Primary buttons
```

### Medium Contrast (AA)
```
#a1a1aa on #1f1f1f (4.8:1)
███████████████████████████████
Secondary text on elevated

#3b82f6 on #ffffff (4.5:1)
███████████████████████████████
Secondary buttons
```

### Large Text (AAA)
```
#71717a on #1f1f1f (3.1:1)
███████████████████████████████
Tertiary text (18px+) on elevated
```

---

## Usage Guidelines

### When to Use Each Background

**Primary (#0a0a0a)**:
- Full-page backgrounds
- App root container
- Deepest layer

**Secondary (#171717)**:
- Sidebar
- Panel backgrounds
- Navigation

**Tertiary (#262626)**:
- Input fields
- Button backgrounds (secondary)
- Hover states

**Elevated (#1f1f1f)**:
- Cards
- Modals
- Dropdowns
- Popovers

### When to Use Each Text Color

**Primary (#fafafa)**:
- Headlines
- Important text
- Labels

**Secondary (#a1a1aa)**:
- Body text
- Descriptions
- Standard content

**Tertiary (#71717a)**:
- Secondary labels
- Metadata
- Timestamps

**Muted (#52525b)**:
- Disabled text
- Placeholders
- Hints

### When to Use Each Accent

**Primary Purple (#8b5cf6)**:
- Brand elements
- Primary CTAs
- Active states
- Links

**Secondary Blue (#3b82f6)**:
- Secondary actions
- Info states
- Neutral CTAs

**Success Green (#10b981)**:
- Success messages
- Completion states
- Positive feedback

**Warning Amber (#f59e0b)**:
- Warnings
- Demo mode
- Caution states

**Error Red (#ef4444)**:
- Errors
- Destructive actions
- Failure states

---

## Quick Reference

### Most Common Classes

```tsx
// Container
<div className="bg-primary text-text-primary">

// Card
<div className="bg-elevated rounded-xl border border-border-subtle p-6">

// Button (primary)
<button className="bg-accent-primary hover:bg-accent-primary-hover text-white px-4 py-2 rounded-xl">

// Input
<input className="bg-tertiary border border-border-subtle rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent-primary/50">

// Text
<h1 className="text-2xl font-semibold">Heading</h1>
<p className="text-sm text-text-secondary">Body text</p>
<span className="text-xs text-text-tertiary">Metadata</span>

// Badge
<span className="bg-tertiary text-text-secondary px-2 py-1 rounded-full text-xs">Badge</span>
```

---

## Contrast Checker

### Valid Combinations ✅

| Foreground | Background | Ratio | Grade |
|------------|------------|-------|-------|
| #fafafa | #1f1f1f | 16.5:1 | AAA |
| #a1a1aa | #1f1f1f | 4.8:1 | AA |
| #8b5cf6 | #ffffff | 5.2:1 | AA |
| #10b981 | #1f1f1f | 4.5:1 | AA |

### Invalid Combinations ❌

| Foreground | Background | Ratio | Grade |
|------------|------------|-------|-------|
| #71717a | #262626 | 2.1:1 | Fail |
| #a1a1aa | #262626 | 2.9:1 | Fail |
| #52525b | #262626 | 1.8:1 | Fail |

**Note**: Always use lighter text on darker backgrounds!

---

This visual guide provides a quick reference for all design tokens. For complete implementation details, see `design-guidelines.md`.
