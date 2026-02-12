import { ReactNode, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Search, Settings, LayoutDashboard, Users, Building2, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/organizations", label: "Organizations", icon: Building2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

interface LayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
}

export default function Layout({ children, onSearch }: LayoutProps) {
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const { signOut } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState("");

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearch?.(value);
  };

  // Broadcast search via custom event so Dashboard can listen
  const handleSearchChange = (value: string) => {
    setSearch(value);
    window.dispatchEvent(new CustomEvent("global-search", { detail: value }));
  };

  const atRiskCount = 3;

  return (
    <div className="min-h-screen bg-gradient-radial">
      <AnimatePresence>
        {isDemoMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-primary/20 border-b border-primary/30 text-center py-2 px-4"
          >
            <span className="text-sm font-medium text-primary">
              🎭 DEMO MODE — All data is fake for demonstration purposes
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-lg tracking-tight">Be Connect</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates, organizations..."
                className="pl-10 bg-muted/50 border-border/50"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-md hover:bg-accent/50 transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {atRiskCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {atRiskCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 pl-4 border-l border-border/50">
              <span className="text-xs font-medium text-muted-foreground">DEMO</span>
              <Switch checked={isDemoMode} onCheckedChange={toggleDemoMode} />
            </div>

            <button
              onClick={() => signOut()}
              className="p-2 rounded-md hover:bg-accent/50 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
