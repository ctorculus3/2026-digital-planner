

## Add Contact Support Dialog to Landing Page and Dashboard

### What It Does

Adds a "Contact" button that opens a popup dialog with the support email (`support@practicedaily.app`) and a friendly message. It will appear in two places:

1. **Landing page footer** -- next to "Privacy" and "Terms" links
2. **Dashboard top bar** -- next to the existing controls (How-To Manual, Manage Subscription, User Menu)

### Design

The dialog popup shows:
- A mail icon and "Contact Support" title
- The message: "Have a question, issue, or feedback? Reach out and we'll get back to you as soon as we can."
- A clickable email link (`support@practicedaily.app`)

### Files to Change

**1. New file: `src/components/ContactDialog.tsx`**

A reusable component containing the Dialog with trigger button, so it can be dropped into both the Landing page and Dashboard without duplicating code.

- Uses the existing `Dialog` UI components and `Mail` icon from lucide-react
- Accepts an optional `variant` prop to style the trigger differently in each context (e.g., ghost button on Dashboard, text link in footer)

**2. `src/pages/Landing.tsx`** -- 1 addition

- Import `ContactDialog`
- Add it to the footer section alongside "Privacy" and "Terms" links, styled as a text link to match the existing footer style

**3. `src/pages/Dashboard.tsx`** -- 1 addition

- Import `ContactDialog`
- Add it to the top bar controls area, between `HowToManual` and `ManageSubscription`, styled as a small ghost button to match the existing controls

**4. `src/components/practice-log/PracticeLogCalendar.tsx`** -- 1 addition

- Same change as Dashboard -- add `ContactDialog` to the Journal page's top bar for consistency across all logged-in pages

### About the Support Email

The email `support@practicedaily.app` is referenced in the Terms page already. To receive mail at that address, you will need to set up email forwarding or hosting with your domain provider (e.g., Cloudflare Email Routing, Google Workspace, or Zoho Mail) outside of Lovable.

### No Existing Features Affected

All changes are purely additive. No existing content, layout, or functionality is modified or removed.

