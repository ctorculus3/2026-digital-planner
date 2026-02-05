
# Share Practice Log Feature

## Summary
Add the ability for users to share their practice log entries with teachers, friends, or others via a shareable link. Recipients can view the practice log without needing an account. Links can optionally have an expiration date.

## Features

| Feature | Description |
|---------|-------------|
| Share Button | "Share" button next to the Save button |
| Unique Link | Generate a unique token for each shared log |
| Read-Only View | Shared link opens a public, read-only view |
| Expiration Option | User can set link to expire (1 day, 7 days, 30 days, or never) |
| Revoke Access | User can revoke a shared link at any time |

## Database Changes

### New Table: `shared_practice_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| practice_log_id | uuid | References practice_logs.id |
| share_token | text | Unique token for the URL |
| created_at | timestamptz | When share was created |
| expires_at | timestamptz | When link expires (null = never) |
| created_by | uuid | User who created the share |

### RLS Policies
- Users can create/delete share tokens for their own practice logs
- Anyone can read practice logs via valid, non-expired share token

## New Files to Create

| File | Purpose |
|------|---------|
| `src/components/practice-log/ShareButton.tsx` | Share button with dialog UI |
| `src/pages/SharedPracticeLog.tsx` | Public read-only view page |
| `src/hooks/useSharePracticeLog.ts` | Hook for share CRUD operations |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/shared/:token` public route |
| `src/components/practice-log/PracticeLogForm.tsx` | Add ShareButton to header |

## User Flow

```text
1. User clicks "Share" button in practice log header
2. Dialog opens with expiration options (Never, 1 day, 7 days, 30 days)
3. User clicks "Generate Link"
4. System creates token and displays copyable URL
5. User copies link and sends to teacher/friend
6. Teacher opens link (no login required)
7. Teacher sees read-only practice log
```

## Share Dialog UI

```text
+----------------------------------------+
|  Share Practice Log                    |
|                                        |
|  Link expires:                         |
|  [Never] [1 day] [7 days] [30 days]    |
|                                        |
|  [Generate Link]                       |
|                                        |
|  --- After generating ---              |
|                                        |
|  Anyone with this link can view:       |
|  [https://app.../shared/abc123   ] [Copy]
|                                        |
|  [Revoke Access]              [Done]   |
+----------------------------------------+
```

## Shared View Page Layout

The `/shared/:token` page will display:
- Header: "Shared Practice Log" with date
- All fields rendered as read-only (no inputs)
- Goals, Subgoals, Time tracking, Warm-ups, Scales, Repertoire, Notes
- Footer: "Shared via Practice Log App"

## Technical Implementation

### Token Generation
Use `crypto.randomUUID()` for secure unique tokens

### Database Query for Shared View
```sql
SELECT pl.* FROM practice_logs pl
JOIN shared_practice_logs spl ON pl.id = spl.practice_log_id
WHERE spl.share_token = $token
  AND (spl.expires_at IS NULL OR spl.expires_at > now())
```

### Checking Existing Share
When opening share dialog, check if a valid share already exists for this log and display it instead of creating a new one.

## Testing Checklist
1. Click Share button - dialog opens with expiration options
2. Generate link with "Never" expiration - link works indefinitely
3. Generate link with "1 day" expiration - link stops working after 24 hours
4. Copy link and open in incognito - read-only view displays correctly
5. Click "Revoke Access" - link immediately stops working
6. Verify shared view shows all practice log data without edit controls
7. Test on mobile devices for responsive layout
