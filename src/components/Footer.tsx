import { Separator } from "@/components/ui/separator";
import { Trophy, Users, Calendar, Shield, Phone } from "lucide-react";

// lucide-react 1.x removed brand icons; keep the GitHub mark inline.
const GithubMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-t from-card to-background border-t border-border/30 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* League Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">APEX</h3>
                <p className="text-sm text-muted-foreground">Fantasy Football League</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The premier fantasy football league where strategy meets competition. 
              Join 12 elite managers in the ultimate battle for APEX glory.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              League Stats
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Teams:</span>
                <span className="text-foreground font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span>Scoring:</span>
                <span className="text-foreground font-medium">0.5 PPR</span>
              </div>
              <div className="flex justify-between">
                <span>Platform:</span>
                <span className="text-foreground font-medium">ESPN</span>
              </div>
              <div className="flex justify-between">
                <span>Buy-in:</span>
                <span className="text-foreground font-medium">$125</span>
              </div>
            </div>
          </div>

          {/* Important Dates */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Key Dates
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>
                <div className="font-medium text-foreground">Draft Day</div>
                <div>Aug 25, 2025</div>
                <div className="text-xs">7:30 PM CDT</div>
              </div>
              <div>
                <div className="font-medium text-foreground">Trade Deadline</div>
                <div>Nov 26, 2025</div>
              </div>
            </div>
          </div>

          {/* League Management */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              League Info
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>
                <div className="font-medium text-foreground">Commissioner</div>
                <div>David Rasmussen</div>
              </div>
              <div>
                <div className="font-medium text-foreground">Roster Integrity</div>
                <div>Brennan Champion (Chair)</div>
                <div>Cole Thomas (Analyst)</div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Contact Support
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>
                <div className="font-medium text-foreground">24/7 Support</div>
                <div className="text-primary font-semibold">1-800-522-4700</div>
              </div>
              <div className="text-xs text-muted-foreground">
                Need help with your team or have questions? 
                Our support team is available around the clock.
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* Bottom Footer */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>© {currentYear} APEX Fantasy Football League</span>
            <span>•</span>
            <span>All rights reserved</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-muted-foreground">Live</span>
            </div>
            <span className="text-muted-foreground">Last updated: Oct 03, 2025</span>
            <span>•</span>
            <a 
              href="https://github.com/Mr-Coin/apexleague.bet" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <GithubMark className="w-4 h-4" />
              <span>Source Code</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
