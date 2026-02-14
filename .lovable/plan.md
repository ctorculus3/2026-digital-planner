

## Add Music AI Highlight Badge to Hero Section

### What Changes

Add a small eye-catching badge/pill directly beneath the hero subtitle (and above the CTA buttons) that highlights the Music AI Assistant as a key differentiator. This draws immediate attention without cluttering the hero layout.

### Design

A centered pill-shaped badge with the Sparkles icon and text: **"Includes Music AI Assistant -- theory questions & practice coaching built in"**

Styled with a semi-transparent white background to stand out against the header-bg, similar to a "featured badge" pattern.

### File to Change

**`src/pages/Landing.tsx`** -- 1 addition (between lines 220 and 221, after the subtitle paragraph and before the CTA buttons):

- Add a `div` containing a pill/badge element:
  ```
  <div className="mt-6 flex justify-center">
    <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 border border-primary-foreground/25 px-4 py-2 text-sm text-primary-foreground">
      <Sparkles className="h-4 w-4" />
      <span>Includes Music AI Assistant — theory questions & practice coaching built in</span>
    </div>
  </div>
  ```

### No Existing Features Affected

Purely additive -- one new element inserted into the hero section. No existing content is modified or removed.

