---
name: Hostel Biometric System
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display-bold:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 24px
  stack-gap: 16px
  grid-gutter: 20px
  inline-element-gap: 8px
---

## Brand & Style
The design system is engineered for high-stakes security environments where trust and efficiency are paramount. The visual language follows a **Corporate Minimalist** aesthetic, prioritizing clarity over decoration. It leverages a rigorous, systematic approach to interface design to reassure administrators of the system's reliability and precision. 

The emotional response should be one of "effortless security"—an interface that feels stable, responsive, and authoritative. By utilizing a "White-Space First" philosophy, the design system minimizes cognitive load, allowing users to focus on critical biometric data and access logs without distraction.

## Colors
The palette is rooted in functional utility. **Deep Blue** serves as the primary action color, signaling intelligence and stability. Neutral tones are pulled from a slate-grey scale to maintain a professional, tech-forward feel without the harshness of pure black.

- **Primary (#2563EB):** Reserved for primary actions, active states, and focus indicators.
- **Success (#10B981):** Used exclusively for "IN" status, successful verification, and positive system health.
- **Danger (#EF4444):** Used for "OUT" status, access denied, and critical system alerts.
- **Surface Colors:** Pure White is used for interactive cards and panels, while Light Slate Grey provides structural depth for background containers.

## Typography
This design system utilizes **Inter** for its exceptional legibility in data-heavy environments. The typographic hierarchy is designed to highlight status and identity first. 

Headlines use a tighter letter-spacing to appear more grounded and assertive. Body text maintains a standard tracking for readability. For technical data—such as timestamps or biometric IDs—a medium weight is used to ensure visibility against lighter backgrounds.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop monitoring stations, transitioning to a single-column stack for mobile administration. 

- **Dashboard Layout:** A fixed left-hand navigation (240px) with a fluid content area.
- **Spacing Rhythm:** Based on an 8px square grid. All margins and paddings should be multiples of 4px or 8px to maintain mathematical harmony.
- **Safe Zones:** High-security camera overlays require a 40px "clear zone" from the edge of the viewport to ensure no critical UI elements obscure the biometric scanning field.

## Elevation & Depth
Depth is used sparingly to signify interactivity. The system uses **Ambient Shadows** to lift actionable elements off the slate-grey background.

- **Low Elevation (shadow-sm):** Used for standard buttons and small input fields. 0px 1px 2px rgba(0, 0, 0, 0.05).
- **Mid Elevation (shadow-md):** Used for metric cards and modal overlays. 0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06).
- **Flat:** All background containers and decorative elements remain flat (0dp) to ensure the interface doesn't feel cluttered.

## Shapes
A consistent **0.5rem (8px)** base radius is applied to most UI components to balance professional rigidity with modern approachability. However, as per specific requirements, buttons and primary inputs use an increased **12px radius** to make them more prominent and tactile for touch-screen gate terminals.

## Components

### Buttons
- **Primary:** Filled Deep Blue with white text, 12px border radius, medium weight.
- **Secondary:** White background with a 1px Slate-300 border.

### Status Badges
- Small, uppercase labels with a subtle tinted background (10% opacity of the status color) and a high-contrast text color.
- **IN:** Emerald text on Emerald-50 background.
- **OUT:** Crimson text on Crimson-50 background.

### Form Inputs
- Labels sit above the input in `label-caps`. 
- Inputs have a 1px border (#CBD5E1) and a 12px radius. 
- Focus state: 2px Deep Blue border with a soft blue outer glow.

### Dashboard Metric Cards
- White surface, `shadow-md` elevation.
- Large numerical data (32px) paired with a secondary `body-sm` label.

### Activity Log Items
- Horizontal layout with a 48px circular avatar or biometric placeholder on the left.
- Vertical stack of `body-base` (Name) and `body-sm` (Timestamp/Event).
- 1px bottom border (#F1F5F9) to separate entries.

### Camera Overlay Focus Guides
- Ultra-thin (1px) white frame with "corner brackets" to indicate the face-detection zone.
- Semi-transparent black mask (40% opacity) outside the focus area to draw the student's eye to the center.
- Real-time "Scanning" pulse effect using the primary blue color.