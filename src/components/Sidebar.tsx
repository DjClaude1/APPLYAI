import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Briefcase, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Sidebar({ 
  isOpen, 
  onClose, 
  isCollapsed, 
  setIsCollapsed 
}: { 
  isOpen?: boolean, 
  onClose?: () => void,
  isCollapsed: boolean,
  setIsCollapsed: (val: boolean) => void
}) {
  const { user, userData, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Resume Builder', path: '/resume-builder', icon: FileText },
    { name: 'Magic Apply', path: '/magic-apply', icon: Zap },
    { name: 'Job Search', path: '/job-search', icon: Search },
    { name: 'Cover Letter', path: '/cover-letter', icon: FileText },
    { name: 'Applications', path: '/applications', icon: Briefcase },
  ];

  if (userData?.role === 'admin') {
    navItems.push({ name: 'Admin', path: '/admin', icon: ShieldCheck });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" 
          onClick={onClose}
        />
      )}

      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r transition-all duration-300 z-50 flex flex-col",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-4 border-b">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl overflow-hidden whitespace-nowrap">
          <div className="bg-primary text-primary-foreground p-1 rounded-lg shrink-0">
            <Briefcase size={20} />
          </div>
          {!isCollapsed && <span className="transition-opacity duration-300">ApplyAI</span>}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} className={cn("shrink-0", isActive ? "" : "group-hover:scale-110 transition-transform")} />
              {!isCollapsed && (
                <span className="text-sm font-medium transition-opacity duration-300">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t space-y-2">
        <Link
          to="/settings"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-muted text-muted-foreground hover:text-foreground",
            location.pathname === '/settings' && "bg-muted text-foreground"
          )}
        >
          <Settings size={20} className="shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="w-full mt-4 flex justify-center"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
    </aside>
    </>
  );
}
