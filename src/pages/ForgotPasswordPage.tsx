import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import AuthPanel from '@/components/auth/AuthPanel';
import {
  findUserByIdentifier,
  generateOtp,
  verifyOtp,
  clearOtp,
  resetPassword,
} from '@/lib/authStore';

type Step = 'request' | 'otp' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown(v => {
        if (v <= 1) { clearInterval(interval); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) { setError('Please enter your email or mobile number.'); return; }

    setLoading(true);
    const { found } = await findUserByIdentifier(identifier.trim());
    setLoading(false);

    if (!found) {
      setError('No account found with this email or mobile number.');
      return;
    }

    const code = generateOtp(identifier.trim());
    setGeneratedOtp(code);
    startCooldown();
    setStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    setLoading(false);

    if (!verifyOtp(identifier.trim(), otp)) {
      setError('Invalid or expired OTP. Please try again.');
      return;
    }

    clearOtp();
    setStep('reset');
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    const code = generateOtp(identifier.trim());
    setGeneratedOtp(code);
    setOtp('');
    setError('');
    startCooldown();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const ok = await resetPassword(identifier.trim(), newPassword);
    setLoading(false);

    if (!ok) { setError('Something went wrong. Please start over.'); return; }
    setStep('success');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-10">
            <div
              className="inline-flex w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-5"
              style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
            >
              <span className="text-primary-foreground font-black text-4xl tracking-tighter">B</span>
            </div>
            <h1 className="text-2xl font-black text-primary tracking-widest uppercase">
              Bombax Logistics
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-medium">Password Recovery</p>
          </div>

          <div
            className="bg-card rounded-2xl border border-border p-8"
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
          >
            {/* STEP 1 — Request OTP */}
            {step === 'request' && (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Forgot Password?</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your registered email or mobile number. We'll send you a verification code.
                  </p>
                </div>
                {error && <ErrorBox message={error} />}
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                    Email / Mobile Number
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="you@company.com or 9876543210"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full font-bold gap-2" disabled={loading}>
                  {loading ? <Spinner /> : <><ArrowRight className="w-4 h-4" /> Send OTP</>}
                </Button>
              </form>
            )}

            {/* STEP 2 — Enter OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Enter OTP</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    A 6-digit code has been sent to <span className="font-semibold text-foreground">{identifier}</span>
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Your OTP (demo — in production this is sent via SMS/Email)</p>
                  <p className="text-3xl font-black tracking-[0.3em] text-primary">{generatedOtp}</p>
                  <p className="text-xs text-muted-foreground mt-1">Valid for 5 minutes</p>
                </div>

                {error && <ErrorBox message={error} />}
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-center text-lg tracking-widest font-bold"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full font-bold gap-2" disabled={loading}>
                  {loading ? <Spinner /> : <><ArrowRight className="w-4 h-4" /> Verify OTP</>}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="text-xs text-primary font-semibold hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3 — Set New Password */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Set New Password</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choose a strong new password for your account.</p>
                </div>
                {error && <ErrorBox message={error} />}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full font-bold gap-2" disabled={loading}>
                  {loading ? <Spinner /> : <><ArrowRight className="w-4 h-4" /> Reset Password</>}
                </Button>
              </form>
            )}

            {/* STEP 4 — Success */}
            {step === 'success' && (
              <div className="space-y-5 text-center">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Password Reset!</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your password has been updated successfully. You can now log in with your new password.
                  </p>
                </div>
                <Button size="lg" className="w-full font-bold gap-2" onClick={() => navigate('/login')}>
                  <ArrowRight className="w-4 h-4" /> Back to Login
                </Button>
              </div>
            )}
          </div>

          {step !== 'success' && (
            <p className="text-center text-xs text-muted-foreground mt-5">
              <Link to="/login" className="text-primary font-semibold hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </Link>
            </p>
          )}
        </div>
      </div>

      <AuthPanel />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm font-medium">
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <span className="flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
      Please wait…
    </span>
  );
}
