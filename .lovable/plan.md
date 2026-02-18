

## Replace Hero Buttons with Link-Style Buttons

Replace the two prominent hero buttons ("Start Your Free Trial Now" and "Sign in") with simple text links using the `link` variant of the Button component. This avoids visual duplication with the auth section CTA buttons further down the page.

### Changes to `src/pages/Landing.tsx` (lines 224-231)

Replace the current button pair with link-styled text:

- **"Start Your Free Trial Now"** -- change from default `Button` to `variant="link"` and keep the `onClick` that sets sign-up mode and scrolls to auth
- **"Sign in"** -- change from `variant="outline"` to `variant="link"` and keep the `onClick` that sets login mode and scrolls to auth
- Remove the `size="lg"` and extra padding classes since link-style buttons don't need them
- Keep both on the same row, centered, with a small visual separator or just spacing between them

### Technical detail

```tsx
<div className="mt-6 flex items-center justify-center gap-6">
  <Button variant="link" className="text-base" onClick={() => { setIsLogin(false); scrollToAuth(); }}>
    Start Your Free Trial Now
  </Button>
  <Button variant="link" className="text-base" onClick={() => { setIsLogin(true); scrollToAuth(); }}>
    Sign in
  </Button>
</div>
```

### Preserved
- Scroll-to-auth behavior
- Login vs sign-up mode toggling
- All other sections unchanged
