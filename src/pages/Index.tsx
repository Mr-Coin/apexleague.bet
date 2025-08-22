import { useState, useEffect } from "react";
import LockScreen from "@/components/LockScreen";
import ApexHeader from "@/components/ApexHeader";
import RulesSection from "@/components/RulesSection";
import KeepersSection from "@/components/KeepersSection";
import HistorySection from "@/components/HistorySection";
import ExtrasSection from "@/components/ExtrasSection";
import DraftSection from "@/components/DraftSection";

const Index = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");

  useEffect(() => {
    // Check if already unlocked
    const unlocked = localStorage.getItem('apex_unlock_v1') === '1';
    setIsUnlocked(unlocked);

    // Handle hash navigation
    const hash = window.location.hash.slice(1);
    if (hash && ['rules', 'keepers', 'history', 'extras'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('apex_unlock_v1');
    setIsUnlocked(false);
    setActiveTab("rules");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  };

  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "keepers":
        return <KeepersSection />;
      case "history":
        return <HistorySection />;
      case "extras":
        return <ExtrasSection />;
      default:
        return (
          <div className="space-y-6">
            <RulesSection />
            <DraftSection />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <ApexHeader 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onLogout={handleLogout} 
      />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {renderContent()}
      </main>

      <footer className="border-t border-border/30 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-sm text-muted-foreground">
            Built for <strong className="text-foreground">APEX</strong>. Last updated Aug 11, 2025.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
