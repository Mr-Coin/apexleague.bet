import { Settings as SettingsIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router";
import Settings from "@/components/Settings";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home" },
  { to: "/teams", label: "Teams" },
  { to: "/keepers", label: "Keepers" },
  { to: "/history", label: "History" },
  { to: "/proposals", label: "Proposals" },
  { to: "/parlay", label: "Parlay" },
];

export default function ApexHeader() {
  const { logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSettings) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) setShowSettings(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  return (
    <header className="sticky top-0 z-10 bg-linear-to-b from-background/90 to-background/0 backdrop-blur-md border-b border-border/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4 sm:gap-6 flex-wrap">
          <NavLink to="/" className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-accent overflow-hidden">
              <img src="/league-logo.jpg" alt="APEX League Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">APEX</h1>
              <p className="text-sm text-muted-foreground">12 teams • 0.5 PPR • ESPN</p>
            </div>
          </NavLink>

          <nav className="flex gap-2 flex-wrap order-last w-full lg:order-none lg:w-auto" aria-label="Primary">
            {tabs.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.to === "/"}>
                {({ isActive }) => (
                  <Button
                    asChild={false}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    tabIndex={-1}
                    className={cn(
                      isActive
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "bg-card/50 text-foreground border-border hover:bg-card hover:shadow-card transition-all duration-200",
                    )}
                  >
                    {tab.label}
                  </Button>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative" ref={settingsRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings((v) => !v)}
                className="text-muted-foreground hover:text-foreground p-2"
                aria-label="Settings"
                aria-expanded={showSettings}
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
              <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
            </div>

            <Button variant="ghost" size="sm" onClick={() => void logout()} className="text-muted-foreground hover:text-foreground">
              Log out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
