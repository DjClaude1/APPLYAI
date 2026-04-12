import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { FileText, Search, LayoutDashboard, Settings, LogOut, Briefcase, Menu } from 'lucide-react';

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {user && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
              <Menu size={24} />
            </Button>
          )}
          {!user && (
            <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight">
              <div className="bg-primary text-primary-foreground p-1 rounded-lg">
                <Briefcase size={24} />
              </div>
              <span>ApplyAI</span>
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-6">
          {/* Main navigation moved to Sidebar */}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/settings">
                <Button variant="ghost" size="icon">
                  <Settings size={20} />
                </Button>
              </Link>
              <Button variant="outline" onClick={logout} className="gap-2">
                <LogOut size={16} /> Logout
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
