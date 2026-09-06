// ---------------------------------------------------------------------------
// Auth layer: account data lives in localStorage (no real database), but
// OTP generation + checking + emailing now happen on the real mail server
// in /server (index.js) via /api/send-otp and /api/verify-otp.
//
// This keeps the exact same exported interface AuthPage.jsx / App.jsx
// already use — authApi.register/login/verifyOtp/forgotPassword/
// resetPassword, saveSession, clearSession, getCurrentUser — so no UI code
// needs to change.
// ---------------------------------------------------------------------------

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:4040';

const USERS_KEY = 'drivefusion_mock_users';

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return readJSON(USERS_KEY, {});
}

function saveUsers(users) {
  writeJSON(USERS_KEY, users);
}

function makeFakeToken(email) {
  return btoa(`${email}:${Date.now()}:${Math.random().toString(36).slice(2)}`);
}

class ApiError extends Error {}

// Ask the real server to generate an OTP, store it in the visitor's
// session, and email it. `credentials: 'include'` is required so the
// session cookie set by the server is sent back on the next request
// (verify step) even though frontend and server run on different ports.
async function requestOtpEmail(email, purpose) {
  let response;
  try {
    response = await fetch(`${SERVER_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, purpose }),
    });
  } catch {
    throw new ApiError('Could not reach the mail server. Is it running on ' + SERVER_URL + '?');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.message || 'Failed to send verification email.');
  return data;
}

// Ask the real server to check the OTP the visitor typed against what it
// stored in their session.
async function confirmOtp(email, otp) {
  let response;
  try {
    response = await fetch(`${SERVER_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    });
  } catch {
    throw new ApiError('Could not reach the mail server. Is it running on ' + SERVER_URL + '?');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.message || 'Incorrect or expired code.');
  return data;
}

export const authApi = {
  async register({ fullName, email, password }) {
    await delay();
    if (!fullName || !email || !password) throw new ApiError('All fields are required.');
    const users = getUsers();
    const key = email.toLowerCase();
    if (users[key]) throw new ApiError('An account with this email already exists.');

    users[key] = { fullName, email, password, verified: false };
    saveUsers(users);

    const result = await requestOtpEmail(email, 'verify');
    return { message: result.message || `We sent a verification code to ${email}.` };
  },

  async login({ email, password }) {
    await delay();
    const users = getUsers();
    const key = (email || '').toLowerCase();
    const user = users[key];
    if (!user || user.password !== password) {
      throw new ApiError('Invalid email or password.');
    }

    if (!user.verified) {
      const result = await requestOtpEmail(email, 'verify');
      return { message: result.message || 'Please verify your email before signing in. We sent a new code.' };
    }

    return {
      token: makeFakeToken(key),
      user: { fullName: user.fullName, email: user.email },
    };
  },

  async verifyOtp({ email, otp }) {
    await delay();
    const key = (email || '').toLowerCase();
    await confirmOtp(email, otp);

    const users = getUsers();
    if (!users[key]) throw new ApiError('Account not found.');
    users[key].verified = true;
    saveUsers(users);

    return { message: 'Email verified successfully.' };
  },

  async forgotPassword({ email }) {
    await delay();
    const key = (email || '').toLowerCase();
    const users = getUsers();
    if (!users[key]) throw new ApiError('No account found with this email.');

    const result = await requestOtpEmail(email, 'reset');
    return { message: result.message || `We sent a password reset code to ${email}.` };
  },

  async resetPassword({ email, otp, newPassword }) {
    await delay();
    const key = (email || '').toLowerCase();
    await confirmOtp(email, otp);

    const users = getUsers();
    if (!users[key]) throw new ApiError('Account not found.');
    users[key].password = newPassword;
    saveUsers(users);

    return { message: 'Password reset successfully.' };
  },
};

export function saveSession(response) {
  if (response?.token) localStorage.setItem('drivefusion_token', response.token);
  if (response?.user) localStorage.setItem('drivefusion_user', JSON.stringify(response.user));
}

export function clearSession() {
  localStorage.removeItem('drivefusion_token');
  localStorage.removeItem('drivefusion_user');
}

export async function getCurrentUser() {
  const token = localStorage.getItem('drivefusion_token');
  const userRaw = localStorage.getItem('drivefusion_user');
  if (!token || !userRaw) return null;
  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
}
