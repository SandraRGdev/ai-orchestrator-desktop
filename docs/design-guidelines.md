# AI Orchestrator Desktop - Design Guidelines

## Design System

### Color Palette

#### Dark Mode (Primary)
- **Backgrounds**
  - `bg-primary`: #0a0a0a (Main background - almost black)
  - `bg-secondary`: #171717 (Secondary background - dark gray)
  - `bg-tertiary`: #262626 (Tertiary background - lighter gray)
  - `bg-elevated`: #1f1f1f (Elevated surfaces - cards, panels)

- **Text**
  - `text-primary`: #fafafa (Primary text - almost white)
  - `text-secondary`: #a1a1aa (Secondary text - medium gray)
  - `text-tertiary`: #71717a (Tertiary text - lighter gray)
  - `text-muted`: #52525b (Muted text - dim gray)

- **Accent Colors**
  - `accent-primary`: #8b5cf6 (Purple - primary brand color)
  - `accent-primary-hover`: #7c3aed (Purple hover)
  - `accent-secondary`: #3b82f6 (Blue - secondary actions)
  - `accent-success`: #10b981 (Green - success states)
  - `accent-warning`: #f59e0b (Amber - warnings)
  - `accent-error`: #ef4444 (Red - errors)

- **Borders**
  - `border-default`: #27272a (Default borders)
  - `border-subtle`: #1e1e1e (Subtle borders)
  - `border-focus`: #8b5cf6 (Focus rings)

#### Light Mode (Future Support)
- `bg-primary`: #ffffff
- `bg-secondary`: #f4f4f5
- `text-primary`: #18181b
- `text-secondary`: #71717a
- `accent-primary`: #7c3aed

### Typography

#### Font Family
- **Primary**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
- **Monospace**: JetBrains Mono, 'Fira Code', 'Courier New', monospace

#### Type Scale
- **Display**: `text-4xl font-bold` (32px) - Page titles
- **Heading 1**: `text-2xl font-semibold` (24px) - Section titles
- **Heading 2**: `text-xl font-semibold` (20px) - Card titles
- **Heading 3**: `text-lg font-medium` (18px) - Subsection headers
- **Body**: `text-sm` (14px) - Default body text
- **Small**: `text-xs` (12px) - Metadata, captions
- **Tiny**: `text-[10px]` - Labels, badges

#### Line Heights
- Headings: 1.2 (tight)
- Body: 1.5 (readable)
- Code: 1.6 (spacious)

### Spacing Scale

Based on 4px base unit:
- `gap-1`: 4px (tight)
- `gap-2`: 8px (compact)
- `gap-3`: 12px (comfortable)
- `gap-4`: 16px (default)
- `gap-6`: 24px (spacious)
- `gap-8`: 32px (section separation)

### Component Patterns

#### Cards
```tsx
className="bg-elevated rounded-xl border border-border-subtle p-4"
```

#### Buttons
**Primary**: `bg-accent-primary hover:bg-accent-primary-hover text-white font-medium px-4 py-2 rounded-lg transition-colors`
**Secondary**: `bg-tertiary hover:bg-border-default text-text-primary font-medium px-4 py-2 rounded-lg transition-colors`
**Ghost**: `hover:bg-tertiary text-text-secondary hover:text-text-primary px-4 py-2 rounded-lg transition-colors`

#### Inputs
```tsx
className="w-full bg-tertiary border border-border-subtle rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
```

#### Badges
**Default**: `bg-tertiary text-text-secondary text-xs px-2 py-1 rounded-full`
**Accent**: `bg-accent-primary/10 text-accent-primary text-xs px-2 py-1 rounded-full`
**Success**: `bg-accent-success/10 text-accent-success text-xs px-2 py-1 rounded-full`
**Warning**: `bg-accent-warning/10 text-accent-warning text-xs px-2 py-1 rounded-full`
**Error**: `bg-accent-error/10 text-accent-error text-xs px-2 py-1 rounded-full`

#### Sidebar
- Width expanded: `w-64` (256px)
- Width collapsed: `w-16` (64px)
- Active item: `bg-accent-primary/10 text-accent-primary border-r-2 border-accent-primary`
- Hover item: `hover:bg-tertiary`

### Shadows

- **sm**: `shadow-sm` - Subtle elevation for cards
- **md**: `shadow-md` - Dropdowns, popovers
- **lg**: `shadow-lg` - Modals, panels
- **xl**: `shadow-xl` - Toast notifications

### Border Radius

- **sm**: `rounded-sm` - 2px (subtle)
- **md**: `rounded-md` - 6px (default)
- **lg**: `rounded-lg` - 8px (cards)
- **xl**: `rounded-xl` - 12px (prominent cards)
- **2xl**: `rounded-2xl` - 16px (modals)

### Transitions

