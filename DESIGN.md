# DioLink design

The Parish and User portals use a warm white and sage palette, Lora headings,
and DM Sans body text. System fonts provide fallbacks if Google Fonts is unavailable.

- Shared foundation: `dist/assets/heaven.css`
- Final vibrant screen theme: `dist/assets/vibrant.css` (loaded after `simple-parish.css`)
- Dimensional church icon: `dist/assets/vibrant-church.svg`
- Dashboard bento layout: `dist/assets/home-bento.css` (loaded after `vibrant.css`)
- Certificate services layout: `dist/assets/certificate-bento.css`
- Mass schedules and visit planning: `dist/assets/mass-bento.css`
- Appointment calendar and booking form: `dist/assets/appointments-bento.css`
- Live viewer and stream schedule: `dist/assets/live-bento.css`
- Member notice board: `dist/assets/announcements-bento.css`
- Request tracking and empty state: `dist/assets/requests-bento.css`
- Member profile, edit form, and preferences: `dist/assets/profile-bento.css`
- Parish secretary and AI help: `dist/assets/support-bento.css`
- Functional member preferences: `dist/assets/member-preferences.js` and `.css`
- Login, registration, and recovery presentation: `dist/assets/login-vibrant.css`

Profile preferences are stored per account in this browser. Theme selection replaces
the former light-mode lock. Notification preferences suppress new pop-up alerts
without removing the notification inbox. Prayer updates display prayer-related
items from the dashboard's latest 20 published parish notices. These preferences
do not sync across devices. Run `node scripts/check-member-preferences.mjs` with
the design preview server and Chrome debugging session to verify persistence,
theme changes, account isolation, and prayer-card visibility.
- Church illustration: `dist/assets/heaven-church.svg`
- Application entry: `dist/index.html`
- Maintained application bundle: `dist/assets/index-v20260422157000.js`

Run `npm.cmd run dev` in PowerShell. Run `npm.cmd run build` to produce
`site-build/`, then `npm.cmd run preview` to preview that output.
The build preserves `dist/`: it contains the application and must not be cleared.

The final theme pairs Sora headings with DM Sans body text, using system sans-serif
fallbacks when web fonts are unavailable. It uses violet, sky blue, and coral accents, raised cards and icon
tiles, with mobile and dark-theme overrides. Hover movement respects reduced
motion preferences. It applies only to screens so certificate printing retains
its existing styling. The recovery email in `supabase/templates/recovery.html`
uses matching inline styles with solid-color fallbacks for email clients.

Browser verification uses `scripts/preview-design.mjs` on port 5181 and an isolated
Chrome debugging session on port 9223. `scripts/check-heaven-design.mjs` checks
22 routes at desktop and mobile widths, calendar navigation, the booking dialog,
mobile navigation, password visibility, registration layout, and theme switching.
These checks use mock account data and intercept database calls; they do not
validate live database transactions. Screenshots are saved to `.design-preview/`.

The missing application files were restored from the local `dio-main.zip` backup.
Diocese routes, screens, and chat were removed again before applying the redesign.
