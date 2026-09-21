import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import nodemailer from 'nodemailer';

// Express instance
const app = express();

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
    cookie: { secure: false }, // set true only when served over HTTPS
}));

// Mail transporter (Gmail + App Password)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

transporter.verify((err) => {
    if (err) console.error('[mail] config error:', err.message);
    else console.log('[mail] ready to send emails from', process.env.GMAIL_USER);
});

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
        await transporter.sendMail({
            from: `"DriveFusion" <${process.env.GMAIL_USER}>`,
            to: email,
            subject,
            html,
        });
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

// Start the server
const PORT = process.env.PORT || 4040;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
