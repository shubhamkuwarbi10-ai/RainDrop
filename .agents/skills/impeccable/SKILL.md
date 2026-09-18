---
name: impeccable
description: Enforce impeccable UI/UX craftsmanship, pixel-perfect visual hierarchy, responsive layout precision, accessible design tokens, fluid micro-interactions, and pristine frontend engineering standards. Use when designing, building, reviewing, or refactoring user interfaces and web applications.
metadata:
  model: inherit
---

# 💎 Impeccable Design & Frontend Craftsmanship Standard

Impeccable guides the creation of world-class, premium, and human-centered interfaces that immediately evoke trust, clarity, and delight.

---

## 1. Visual Hierarchy & Typographic Rhythm
- **Clear Information Density**: Establish an unmistakable optical path. Primary headings, contextual badges, metadata, and actions must each have distinct typographic weight and size.
- **Intentional Font Pairing**: Use geometric modern sans-serifs (Inter, Plus Jakarta Sans, Outfit, SF Pro) paired with refined display serifs where editorial warmth is needed.
- **Proportional Line Heights**: Tight headings (`leading-tight` or `leading-snug`, 1.1–1.2x) and relaxed body text (`leading-relaxed`, 1.5–1.6x) to maximize scannability.
- **Tabular Numerals**: Always apply `font-mono tabular-nums` or `font-variant-numeric: tabular-nums` to financial data, telemetry, and live status counters to prevent jitter.

---

## 2. Spatial Cadence & The 8pt Grid
- **Strict Multiples of 4 & 8**: All margins, paddings, gaps, and component heights adhere strictly to the 4/8/12/16/24/32/48/64px scale.
- **Breathing Room**: Avoid cramped layouts. Interfaces must feel spacious, with generous whitespace surrounding key interaction targets.
- **Touch & Click Targets**: Interactive elements (buttons, pills, dropdown items) must maintain a minimum hit area of 40×40px (44×44px on mobile).

---

## 3. Curated Color Harmony & Contrast (WCAG AAA/AA)
- **Zero Generic Colors**: Never use default web primaries (harsh `#FF0000`, `#0000FF`, `#00FF00`). Use tailored HSL/OKLCH color ramps (e.g., deep slate blues, warm slate ambers, rich emerald greens, subtle crimson alerts).
- **Surface Layering**: Build depth using tonal surfaces rather than heavy borders. Dark modes must use rich dark zinc/slate bases (`#0B0F19`, `#111827`) instead of flat pitch black `#000000`.
- **Accessible Contrast**: Foreground text must always exceed 4.5:1 (minimum) and target 7:1 contrast ratio against backdrops.

---

## 4. Surfaces, Depth & Glassmorphism
- **Subtle Layered Elevation**: Combine multi-stop soft ambient shadows (`shadow-sm`, `shadow-xl`, `shadow-2xl`) with ultra-fine inner ring highlights (`border border-white/10` or `ring-1 ring-white/5`).
- **Frosted Translucency**: When using glassmorphic surfaces (`backdrop-blur-md`, `backdrop-blur-xl`), always provide a translucent background fallback (`bg-white/80` or `bg-slate-900/80`) to guarantee legibility regardless of underlying visuals.
- **Rounded Curvatures**: Use consistent corner radiuses (e.g., `rounded-xl` for small cards, `rounded-2xl` or `rounded-3xl` for major hero containers).

---

## 5. Motion, Physics & Micro-Interactions
- **Hardware-Accelerated Transitions**: Animate only composite properties (`transform`, `opacity`, `filter`). Never animate layout properties like `height`, `width`, or `margin` directly.
- **Natural Easing**: Use cubic-bezier easing curves (e.g., `cubic-bezier(0.16, 1, 0.3, 1)` or `transition-all duration-200 ease-out`).
- **Tactile State Feedback**: All interactive components must have distinct, delightful states for `hover`, `active`/`pressed`, `focus-visible`, and `disabled`.

---

## 6. Zero Layout Shifts & Resilient States
- **Aspect-Ratio Containers**: Reserve layout space for images, maps, charts, and lazy-loaded assets using `aspect-video`, `aspect-square`, or explicit dimensions to prevent Cumulative Layout Shift (CLS).
- **Graceful Empty & Error States**: Every dynamic component must render thoughtful skeleton loaders or contextual empty states with actionable guidance.

---

## 7. Authentic Human Communication (No Generic AI-Speak)
- **Plain Layman Language**: Avoid meaningless buzzwords, pseudo-technical filler, or generic placeholder copy.
- **Action-Oriented Verbs**: Buttons and links state exactly what will happen (e.g., "Explore City Grid →", "Download Offline Map", "Simulate 50mm Downpour").
