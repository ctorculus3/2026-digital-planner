

## Add a Decorative Divider Between "What Is This?" and Features Sections

### What

Add a subtle visual separator between the "What is Practice Daily?" section and the "See Your Practice Come to Life" features section to break up the empty space and create a smoother visual flow.

### Approach

Insert a decorative divider after the "What is Practice Daily?" section. Rather than reusing the `ScallopDivider` (which transitions from the teal header background), this will be a simple centered ornamental element -- a short horizontal rule with a music note icon in the middle. This keeps the design clean and on-brand without adding visual weight.

### Visual

```text
   What is Practice Daily?
   [paragraph text...]

        ———  ♪  ———        <-- decorative divider

   See Your Practice Come to Life
```

### Technical Details

**File:** `src/pages/Landing.tsx`

- Add a decorative divider `<div>` between the closing `</section>` of "What Is This?" and the opening of the `#features` section (around line 240)
- Layout: a flex row with two short border lines and a `Music2` icon centered between them, using existing `text-header-bg/30` and `border-header-bg/20` colors for a subtle, cohesive look
- No new components or dependencies needed -- just a small inline element using the already-imported `Music2` icon

