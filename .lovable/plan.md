

## Fix: Redeploy the checkout function

The issue is clear: the `create-checkout` edge function code was updated with the correct live Stripe price IDs, but the **deployed version** is still running the old code. The logs confirm it's still trying to use `price_1T06ILPp57aypoj4m88umkXc` (the old/invalid price).

### What needs to happen

1. **Redeploy the `create-checkout` edge function** so the live version uses the updated price IDs:
   - Monthly: `price_1T06OeLSlNM2EUMkv9O6hItY`
   - Yearly: `price_1T06OeLSlNM2EUMkNM8T5t8k`

2. **Verify** the checkout flow works after redeployment.

No code changes are needed -- the code is already correct. This is purely a deployment issue.

