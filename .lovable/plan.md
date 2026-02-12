

## Add Privacy Policy and Terms of Service Pages

### Overview

Create two new pages -- Privacy Policy and Terms of Service -- with standard legal content tailored to Practice Daily. Update the footer links on the landing page to navigate to these pages, and add routes in the app.

### Changes

**1. New file: `src/pages/Privacy.tsx`**
- Full privacy policy page with standard sections: Information We Collect, How We Use It, Data Sharing, Data Security, Cookies, Children's Privacy, Changes to Policy, Contact Us
- Styled consistently with the landing page (header with logo, clean typography)
- Back link to return to the landing/auth page

**2. New file: `src/pages/Terms.tsx`**
- Full terms of service page with standard sections: Acceptance of Terms, Account Registration, Subscription & Billing, Acceptable Use, Intellectual Property, Termination, Limitation of Liability, Governing Law, Contact Us
- Same styling as Privacy page

**3. Modified file: `src/pages/Landing.tsx`**
- In the footer (lines 455-461), replace the `<span>` elements for "Privacy" and "Terms" with `<Link>` components from react-router-dom pointing to `/privacy` and `/terms`

**4. Modified file: `src/App.tsx`**
- Add two new public routes: `/privacy` and `/terms` (no auth protection needed)
- Import the new Privacy and Terms page components

### No database or backend changes required.
