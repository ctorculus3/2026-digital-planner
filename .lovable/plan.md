

# Add Sharer's Name to Shared Practice Log

## Summary
Update the shared practice log page to display "Music Practice Daily Record Journal Shared by [User Name]" and collect the user's name during signup.

## Current State
- Signup only collects email and password
- No user profile/name storage exists
- Shared page shows generic "Shared via Practice Log App" footer

## Changes Required

### 1. Database Changes

**Create `profiles` table:**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users |
| display_name | text | User's display name |
| created_at | timestamptz | When profile was created |
| updated_at | timestamptz | Last update time |

**Create trigger** to auto-create a profile row when a user signs up.

**RLS Policies:**
- Users can read/update their own profile
- Anyone can read profiles (needed for shared page to show name)

### 2. Update Signup Form
Add a "Display Name" field to the Auth page that collects the user's name during registration.

### 3. Update Shared Practice Log Page
Modify the query to also fetch the sharer's display name from the profiles table and display it in the header:

```text
Music Practice Daily Record Journal
Shared by John Smith
```

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Create profiles table, trigger, and RLS |
| `src/pages/Auth.tsx` | Add display name input field |
| `src/contexts/AuthContext.tsx` | Update signUp to accept name parameter |
| `src/pages/SharedPracticeLog.tsx` | Fetch and display sharer's name |

## Updated Shared Page Header

```text
+------------------------------------------+
|    Music Practice Daily Record Journal   |
|          Shared by John Smith            |
|                                          |
|        MONDAY - FEB 05 2025              |
+------------------------------------------+
```

## Technical Details

### Query for Shared Page
```sql
SELECT 
  pl.*,
  p.display_name as sharer_name
FROM practice_logs pl
JOIN shared_practice_logs spl ON pl.id = spl.practice_log_id
JOIN profiles p ON spl.created_by = p.id
WHERE spl.share_token = $token
```

### Signup Flow
1. User enters name, email, password
2. On signup, Supabase creates auth.users row
3. Database trigger auto-creates profiles row with display_name

### Existing Users
For users who signed up before this change (no profile), the shared page will gracefully show just the app name without "Shared by" text.

