

## Replace Hero with Notion-Style Responsive Hero

Rebuild the hero section following the Notion responsive hero architecture from your PDF, using your existing assets.

### Three-Part Hero Structure

The current single-image-with-overlaid-buttons hero will be replaced with a **flex column layout** containing three distinct wrappers, reordered via CSS `order` at different breakpoints:

| Section | Content | Mobile Order | Desktop Order |
|---------|---------|-------------|---------------|
| **Entourage** | `musicians-hero.png` illustration strip | 1 (second) | 0 (first) |
| **Header** | H1 headline + subtitle + CTA buttons | 2 (third) | 1 (middle) |
| **Media** | `journal-screenshot.png` product preview | 0 (first) | 2 (last) |

### CTA Buttons (replacing placeholders)

Two buttons wired to the existing scroll-to-auth actions:
- **"Get Practice Daily free"** (primary) -- triggers `setIsLogin(false); scrollToAuth()`
- **"Sign in"** (outline/secondary) -- triggers `setIsLogin(true); scrollToAuth()`

Button layout evolution:
- Under 440px: full-width stacked
- 440px+: side-by-side, tight gap (8px)
- 768px+: side-by-side, generous gap (16px)

### Responsive Behaviors

- **Mobile (less than 840px)**: Media appears first (product screenshot at top), then illustration strip, then headline + CTAs at the bottom. Product media uses square (1:1) aspect ratio, no border/shadow.
- **Desktop (840px+)**: Order flips -- illustration strip on top with negative margin overlapping into the headline, then headline + CTAs, then product screenshot at bottom with border, rounded corners, and box-shadow. Media uses 1.6:1 widescreen aspect ratio.
- Entourage strip capped at `max-width: 768px` on 600px+ viewports.
- Negative margin on the entourage creates the "peeking into headline" overlap effect.

### Technical Details

**File: `src/pages/Landing.tsx`** (lines ~215-235)

Replace the current hero `<section>` with:

1. A flex-column container with responsive gap (`gap-4` mobile, larger on desktop)
2. **Entourage wrapper**: The `musicians-hero.png` image with `order-1 lg:order-0`, max-width constraint, and negative margin for overlap effect
3. **Header wrapper**: `order-2 lg:order-1`, containing:
   - H1: "Your personal practice journal" (64px desktop, bold, centered)
   - Subtitle paragraph
   - CTA button group with the three-stage responsive layout
4. **Media wrapper**: `order-0 lg:order-2`, containing `journal-screenshot.png` with:
   - Aspect ratio switching via CSS (`aspect-square` on mobile, `aspect-video` on desktop)
   - Border, rounded corners, and shadow only at desktop (`lg:border lg:rounded-lg lg:shadow-lg`)

The breakpoint of 840px maps to Tailwind's custom breakpoint or can be approximated with `md` (768px) / `lg` (1024px). We will use `md` for the order flip since it is closest.

No new files are created. The existing `musiciansHero` and `journal-screenshot.png` imports are reused. All other sections of the landing page remain untouched.
