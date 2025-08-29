import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trophy, Users, Calendar, Shield, Phone, Github } from "lucide-react";

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
            <span className="text-muted-foreground">Last updated: Aug 28, 2025</span>
            <span>•</span>
            <a 
              href="https://github.com/Mr-Coin/apexleague.bet" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>Source Code</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
