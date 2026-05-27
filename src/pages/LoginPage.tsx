import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Eye, EyeOff, LogIn } from 'lucide-react';
import AuthPanel from '@/components/auth/AuthPanel';
import { loginUser, setSession, setRemembered, clearRemembered, getRemembered, getSession, UserAccount } from '@/lib/authStore';
export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // If already logged in, redirect
    if (getSession()) {
      navigate('/', {
        replace: true
      });
      return;
    }
    // Pre-fill remembered identifier
    const remembered = getRemembered();
    if (remembered) {
      setIdentifier(remembered);
      setRememberMe(true);
    }
  }, [navigate]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('Please enter your email or mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    const result = await loginUser(identifier.trim(), password);
    setLoading(false);
    if (result.success && result.user) {
      setSession(result.user as UserAccount);
      if (rememberMe) {
        setRemembered(identifier.trim());
      } else {
        clearRemembered();
      }
      navigate('/', {
        replace: true
      });
    } else {
      setError(result.error || 'Login failed.');
    }
  };
  return <div className="min-h-screen bg-background flex">
      {/* Login Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">

          {/* Logo + Brand */}
          <div className="text-center mb-10">
            <div className="inline-flex w-20 h-20 rounded-2xl overflow-hidden items-center justify-center mb-5 bg-white" style={{
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
          }}>
              <img src="https://images.fillout.com/orgid-657239/flowpublicid-m5ysogfz8t/widgetid-default/jx8DkWaz55Ny4zY6WLkktk/pasted-image-1776255317557.jpg" alt="Bombax Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className='tracking-widest uppercase font-extrabold text-[#ff0019] text-3xl'>Bombax Logistics</h1>
            <p className='text-muted-foreground mt-1.5 font-extrabold text-lg'>Analysis Dashboard</p>
          </div>

          {/* Login Card */}
          <form onSubmit={handleLogin} className="bg-card rounded-2xl border border-border p-8 space-y-5" style={{
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
        }}>
            <div>
              <h2 className="text-xl font-bold text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">Sign in to your logistics dashboard</p>
            </div>

            {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm font-medium">
                {error}
              </div>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                  Email / Mobile Number
                </label>
                <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="you@company.com or 9876543210" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-border accent-primary cursor-pointer" />
                <span className="text-xs font-medium text-muted-foreground">Remember Me</span>
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" size="lg" className='w-full font-bold text-base gap-2 shadow-sm bg-[#f20049]' disabled={loading}>
              {loading ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in…
                </span> : <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Login <ArrowRight className="w-4 h-4" />
                </span>}
            </Button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-xs text-muted-foreground mt-5">
            New user?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <AuthPanel />
    </div>;
}