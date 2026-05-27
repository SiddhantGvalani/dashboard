import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { LogOut, Mail, User, Phone } from 'lucide-react';
import { getSession, clearSession } from '@/lib/authStore';

export default function SettingsPage() {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-10 max-w-xl">
        <h2 className="text-2xl font-black text-foreground mb-6">Settings</h2>

        <div className="rounded-2xl border-2 border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">
                {session?.fullName || 'Your Account'}
              </p>
              {session?.email && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{session.email}</span>
                </div>
              )}
              {session?.mobile && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>+91 {session.mobile}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Account
            </h3>
            <Button variant="destructive" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
              About
            </h3>
            <p className="text-sm text-muted-foreground">
              Bombax Logistics Analytics Platform — powered by Google Sheets API with local IndexedDB caching (5-minute TTL).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
