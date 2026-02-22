# Social Auth & Login/Landing Split — Design

**Goal:** Add optional social sign-in (Supabase OAuth) controllable from Settings, and redesign the login page into a fixed sign-in/sign-up half and a scrollable landing half with footer links.

**Architecture:** Social auth is enabled per-user via Settings toggle (stored in `user_metadata.social_login_enabled` and a cookie for the login page when unauthenticated). Login page uses Supabase client-side `signInWithOAuth` for Google (and extensible for other providers). Login layout: two-column on desktop (fixed form | scrollable landing + footer); mobile: stacked with same behavior. All copy from i18n (`messages/en.json`).

**Tech stack:** Next.js 16, Supabase Auth (OAuth), next-intl, Tailwind.

**Supabase:** Add your app’s callback URL to the [Redirect URLs](https://supabase.com/dashboard/project/_/auth/url-configuration) allow list (e.g. `http://localhost:3000/auth/callback` and your production URL). Enable the Google (or other) provider in Authentication → Providers.

---

## Decisions

- **Settings toggle:** "Enable social sign-in on login page" — persisted to `user_metadata` and cookie `docsign_social_login_enabled` so the login page can hide/show social buttons when user is not logged in (default: show).
- **Login page:** Left column fixed (sign-in/sign-up card); right column scrollable (landing copy + footer with About, Privacy, Cookies, Terms, Documentation as links; pages created later).
- **i18n:** All new strings in `messages/en.json` under `Auth`, `Settings`, and `Landing`.
