

## Consolidate Teacher Studio Plan in Stripe

### The Problem
The Teacher plan currently exists as two separate Stripe products:
- **Product 1** (prod_U1AUmfw6LA4Q1s): Monthly price only ($15.99/mo)
- **Product 2** (prod_U1AVeXAvSQffrE): Yearly price only ($159.99/yr)

Both prices should live under a single product.

### The Fix

**Step 1: Create a new yearly price under the existing monthly product**
- Add a $159.99/year recurring price to prod_U1AUmfw6LA4Q1s (the product that already has the monthly price)

**Step 2: Update the code to use the new yearly price ID**
- Update `supabase/functions/create-checkout/index.ts` to replace the old yearly price ID with the new one

**Step 3: Archive the duplicate product**
- Archive prod_U1AVeXAvSQffrE (the standalone yearly product) in Stripe since it will no longer be used

**Step 4: Update product ID reference**
- No change needed in `src/lib/subscriptionTiers.ts` since TEACHER_PRODUCT_ID already points to prod_U1AUmfw6LA4Q1s

### Technical Details

Files to modify:
- `supabase/functions/create-checkout/index.ts` — update the `teacher.yearly` price ID from `price_1T38ABLSlNM2EUMkm7TQFzvD` to the new price ID
- `supabase/functions/check-subscription/index.ts` — no changes needed (it reads the product from the subscription dynamically)
- `src/lib/subscriptionTiers.ts` — no changes needed (already uses prod_U1AUmfw6LA4Q1s)

