import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TEAMS, getTeamsByDraftOrder } from "@/config/teams";
import { TeamBadge } from "@/components/ui/team-badge";
import { getBadgesByIds } from "@/config/badges";

export default function TeamsSection() {
  const teamsByDraftOrder = getTeamsByDraftOrder();

  return (
    <div className="space-y-6">
      <Card className="bg-panel-gradient border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">League Teams</CardTitle>
          <CardDescription className="text-muted-foreground">
            Meet the 12 teams and their owners competing for APEX glory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamsByDraftOrder.map((team) => (
              <Card key={team.id} className="bg-card/50 border-border hover:shadow-card transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="text-xs">
                      Draft #{team.draftPosition}
                    </Badge>
                  </div>
                  
                  {/* Team Logo and Name */}
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
                      <img 
                        src={team.logo} 
                        alt={`${team.name} logo`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{team.name}</h3>
                    
                    {/* Team Badges */}
                    {team.badges && team.badges.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2 mt-3">
                        {(() => {
                          const badgeCounts: Record<string, number> = {};
                          team.badges.forEach(badgeId => {
                            badgeCounts[badgeId] = (badgeCounts[badgeId] || 0) + 1;
                          });
                          
                          return Object.entries(badgeCounts).map(([badgeId, count]) => {
                            const badge = getBadgesByIds([badgeId])[0];
                            if (!badge) return null;
                            
                            return (
                              <TeamBadge
                                key={badgeId}
                                icon={badge.icon}
                                name={badge.name}
                                description={badge.description}
                                color={badge.color}
                                backgroundColor={badge.backgroundColor}
                                textColor={badge.textColor}
                                count={count}
                              />
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Owner Photo and Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={team.ownerPhoto} 
                        alt={`${team.owner}`}
                        className="w-16 h-16 rounded-full object-cover shadow-md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm">{team.owner}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {team.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Owner Blurb */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {team.ownerBlurb}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
