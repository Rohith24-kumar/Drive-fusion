import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react';
import { authApi, saveSession } from './api';

const initialForm = { fullName: '', email: '', password: '', confirmPassword: '', otp: '' };

export default function AuthPage({ onBack, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [seconds, setSeconds] = useState(600);
  const [theme, setTheme] = useState(() => localStorage.getItem('drivefusion_theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('drivefusion_theme', theme);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', theme === 'dark' ? '#07101f' : '#f7faff');
  }, [theme]);

  useEffect(() => {
    if (!['verify', 'reset'].includes(mode) || seconds <= 0) return;
    const timer = setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [mode, seconds]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const resetNotices = () => { setError(''); setMessage(''); setDevOtp(''); };
  const switchMode = (next) => { resetNotices(); setForm(initialForm); setSeconds(600); setMode(next); };

  async function submit(event) {
    event.preventDefault(); resetNotices(); setBusy(true);
    try {
      if (mode === 'login') {
        const response = await authApi.login({ email: form.email, password: form.password });
        if (!response.token) {
          setDevOtp(response.devOtp || ''); setMessage(response.message); setSeconds(600); setMode('verify');
        } else { saveSession(response); onAuthenticated(response.user); }
      } else if (mode === 'register') {
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match.');
        const response = await authApi.register({ fullName: form.fullName, email: form.email, password: form.password });
        setDevOtp(response.devOtp || ''); setMessage(response.message); setSeconds(600); setMode('verify');
      } else if (mode === 'verify') {
        await authApi.verifyOtp({ email: form.email, otp: form.otp });
        setMessage('Email verified. You can now log in.'); setSeconds(600); setMode('login');
      } else if (mode === 'forgot') {
        const response = await authApi.forgotPassword({ email: form.email });
        setDevOtp(response.devOtp || ''); setMessage(response.message); setSeconds(600); setMode('reset');
      } else if (mode === 'reset') {
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match.');
        await authApi.resetPassword({ email: form.email, otp: form.otp, newPassword: form.password });
        setMessage('Password reset successfully. Log in with your new password.'); setForm((f) => ({ ...f, password: '', confirmPassword: '', otp: '' })); setMode('login');
      }
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  const titles = { login: 'Welcome back', register: 'Create your account', verify: 'Verify your email', forgot: 'Reset your password', reset: 'Choose a new password' };
  const subtitles = { login: 'Sign in to your DriveFusion workspace.', register: 'Start managing every drive from one place.', verify: 'Enter the 6-digit code sent to your email.', forgot: 'We’ll send a one-time code to your account.', reset: 'Use your OTP and set a strong new password.' };
  const submitLabels = { login: 'Sign In', register: 'Create Account', verify: 'Verify Email', forgot: 'Send Reset Code', reset: 'Reset Password' };
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0'); const secs = String(seconds % 60).padStart(2, '0');

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" />
      <button className="auth-back" onClick={onBack}><ArrowLeft size={17} /> Back to DriveFusion</button>
      <button className="auth-theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="auth-shell">
        <div className="auth-brand-panel">
          <div className="auth-brand-mark"><span>D</span><i /></div>
          <div className="auth-brand-name">Drive<span>Fusion</span></div>
          <div className="auth-badge"><ShieldCheck size={14} /> Secure authentication</div>
          <h1>One login.<br /><span>Every drive.</span></h1>
          <p>Securely access your unified cloud workspace with token-based authentication and protected sessions.</p>
          <div className="auth-benefits"><span><CheckCircle2 /> BCrypt password hashing</span><span><CheckCircle2 /> JWT-protected sessions</span><span><CheckCircle2 /> OTP verification</span></div>
        </div>
        <div className="auth-card">
          <div className="auth-card-top"><div className="auth-mini-icon"><LockKeyhole size={18} /></div><span>{mode === 'login' ? 'ACCOUNT ACCESS' : 'ACCOUNT SECURITY'}</span></div>
          <h2>{titles[mode]}</h2><p className="auth-subtitle">{subtitles[mode]}</p>
          {message && <div className="auth-message"><CheckCircle2 size={17} /> {message}</div>}
          {error && <div className="auth-error">{error}</div>}
          {devOtp && <div className="dev-otp">Development OTP: <strong>{devOtp}</strong></div>}
          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && <label><span>Full name</span><div className="auth-input"><UserRound size={17} /><input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Rohith Kumar" minLength="2" required /></div></label>}
            {mode !== 'reset' && <label><span>Email address</span><div className="auth-input"><Mail size={17} /><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" required /></div></label>}
            {['verify','reset'].includes(mode) && mode === 'reset' && <label><span>Email address</span><div className="auth-input"><Mail size={17} /><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" required /></div></label>}
            {mode === 'verify' || mode === 'reset' ? <label><span>6-digit OTP</span><div className="auth-input otp-input"><ShieldCheck size={17} /><input inputMode="numeric" maxLength="6" pattern="[0-9]{6}" value={form.otp} onChange={(e) => update('otp', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" required /></div><small className={seconds === 0 ? 'expired' : ''}>{seconds ? `Code expires in ${minutes}:${secs}` : 'Code expired. Request a new one.'}</small></label> : null}
            {['login','register','reset'].includes(mode) && <label><span>{mode === 'reset' ? 'New password' : 'Password'}</span><div className="auth-input"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Minimum 8 characters" minLength="8" required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>}
            {['register','reset'].includes(mode) && <label><span>Confirm password</span><div className="auth-input"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="Repeat your password" minLength="8" required /></div></label>}
            <button className="btn btn-primary auth-submit" disabled={busy || ((mode === 'verify' || mode === 'reset') && seconds === 0)}>{busy ? 'Please wait…' : submitLabels[mode]} <ArrowRight size={17} /></button>
          </form>
          <div className="auth-switches">
            {mode === 'login' && <><button onClick={() => switchMode('forgot')}>Forgot password?</button><span>New here? <button onClick={() => switchMode('register')}>Create an account</button></span></>}
            {mode === 'register' && <span>Already have an account? <button onClick={() => switchMode('login')}>Sign in</button></span>}
            {mode === 'forgot' && <button onClick={() => switchMode('login')}>Back to sign in</button>}
            {mode === 'verify' && <span>Verified already? <button onClick={() => switchMode('login')}>Go to login</button></span>}
            {mode === 'reset' && <button onClick={() => switchMode('forgot')}>Request another code</button>}
          </div>
          <small className="auth-footer-note">By continuing, you agree to DriveFusion’s terms and privacy policy.</small>
        </div>
      </div>
    </div>
  );
}
