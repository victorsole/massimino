# Massimino Aesthetics Manual

> A comprehensive guide to the visual design system, styling patterns, and aesthetic principles of the Massimino fitness platform.

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Component Design](#component-design)
5. [Layout Patterns](#layout-patterns)
6. [Spacing & Grid](#spacing--grid)
7. [Interactive States](#interactive-states)
8. [Animations & Transitions](#animations--transitions)
9. [Icons & Imagery](#icons--imagery)
10. [Responsive Design](#responsive-design)
11. [Accessibility](#accessibility)
12. [Implementation Guidelines](#implementation-guidelines)

---

## Brand Identity

### Core Values
Massimino's design philosophy centers on three pillars:
- **Safety First**: Visual cues that emphasize security and trust
- **Professional Excellence**: Clean, modern aesthetics that convey expertise
- **Community Warmth**: Approachable design that feels welcoming

### Brand Colors

#### Primary Brand Palette
```css
/* Deep Blue - Primary brand color */
--brand-primary: #254967

/* Primary Variants */
--brand-primary-light: #3a5a7a
--brand-primary-dark: #1a3a52

/* Warm Cream - Secondary brand color */
--brand-secondary: #fcf8f2
--brand-secondary-dark: #f5f0e8
```

**Usage Guidelines:**
- **Primary Blue** (`#254967`): Use for headers, navigation, primary buttons, and key branding elements
- **Warm Cream** (`#fcf8f2`): Use for backgrounds, secondary buttons, and creating warm contrast against the blue
- Reserve primary colors for branding moments - don't overuse them to maintain impact

### Logo Usage
- Logo file: `/public/massimino_logo.png`
- Standard display size: 40×40px (navigation), 96×96px (hero sections)
- Always maintain aspect ratio
- Provide adequate breathing space around the logo (minimum 12px padding)

### Tagline
**"Safe Workouts for Everyone"**
- Display with logo in hero sections
- Use `text-xs` or `text-sm` classes
- Color: `text-brand-primary-light`

---

## Color System

### Semantic Color System

The platform uses a comprehensive HSL-based color system for flexibility and theme support.

#### Base Tokens (Light Mode)
```css
--background: 0 0% 100%           /* Pure white */
--foreground: 222.2 84% 4.9%      /* Near black */
--card: 0 0% 100%                 /* White */
--card-foreground: 222.2 84% 4.9% /* Near black */
--primary: 221.2 83.2% 53.3%      /* Blue */
--primary-foreground: 210 40% 98% /* Off-white */
--secondary: 210 40% 96%          /* Light gray-blue */
--muted: 210 40% 96%              /* Subtle gray */
--muted-foreground: 215.4 16.3% 46.9% /* Medium gray */
--border: 214.3 31.8% 91.4%       /* Light border */
--ring: 221.2 83.2% 53.3%         /* Focus ring - matches primary */
--radius: 0.5rem                  /* 8px default border radius */
```

#### Dark Mode Support
```css
.dark {
  --background: 222.2 84% 4.9%
  --foreground: 210 40% 98%
  --card: 222.2 84% 4.9%
  /* ... full dark mode palette defined in globals.css */
}
```

### Contextual Color Palettes

#### Safety Indicators
```css
/* Safety-specific colors for content moderation */
.safety-green: #10b981   /* Safe content - green-500 */
.safety-yellow: #f59e0b  /* Flagged for review - yellow-500 */
.safety-red: #ef4444     /* Blocked content - red-500 */
.safety-blue: #3b82f6    /* Trainer verified - blue-500 */
```

**Usage:**
- Apply to badges, status indicators, and moderation UI
- Use with corresponding text colors for accessibility
- Pair with border styles for emphasis

#### Fitness Category Colors
```css
/* Activity-specific semantic colors */
.fitness-muscle: #e11d48    /* Strength training - rose-600 */
.fitness-cardio: #06b6d4    /* Cardio activities - cyan-500 */
.fitness-flexibility: #8b5cf6 /* Yoga/stretching - violet-500 */
.fitness-nutrition: #84cc16  /* Diet/nutrition - lime-500 */
```

#### User Role Colors
```css
/* Role identification */
.role-client: #64748b   /* slate-500 */
.role-trainer: #2563eb  /* blue-600 */
.role-admin: #7c3aed    /* violet-600 */
```

### Color Application Classes

#### Pre-built Gradient Backgrounds
```css
.massimino-gradient {
  @apply bg-gradient-to-br from-brand-secondary to-brand-secondary-dark;
}

.safety-gradient {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.trainer-badge {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
}
```

---

## Typography

### Font Families

#### Primary Font: Inter
```css
font-family: 'Inter', system-ui, sans-serif;
```
- Used for all body text, UI elements, and headings
- Provides excellent readability across all sizes
- Variable font support for flexible weights

#### Monospace Font: JetBrains Mono
```css
font-family: 'JetBrains Mono', monospace;
```
- Used for code snippets, technical data, and numerical displays
- Applied to tabular data for alignment

### Type Scale

#### Headings
```html
<!-- Page Titles -->
<h1 class="text-3xl font-bold text-brand-primary mb-2">
  Welcome back, Victor!
</h1>

<!-- Section Headings -->
<h2 class="text-2xl font-bold text-brand-primary mb-4">
  Trainer Business Overview
</h2>

<!-- Card Titles -->
<h3 class="text-2xl font-semibold leading-none tracking-tight">
  Your Profile
</h3>

<!-- Subsection Headings -->
<h4 class="text-xl font-semibold text-gray-900">
  Connect
</h4>
```

#### Body Text
```html
<!-- Large body text -->
<p class="text-lg text-gray-600">
  Ready to continue your fitness journey?
</p>

<!-- Standard body text -->
<p class="text-base text-gray-700">
  Standard paragraph content
</p>

<!-- Small text -->
<p class="text-sm text-gray-600">
  Supporting details and metadata
</p>

<!-- Extra small text -->
<p class="text-xs text-gray-500">
  Captions and fine print
</p>
```

#### Text Colors
- **Primary content**: `text-gray-900` (dark mode: `text-gray-50`)
- **Secondary content**: `text-gray-700` (dark mode: `text-gray-300`)
- **Muted content**: `text-gray-600` (dark mode: `text-gray-400`)
- **Metadata**: `text-gray-500` (dark mode: `text-gray-500`)
- **Brand emphasis**: `text-brand-primary`
- **Links**: `text-primary hover:underline`

### Font Weights
- **Regular (400)**: Body text, descriptions
- **Medium (500)**: Emphasized text, labels
- **Semibold (600)**: Subheadings, important labels
- **Bold (700)**: Headings, primary emphasis

---

## Component Design

### Buttons

#### Button Variants

**Primary Button**
```html
<Button className="bg-brand-primary hover:bg-brand-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors">
  Sign Up
</Button>
```

**Secondary Button**
```html
<Button className="bg-brand-secondary hover:bg-brand-secondary-dark text-brand-primary font-medium py-2 px-4 rounded-lg border border-brand-primary">
  Learn More
</Button>
```

**Outline Button**
```html
<Button variant="outline" className="border border-brand-primary hover:bg-brand-secondary text-brand-primary">
  Browse
</Button>
```

**Ghost Button**
```html
<Button variant="ghost" className="hover:bg-accent hover:text-accent-foreground">
  Cancel
</Button>
```

**Destructive Button**
```html
<Button variant="destructive" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Delete
</Button>
```

#### Button Sizes
```html
<!-- Small -->
<Button size="sm" className="h-9 rounded-md px-3">Small</Button>

<!-- Default -->
<Button size="default" className="h-10 px-4 py-2">Default</Button>

<!-- Large -->
<Button size="lg" className="h-11 rounded-md px-8">Large</Button>

<!-- Icon Only -->
<Button size="icon" className="h-10 w-10">
  <Icon />
</Button>
```

### Cards

#### Standard Card
```html
<Card class="rounded-lg border bg-card text-card-foreground shadow-sm">
  <CardHeader class="flex flex-col space-y-1.5 p-6">
    <CardTitle class="text-2xl font-semibold leading-none tracking-tight">
      Card Title
    </CardTitle>
    <CardDescription class="text-sm text-muted-foreground">
      Supporting description text
    </CardDescription>
  </CardHeader>
  <CardContent class="p-6 pt-0">
    <!-- Card content -->
  </CardContent>
  <CardFooter class="flex items-center p-6 pt-0">
    <!-- Footer actions -->
  </CardFooter>
</Card>
```

#### Elevated Card (Interactive)
```css
.card-elevated {
  @apply bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300;
}
```

#### Interactive Card
```css
.card-interactive {
  @apply bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer;
}
```

### Badges

#### Badge Variants
```html
<!-- Default -->
<Badge class="bg-primary text-primary-foreground">Default</Badge>

<!-- Secondary -->
<Badge variant="secondary" class="bg-secondary text-secondary-foreground">
  Secondary
</Badge>

<!-- Outline -->
<Badge variant="outline">Outline</Badge>

<!-- Destructive -->
<Badge variant="destructive" class="bg-destructive text-destructive-foreground">
  Error
</Badge>
```

#### Contextual Badges
```css
/* Pre-built badge styles */
.massimino-badge-primary { @apply bg-brand-primary text-white; }
.massimino-badge-success { @apply bg-green-100 text-green-800; }
.massimino-badge-warning { @apply bg-yellow-100 text-yellow-800; }
.massimino-badge-danger { @apply bg-red-100 text-red-800; }
```

#### Safety Indicators
```html
<span class="safety-indicator safe">
  Safe Content
</span>

<span class="safety-indicator warning">
  Review Required
</span>

<span class="safety-indicator danger">
  Blocked
</span>
```

### Form Elements

#### Input Fields
```html
<Input
  type="text"
  placeholder="Enter text..."
  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
/>
```

**Custom Massimino Input**
```css
.massimino-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent;
}
```

#### Form Labels
```css
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}
```

### Dialogs & Modals

```html
<Dialog>
  <DialogContent class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
    <DialogHeader>
      <DialogTitle class="text-lg font-semibold">Dialog Title</DialogTitle>
      <DialogDescription class="text-sm text-muted-foreground">
        Description text
      </DialogDescription>
    </DialogHeader>
    <!-- Dialog content -->
    <DialogFooter class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
      <!-- Footer actions -->
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Layout Patterns

### Container Widths

#### Max-Width Containers
```html
<!-- Standard page container -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <!-- Content -->
</div>

<!-- Narrow content container -->
<div class="max-w-2xl mx-auto px-4">
  <!-- Content -->
</div>

<!-- Wide content container -->
<div class="max-w-screen-2xl mx-auto px-4">
  <!-- Content -->
</div>
```

**Available max-widths:**
- `max-w-sm` (384px): Small modals, tooltips
- `max-w-md` (448px): Forms, narrow content
- `max-w-lg` (512px): Dialogs, single-column layouts
- `max-w-2xl` (672px): Blog posts, articles
- `max-w-4xl` (896px): Dashboard sections
- `max-w-5xl` (1024px): Special sections like rest timer bar
- `max-w-7xl` (1280px): Standard page width
- `max-w-screen-2xl` (1536px): Full-width layouts

### Grid Layouts

#### Responsive Grid Patterns
```html
<!-- Auto-fit grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- Grid items -->
</div>

<!-- Stats grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <Card><!-- Stat card --></Card>
</div>

<!-- Feature grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  <!-- Feature cards -->
</div>
```

### Section Layouts

#### Hero Section
```html
<section class="relative py-20 overflow-hidden">
  <!-- Background layer -->
  <div class="absolute inset-0 z-0">
    <!-- Background content (video, image, gradient) -->
  </div>

  <!-- Content layer -->
  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Hero content -->
  </div>
</section>
```

#### Standard Section
```html
<section class="py-20 bg-brand-secondary">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Section heading -->
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">
        Section Title
      </h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Section description
      </p>
    </div>

    <!-- Section content -->
  </div>
</section>
```

### Header Navigation
```html
<header class="bg-brand-secondary shadow-sm border-b border-brand-primary-dark">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <!-- Logo and brand -->
      </div>

      <!-- Desktop navigation -->
      <nav class="hidden md:flex items-center space-x-2">
        <!-- Nav items -->
      </nav>

      <!-- User actions -->
      <div class="flex items-center space-x-4">
        <!-- User menu, notifications, etc. -->
      </div>
    </div>
  </div>
</header>
```

---

## Spacing & Grid

### Spacing Scale

Massimino uses Tailwind's default spacing scale with custom additions:

```css
/* Standard spacing (Tailwind defaults) */
spacing: {
  0: '0px',
  1: '0.25rem',   /* 4px */
  2: '0.5rem',    /* 8px */
  3: '0.75rem',   /* 12px */
  4: '1rem',      /* 16px */
  5: '1.25rem',   /* 20px */
  6: '1.5rem',    /* 24px */
  8: '2rem',      /* 32px */
  10: '2.5rem',   /* 40px */
  12: '3rem',     /* 48px */
  16: '4rem',     /* 64px */
  20: '5rem',     /* 80px */
  24: '6rem',     /* 96px */
  /* ... continues */
}

/* Custom spacing additions */
18: '4.5rem',  /* 72px */
88: '22rem',   /* 352px */
```

### Padding Patterns

#### Component Padding
```html
<!-- Card padding -->
<CardHeader class="p-6">
<CardContent class="p-6 pt-0">

<!-- Section padding -->
<section class="py-20">  <!-- Vertical -->
<section class="px-4 sm:px-6 lg:px-8">  <!-- Horizontal -->
```

#### Responsive Padding Utilities
```css
.mobile-padding { @apply px-4; }        /* < 640px */
.tablet-padding { @apply px-6; }        /* 641-1024px */
.desktop-padding { @apply px-8; }       /* > 1025px */
```

### Gap Spacing
```html
<!-- Grid gaps -->
<div class="grid gap-4">    <!-- 16px -->
<div class="grid gap-6">    <!-- 24px -->
<div class="grid gap-8">    <!-- 32px -->

<!-- Flex gaps -->
<div class="flex gap-2">    <!-- 8px -->
<div class="flex gap-3">    <!-- 12px -->
<div class="flex gap-4">    <!-- 16px -->
```

### Border Radius

```css
/* Defined in tailwind.config.js */
borderRadius: {
  sm: 'calc(var(--radius) - 4px)',  /* 4px */
  md: 'calc(var(--radius) - 2px)',  /* 6px */
  lg: 'var(--radius)',               /* 8px */
  xl: '12px',
  '2xl': '16px',
  full: '9999px'
}
```

**Common applications:**
- Buttons: `rounded-lg` (8px)
- Cards: `rounded-lg` or `rounded-xl` (8px or 12px)
- Inputs: `rounded-md` (6px)
- Badges: `rounded-full`
- Images: `rounded-full` (avatars) or `rounded-lg` (thumbnails)

---

## Interactive States

### Hover Effects

#### Scale Transforms
```html
<!-- Icon buttons -->
<Link class="p-2 rounded-lg hover:scale-110 active:scale-95 transition-all duration-200">
  <Icon />
</Link>

<!-- Cards -->
<Card class="hover:shadow-lg transition-shadow cursor-pointer">
```

#### Background Transitions
```html
<!-- Navigation items -->
<Link class="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200">
```

### Focus States

#### Focus Ring
```css
/* Standard focus ring */
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2

/* Custom brand focus */
focus:ring-2
focus:ring-brand-primary
focus:border-transparent
```

### Active States
```html
<!-- Button active state -->
<Button class="active:scale-95">

<!-- Link active state -->
<Link class="active:scale-95 transition-transform">
```

### Disabled States
```css
/* Automatic disabled styling */
disabled:pointer-events-none
disabled:opacity-50
```

---

## Animations & Transitions

### Keyframe Animations

#### Safety-Specific Animations
```css
/* Safety pulse - for attention-grabbing elements */
@keyframes safety-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}
animation: safety-pulse 2s ease-in-out infinite;

/* Warning shake - for errors */
@keyframes warning-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}
animation: warning-shake 0.5s ease-in-out;

/* Success bounce - for confirmations */
@keyframes success-bounce {
  0%, 100% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-4px);
    opacity: 0.8;
  }
}
animation: success-bounce 0.6s ease-out;
```

#### UI Animations
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in { animation: fadeIn 0.5s ease-in-out; }

/* Slide up */
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.animate-slide-up { animation: slideUp 0.3s ease-out; }

/* Bounce in */
@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.animate-bounce-in { animation: bounceIn 0.6s ease-out; }
```

### Transition Classes

#### Standard Transitions
```html
<!-- All properties -->
<div class="transition-all duration-200">

<!-- Specific properties -->
<div class="transition-colors duration-200">
<div class="transition-shadow duration-300">
<div class="transition-transform duration-200">

<!-- Timing functions -->
<div class="transition-all duration-200 ease-out">
<div class="transition-all duration-300 ease-in-out">
```

### Loading States

#### Spinner
```html
<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
```

#### Skeleton Loaders
```html
<div class="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
```

---

## Icons & Imagery

### Icon Library: Lucide Icons

Massimino primarily uses Lucide Icons for UI elements:

```typescript
import {
  User,
  Dumbbell,
  Calendar,
  TrendingUp,
  Shield,
  Heart,
  Settings,
  LogOut
} from 'lucide-react';
```

**Common icons:**
- User/Profile: `User`
- Workouts: `Dumbbell`
- Schedule: `Calendar`
- Statistics: `TrendingUp`, `Activity`, `LineChart`
- Actions: `Plus`, `Edit`, `Trash2`, `Search`
- Navigation: `Menu`, `X`, `ChevronLeft`, `ChevronRight`, `ArrowRight`
- Status: `CheckCircle`, `AlertCircle`, `Info`
- Social: `Heart`, `Star`, `MessageCircle`

### Custom MDI Icons

Material Design Icons are used for specific fitness-related icons:

```typescript
const MDI_ICONS = {
  viewDashboard: 'M19,5V7H15V5H19M9,5V11H5V5H9...',
  dumbbell: 'M20.57,14.86L22,13.43L20.57,12...',
  clipboardCheck: 'M19,3H14.82C14.4,1.84...',
  accountGroup: 'M12,5A3.5,3.5 0 0,0 8.5...',
  compass: 'M7,17L10.2,10.2L17,7L13.8...',
  runFast: 'M16.5,5.5A2,2 0 0,0 18.5...',
  handshake: 'M21.71 8.71C22.96 7.46...'
};
```

### Icon Sizing
```html
<!-- Standard sizes -->
<Icon className="h-4 w-4" />   <!-- 16px -->
<Icon className="h-5 w-5" />   <!-- 20px -->
<Icon className="h-6 w-6" />   <!-- 24px -->
<Icon className="h-8 w-8" />   <!-- 32px -->
<Icon className="h-12 w-12" /> <!-- 48px -->
```

### Image Handling

#### Avatar Images
```html
<Image
  src={user.image}
  alt={user.name}
  width={32}
  height={32}
  className="rounded-full"
  referrerPolicy="no-referrer"
/>
```

#### Logo Images
```html
<div class="relative w-10 h-10">
  <Image
    src="/massimino_logo.png"
    alt="Massimino Logo"
    fill
    sizes="40px"
    className="object-contain"
  />
</div>
```

#### Background Images
- Located in `/public/images/background/`
- Categories: cityscapes (paris.jpg, athens.jpg, london.jpg), equipment (kettlebells.jpg), maps
- Used with opacity overlays: `opacity-60`
- Paired with gradient overlays for text readability

---

## Responsive Design

### Breakpoint System

```css
/* Tailwind breakpoints */
sm: '640px'   /* Small devices */
md: '768px'   /* Medium devices */
lg: '1024px'  /* Large devices */
xl: '1280px'  /* Extra large devices */
2xl: '1536px' /* 2X large devices */

/* Custom container */
container: {
  center: true,
  padding: '2rem',
  screens: {
    '2xl': '1400px'
  }
}
```

### Mobile-First Approach

#### Responsive Utilities
```html
<!-- Show/hide by breakpoint -->
<div class="block md:hidden">Mobile only</div>
<div class="hidden md:block">Desktop only</div>

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

<!-- Responsive flex -->
<div class="flex flex-col sm:flex-row">

<!-- Responsive padding -->
<div class="px-4 sm:px-6 lg:px-8">

<!-- Responsive text -->
<h1 class="text-2xl sm:text-3xl lg:text-5xl">
```

### Navigation Patterns

#### Mobile Menu
```html
<!-- Mobile menu toggle -->
<Button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
</Button>

<!-- Mobile menu panel -->
{isMenuOpen && (
  <div class="md:hidden border-t">
    <!-- Mobile navigation items -->
  </div>
)}

<!-- Desktop navigation -->
<nav class="hidden md:flex items-center space-x-2">
  <!-- Desktop navigation items -->
</nav>
```

### Responsive Typography
```html
<!-- Responsive headings -->
<h1 class="text-3xl sm:text-4xl lg:text-5xl">

<!-- Responsive body text -->
<p class="text-sm sm:text-base lg:text-lg">
```

### Touch Targets

Ensure minimum touch target sizes for mobile:
```html
<!-- Minimum 44×44px for interactive elements -->
<Button size="default" class="h-10 min-w-[44px]">

<!-- Icon buttons -->
<Button size="icon" class="h-10 w-10">
```

---

## Accessibility

### Color Contrast

All color combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text):

#### High Contrast Pairings
- `text-brand-primary` on `bg-brand-secondary`
- `text-white` on `bg-brand-primary`
- `text-gray-900` on `bg-white`
- `text-gray-50` on `bg-gray-900` (dark mode)

#### Safety Colors with Text
```html
<!-- Green (safe) -->
<div class="bg-green-100 text-green-800">

<!-- Yellow (warning) -->
<div class="bg-yellow-100 text-yellow-800">

<!-- Red (danger) -->
<div class="bg-red-100 text-red-800">
```

### Focus Indicators

All interactive elements have visible focus states:
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

### Semantic HTML

Use proper semantic elements:
```html
<!-- Navigation -->
<nav>
<header>
<main>
<footer>

<!-- Sectioning -->
<section>
<article>
<aside>

<!-- Text -->
<h1>-<h6>
<p>
<ul>, <ol>, <li>
```

### Screen Reader Support

```html
<!-- Hidden labels -->
<span class="sr-only">Screen reader only text</span>

<!-- ARIA labels -->
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

<!-- ARIA live regions for dynamic content -->
<div role="status" aria-live="polite" aria-atomic="true">
  Loading...
</div>
```

### Keyboard Navigation

Ensure logical tab order and keyboard support:
- All interactive elements are keyboard accessible
- Custom components handle `Enter` and `Space` for activation
- Modals trap focus and restore on close
- Skip links for main content

---

## Implementation Guidelines

### Component Composition

#### Building New Components

1. **Start with shadcn/ui base components**
   ```bash
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add card
   ```

2. **Extend with Massimino utilities**
   ```html
   <Card class="massimino-card">
     <Button class="massimino-button-primary">
   ```

3. **Follow naming conventions**
   - Component files: `PascalCase.tsx`
   - Utility classes: `kebab-case`
   - CSS variables: `--kebab-case`

#### Theming Pattern

Use CSS variables for dynamic theming:
```tsx
// In your component
<div className="bg-background text-foreground">
  <Card className="bg-card text-card-foreground">
    <!-- Content -->
  </Card>
</div>
```

### Style Organization

#### File Structure
```
src/
   app/
      globals.css          # Global styles, CSS variables
      [routes]/
          page.tsx          # Route components
   components/
      ui/                   # Base UI components (shadcn/ui)
         button.tsx
         card.tsx
         ...
      [feature]/            # Feature-specific components
   lib/
       animations/
           variants.ts        # Framer Motion variants
```

#### Tailwind Configuration
Located at `tailwind.config.js`:
- Extend the theme with brand colors
- Add custom utilities for safety features
- Define custom animations
- Configure plugins (e.g., `tailwindcss-animate`)

### Utility-First Approach

**Prefer Tailwind utilities over custom CSS:**
```html
<!-- Good -->
<div class="flex items-center gap-4 p-6 rounded-lg bg-white shadow-sm">

<!-- Avoid -->
<div class="custom-container">
<style>
.custom-container {
  display: flex;
  align-items: center;
  /* ... */
}
</style>
```

**When to create utility classes:**
- Repeated complex combinations (e.g., `.massimino-card`)
- Brand-specific patterns (e.g., `.massimino-button-primary`)
- Special effects (e.g., `.safety-gradient`)

### Animation Guidelines

#### Use Framer Motion for Complex Animations
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

#### Use CSS for Simple Transitions
```html
<div class="transition-all duration-200 hover:scale-105">
```

### Performance Considerations

1. **Optimize images**
   - Use Next.js `<Image>` component
   - Specify `width`, `height`, and `sizes`
   - Use `loading="lazy"` for below-fold images

2. **Minimize CSS**
   - Remove unused Tailwind classes with PurgeCSS (automatic)
   - Avoid inline styles when utilities are available

3. **Reduce animation complexity**
   - Limit simultaneous animations
   - Use `transform` and `opacity` for best performance
   - Avoid animating `width`, `height`, `top`, `left`

### Dark Mode Support

Implement dark mode using the `dark:` variant:
```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50">
```

Enable dark mode with:
```tsx
// In root layout or theme provider
<html lang="en" className="dark">
```

### Consistency Checklist

When creating new UI elements, ensure:
- [ ] Colors use CSS variables or brand tokens
- [ ] Typography follows the type scale
- [ ] Spacing uses the spacing scale (no magic numbers)
- [ ] Interactive elements have hover/focus states
- [ ] Mobile-responsive (test on sm/md/lg breakpoints)
- [ ] Accessible (keyboard navigation, ARIA labels, color contrast)
- [ ] Animations are subtle and performant
- [ ] Icons are appropriately sized (h-4/h-5/h-6)

---

## Code Examples

### Complete Component Example

Here's a complete example combining all aesthetic principles:

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, TrendingUp } from 'lucide-react';

export function WorkoutStatsCard() {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl">This Week</CardTitle>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-800">
            +12%
          </Badge>
        </div>
        <CardDescription className="mt-2">
          Your workout performance this week
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Workouts</span>
              <span className="text-2xl font-bold text-gray-900">8</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                style={{ width: '80%' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>Trending up from last week</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full bg-brand-primary hover:bg-brand-primary-dark"
          size="sm"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Safety Indicator Component

```tsx
interface SafetyBadgeProps {
  status: 'safe' | 'warning' | 'danger';
  label: string;
}

export function SafetyBadge({ status, label }: SafetyBadgeProps) {
  const variants = {
    safe: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 animate-safety-pulse',
    danger: 'bg-red-100 text-red-800 border-red-200 animate-warning-shake'
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
        variants[status]
      )}
    >
      {label}
    </Badge>
  );
}
```

---

## Summary & Quick Reference

### Core Principles
1. **Consistency**: Use established patterns and components
2. **Accessibility**: Meet WCAG AA standards, ensure keyboard navigation
3. **Responsiveness**: Mobile-first, test across breakpoints
4. **Performance**: Optimize images, minimize animations
5. **Brand Alignment**: Use brand colors purposefully, maintain visual identity

### Quick Color Reference
- Primary: `#254967` (deep blue)
- Secondary: `#fcf8f2` (warm cream)
- Safe: `#10b981` (green-500)
- Warning: `#f59e0b` (yellow-500)
- Danger: `#ef4444` (red-500)

### Quick Spacing Reference
- Card padding: `p-6` (24px)
- Section spacing: `py-20` (80px vertical)
- Grid gaps: `gap-6` or `gap-8` (24px or 32px)
- Button padding: `px-4 py-2` (16px × 8px)

### Quick Typography Reference
- Page title: `text-3xl font-bold text-brand-primary`
- Section heading: `text-2xl font-bold`
- Card title: `text-xl font-semibold`
- Body text: `text-base text-gray-700`
- Metadata: `text-sm text-gray-500`

---

*This document is a living guide. Update it as new patterns emerge and the design system evolves.*

**Last Updated**: November 23, 2025
**Version**: 1.0
**Maintainer**: Massimino Design Team
