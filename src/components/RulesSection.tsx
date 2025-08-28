import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DRAFT_CONFIG } from "@/config/draft";

export default function RulesSection() {

  return (
    <div className="space-y-6">
      {/* Draft Conclusion Header - Green Styled */}
      {DRAFT_CONFIG.showDraftConclusion && (
        <Card className="bg-gradient-to-r from-green-500/20 via-green-400/10 to-emerald-500/20 border-green-500/30 shadow-glow">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-green-600 font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6" />
              {DRAFT_CONFIG.draftConclusion.title}
            </CardTitle>
            <CardDescription className="text-lg text-green-600/80 font-semibold">
              {DRAFT_CONFIG.draftConclusion.message}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Draft Day Section - Configurable */}
      {DRAFT_CONFIG.showDraftNotification && (
        <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border-primary/30 shadow-glow">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-primary font-bold">{DRAFT_CONFIG.draftNotification.title}</CardTitle>
            <CardDescription className="text-lg text-primary/80 font-semibold">
              {DRAFT_CONFIG.draftNotification.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-center">
              <p className="text-lg text-foreground font-medium mb-3">
                {DRAFT_CONFIG.draftNotification.date} • {DRAFT_CONFIG.draftNotification.time} {DRAFT_CONFIG.draftNotification.timezone}
              </p>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => window.open(DRAFT_CONFIG.draftNotification.meetLink, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {DRAFT_CONFIG.draftNotification.meetLinkText}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            
            {/* ByLaws Subsection */}
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">ByLaws</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Access the complete league bylaws and official rules documentation.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => window.open('/Apex-Bylaws.pdf', '_blank')}
                  className="bg-primary hover:bg-primary/90"
                >
                  View PDF
                </Button>
                <Button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/Apex-Bylaws.pdf';
                    link.download = 'Apex-League-Bylaws.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  Download PDF
                </Button>
              </div>
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
            <li>• <strong>6/12/18 Challenge:</strong> Loser must choose between hotdogs eaten, miles run, and beers consumed in a 24hr period. Loser assigns each "event" to a number (6, 12, or 18) and must complete all within 24 hours. Numbers can be assigned however the loser chooses. None need to be completed consecutively (i.e., no need to run 12 miles straight or drink 18 beers in a single sitting). Documentation of this epic feat is non-negotiable.</li>
            <li>• Chicago tri (first tri/major race or distance competition)</li>
            <li>• <strong>9x9 Challenge:</strong> 9 hotdogs and 9 beers consumed over 9 innings of baseball</li>
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
            Organization for the Vigilance and Repression of Anti-Competitive Activity (OVRAA)
          </CardDescription>
          <p className="text-sm text-muted-foreground">
            Mission: Leaguewide roster monitoring to ensure members act in good faith and abide by league rules.
          </p>
          <p className="text-sm text-muted-foreground">
            Procedure:  Any member of the league may report a suspected violation of the rules to a member of the OVRAA. The OVRAA will then investigate the report and take appropriate action. If foul play is suspected, the commissioner will be notified and swift action will be taken.
          </p>
          <p className="text-sm text-muted-foreground">
            Membership:  Once a league member has notified the OVRAA of a suspected violation and the accusation is substantiated, the accuser may join the OVRAA.
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