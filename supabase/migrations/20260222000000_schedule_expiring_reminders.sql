-- Schedule daily invocation of the expiring-reminders Edge Function (documents expiring in 48h).
-- Requires: pg_cron and pg_net enabled (Dashboard → Database → Extensions).
-- Before running this migration, create Vault secrets in SQL Editor:
--
--   select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'expiring_reminders_project_url');
--   select vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'expiring_reminders_anon_key');
--   select vault.create_secret('YOUR_CRON_SECRET', 'expiring_reminders_cron_secret');
--
-- Use the same CRON_SECRET value as in the Edge Function secrets (X-Cron-Secret).

select cron.schedule(
  'expiring-reminders-daily',
  '0 9 * * *',  -- Every day at 09:00 UTC
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'expiring_reminders_project_url') || '/functions/v1/expiring-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'expiring_reminders_anon_key'),
      'X-Cron-Secret', (select trim(decrypted_secret::text) from vault.decrypted_secrets where name = 'expiring_reminders_cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
