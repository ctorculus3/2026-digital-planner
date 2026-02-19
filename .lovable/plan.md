

## Fix Hero: Remove Illustration, Fix Media Box

### What changes

1. **Remove the Entourage section entirely** (lines 220-228) -- the musicians illustration strip will be deleted from the hero. The `musiciansHero` import can stay in case it is used elsewhere on the page.

2. **Fix the Media box** -- the "black box" appearance is caused by the `aspect-square md:aspect-[16/10]` with `object-cover` forcing a crop, plus borders/shadow appearing even when the image may not fill the container well. The fix:
   - Remove the forced aspect ratios so the image displays at its natural proportions
   - Keep the desktop border, rounded corners, and shadow for a polished card look
   - Remove `object-cover` since it can crop content unexpectedly

3. **Simplify ordering** -- with the Entourage gone, there are only two sections (Header and Media). On all screen sizes the order will be: Header first, Media second. The CSS `order` classes will be removed since they are no longer needed.

### Technical Details

**File: `src/pages/Landing.tsx`**

- Delete lines 220-228 (the Entourage wrapper and image)
- On the Header wrapper (line 231): remove `order-2 md:order-1`
- On the Media wrapper (line 249): remove `order-0 md:order-2`, remove forced aspect ratios, remove `object-cover`
- Final Media image class: `w-full h-auto` (natural dimensions, responsive width)
- Media container keeps: `w-full max-w-4xl md:mt-8 overflow-hidden md:border md:border-border md:rounded-xl md:shadow-2xl`

