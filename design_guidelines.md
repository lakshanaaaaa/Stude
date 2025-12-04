# Design Guidelines: Student Coding Performance Analytics Platform

## Design Approach

**Selected System**: Modern Dashboard Design Pattern (inspired by Linear, Vercel Dashboard, and GitHub Insights)
**Justification**: This is a data-intensive analytics platform requiring clean information hierarchy, excellent readability, and efficient data visualization. The design should prioritize clarity over decoration.

## Typography System

**Font Stack**:
- Primary: Inter (Google Fonts) - all body text, labels, data points
- Monospace: JetBrains Mono - usernames, code-related stats, platform IDs

**Type Scale**:
- Hero/Page Titles: text-4xl font-bold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base (16px)
- Labels/Meta: text-sm text-gray-600 (14px)
- Small Stats: text-xs (12px)

## Layout & Spacing System

**Tailwind Spacing Primitives**: 2, 4, 6, 8, 12, 16, 24
- Component padding: p-6
- Card spacing: gap-6
- Section margins: mb-8 or mb-12
- Grid gaps: gap-4 or gap-6
- Button padding: px-6 py-3

**Container Strategy**:
- Main content: max-w-7xl mx-auto px-6
- Dashboard sections: w-full
- Forms: max-w-2xl

## Page-Specific Layouts

### Login Page
- Centered card design (max-w-md)
- Clean, minimal layout with platform branding
- Single-column form with generous spacing (gap-6)

### Dashboard/Homepage
**Top Coder of the Week Section**:
- Full-width featured card with gradient background treatment
- Large display for winner's name, stats, and achievement badges
- Horizontal layout: Avatar (left) + Stats grid (center) + Achievement highlights (right)

**Student Grid**:
- Responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Compact cards showing: Avatar placeholder circle, Name (bold), Username (@handle style), Department tag
- Hover effect: subtle elevation increase (shadow-md to shadow-lg)

### Student Analytics Dashboard
**Layout Structure** (5 main sections):

1. **Profile Header** (full-width, mb-8)
   - Two-column: Left (avatar + basic info) | Right (social links as icon buttons)
   - Include: Name, Dept, Reg No, Email

2. **Coding Accounts Section** (mb-8)
   - Main accounts displayed as prominent pills/badges
   - Sub-accounts in collapsible accordion or smaller tags
   - Each showing: Platform icon + Username + External link icon

3. **Problem Solving Analytics** (grid-cols-1 lg:grid-cols-2, gap-6)
   - Left: Stats cards grid (2x2): Total Problems, Easy/Medium/Hard counts
   - Right: Line chart (Problems over time)
   - Bottom row: Pie chart (Difficulty distribution)

4. **Contest Analytics** (grid-cols-1 lg:grid-cols-3, gap-6)
   - Left column: Rating stats cards (Current, Highest, Total contests)
   - Right column (span-2): Rating graph over time with merged accounts

5. **Badges Grid** (mb-8)
   - Platform badges in responsive grid: grid-cols-2 md:grid-cols-4 lg:grid-cols-6
   - Each badge: Platform icon + Badge icon + Count/Level indicator

### Edit Profile Page
- Two-column form layout on desktop (grid-cols-1 lg:grid-cols-2)
- Left: Personal info fields | Right: Coding accounts management
- Dynamic "Add Account" functionality with platform dropdown + username input
- Submit button fixed at bottom or floating

## Component Library

**Cards**:
- Consistent: bg-white rounded-lg border p-6
- Elevation: border + shadow-sm (default), shadow-md (hover/active)
- Header pattern: Title + optional action button

**Stats Cards**:
- Compact: p-4
- Layout: Icon (top-left) + Label (text-sm) + Value (text-2xl font-bold)
- Use circular icon backgrounds

**Buttons**:
- Primary: px-6 py-3 rounded-lg font-medium
- Secondary: border variant
- Icon buttons: Square (w-10 h-10) with centered icon

**Forms**:
- Input fields: w-full px-4 py-3 rounded-lg border
- Label above input: text-sm font-medium mb-2
- Field spacing: gap-6
- Validation states: border color change + helper text below

**Navigation**:
- Top navbar: Fixed header with logo, nav links, user menu
- Student cards: Clickable entire card area
- Breadcrumbs on detail pages

**Charts** (using Recharts):
- Line charts: Smooth curves, data points visible on hover
- Pie charts: With legend, percentage labels
- Consistent grid styling across all charts
- Responsive containers with aspect-ratio

## Images Strategy

**Hero Image**: None (data-focused application doesn't need hero imagery)

**Profile Images**:
- Student cards: Circular avatar placeholders (w-16 h-16)
- Profile header: Larger circular avatar (w-24 h-24)
- Use initials with generated gradient backgrounds as placeholders

**Platform Icons**:
- Import from Heroicons or use inline SVG for platform logos (LeetCode, CodeChef, etc.)
- Consistent sizing: w-6 h-6 for inline icons, w-8 h-8 for cards

**Badge/Achievement Icons**:
- Trophy, star, flame icons from Heroicons
- Platform-specific achievement badges can use placeholder colored circles with numbers

## Data Visualization Principles

- **Consistent Colors**: Use semantic color system (success, warning, info) consistently across charts
- **Readable Axes**: Clear labels, appropriate tick marks
- **Interactive Tooltips**: Show detailed data on hover
- **Responsive Charts**: Scale gracefully on mobile, maintain readability
- **Loading States**: Skeleton screens for chart containers

## Accessibility & Interaction

- Focus states: ring-2 ring-blue-500 on interactive elements
- Keyboard navigation: Ensure all cards/links are keyboard accessible
- Label associations: Proper for attributes on all form inputs
- Chart alternatives: Include summary stats below complex visualizations
- Consistent hit targets: Minimum 44px for buttons/clickable areas

This design creates a professional, data-centric analytics platform that prioritizes information clarity and efficient navigation while maintaining modern aesthetic standards.