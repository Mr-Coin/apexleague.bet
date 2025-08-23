import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { POPUP_CONFIG } from '../config/popup';

interface SettingsProps {
  onClose: () => void;
  isOpen: boolean;
}

const Settings = ({ onClose, isOpen }: SettingsProps) => {
  const [popupEnabled, setPopupEnabled] = useState(POPUP_CONFIG.enabled);

  const handleTogglePopup = () => {
    const newValue = !popupEnabled;
    setPopupEnabled(newValue);
    
    // Update the config
    POPUP_CONFIG.enabled = newValue;
    
    // Store in localStorage for persistence
    localStorage.setItem('popupEnabled', newValue.toString());
  };

  // Load saved setting on component mount
  useEffect(() => {
    const saved = localStorage.getItem('popupEnabled');
    if (saved !== null) {
      const enabled = saved === 'true';
      setPopupEnabled(enabled);
      POPUP_CONFIG.enabled = enabled;
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">Settings</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Pop-up Notifications</p>
              <p className="text-xs text-muted-foreground">Control site pop-ups</p>
            </div>
            <Switch
              checked={popupEnabled}
              onCheckedChange={handleTogglePopup}
              className="ml-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
