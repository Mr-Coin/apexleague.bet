import { ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { setPopupEnabled, usePopupEnabled } from "@/lib/popup-store";

interface SettingsProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function Settings({ onClose, isOpen }: SettingsProps) {
  const popupEnabled = usePopupEnabled();
  const { isCommissioner, elevate } = useAuth();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const submitPin = async () => {
    setBusy(true);
    setPinError("");
    try {
      await elevate(pin);
      setPin("");
    } catch (e) {
      setPinError(e instanceof Error ? e.message : "Could not verify PIN.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-50">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Settings</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" aria-label="Close settings">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Pop-up Notifications</p>
            <p className="text-xs text-muted-foreground">Control site pop-ups</p>
          </div>
          <Switch checked={popupEnabled} onCheckedChange={setPopupEnabled} className="ml-2" />
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Commissioner
          </p>
          {isCommissioner ? (
            <p className="text-xs text-muted-foreground">Commissioner tools are unlocked for this session.</p>
          ) : (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void submitPin();
              }}
            >
              <Input
                type="password"
                inputMode="numeric"
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="h-8 text-sm"
                autoComplete="off"
                disabled={busy}
              />
              <Button type="submit" size="sm" disabled={busy || !pin}>
                Unlock
              </Button>
            </form>
          )}
          {pinError && <p className="text-xs text-destructive">{pinError}</p>}
        </div>
      </div>
    </div>
  );
}
