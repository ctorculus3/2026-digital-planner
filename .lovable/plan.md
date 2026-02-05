
# Auto-Expanding Textareas for Practice Log

## Summary
Make the Main Goals, Subgoals, and Notes & Focus textareas automatically expand in height as the user types content that exceeds the visible area.

## Current Behavior
- All three textareas have a fixed minimum height of 80px
- `resize-none` prevents manual resizing
- Text that exceeds the box scrolls within the fixed area, making it hard to see everything

## New Behavior
- Textareas will automatically grow taller as content is added
- Users will always see all their text without scrolling inside the box
- Minimum height of 80px is preserved (boxes won't shrink below this)
- The textarea shrinks back down when content is deleted

## Implementation

### Approach
Create an `AutoExpandingTextarea` component or add auto-resize logic directly to the onChange handlers. The technique uses JavaScript to:
1. Reset the textarea height to a minimum
2. Set the height to match `scrollHeight` (the full content height)

### Code Change
Add a `useRef` and resize function for each textarea:

```typescript
const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
};
```

Then update each textarea's onChange:
```typescript
onChange={(e) => {
  setMainGoals(e.target.value);
  markChanged();
  adjustTextareaHeight(e.target);
}}
```

### Textareas to Update
1. **Main Goals** (line 212-217)
2. **Subgoals** (line 221-226)
3. **Notes & Focus** (line 351-356)

### Additional Consideration
Add a `useEffect` to adjust heights when data is loaded (so saved long content displays correctly on page load).

## Technical Details

### File to Modify
- `src/components/practice-log/PracticeLogForm.tsx`

### Changes Required
1. Add refs for each textarea (`mainGoalsRef`, `subgoalsRef`, `notesRef`)
2. Create `adjustTextareaHeight` helper function
3. Update onChange handlers to call the resize function
4. Add useEffect to resize on initial data load
5. Remove `resize-none` class (optional - can keep it to prevent manual resize while allowing auto-resize)

### No Database Changes
This is purely a UI enhancement.

## Testing
1. Type multiple lines in Main Goals - box should grow
2. Delete content - box should shrink back to minimum
3. Save a long entry, refresh page - box should load at correct height
4. Test on mobile to ensure it works well on smaller screens
