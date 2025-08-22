import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LockScreenProps {
  onUnlock: () => void;
}

const STORED_HASH = "bdf03daabe9cb8cf7b018f0747d8f05fbdfb45df43d798c5b3e96f551fc35a83";

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  async function sha256Hex(text: string): Promise<string> {
    const enc = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const handleUnlock = async () => {
    setIsChecking(true);
    setStatus('Checking...');
    
    try {
      const hex = await sha256Hex(password);
      if (hex === STORED_HASH) {
        localStorage.setItem('apex_unlock_v1', '1');
        onUnlock();
      } else {
        setStatus('Incorrect password.');
        setTimeout(() => setStatus(''), 2000);
      }
    } catch (error) {
      setStatus('Error checking password.');
      setTimeout(() => setStatus(''), 2000);
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md shadow-glow border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-accent overflow-hidden">
            <img 
              src="/league-logo.jpg" 
              alt="APEX League Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <CardTitle className="text-2xl text-foreground">Enter league password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Content is private to league members.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-muted border-border text-foreground"
            autoComplete="current-password"
            disabled={isChecking}
          />
          <div className="flex items-center justify-between">
            <Button 
              onClick={handleUnlock} 
              disabled={isChecking}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isChecking ? 'Checking...' : 'Unlock'}
            </Button>
            {status && (
              <span className="text-sm text-muted-foreground">{status}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}