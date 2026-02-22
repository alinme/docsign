# Expiring reminders Edge Function

Sends reminder emails to **pending signers** for documents that **expire within 48 hours**. Uses Resend and runs on a schedule (e.g. daily via pg_cron).

## Behaviour

- Queries `documents` where `status = 'Pending'` and `expires_at` is between now and now + 48 hours.
- For each document, sends one email per signer (from `signers` array) with a “Click here to sign” link.
- Logs each send in `audit_logs` with `action = 'EMAIL_SENT'` and `details.event = 'expiring_reminder'`.

## Secrets (Supabase Dashboard → Edge Functions → expiring-reminders → Secrets)

| Secret | Required | Description |
|--------|----------|-------------|
| `RESEND_API_KEY` | Yes | Resend API key (same as in your app). |
| `CRON_SECRET` | Recommended | Shared secret for `Authorization: Bearer <CRON_SECRET>`. If not set, the function allows unauthenticated calls. |
| `APP_URL` or `NEXT_PUBLIC_APP_URL` | Yes | Base URL for sign links (e.g. `https://getsign.app`). |
| `RESEND_FROM` | Optional | Override sender (e.g. `GetSign <doc@getsign.app>`). |
| `RESEND_FROM_NAME` / `RESEND_FROM_EMAIL` | Optional | Used if `RESEND_FROM` is not set. |

## Deploy

```bash
supabase functions deploy expiring-reminders
```

## Invoke manually

Supabase requires a valid JWT in `Authorization`. Use your **anon key** there and pass the cron secret in `X-Cron-Secret`:

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/expiring-reminders" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "X-Cron-Secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

## Schedule with pg_cron (Supabase)

1. Enable **pg_cron** and **pg_net** in Dashboard → Database → Extensions.
2. Create Vault secrets (SQL Editor):

   ```sql
   select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'expiring_reminders_project_url');
   select vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'expiring_reminders_anon_key');
   select vault.create_secret('YOUR_CRON_SECRET', 'expiring_reminders_cron_secret');
   ```

3. Run the migration that schedules the job (or run the `cron.schedule` SQL from `migrations/20260222000000_schedule_expiring_reminders.sql`).

The default schedule is **daily at 09:00 UTC**. To change it, edit the cron expression in the migration (e.g. `'0 9 * * *'`).
