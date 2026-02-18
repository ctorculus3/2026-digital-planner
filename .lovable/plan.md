

## Landing Page Redesign

A comprehensive overhaul of the Practice Daily landing page based on the analysis document, competitor research (Modacity), and your preferences. The goal is a more engaging, conversion-focused page that shows the product immediately and leads with the strongest differentiators.

---

### Section-by-Section Changes

**1. Hero Section -- Complete Rewrite**

- Replace the generic headline "Your Daily Practice, Elevated" with a pain-point-driven headline, e.g.:
  **"Never Lose Track of What You Practiced"**
  Subtitle: "Log sessions, track progress, and share with your teacher -- all from one practice journal built for serious musicians."
- Add a real screenshot of the journal app (from the uploaded PDF) on the right side of the hero, displayed in a browser/device mockup frame -- similar to how Modacity shows their app beside the text
- Keep the "Start Your 7-Day Free Trial" CTA button and the AI Assistant badge
- Remove the "Already a member? Sign in" text link from the hero (sign-in stays in the nav)
- Layout: text on the left, app screenshot on the right (stacks vertically on mobile)

**2. Remove "What is Practice Daily?" Section**

- The analysis flags this as redundant. The hero + features already communicate the value.
- Delete this section entirely.

**3. Top 4 Features Spotlight**

- Replace the flat 11-card grid with a curated spotlight of 4 top features:
  1. Music AI Assistant (with voice playback)
  2. Share With Teachers and Peers
  3. Dashboard, Streaks, and Badges
  4. Built-in Metronome, Tuner, and Drone Player
- Each feature gets a larger card with an icon, title, and description
- Below the 4 cards, add a "See All Features" button that expands (accordion/collapsible) to reveal the remaining features in a compact list

**4. Animated Ad / Product Walkthrough Section**

- Move the existing animated HTML ad (practice-daily-ad.html) to its own dedicated section below the top features
- Add a heading like "See It in Action" above the iframe
- This is the "interactive demo" the analysis recommends

**5. Community / Values Section -- Keep but Tighten**

- Keep the 3-value cards (Accountability, Reference, Growth) but make them slightly more concise
- Update headline to speak to musician segments: "Whether you're a student preparing for auditions, a teacher tracking student progress, or a gigging musician refining your craft"

**6. Testimonials -- Improve Credibility**

- Add avatar placeholder icons (colored initials circles) next to each testimonial
- Make quotes more outcome-specific where possible
- Keep current 3 testimonials but add a "Best Value" visual treatment

**7. Pricing Section -- Add Framing**

- Add a comparison anchor line: "Less than a cup of coffee per month"
- Add a "BEST VALUE" badge on the yearly plan toggle
- Keep the existing pricing card and feature checklist

**8. New FAQ Section**

- Add an accordion FAQ section before the auth form with common questions:
  - "Does it work on my phone/tablet?"
  - "Can I cancel anytime?"
  - "What happens after my free trial?"
  - "Can my teacher see my practice logs?"
  - "Is my data private and secure?"

**9. Auth Section and Footer -- Minimal Changes**

- Keep auth form as-is
- Keep footer as-is

---

### Technical Details

**Files to modify:**

1. **`src/pages/Landing.tsx`** -- Major rewrite of sections:
   - Restructure hero with two-column layout (text left, screenshot right)
   - Remove "What is Practice Daily?" section
   - Replace feature grid with top-4 spotlight + expandable "See All" collapsible using Radix Collapsible
   - Move animated ad iframe to its own "See It in Action" section
   - Update testimonial cards with avatar initials
   - Add "Less than a cup of coffee" pricing anchor
   - Add FAQ accordion section using the existing Accordion component

2. **Copy uploaded journal screenshot** -- Save the journal screenshot from the PDF as a project asset for use in the hero section (`src/assets/journal-screenshot.png`)

3. **`src/components/subscription/PlanToggle.tsx`** -- Add "BEST VALUE" badge permanently on the yearly option (not just the save percentage)

**No new dependencies needed** -- uses existing Radix Accordion, Collapsible, and current UI components.

**Preserved functionality:**
- All auth logic (sign in, sign up, Google, Apple OAuth)
- JSON-LD structured data
- Email verification toast
- Scroll-to-auth behavior
- Contact dialog in footer
- Plan toggle state
- All existing navigation

