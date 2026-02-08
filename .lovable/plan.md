

# Add Practice Daily Logo to Landing Page

## Overview

Place the uploaded logo in two locations on the landing page: the navigation bar brand and the auth/sign-up card.

## Changes

### 1. Copy the logo image into the project

The uploaded logo will be saved to `src/assets/practice-daily-logo.png` so it can be imported as an ES6 module in the React component.

### 2. Navigation bar brand (sticky nav)

**Current:** A small teal circle with a Music2 icon + "Practice Daily" text.

**New:** Replace the teal circle + icon with a compact version of the logo image (sized to fit the 64px nav height, roughly 36-40px tall). The "Practice Daily" text label next to it will be removed since the logo already contains the brand name.

### 3. Auth / sign-up card

**Current:** A teal circle with a Music2 icon above the "Welcome Back" / "Create Your Account" title.

**New:** Replace the circle + icon with the logo image, sized to around 120-140px wide, centered above the card title. This gives the sign-up/sign-in experience a polished, branded feel.

### 4. Files modified

- **`src/pages/Landing.tsx`** -- Import the logo asset; update the nav brand element (lines 127-136) and the auth card header icon (lines 302-305) to use an `<img>` tag referencing the imported logo. All other features and sections remain untouched.

No other files are changed.

