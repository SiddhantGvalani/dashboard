import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, Shield, LogOut, User } from 'lucide-react';
import { getSession, clearSession, UserAccount } from '@/lib/authStore';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession() as UserAccount | null;

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-40">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between max-w-7xl">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img
            src="https://images.fillout.com/orgid-657239/flowpublicid-m5ysogfz8t/widgetid-default/p6iHvhG6UE1c9KfxRzuwGk/pasted-image-1775499782845.jpg"
            alt="Bombax Logo"
            className="w-10 h-10 object-contain bg-[#de1212] shadow-[0_4px_6px_-1px_#e31b1b6e,_0_2px_4px_-2px_#e31b1b6e]"
          />
          <div className="hidden sm:block">
            <p className="text-[#f70a0a] font-extrabold text-2xl shadow-[0_4px_6px_-1px_#c93a5c80,_0_2px_4px_-2px_#c93a5c80] bg-[#ffffff]">
              BOMBAX LOGISTICS
            </p>
          </div>
        </button>

        <nav className="flex items-center gap-1">
          {session && (
            <div className="hidden md:flex items-center gap-1.5 mr-3 bg-muted/60 rounded-lg px-3 py-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium max-w-[160px] truncate">
                {session?.fullName || session?.email}
              </span>
            </div>
          )}
          <Button
            variant={location.pathname === '/admin' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/admin')}
            className="gap-1.5"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
          <Button
            variant={location.pathname === '/settings' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => navigate('/settings')}
            className="gap-1.5"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
