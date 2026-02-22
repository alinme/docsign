# Agent memory / preferences

- **NEW-FEATURES (buildability):** All 7 items in `NEW-FEATURES` are buildable. Suggested order: (1) Automated reminders cron, (2) Bulk CSV send, (3) Stripe + free tier limits, (4) Webhooks & API keys, (5) Team workspaces, (6) Advanced PDF fields & attachments, (7) Signer 2FA. Saved for later reference.
- **Email links in dev:** Use `EMAIL_BASE_URL=http://localhost:3000` in `.env.local` so “Click here to sign” and other email links point to localhost when testing locally; omit in production.
- **“Me” button (signer):** After clicking “Me”, the toast now shows the email that was filled (e.g. “Filled with your details (sugin223pl@gmail.com)”) so the user can confirm they’re using the right account and avoid emails going to a different address (e.g. wrong Google account in session).
