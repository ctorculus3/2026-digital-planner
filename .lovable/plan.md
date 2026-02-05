
# Plan: Scheduled Data Purge After 90 Days of Inactivity

## Overview

This plan implements an automated system that deletes practice log data for users who have been inactive (no active subscription) for more than 90 days. The system will run daily and check each user's subscription status before purging their data.

## How It Works

1. A scheduled job runs once daily at 3:00 AM UTC
2. The job identifies all users who have practice logs in the database
3. For each user, it checks their Stripe subscription status
4. If a user has no active subscription AND their subscription ended more than 90 days ago, their practice logs are deleted
5. Users who never had a subscription (never completed checkout) will also have their data purged after 90 days of account creation

---

## Implementation Steps

### Step 1: Create the Purge Edge Function

Create a new backend function `purge-inactive-data` that:
- Uses the service role key to access all user data (bypasses RLS)
- Queries all unique user IDs from `practice_logs`
- For each user, checks their Stripe subscription status
- Deletes practice logs for users inactive for 90+ days
- Logs all actions for auditing purposes

### Step 2: Enable Required Database Extensions

Enable the `pg_cron` and `pg_net` extensions which are required for scheduling automated tasks.

### Step 3: Create the Scheduled Cron Job

Set up a daily cron job that calls the purge function at 3:00 AM UTC using SQL:

```text
Schedule: 0 3 * * *  (runs daily at 3:00 AM UTC)
Action: HTTP POST to the purge-inactive-data function
```

### Step 4: Add Logging Table (Optional but Recommended)

Create a `purge_logs` table to track:
- When purges occurred
- How many users were affected
- How many practice logs were deleted

This provides an audit trail and helps with debugging.

---

## Technical Details

### Edge Function Logic

```text
1. Query distinct user_ids from practice_logs
2. For each user_id:
   a. Look up user email from auth.users
   b. Check Stripe for customer by email
   c. If no customer found:
      - Check user created_at date
      - If created > 90 days ago, mark for deletion
   d. If customer found:
      - Get all subscriptions
      - Find the most recent subscription end date
      - If ended > 90 days ago, mark for deletion
3. Delete all practice_logs for marked users
4. Log results
```

### Security Considerations

- The function uses the service role key (already configured as a secret)
- JWT verification is disabled for this function since it's called by the cron job, not by users
- Authorization is handled via a secret token passed in the request header

### Data Flow Diagram

```text
+------------------+     +----------------------+     +--------+
|  pg_cron         | --> | purge-inactive-data  | --> | Stripe |
|  (daily 3AM UTC) |     | (Edge Function)      |     | API    |
+------------------+     +----------------------+     +--------+
                                   |
                                   v
                         +------------------+
                         | practice_logs    |
                         | (DELETE inactive)|
                         +------------------+
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/purge-inactive-data/index.ts` | Create | Main purge logic with Stripe integration |
| `supabase/config.toml` | Update | Add function configuration |
| Database migration | Create | Enable pg_cron, pg_net extensions |
| SQL insert | Execute | Schedule the cron job |

---

## Testing Strategy

1. **Manual Testing**: Call the purge function directly via curl to verify logic works
2. **Dry Run Mode**: Add a `dry_run` parameter that logs what would be deleted without actually deleting
3. **Monitor Logs**: Check backend function logs after deployment to verify scheduled execution

---

## Important Notes

- The cron job setup requires running a SQL command with your project's specific URL and anon key
- Users will NOT be notified before their data is deleted (you may want to add email notifications as a future enhancement)
- The purge is permanent - deleted data cannot be recovered
- The 90-day threshold can be adjusted in the edge function code if needed
