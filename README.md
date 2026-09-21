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
for real** by a small Express server in `server/`, using Gmail + Nodemailer.

### 1. Set up the mail server

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:
- `GMAIL_USER` — your Gmail address
- `GMAIL_APP_PASSWORD` — a 16-character App Password (Google Account →
  Security → 2-Step Verification must be on → App passwords → generate one)
- `SESSION_SECRET` — any random string
- `APP_ORIGIN` — the frontend's URL, defaults to `http://localhost:5173`

Then run it:

```bash
npm start
```

You should see `Server is running on port 4040` and `[mail] ready to send
emails from you@gmail.com`.

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
  it in that visitor's session, and emails it via Gmail.
- Entering the code calls `POST /api/verify-otp`, which checks it against
  the session (10-minute expiry).
- `src/api.js` still exposes the same `authApi.register/login/verifyOtp/
  forgotPassword/resetPassword`, `saveSession`, `clearSession`, and
  `getCurrentUser` functions, so `AuthPage.jsx` and `App.jsx` needed zero
  changes.

This is still demo-grade (no real user database, in-memory session store),
but the emails are real. For production you'd add a real database and swap
Gmail for a transactional email provider (Resend, SendGrid, Postmark).
