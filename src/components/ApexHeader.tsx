import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Settings from './Settings';

interface ApexHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const tabs = [
  { id: 'home', label: 'Home' },
  { id: 'teams', label: 'Teams' },
  { id: 'keepers', label: 'Keepers' },
  { id: 'history', label: 'History' },
  { id: 'proposals', label: 'Proposals' },
];

export default function ApexHeader({ activeTab, onTabChange, onLogout }: ApexHeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  return (
    <>
      <header className="sticky top-0 z-10 bg-gradient-to-b from-background/90 to-background/0 backdrop-blur-md border-b border-border/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-accent overflow-hidden">
                <img 
                  src="/league-logo.jpg" 
                  alt="APEX League Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">APEX</h1>
                <p className="text-sm text-muted-foreground">12 teams • 0.5 PPR • ESPN</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex gap-2 flex-wrap">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTabChange(tab.id)}
                  className={activeTab === tab.id 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "bg-card/50 text-foreground border-border hover:bg-card hover:shadow-card transition-all duration-200"
                  }
                >
                  {tab.label}
                </Button>
              ))}
            </nav>

            {/* Settings and Logout Buttons */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={settingsRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  <SettingsIcon className="h-4 w-4" />
                </Button>
                
                <Settings 
                  isOpen={showSettings} 
                  onClose={() => setShowSettings(false)} 
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                Log out
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}