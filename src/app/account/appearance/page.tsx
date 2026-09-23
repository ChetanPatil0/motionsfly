import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppearancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Theme</CardTitle>
          <CardDescription>Choose how MotionFly looks on your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
