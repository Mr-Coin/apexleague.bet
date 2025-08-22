import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, Users } from "lucide-react";

const draftOrder = [
  { pos: 1, team: "CeeDeez Nuts", manager: "Sam Lohmar" },
  { pos: 2, team: "Das how a white man run da ball", manager: "Rodrigo Rabanal" },
  { pos: 3, team: "Dark Web Bitcoin Miners", manager: "Cole Thomas" },
  { pos: 4, team: "Painted Nail Zesty Boys 💅", manager: "Henry Erzinger" },
  { pos: 5, team: "Team Smith", manager: "Jake Smith" },
  { pos: 6, team: "Free Tyreek", manager: "mike tracy" },
  { pos: 7, team: "Big Mike and the boys", manager: "Brennan Champion" },
  { pos: 8, team: "Geriatric Unit", manager: "Kevin Killeen" },
  { pos: 9, team: "Josh Downs Syndrome", manager: "Stuart Alvey" },
  { pos: 10, team: "IL DUCE", manager: "David Rasmussen" },
  { pos: 11, team: "Olave Garden", manager: "Joseph Ross" },
  { pos: 12, team: "Gully", manager: "Matt Gullickson" },
];

const teams = [
  { team: "IL DUCE", manager: "David Rasmussen" },
  { team: "Big Mike and the boys", manager: "Brennan Champion" },
  { team: "Geriatric Unit", manager: "Kevin Killeen" },
  { team: "Painted Nail Zesty Boys 💅", manager: "Henry Erzinger" },
  { team: "Team Smith", manager: "Jake Smith" },
  { team: "Gully", manager: "Matt Gullickson" },
  { team: "Josh Downs Syndrome", manager: "Stuart Alvey" },
  { team: "Free Tyreek", manager: "mike tracy" },
  { team: "CeeDeez Nuts", manager: "Sam Lohmar" },
  { team: "Olave Garden", manager: "Joseph Ross" },
  { team: "Das how a white man run da ball", manager: "Rodrigo Rabanal" },
  { team: "Dark Web Bitcoin Miners", manager: "Cole Thomas" },
];

export default function ExtrasSection() {
  return (
    <div className="space-y-6">
      <Card className="bg-panel-gradient border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            2025 Draft Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-border">
                  <TableHead className="text-foreground">Pos</TableHead>
                  <TableHead className="text-foreground">Team</TableHead>
                  <TableHead className="text-foreground">Manager</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draftOrder.map((pick) => (
                  <TableRow key={pick.pos} className="border-border hover:bg-muted/20">
                    <TableCell className="text-foreground font-bold">{pick.pos}</TableCell>
                    <TableCell className="text-foreground font-medium">{pick.team}</TableCell>
                    <TableCell className="text-muted-foreground">{pick.manager}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-panel-gradient border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Draft Day
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">APEX Fantasy Football Draft</h3>
              <p className="text-muted-foreground text-sm">
                Mon, Aug 25, 2025 • 7:30–9:00pm (America/Chicago)
              </p>
            </div>
            <Button 
              variant="outline" 
              className="bg-card border-border text-foreground hover:bg-muted flex items-center gap-2"
              onClick={() => window.open('https://meet.google.com/cvq-pcru-tcu', '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              Google Meet Link
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-panel-gradient border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Teams & Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-border">
                    <TableHead className="text-foreground">Team</TableHead>
                    <TableHead className="text-foreground">Manager</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team, index) => (
                    <TableRow key={index} className="border-border hover:bg-muted/20">
                      <TableCell className="text-foreground font-medium">{team.team}</TableCell>
                      <TableCell className="text-muted-foreground">{team.manager}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/20 border-border">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground font-mono">
            <strong>Tip:</strong> To update keepers or rules, edit this single HTML file and redeploy to Netlify (Deploys → Upload deploy).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}