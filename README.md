# Now I Started — Lavender Web App

Secure React + Vite + Tailwind + Firebase starter implementing:

- Email-link sign up, email+password sign-in, password reset
- Timer with pause/resume/stop, extension flow, public/anonymous toggles
- Reflection modals and status mapping (cancelled, stopped_early, completed, times_up_incomplete, extended)
- Community feed with 15‑minute daily viewing lock and progress bar
- Profile page with editable name, avatar initial, and simple analytics

## Quickstart

1) Copy `.env.local.example` to `.env.local` and fill your Firebase web app keys.
2) Enable **Authentication** in Firebase console:
   - Providers: *Email/Password* and *Email link (passwordless)*.
3) Create Firestore database (in "production mode") and publish `firestore.rules`.
4) Install & run:

```bash
npm install
npm run dev
```

## Notes on Privacy

- If a task is posted as **Anonymous**, subsequent reflection visibility toggles are disabled in the UI and reflections are saved as private.
- Reflection text is stored under `shares/{shareId}/reflections/main` with its own `public` boolean so security rules can protect private reflections while leaving the parent post readable.

## Project Structure

```
now-i-started/
  src/
    components/ui/         # Toggle, Modal, ProgressBar, Avatar
    layouts/               # AppLayout
    lib/                   # Firebase initialization
    hooks/                 # useCountdown
    pages/                 # Community, Timer, Profile
      auth/                # SignIn, SignUp, ResetPassword, CompleteEmail
    state/                 # auth provider, app state
    utils/                 # time helpers
  firestore.rules
  index.html
  tailwind.config.js
  postcss.config.js
  vite.config.js
  package.json
```
