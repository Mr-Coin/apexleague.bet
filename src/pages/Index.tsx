import { useState, useEffect } from "react";
import LockScreen from "@/components/LockScreen";
import ApexHeader from "@/components/ApexHeader";
import RulesSection from "@/components/RulesSection";
import TeamsSection from "@/components/TeamsSection";
import KeepersSection from "@/components/KeepersSection";
import HistorySection from "@/components/HistorySection";
import DraftSection from "@/components/DraftSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    // Check if already unlocked
    const unlocked = localStorage.getItem('apex_unlock_v1') === '1';
    setIsUnlocked(unlocked);

    // Handle hash navigation
    const hash = window.location.hash.slice(1);
    if (hash && ['home', 'teams', 'keepers', 'history'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('apex_unlock_v1');
    setIsUnlocked(false);
    setActiveTab("home");
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
      case "teams":
        return <TeamsSection />;
      case "keepers":
        return <KeepersSection />;
      case "history":
        return <HistorySection />;
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

      <Footer />
    </div>
  );
};

export default Index;
