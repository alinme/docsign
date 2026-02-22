-- Enable pg_cron and pg_net so we can schedule the expiring-reminders Edge Function.
-- If this fails (e.g. permission denied), enable them from Supabase Dashboard:
--   Database → Extensions → search "pg_cron" and "pg_net" → Enable.

create extension if not exists pg_cron;
create extension if not exists pg_net;
