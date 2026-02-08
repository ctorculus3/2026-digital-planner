

## Add Yearly Plan Option to Checkout Flow

Currently the paywall screen only shows the $3.99/month plan with a hardcoded price. This update will let users choose between monthly and yearly billing before starting their free trial.

### What you'll see

The paywall card will be redesigned with a **plan toggle** (Monthly / Yearly) at the top of the pricing section. When "Yearly" is selected, the price display updates to show **$39.99/year** with a savings badge like "Save 17%". Both options still include the 7-day free trial. The "Start Free Trial" button will checkout with whichever plan is currently selected.

### Changes needed (3 files)

**1. Paywall UI -- `src/components/subscription/SubscriptionGate.tsx`**

- Add a `selectedPlan` state toggle: `"monthly"` (default) or `"yearly"`
- Add a toggle/tab switcher above the price display (Monthly | Yearly)
- Update the price display to reflect the selected plan ($3.99/mo vs $39.99/yr)
- Show a "Save 17%" badge when yearly is selected
- Pass the selected plan to the checkout function call:
  ```
  supabase.functions.invoke("create-checkout", {
    body: { plan: selectedPlan }
  })
  ```

**2. Backend checkout function -- `supabase/functions/create-checkout/index.ts`**

- Define both price IDs in a plan map:
  ```
  const PRICES = {
    monthly: "price_1Sx00wPp57aypoj4v8akm2IH",
    yearly: "price_1SyhXOPp57aypoj4Hx9fG1zH",
  };
  ```
- Read the `plan` parameter from the request body (default to `"monthly"` if missing)
- Use the corresponding price ID when creating the Stripe checkout session
- Also fix the authentication method (replace `getClaims` with `getUser`) for reliability, matching the fix already applied to the moderation function

**3. No changes needed to `check-subscription` or `ManageSubscription`**

The subscription verification and management components work at the subscription level (active/inactive), not at the price level, so they'll work correctly with either plan. Users can switch plans via the Stripe Customer Portal ("Manage" button).

### Technical details

Price IDs:
- Monthly: `price_1Sx00wPp57aypoj4v8akm2IH` ($3.99/mo)
- Yearly: `price_1SyhXOPp57aypoj4Hx9fG1zH` ($39.99/yr)

The yearly plan saves roughly 17% vs paying monthly ($39.99 vs $47.88/yr). Both plans include the same 7-day free trial.

