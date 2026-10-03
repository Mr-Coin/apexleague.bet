import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder until the parlay UI port lands (see worker/parlay for the API).
export default function ParlayPage() {
  return (
    <Card className="bg-panel-gradient border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-foreground">Weekly Loser’s Parlay</CardTitle>
        <CardDescription className="text-muted-foreground">Coming to this tab shortly.</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
