import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

const KEEPERS = {
  "2025": [
    ["IL DUCE", "David Rasmussen", "Jayden Daniels", "QB", "7", ""],
    ["IL DUCE", "David Rasmussen", "Bucky Irving", "RB", "12", ""]
  ],
  "2024": [
    ["IL DUCE", "David Rasmussen", "Tyjae Speers", "RB", "14", ""],
    ["Big Mike and the boys", "Brennan Champion", "Nico Collins", "WR", "12", ""],
    ["Big Mike and the boys", "Brennan Champion", "Jared Goff", "QB", "11", ""],
    ["Geriatric Unit", "Kevin Killeen", "Raheem Mostert", "RB", "15", ""],
    ["Painted Nail Zesty Boys 💅", "Henry Erzinger", "Ravens Defense", "DST", "14", ""],
    ["Gully", "Matt Gullickson", "Kyern Williams", "RB", "16", ""],
    ["Gully", "Matt Gullickson", "Harrison Butker", "K", "9", ""],
    ["Josh Downs Syndrome", "Stuart Alvey", "Aaron Rodgers", "QB", "11", ""],
    ["Dark Web Bitcoin Miners", "Cole Thomas", "David Montgomery", "RB", "7", ""],
    ["Dark Web Bitcoin Miners", "Cole Thomas", "Sam LaPorta", "TE", "15", ""],
    ["Das how a white man run da ball", "Rodrigo Rabanal", "Zay Flowers", "WR", "8", ""],
    ["Olave Garden", "Joseph Ross", "Christian Kirk", "WR", "7", ""],
    ["Olave Garden", "Joseph Ross", "Cole Kmet", "TE", "10", ""]
  ]
};

export default function KeepersSection() {
  const [selectedYear, setSelectedYear] = useState("2025");

  const currentKeepers = KEEPERS[selectedYear as keyof typeof KEEPERS] || [];

  const exportToCsv = () => {
    const header = ["Team", "Manager", "Player", "Pos", "Round", "Notes"];
    const rows = currentKeepers;
    const csvContent = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keepers_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-panel-gradient border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-foreground">Keeper Selections</CardTitle>
        <CardDescription className="text-muted-foreground">
          Toggle year to view keepers and export to CSV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6 flex-wrap">
          {["2025", "2024"].map((year) => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedYear(year)}
              className={selectedYear === year 
                ? "bg-primary text-primary-foreground" 
                : "bg-card border-border text-foreground hover:bg-muted"
              }
            >
              {year}
            </Button>
          ))}
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

        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-border">
                <TableHead className="text-foreground">Team</TableHead>
                <TableHead className="text-foreground">Manager</TableHead>
                <TableHead className="text-foreground">Player</TableHead>
                <TableHead className="text-foreground">Pos</TableHead>
                <TableHead className="text-foreground">Round</TableHead>
                <TableHead className="text-foreground">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentKeepers.map((keeper, index) => (
                <TableRow key={index} className="border-border hover:bg-muted/20">
                  <TableCell className="text-foreground font-medium">{keeper[0]}</TableCell>
                  <TableCell className="text-foreground">{keeper[1]}</TableCell>
                  <TableCell className="text-foreground">{keeper[2]}</TableCell>
                  <TableCell className="text-foreground">{keeper[3]}</TableCell>
                  <TableCell className="text-foreground">{keeper[4]}</TableCell>
                  <TableCell className="text-muted-foreground">{keeper[5] || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          2026 keepers will appear once submitted.
        </p>
      </CardContent>
    </Card>
  );
}