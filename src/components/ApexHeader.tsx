import { Button } from "@/components/ui/button";

interface ApexHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const tabs = [
  { id: 'rules', label: 'Rules' },
  { id: 'keepers', label: 'Keepers' },
  { id: 'history', label: 'History' },
  { id: 'extras', label: 'Extras' },
];

export default function ApexHeader({ activeTab, onTabChange, onLogout }: ApexHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-b from-background/90 to-background/0 backdrop-blur-md border-b border-border/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-hero-gradient rounded-2xl flex items-center justify-center shadow-accent">
              <span className="text-xl font-black text-primary-foreground">APX</span>
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

          {/* Logout Button */}
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
    </header>
  );
}