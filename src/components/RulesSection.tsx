import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function RulesSection() {
  const [isPunishmentOpen, setIsPunishmentOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="bg-panel-gradient border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">League Rules</CardTitle>
          <CardDescription className="text-muted-foreground">
            Core gameplay, roster, scoring, waivers, trades, and payouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Core Settings</h3>
              <ul className="space-y-2 text-sm text-foreground">
                <li><strong>Scoring:</strong> Head-to-Head Points, 0.5 PPR</li>
                <li><strong>Roster:</strong> QB, 2 RB, 2 WR, TE, FLEX, K, D/ST • Bench 7 (2 IR) • Roster size 16</li>
                <li><strong>Playoffs:</strong> 6 teams • R1: 1 week • R2: 1 week • Championship: 2 weeks • Tiebreaker: Points For</li>
                <li><strong>Draft:</strong> Snake • Aug 25, 2025 @ 7:30 PM CDT • 90s/pick • Order set by LM</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Transactions</h3>
              <ul className="space-y-2 text-sm text-foreground">
                <li><strong>Waivers:</strong> Waivers (1 day) • Order resets weekly inverse standings</li>
                <li><strong>Trades:</strong> No limit • Deadline Nov 26, 2025 11:00 AM CST • 1-day review • 3 votes to veto</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-panel-gradient border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">2025 League Rules (Additional)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-foreground">
            <li><strong>Buy-in:</strong> $125</li>
            <li><strong>Payouts:</strong> 1st: $1,000; 2nd: $375; 3rd: $125</li>
            <li><strong>Keepers:</strong> Owners can keep 2 players if drafted between rounds 7–16 the following year in place of the pick for that round. No back-to-back years; player must remain on roster through season. Keepers due 48h before draft (commissioner sets exact time).</li>
            <li><strong>Weekly low-score:</strong> Lowest weekly score shotguns a beer before work on Tuesday (regular season & playoffs).</li>
          </ul>
          
          <Collapsible open={isPunishmentOpen} onOpenChange={setIsPunishmentOpen} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-foreground hover:text-primary">
                Punishment list (pick one)
                <ChevronDown className={`w-4 h-4 transition-transform ${isPunishmentOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ul className="space-y-1 text-sm text-muted-foreground pl-4">
                <li>• Hot Ones challenge</li>
                <li>• 5 minutes of standup</li>
                <li>• 8-hour Greyhound somewhere then 8 hours back in a day</li>
                <li>• Wear a suit every Saturday for a specified period</li>
                <li>• 6/12/18 challenge (ask Lohmar)</li>
                <li>• Chicago tri (first tri/major race or distance competition)</li>
                <li>• 9x9 challenge</li>
                <li>• Tattoo of the league name or agreed-upon tattoo</li>
                <li>• Full body paint CFB game</li>
                <li>• Musical performance at a CTA stop during rush hour</li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card className="bg-panel-gradient border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Roster Integrity</CardTitle>
          <CardDescription className="text-muted-foreground">
            Organization for the Vigilance and Repression of Anti-Competitive Activity
          </CardDescription>
          <p className="text-sm text-muted-foreground">
            Mission: Leaguewide roster monitoring to ensure members act in good faith and abide by league rules.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-muted-foreground">Photo</span>
              </div>
              <h4 className="font-semibold text-foreground">Brennan Joseph Champion</h4>
              <p className="text-sm text-muted-foreground">Chair</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-muted-foreground">Photo</span>
              </div>
              <h4 className="font-semibold text-foreground">Cole Ellsworth Thomas</h4>
              <p className="text-sm text-muted-foreground">Analyst</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}