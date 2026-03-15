# Write Dev Reports

Generate a Practice Daily developmental report for the current session and publish it to Notion + a PDF on the Desktop.

## Steps

1. **Determine the next report number:**
   - Search Notion for "Dev Report" to find the latest numbered report
   - The next report number is the highest found + 1

2. **Compile the session summary** from the current conversation:
   - Date (today's date)
   - Session info (worktree name, branch)
   - PRs merged (if any)
   - What was completed this session (grouped by feature/task, with implementation details)
   - Files created and modified
   - Current status (blocked tasks, known issues)
   - Next steps (if applicable)

3. **Create the Notion page:**
   - Parent: data source `collection://313e680f-59fe-80bd-80ac-000b9fd124e1` (Practice Development Document Hub)
   - Title: `Dev Report No. {N}`
   - Category property: `Planning`
   - Content format should match existing reports (bold Date/Session/PRs header, horizontal rule, ## sections for Completed, Files Created, Files Modified, Current Status, Next Steps)

4. **Generate a PDF report:**
   - Use Python (`fpdf2` library) to generate a clean PDF with white background, black text, Helvetica font
   - Save to Desktop as `Dev_Report_No_{N}.pdf`
   - Layout: large bold title, bold meta header (date/session/PRs), then sections separated by light gray dividers: Completed (with subsections), Files Modified (filename bold + description in gray), Current Status, Next Steps
   - Use dashes (-) for bullet points (not Unicode bullets — fpdf2 core fonts don't support them)
   - Footer: "Practice Daily  |  practicedaily.app  |  github.com/ctorculus3"

5. **Confirm both are created** — share the Notion URL and PDF file path with Calvin.
