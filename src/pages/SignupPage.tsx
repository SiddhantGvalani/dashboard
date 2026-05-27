import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Eye, EyeOff, UserPlus } from 'lucide-react';
import AuthPanel from '@/components/auth/AuthPanel';
import { createUser } from '@/lib/authStore';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = (): string | null => {
    if (!form.fullName.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    if (!form.mobile.trim()) return 'Mobile number is required.';
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return 'Please enter a valid 10-digit Indian mobile number.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    const result = await createUser({
      email: form.email.trim(),
      fullName: form.fullName.trim(),
      mobile: form.mobile.trim(),
      password: form.password,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Account creation failed.');
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Account Created!</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Welcome, <span className="font-semibold text-foreground">{form.fullName}</span>!<br />
                Your account has been successfully created.
              </p>
            </div>
            <div
              className="bg-card border border-border rounded-xl p-5 text-left space-y-2"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            >
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Account Details</p>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Name:</span> <span className="font-semibold">{form.fullName}</span></p>
                <p><span className="text-muted-foreground">Email:</span> <span className="font-semibold">{form.email}</span></p>
                <p><span className="text-muted-foreground">Mobile:</span> <span className="font-semibold">{form.mobile}</span></p>
              </div>
            </div>
            <Button size="lg" className="w-full font-bold gap-2" onClick={() => navigate('/login')}>
              <ArrowRight className="w-4 h-4" /> Go to Login
            </Button>
          </div>
        </div>
        <AuthPanel />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Signup Panel */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm py-6">

          {/* Logo */}
          <div className="text-center mb-8">
            <div
              className="inline-flex w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-5"
              style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
            >
              <span className="text-primary-foreground font-black text-4xl tracking-tighter">B</span>
            </div>
            <h1 className="text-2xl font-black text-primary tracking-widest uppercase">
              Bombax Logistics
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-medium">Create Your Account</p>
          </div>

          {/* Signup Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl border border-border p-8 space-y-4"
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
          >
            <div>
              <h2 className="text-xl font-bold text-foreground">Create Account</h2>
              <p className="text-sm text-muted-foreground mt-1">Fill in your details to get started</p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="John Doe"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@company.com"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 rounded-lg border border-border bg-muted text-sm text-muted-foreground font-medium select-none">
                  +91
                </div>
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="9876543210"
                  maxLength={10}
                  className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 6 characters"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <PasswordStrength password={form.password} />
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Re-enter your password"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-destructive mt-1 font-medium">Passwords do not match</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 6 && (
                <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-bold text-base gap-2 mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                  Creating Account…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Create Account
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <AuthPanel />
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-destructive', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < strength ? colors[strength - 1] : 'bg-muted'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength < 2 ? 'text-destructive' : strength < 3 ? 'text-orange-500' : 'text-green-600'}`}>
        {labels[strength - 1] || 'Too short'}
      </p>
    </div>
  );
}
