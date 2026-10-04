import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Card className="bg-panel-gradient border-border shadow-card max-w-md mx-auto mt-12">
      <CardContent className="py-12 text-center space-y-4">
        <h1 className="text-5xl font-bold text-primary">404</h1>
        <p className="text-muted-foreground">Oops! Page not found</p>
        <Button asChild>
          <Link to="/">Return to Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
