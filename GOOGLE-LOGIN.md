# Google sign-in setup

The client login includes Continue with Google. Terms acceptance is required for both sign-in methods. Existing client profiles are reused; new Google clients complete their parish and contact details before entering the dashboard. Parish accounts are rejected.

Google is currently disabled in the Supabase project (checked via its public Auth settings). To enable live sign-in:

1. Create a Google OAuth web client and configure its consent screen. Add this authorized redirect URI: `https://lnipoknkbjcxwnggzrnm.supabase.co/auth/v1/callback`.
2. In Supabase Authentication → Sign In / Providers → Google, enable Google and enter the OAuth client ID and client secret. Keep the secret in Supabase; do not add it to frontend files.
3. In Supabase Authentication → URL Configuration, allow `http://localhost:5182/dist/index.html`, `http://127.0.0.1:5182/dist/index.html`, and the production site's `/dist/index.html` URL. Set the production Site URL as appropriate.
4. Open the client portal, accept the terms, and use Continue with Google. If the Google consent app is in testing, add the intended Google accounts as test users.

The flow opens outside the iframe and returns directly to the maintained dashboard. It uses the existing Supabase implicit callback handling and server-side user validation. No Google credentials are stored in the repository.

Official setup instructions: https://supabase.com/docs/guides/auth/social-login/auth-google
