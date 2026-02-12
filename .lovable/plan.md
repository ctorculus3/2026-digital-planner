

## Add Monthly/Yearly Toggle to Landing Page Pricing

### What Changes

The pricing section on the landing page currently shows only the monthly price ($3.99/mo). This update adds the existing `PlanToggle` component above the pricing card so visitors can switch between Monthly and Yearly, with the price and label updating dynamically.

### Changes to `src/pages/Landing.tsx`

1. **Import** the `PlanToggle` component from `@/components/subscription/PlanToggle`.
2. **Add state**: `const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly")`.
3. **Place `<PlanToggle />`** above the pricing card, inside the pricing section.
4. **Make the card dynamic**:
   - Label: shows "Monthly" or "Yearly" based on selection.
   - Price: shows `$3.99/mo` or `$39.99/yr`.
   - Trial note stays the same ("7-day free trial included").
5. No other sections or files are touched.

### What Stays the Same

- All feature cards, testimonials, hero, auth section, and footer remain unchanged.
- The `PlanToggle` component itself is reused as-is (it already includes the "Save 17%" badge for yearly).
