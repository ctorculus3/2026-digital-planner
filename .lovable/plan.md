

## Update Checkout Edge Function with New Stripe Price IDs

New products and prices were just created in Stripe. The `create-checkout` edge function needs to reference the new price IDs.

### What changes

**File:** `supabase/functions/create-checkout/index.ts`

Update the `PRICES` map from the old IDs to the new ones:

- **Monthly:** `price_1Sx00wPp57aypoj4v8akm2IH` -> `price_1T06ILPp57aypoj4m88umkXc`
- **Yearly:** `price_1SyhXOPp57aypoj4Hx9fG1zH` -> `price_1T06IZPp57aypoj4XD8OaYyl`

This is a two-line change in the `PRICES` constant at the top of the file. No other files need modification.

### Why

The previous price IDs may have been created in test mode. The new ones were just created in the current Stripe environment so they should appear in your Stripe dashboard under "My Products."

