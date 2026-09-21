# DriveFusion Landing Page

Enhanced React + Vite landing page for DriveFusion.

## Highlights
- Responsive desktop/tablet/mobile layout
- Active navigation based on scroll position
- Animated hero cloud-drive hub
- Interactive feature cards and dashboard mockup
- Security section with animated protection visual
- FAQ accordion
- New About / product positioning section
- Toast feedback instead of browser alert
- Better hover/focus states
- Reduced-motion accessibility support
- Responsive mobile navigation

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Authentication + real email OTP

Account data (name/email/password) lives in the browser's `localStorage` —
there's no real database. But OTP codes are generated, checked, and **emailed
for real** by a small Express server in `server/`, using the Brevo email API.

### 1. Set up the mail server

Emails are sent through [Brevo](https://www.brevo.com) (free plan: 300 emails/day) using its
HTTPS API, so it also works on hosts that block SMTP (e.g. Render's free tier).

1. Create a free Brevo account and confirm your email.
2. Go to **SMTP & API → API Keys** and generate an API key.
3. The email you signed up with is already a verified sender in Brevo (check **Senders, Domains & Dedicated IPs → Senders**).

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:
- `BREVO_API_KEY` — the API key from Brevo
- `MAIL_FROM_EMAIL` — a verified Brevo sender (your signup email)
- `MAIL_FROM_NAME` — display name, defaults to `DriveFusion`
- `SESSION_SECRET` — any random string
- `APP_ORIGIN` — the frontend's URL, defaults to `http://localhost:5173`

Then run it:

```bash
npm start
```

You should see `Server is running on port 4040` and `[mail] Brevo configured, sending as ...`.

### 2. Run the frontend (separate terminal)

```bash
npm install
npm run dev
```

By default the frontend calls the mail server at `http://localhost:4040`.
To change that, add a `.env` file at the project root with:

```
VITE_API_URL=http://localhost:4040
```

### How it works

- Register / login (unverified) / forgot-password all call
  `POST /api/send-otp` on the server, which generates a 6-digit code, stores
  it in that visitor's session, and emails it via Brevo.
- Entering the code calls `POST /api/verify-otp`, which checks it against
  the session (10-minute expiry).
- `src/api.js` still exposes the same `authApi.register/login/verifyOtp/
  forgotPassword/resetPassword`, `saveSession`, `clearSession`, and
  `getCurrentUser` functions, so `AuthPage.jsx` and `App.jsx` needed zero
  changes.

This is still demo-grade (no real user database, in-memory session store),
but the emails are real. For production you'd add a real database and send from
your own authenticated domain (better inbox placement).

## Deploying on Render (single Web Service)

The Express server also serves the built frontend, so one service runs everything on one origin (no CORS/cookie issues).

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install && npm run build && npm install --prefix server` |
| Start Command | `node server/index.js` |

Environment variables (Render dashboard → Environment):
- `BREVO_API_KEY`, `MAIL_FROM_EMAIL`, `SESSION_SECRET` (and optionally `MAIL_FROM_NAME`)
- Do **not** set `PORT` — Render provides it.

Works on Render's **free** instance type: Brevo is called over HTTPS, and free Render services only block SMTP ports.

**Deliverability note:** without your own domain, Brevo replaces a free address like `@gmail.com` with one of its own sender
addresses, so OTP emails may occasionally land in spam. Authenticating your own domain in Brevo fixes this.

**Never commit `server/.env`** — keep real secrets only in Render's environment settings.
