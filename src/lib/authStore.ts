// Auth store — backed by Zite Database via API endpoints
// Session is still persisted in localStorage for instant access

import { authLogin, authSignup, authFindUser, authResetPassword } from 'zite-endpoints-sdk';

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  mobile: string;
  role: string; // 'admin' | 'user'
}

const SESSION_KEY = 'bombax_session';
const REMEMBER_KEY = 'bombax_remember';
const OTP_KEY = 'bombax_otp';

// ─── Session (localStorage — unchanged interface) ───────────────────────────

export function getSession(): UserAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(user: UserAccount) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Remember Me (localStorage — unchanged) ─────────────────────────────────

export function setRemembered(identifier: string) {
  localStorage.setItem(REMEMBER_KEY, identifier);
}

export function getRemembered(): string {
  return localStorage.getItem(REMEMBER_KEY) || '';
}

export function clearRemembered() {
  localStorage.removeItem(REMEMBER_KEY);
}

// ─── Auth API calls ──────────────────────────────────────────────────────────

export async function createUser(data: {
  email: string;
  fullName: string;
  mobile: string;
  password: string;
}): Promise<{ success: boolean; error?: string; user?: UserAccount }> {
  try {
    const result = await authSignup(data);
    if (!result.success || !result.user) return { success: false, error: result.error || 'Account creation failed.' };
    return { success: true, user: result.user as UserAccount };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const result = await authLogin({ identifier, password });
    if (!result.success || !result.user) return { success: false, error: result.error || 'Login failed.' };
    return { success: true, user: result.user as UserAccount };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function findUserByIdentifier(identifier: string): Promise<{ found: boolean }> {
  try {
    return await authFindUser({ identifier });
  } catch {
    return { found: false };
  }
}

export async function resetPassword(identifier: string, newPassword: string): Promise<boolean> {
  try {
    const result = await authResetPassword({ identifier, newPassword });
    return result.success;
  } catch {
    return false;
  }
}

// ─── OTP (local demo — unchanged) ───────────────────────────────────────────

export function generateOtp(identifier: string): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 5 * 60 * 1000;
  localStorage.setItem(OTP_KEY, JSON.stringify({ identifier, otp, expiry }));
  return otp;
}

export function verifyOtp(identifier: string, otp: string): boolean {
  try {
    const raw = localStorage.getItem(OTP_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data.identifier === identifier && data.otp === otp && Date.now() < data.expiry;
  } catch {
    return false;
  }
}

export function clearOtp() {
  localStorage.removeItem(OTP_KEY);
}
