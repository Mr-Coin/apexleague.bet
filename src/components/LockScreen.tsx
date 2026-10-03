import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export default function LockScreen() {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleUnlock = async () => {
    if (!password || isChecking) return;
    setIsChecking(true);
    setStatus("Checking...");
    try {
      await login(password);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error checking password.");
      setTimeout(() => setStatus(""), 2500);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-linear-to-br from-background via-card to-background flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md shadow-glow border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-accent overflow-hidden">
            <img src="/league-logo.jpg" alt="APEX League Logo" className="w-full h-full object-cover" />
          </div>
          <CardTitle className="text-2xl text-foreground">Enter league password</CardTitle>
          <CardDescription className="text-muted-foreground">Content is private to league members.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleUnlock();
            }}
          >
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-muted border-border text-foreground"
              autoComplete="current-password"
              autoFocus
              disabled={isChecking}
            />
            <div className="flex items-center justify-between">
              <Button type="submit" disabled={isChecking || !password} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isChecking ? "Checking..." : "Unlock"}
              </Button>
              {status && (
                <span className="text-sm text-muted-foreground" role="status">
                  {status}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
