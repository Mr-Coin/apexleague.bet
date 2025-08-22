import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, BarChart } from "lucide-react";

// Sample draft data - first 20 picks
const DRAFT2024 = [
  { Overall: 1, Round: 1, Pick: 1, Player: "Christian McCaffrey SF, RB", Team: "Das how a white man run da ball" },
  { Overall: 2, Round: 1, Pick: 2, Player: "Tyreek Hill Mia, WR", Team: "Free Tyreek" },
  { Overall: 3, Round: 1, Pick: 3, Player: "Bijan Robinson Atl, RB", Team: "IL DUCE" },
  { Overall: 4, Round: 1, Pick: 4, Player: "Breece Hall NYJ, RB", Team: "Painted Nail Zesty Boys 💅" },
  { Overall: 5, Round: 1, Pick: 5, Player: "Jonathan Taylor Ind, RB", Team: "Big Mike and the boys" },
  { Overall: 6, Round: 1, Pick: 6, Player: "Ja'Marr Chase Cin, WR", Team: "CeeDeez Nuts" },
  { Overall: 7, Round: 1, Pick: 7, Player: "CeeDee Lamb Dal, WR", Team: "Team Smith" },
  { Overall: 8, Round: 1, Pick: 8, Player: "Justin Jefferson Min, WR", Team: "Dark Web Bitcoin Miners" },
  { Overall: 9, Round: 1, Pick: 9, Player: "Saquon Barkley Phi, RB", Team: "Geriatric Unit" },
  { Overall: 10, Round: 1, Pick: 10, Player: "Amon-Ra St. Brown Det, WR", Team: "Olave Garden" },
  { Overall: 11, Round: 1, Pick: 11, Player: "A.J. Brown Phi, WR", Team: "Josh Downs Syndrome" },
  { Overall: 12, Round: 1, Pick: 12, Player: "Jahmyr Gibbs Det, RB", Team: "Gully" },
  { Overall: 13, Round: 2, Pick: 1, Player: "Derrick Henry Bal, RB", Team: "Gully" },
  { Overall: 14, Round: 2, Pick: 2, Player: "Garrett Wilson NYJ, WR", Team: "Josh Downs Syndrome" },
  { Overall: 15, Round: 2, Pick: 3, Player: "Lamar Jackson Bal, QB", Team: "Olave Garden" },
  { Overall: 16, Round: 2, Pick: 4, Player: "Deebo Samuel Sr. Wsh, WR", Team: "Geriatric Unit" },
  { Overall: 17, Round: 2, Pick: 5, Player: "Travis Etienne Jr. Jax, RB", Team: "Dark Web Bitcoin Miners" },
  { Overall: 18, Round: 2, Pick: 6, Player: "Isiah Pacheco KC, RB", Team: "Team Smith" },
  { Overall: 19, Round: 2, Pick: 7, Player: "Puka Nacua LAR, WR", Team: "CeeDeez Nuts" },
  { Overall: 20, Round: 2, Pick: 8, Player: "Mike Evans TB, WR", Team: "Big Mike and the boys" },
];

export default function DraftSection() {
  const [viewMode, setViewMode] = useState("overall");

  const exportToCsv = () => {
    const header = ["Overall", "Round", "Pick", "Player", "Team"];
    const csvContent = [header, ...DRAFT2024.map(pick => [
      pick.Overall, pick.Round, pick.Pick, pick.Player, pick.Team
    ])].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "draft_2024_overall.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderByTeam = () => {
    const teamGroups: { [key: string]: typeof DRAFT2024 } = {};
    DRAFT2024.forEach(pick => {
      if (!teamGroups[pick.Team]) teamGroups[pick.Team] = [];
      teamGroups[pick.Team].push(pick);
    });

    const rows: JSX.Element[] = [];
    Object.keys(teamGroups).sort().forEach(team => {
      teamGroups[team].forEach(pick => {
        rows.push(
          <TableRow key={`${team}-${pick.Overall}`} className="border-border hover:bg-muted/20">
            <TableCell className="text-foreground font-medium">{team}</TableCell>
            <TableCell className="text-foreground">{pick.Round}</TableCell>
            <TableCell className="text-foreground">{pick.Overall}</TableCell>
            <TableCell className="text-foreground">{pick.Player}</TableCell>
          </TableRow>
        );
      });
    });
    return rows;
  };

  return (
    <Card className="bg-panel-gradient border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <BarChart className="w-5 h-5 text-primary" />
          Draft Results — 2024
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          View by overall pick, or grouped by team (shows round and overall number).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={viewMode === "overall" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("overall")}
            className={viewMode === "overall" 
              ? "bg-primary text-primary-foreground" 
              : "bg-card border-border text-foreground hover:bg-muted"
            }
          >
            By Overall
          </Button>
          <Button
            variant={viewMode === "team" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("team")}
            className={viewMode === "team" 
              ? "bg-primary text-primary-foreground" 
              : "bg-card border-border text-foreground hover:bg-muted"
            }
          >
            By Team
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCsv}
            className="bg-card border-border text-foreground hover:bg-muted flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-border">
                {viewMode === "overall" ? (
                  <>
                    <TableHead className="text-foreground">Overall</TableHead>
                    <TableHead className="text-foreground">Round</TableHead>
                    <TableHead className="text-foreground">Pick</TableHead>
                    <TableHead className="text-foreground">Player</TableHead>
                    <TableHead className="text-foreground">Team</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-foreground">Team</TableHead>
                    <TableHead className="text-foreground">Round</TableHead>
                    <TableHead className="text-foreground">Overall</TableHead>
                    <TableHead className="text-foreground">Player</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewMode === "overall" ? (
                DRAFT2024.map((pick) => (
                  <TableRow key={pick.Overall} className="border-border hover:bg-muted/20">
                    <TableCell className="text-foreground font-bold">{pick.Overall}</TableCell>
                    <TableCell className="text-foreground">{pick.Round}</TableCell>
                    <TableCell className="text-foreground">{pick.Pick}</TableCell>
                    <TableCell className="text-foreground">{pick.Player}</TableCell>
                    <TableCell className="text-foreground">{pick.Team}</TableCell>
                  </TableRow>
                ))
              ) : (
                renderByTeam()
              )}
            </TableBody>
          </Table>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          Showing first 20 picks. Full draft data available in export.
        </p>
      </CardContent>
    </Card>
  );
}