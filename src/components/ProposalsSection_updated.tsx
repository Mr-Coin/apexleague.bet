import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock } from "lucide-react";
import { PROPOSALS, getActiveProposals } from "@/config/proposals";

export default function ProposalsSection() {
  const activeProposals = getActiveProposals();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'rule-change': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'format-change': return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
      case 'league-expansion': return 'bg-green-500/20 text-green-700 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const formatDescription = (description: string) => {
    return description.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < description.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-panel-gradient border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Active Proposals</CardTitle>
          <CardDescription className="text-muted-foreground">
            Review and discuss current league proposals. Add your comments and feedback below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {activeProposals.map((proposal) => (
              <Card key={proposal.id} className="bg-card/50 border-border">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getCategoryColor(proposal.category)}>
                          {proposal.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Voting ends {formatDate(proposal.votingDeadline)}. Vote In iMessage.
                        </Badge>
                      </div>
                      <CardTitle className="text-lg text-foreground">{proposal.title}</CardTitle>
                      <div className="text-muted-foreground mt-2 whitespace-pre-line">
                        {formatDescription(proposal.description)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Proposed by {proposal.proposedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Proposed {formatDate(proposal.proposedDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Deadline: {formatDate(proposal.votingDeadline)}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Proposal content displayed without comments */}
                </CardContent>
              </Card>
            ))}

            {activeProposals.length === 0 && (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-foreground mb-2">No Active Proposals</h3>
                <p className="text-muted-foreground">
                  There are currently no active proposals to review.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
