

## Condense Tuner and Darken Background

### Changes to `src/components/practice-log/Tuner.tsx`

**Layout**: Switch from a vertical stack to a compact horizontal layout with the mic button in the top-left corner.

```text
Current layout (vertical, spacious):
+----------------------------------+
|        [Gauge Arc]               |
|        [Note + Cents]            |
|        [Mic Button]              |
+----------------------------------+

New layout (compact, horizontal):
+----------------------------------+
| [Mic]  [Gauge Arc]  [Note+Cents] |
+----------------------------------+
```

**Specific changes:**

1. **Background**: Change from `bg-muted/30` to a darker shade like `bg-gray-800` (or `bg-neutral-800`) so the colored gauge segments pop visually.

2. **Mic button**: Move from bottom-center to top-left corner, reduce size slightly.

3. **Gauge SVG**: Shrink the `max-w` and reduce vertical padding to make the whole component more compact.

4. **Note display**: Position to the right of or below the gauge in a tighter arrangement, with text colors adjusted for contrast against the dark background.

5. **Overall padding**: Reduce `p-3` and `gap-2` to tighter spacing.

Only `Tuner.tsx` is modified. No other files or features are affected.

