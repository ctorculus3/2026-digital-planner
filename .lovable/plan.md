

# Landing Page for Practice Daily

## Overview

A premium, professional landing page that replaces the current auth page for non-logged-in visitors. It positions "Practice Daily" as the go-to practice journal for serious musicians who want to build disciplined habits and be part of a community. The page leads with a strong hero section, showcases the app in action, features social proof from fellow musicians, and closes with clear pricing and a call-to-action.

## Routing Changes

The current `/auth` route shows a simple sign-in/sign-up card. This will be replaced with a full landing page that includes the sign-in/sign-up form as a section. Logged-in users still get redirected to the main app as before -- no changes to that flow.

```text
Current flow:
  /auth  -->  Sign-in card (centered)

New flow:
  /auth  -->  Full landing page with:
              - Hero section
              - App preview section
              - Testimonials
              - Pricing card
              - Sign-up/Sign-in form (embedded at bottom)
```

## Page Sections (top to bottom)

### 1. Navigation Bar
- "Practice Daily" brand name with the Music2 icon (matching current teal-to-coral gradient)
- Right side: "Sign In" and "Start Free Trial" buttons
- Sticky on scroll for easy access to CTAs

### 2. Hero Section
- Large headline: something like "Your Daily Practice, Elevated."
- Sub-headline emphasizing the community angle: "Join musicians who track, refine, and grow together."
- Primary CTA button: "Start Your 7-Day Free Trial"
- Secondary link: "Already a member? Sign in"
- Subtle background using the app's teal header color as a gradient wash

### 3. App Preview Section
- Title: "See Your Practice Come to Life"
- A styled screenshot/mockup of the practice log form inside a browser frame
- 3-4 feature callout cards arranged in a grid:
  - Daily practice logging with goals and time tracking
  - Track scales, warmups, and repertoire with recordings
  - Media tools for reference audio and YouTube videos
  - Share your progress with teachers and peers

### 4. Community Vision Section
- Title: "Built for Musicians Who Show Up Every Day"
- Short paragraph about building a practice community
- 3 icon-driven value propositions:
  - Accountability: "Track your consistency and see your streak grow"
  - Reference: "Keep audio, video, and notes all in one place"
  - Growth: "Review your journey and celebrate progress"

### 5. Testimonials Section
- Title: "What Musicians Are Saying"
- 3 testimonial cards with placeholder quotes (you can replace with real quotes later)
- Each card: quote text, name, instrument/role
- Styled with the warm card background and subtle borders

### 6. Pricing Section
- Title: "Simple, Honest Pricing"
- Single pricing card (matching the existing SubscriptionGate design):
  - $3.99/month
  - 7-day free trial
  - Feature checklist (daily logging, scales/warmups/repertoire, media tools, cloud storage, sharing)
  - "Start Free Trial" CTA button
- "Cancel anytime" note underneath

### 7. Sign-In / Sign-Up Section
- Title: "Ready to Practice?"
- The existing auth form (email, password, display name for sign-up) embedded as a card
- Toggle between Sign In and Sign Up
- This replaces the standalone auth page -- same functionality, just embedded in the landing page

### 8. Footer
- "Practice Daily" branding
- Copyright line
- Optional future links (Privacy, Terms -- just placeholders for now)

## Design Approach

- Uses the existing design system: teal primary, coral accent, cream backgrounds, Libre Caslon Text / Roboto fonts
- The scallop pattern from the app header will be used as a decorative divider between sections
- Cards use the existing `bg-card`, `border-border`, `shadow-sm` patterns
- Smooth scroll navigation from the top nav to each section
- Fully responsive: stacks vertically on mobile, side-by-side layouts on desktop

## Technical Details

### Files Created

| File | Purpose |
|------|---------|
| `src/pages/Landing.tsx` | The full landing page component with all sections |

### Files Modified

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Replaced with a redirect/wrapper that renders the Landing page, or simplified to just import Landing |
| `src/App.tsx` | Update the `/auth` PublicRoute to render the new Landing page instead of the old Auth component |

### Implementation Notes

- The sign-in/sign-up form logic stays exactly the same (email + password + optional display name). It just lives inside the landing page now instead of being the entire page.
- The `useAuth` hook and `PublicRoute` wrapper remain unchanged -- logged-in users still get redirected to `/`.
- No database changes needed. No new edge functions.
- The landing page is a single-page scroll with anchor links from the nav bar (e.g., clicking "Pricing" scrolls to the pricing section).
- Testimonial content will use placeholder data that you can easily swap out with real quotes later.
- The app preview will be a styled static visual (CSS-built mockup using the app's actual color scheme and layout patterns) rather than a live screenshot.

