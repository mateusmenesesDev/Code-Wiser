import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { Button } from "./button";
import { ToggleTheme } from "./ToggleTheme";

export default function Header() {
  return (
    <header className="bg-card text-card-foreground shadow">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-semibold text-primary">{"<CodeWise />"}</h1>
        <div className="flex items-center space-x-4">
          <ToggleTheme />
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5 text-primary" />
          </Button>
          <UserButton />
        </div>
      </div>
    </header>
  );
}