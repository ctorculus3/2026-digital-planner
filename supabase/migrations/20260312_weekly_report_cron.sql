-- Weekly report auto-generation cron job
-- Runs every Monday at 6:00 AM UTC via pg_cron + pg_net
-- Calls the generate-practice-report Edge Function in cron mode,
-- which iterates over all users who practiced during the previous week.

-- Store the service role key in vault for secure access from the cron job.
-- (The actual secret value must be inserted via Supabase Dashboard > Vault,
--  or by running: SELECT vault.create_secret('<service_role_key>', 'service_role_key'); )

SELECT cron.schedule(
  'weekly-practice-reports',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://cyiglozkytiadzpuqflh.supabase.co/functions/v1/generate-practice-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'service_role_key'
        LIMIT 1
      )
    ),
    body := '{"mode": "cron"}'::jsonb
  ) AS request_id;
  $$
);
