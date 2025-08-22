import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Trophy } from "lucide-react";
import { useState } from "react";

const champions = [
  { year: 2024, winner: "Gully", second: "Olave Garden", third: "IL DUCE" },
  { year: 2023, winner: "Gully", second: "Waddle You Doing Step Bro", third: "Olave Garden" },
];

const standings2024 = [
  { place: 1, team: "Gully", record: "10-3-0" },
  { place: 2, team: "Olave Garden", record: "9-4-0" },
  { place: 3, team: "IL DUCE", record: "8-5-0" },
  { place: 4, team: "Josh Downs Syndrome", record: "9-4-0" },
  { place: 5, team: "Geriatric Unit", record: "7-6-0" },
  { place: 6, team: "Big Mike and the boys", record: "7-6-0" },
  { place: 7, team: "CeeDeez Nuts", record: "3-10-0" },
  { place: 8, team: "Painted Nail Zesty Boys 💅", record: "5-8-0" },
  { place: 9, team: "Free Tyreek", record: "6-7-0" },
  { place: 10, team: "Das how a white man run da ball", record: "4-9-0" },
  { place: 11, team: "Team Smith", record: "5-8-0" },
  { place: 12, team: "Dark Web Bitcoin Miners", record: "5-8-0" },
];

const standings2023 = [
  { place: 1, team: "Gully", record: "9-5-0" },
  { place: 2, team: "Waddle You Doing Step Bro", record: "11-3-0" },
  { place: 3, team: "Olave Garden", record: "9-5-0" },
  { place: 4, team: "Geriatric Unit", record: "10-4-0" },
  { place: 5, team: "Dark Web Bitcoin Miners", record: "8-6-0" },
  { place: 6, team: "Team 1", record: "6-8-0" },
  { place: 7, team: "Liberal,Liberal,Liberal,Liberal", record: "5-9-0" },
  { place: 8, team: "Team Smith", record: "6-8-0" },
  { place: 9, team: "Deshaun most definitely did it", record: "4-10-0" },
  { place: 10, team: "CeeDeez Nuts", record: "6-8-0" },
  { place: 11, team: "Hank Bigsby", record: "5-9-0" },
  { place: 12, team: "Tight End Fantasies", record: "5-9-0" },
];

export default function HistorySection() {
  const [is2024Open, setIs2024Open] = useState(true);
  const [is2023Open, setIs2023Open] = useState(false);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="bg-panel-gradient border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Champions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {champions.map((champ) => (
              <li key={champ.year} className="text-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-accent font-bold">{champ.year}</span>
                  <span>—</span>
                  <strong className="text-primary">{champ.winner}</strong>
                </div>
                <div className="text-sm text-muted-foreground ml-12">
                  2nd: {champ.second}; 3rd: {champ.third}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-panel-gradient border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Final Standings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={is2024Open} onOpenChange={setIs2024Open}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left hover:bg-muted/20 rounded transition-colors">
              <span className="text-foreground font-medium">
                2024 (Champion: <span className="text-primary">Gully</span>)
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${is2024Open ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-border">
                      <TableHead className="text-foreground">#</TableHead>
                      <TableHead className="text-foreground">Team</TableHead>
                      <TableHead className="text-foreground">Record</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings2024.map((team) => (
                      <TableRow key={team.place} className="border-border hover:bg-muted/20">
                        <TableCell className="text-foreground font-medium">{team.place}</TableCell>
                        <TableCell className={`${team.place <= 3 ? 'text-accent font-medium' : 'text-foreground'}`}>
                          {team.team}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{team.record}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={is2023Open} onOpenChange={setIs2023Open}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left hover:bg-muted/20 rounded transition-colors">
              <span className="text-foreground font-medium">
                2023 (Champion: <span className="text-primary">Gully</span>)
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${is2023Open ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-border">
                      <TableHead className="text-foreground">#</TableHead>
                      <TableHead className="text-foreground">Team</TableHead>
                      <TableHead className="text-foreground">Record</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings2023.map((team) => (
                      <TableRow key={team.place} className="border-border hover:bg-muted/20">
                        <TableCell className="text-foreground font-medium">{team.place}</TableCell>
                        <TableCell className={`${team.place <= 3 ? 'text-accent font-medium' : 'text-foreground'}`}>
                          {team.team}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{team.record}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}