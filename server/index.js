import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Express instance
const app = express();

// Render (and most hosts) terminate HTTPS in front of the app; trust the proxy
// so secure cookies and req.protocol work correctly.
app.set('trust proxy', 1);

// Middlewares
app.use(cors({
    origin: process.env.APP_ORIGIN || 'http://localhost:5173', // your Vite frontend
    credentials: true, // needed so the session cookie is sent/received
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: true,
    // 'auto' = secure cookie over HTTPS (Render), plain cookie on http://localhost
    cookie: { secure: 'auto', sameSite: 'lax', maxAge: 10 * 60 * 1000 },
}));

// Mail sender: Brevo transactional email REST API (free plan: 300 emails/day).
// It uses HTTPS (port 443), so it works on Render's free tier, which blocks SMTP ports.
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL; // must be a verified sender in Brevo
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'DriveFusion';

async function sendMail({ to, subject, html }) {
    if (!BREVO_API_KEY || !MAIL_FROM_EMAIL) {
        throw new Error('BREVO_API_KEY and MAIL_FROM_EMAIL must be set.');
    }
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json',
            accept: 'application/json',
        },
        body: JSON.stringify({
            sender: { name: MAIL_FROM_NAME, email: MAIL_FROM_EMAIL },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
        signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Brevo responded ${response.status}: ${detail}`);
    }
}

if (BREVO_API_KEY && MAIL_FROM_EMAIL) {
    console.log('[mail] Brevo configured, sending as', MAIL_FROM_EMAIL);
} else {
    console.error('[mail] config error: set BREVO_API_KEY and MAIL_FROM_EMAIL');
}

// Routes

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend API is running smoothly!' });
});

// 1. Generate an OTP, remember it in the visitor's session, and email it
app.post('/api/send-otp', async (req, res) => {
    const { email, purpose } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email is required.' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    req.session.otp = otp;
    req.session.otpEmail = email.toLowerCase();
    req.session.otpPurpose = purpose || 'verify';
    req.session.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const subject = purpose === 'reset'
        ? 'DriveFusion password reset code'
        : 'Verify your DriveFusion email';
    const html = `
      <div style="font-family: sans-serif; max-width: 420px; margin: auto;">
        <h2>${subject}</h2>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
        <p style="color:#666; font-size: 13px;">This code expires in 10 minutes.</p>
      </div>
    `;

    try {
        await sendMail({ to: email, subject, html });
        res.json({ message: 'OTP sent.' });
    } catch (err) {
        console.error('[mail] send failed:', err.message);
        res.status(500).json({ message: 'Failed to send email.' });
    }
});

// 2. Check the code the visitor typed against what's stored in their session
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body || {};

    if (!req.session.otp) {
        return res.status(400).json({ message: 'No code was requested.' });
    }
    if (Date.now() > req.session.otpExpiresAt) {
        return res.status(400).json({ message: 'Code expired. Request a new one.' });
    }
    if (req.session.otpEmail !== (email || '').toLowerCase() || req.session.otp !== otp) {
        return res.status(400).json({ message: 'Incorrect code.' });
    }

    delete req.session.otp;
    delete req.session.otpEmail;
    delete req.session.otpExpiresAt;
    res.json({ message: 'Verified.' });
});

// Serve the built React frontend (run `npm run build` in the project root first)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));

// Start the server
const PORT = process.env.PORT || 4040;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
