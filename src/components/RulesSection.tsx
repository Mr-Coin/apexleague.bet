import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RulesSection() {

  return (
    <div className="space-y-6">
      {/* Draft Day Section - Prominently Featured */}
      <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border-primary/30 shadow-glow">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl text-primary font-bold">Draft Day</CardTitle>
          <CardDescription className="text-lg text-primary/80 font-semibold">
            APEX Fantasy Football Draft
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-center">
            <p className="text-lg text-foreground font-medium mb-3">
              Mon, Aug 25, 2025 • 7:30–9:00pm (America/Chicago)
            </p>
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => window.open('https://meet.google.com/cvq-pcru-tcu', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Google Meet Link
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <li><strong>Buy-in:</strong> $125</li>
                <li><strong>Payouts:</strong> 1st: $1,000; 2nd: $375; 3rd: $125</li>
                <li><strong>Keepers:</strong> Owners can keep 2 players if drafted between rounds 7–16 the following year in place of the pick for that round. No back-to-back years; player must remain on roster through season. Keepers due 48h before draft (commissioner sets exact time). <a href="#keepers" className="text-primary hover:text-primary/80 underline">View Keepers Page</a></li>
                <li><strong>Weekly low-score:</strong> Lowest weekly score shotguns a beer before work on Tuesday (regular season & playoffs).</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Trades</h3>
              <ul className="space-y-2 text-sm text-foreground">
                <li>Each trade will be subject to a review period of one (1) day. During this period, league members may vote to veto the trade.</li>
                <li>The commissioner may approve and process a trade immediately if he determines it is clearly within the competitive integrity of the league.</li>
                <li>Trades are not guaranteed to be processed before game time. However, the commissioner will make reasonable efforts to process trades before any game-time deadline, provided the trade is deemed competitive and made in good faith.</li>
                <li>The commissioner retains the authority to veto any trade that is deemed uncompetitive, unfair, or made in bad faith.</li>
                <li>In exercising this authority, the commissioner may consult with the Organization for the Vigilance and Repression of Anti-Competitive Activity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-panel-gradient border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Punishment Options</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Loser of the regular season must complete one of the punishments from the list below by the draft of the next season or be expelled from the league.</p>
          <ul className="space-y-1 text-sm text-foreground pl-4">
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
        </CardContent>
      </Card>

      <Card className="bg-panel-gradient border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Commissioner</CardTitle>
          <CardDescription className="text-muted-foreground">
            The man behind the madness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <img 
                src="/commish.png" 
                alt="David Rasmussen - Commissioner" 
                className="w-32 h-32 rounded-full object-cover shadow-lg"
              />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-foreground mb-3">David Rasmussen</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                David Rasmussen, our fantasy football commish, kicked off this league two years ago dreaming of glory. That dream's a total bust so far, but he keeps grinding through the seasons. From the bullet-riddled hellhole otherwise known as Chicago, he dodges gang shootouts on his commute to slave away for banking tyrant Jamie Dimon—who's now yanked him back to the office five days a week, gutting his time to manage his squad, IL DUCE.
              </p>
            </div>
          </div>
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
              <img 
                src="/brennan.png" 
                alt="Brennan Joseph Champion - Chair" 
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg"
              />
              <h4 className="font-semibold text-foreground">Brennan Joseph Champion</h4>
              <p className="text-sm text-muted-foreground">Chair</p>
            </div>
            <div className="text-center">
              <img 
                src="/cole.png" 
                alt="Cole Ellsworth Thomas - Analyst" 
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg"
              />
              <h4 className="font-semibold text-foreground">Cole Ellsworth Thomas</h4>
              <p className="text-sm text-muted-foreground">Analyst</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}