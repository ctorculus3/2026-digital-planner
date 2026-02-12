

## Update Landing Page with New Features

### What's Changing

The landing page currently lists 4 feature cards and 6 pricing bullet points. Several features have been added to the app since the landing page was written. This update adds the missing features to both the feature cards section and the pricing checklist.

### Features to Add

**New feature cards** (expanding from 4 to 8 cards, grid stays responsive):

1. **Built-in Metronome** -- "Practice with an authentic clave-sample metronome. Adjustable BPM with fine-tuning controls."  
   Icon: a music/activity icon (e.g. `Activity` or `Timer`)

2. **Chromatic Tuner** -- "Tune your instrument in real time using your device microphone with a visual pitch gauge."  
   Icon: `Mic`

3. **Community Feed** -- "Connect with fellow musicians. Share thoughts on gear, habits, and practice in a dedicated social space."  
   Icon: `Users`

4. **Dashboard & Streaks** -- "Visualize your practice history with calendars, time summaries, badges, and streak tracking."  
   Icon: `TrendingUp` (or `BarChart3`)

**New pricing checklist items** (adding to the existing 6):

- Built-in metronome with clave sample
- Chromatic tuner with real-time pitch detection
- Community feed to connect with musicians
- Dashboard with streaks, badges & practice calendar

### Files Modified

**`src/pages/Landing.tsx`** only:

1. Add new icon imports (`Mic`, `Activity`, `Users` -- some already imported, add missing ones).
2. Append 4 new entries to the `features` array.
3. Append 4 new strings to the `pricingFeatures` array.
4. No layout or structural changes needed -- the existing responsive grid (`sm:grid-cols-2 lg:grid-cols-4`) will naturally accommodate 8 cards across 2 rows.

### What Stays the Same

- All existing feature cards, testimonials, values, hero section, auth section, and footer remain untouched.
- No other files are modified.