- **Fast**: `transition-150` - 150ms (hover states)
- **Default**: `transition-200` - 200ms (most interactions)
- **Slow**: `transition-300` - 300ms (layout changes)

**Easing**: `ease-out` (deceleration)

### Interactive States

#### Focus
All interactive elements MUST have visible focus indicators:
```tsx
focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary
```

#### Disabled
```tsx
disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent
```

#### Loading
Show loading spinner or skeleton:
```tsx
<div className="animate-pulse bg-tertiary rounded" />
```

### Accessibility

#### Contrast Requirements (WCAG AA)
- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px): 3:1 minimum
- UI components: 3:1 minimum

#### Touch Targets
- Minimum size: 44x44px for mobile
- Interactive elements must have adequate spacing

#### Keyboard Navigation
- Tab order follows visual hierarchy
- Escape closes modals/dropdowns
- Enter activates focused buttons

### Demo Mode Indicators

**Badge**: `bg-accent-warning/10 text-accent-warning border border-accent-warning/20 text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-2`
**Icon**: Simple dot or badge indicator in header
**Placement**: Top-right corner or inline with relevant info

### Icon System

Use Lucide React icons:
```tsx
import { MessageSquare, Zap, Users, Settings } from 'lucide-react'
```

Size classes:
- `w-4 h-4` - Small (inline)
- `w-5 h-5` - Default (buttons)
- `w-6 h-6` - Large (headers)

### Responsive Breakpoints

- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)
- `2xl`: 1536px (large screens)

### Animation Principles

1. **Purposeful**: Every animation serves a function
2. **Subtle**: Small movements, no distractions
3. **Smooth**: Use 60fps transitions
4. **Respectful**: Honor `prefers-reduced-motion`

### Layout Patterns

#### Sidebar Layout
```tsx
<div className="flex h-screen bg-primary">
  <aside className="w-64 bg-secondary border-r border-border-subtle">
    {/* Sidebar content */}
  </aside>
  <main className="flex-1 overflow-auto">
    {/* Main content */}
  </main>
</div>
```

#### Two-Column Layout
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="bg-elevated rounded-xl p-6">{/* Left */}</div>
  <div className="bg-elevated rounded-xl p-6">{/* Right */}</div>
</div>
```

#### Three-Column Layout
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">{/* Main */}</div>
  <div>{/* Sidebar */}</div>
</div>
```

## Component Examples

### Message Bubble (User)
```tsx
<div className="flex justify-end mb-4">
  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent-primary px-4 py-3 text-primary shadow-sm">
    <p className="text-sm leading-relaxed">Message content</p>
    <span className="text-xs opacity-70 mt-1 block">Metadata</span>
  </div>
</div>
```

### Message Bubble (AI)
```tsx
<div className="flex justify-start mb-4">
  <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-elevated border border-border-subtle px-4 py-3 text-primary shadow-sm">
    <p className="text-sm leading-relaxed">Message content</p>
    <span className="text-xs text-text-secondary mt-1 block">Metadata</span>
  </div>
</div>
```

### Card with Header
```tsx
<div className="bg-elevated rounded-xl border border-border-subtle overflow-hidden">
  <div className="px-6 py-4 border-b border-border-subtle">
    <h3 className="text-lg font-semibold">Card Title</h3>
    <p className="text-xs text-text-secondary mt-1">Description</p>
  </div>
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

### Navigation Item
```tsx
<button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-tertiary text-text-secondary hover:text-text-primary">
  <Icon className="w-5 h-5" />
  <span className="font-medium">Label</span>
</button>
```

## Status Colors

### Provider Status
- **Active**: `bg-accent-success/10 text-accent-success`
- **Inactive**: `bg-tertiary text-text-tertiary`
- **Error**: `bg-accent-error/10 text-accent-error`

### Agent Status
- **Idle**: `bg-tertiary text-text-secondary`
- **Running**: `bg-accent-primary/10 text-accent-primary animate-pulse`
- **Completed**: `bg-accent-success/10 text-accent-success`
- **Failed**: `bg-accent-error/10 text-accent-error`

### Workflow Types
- **Sequential**: `bg-blue-500/10 text-blue-500`
- **Parallel**: `bg-green-500/10 text-green-500`
- **Evaluator**: `bg-purple-500/10 text-purple-500`

## Implementation Notes

### Tailwind Configuration
All colors and spacing should be defined in `tailwind.config.js` as custom theme values for consistency.

### Component Library
Start with base components, then build composite components:
1. Button, Input, Card (primitives)
2. MessageBubble, ProviderCard, AgentCard (domain-specific)
3. ChatInterface, ComparisonView, AgentWorkspace (views)

### Testing Colors
Always test color combinations for contrast:
- Use browser devtools color picker
- Test with real content
- Verify in both light and dark modes
