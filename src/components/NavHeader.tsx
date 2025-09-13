import { useState } from "react";
import { User, Bell, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavHeaderProps {
  userName?: string;
  userRole?: "customer" | "delivery" | "admin";
}

export const NavHeader = ({ userName = "Rahul Kumar", userRole = "customer" }: NavHeaderProps) => {
  const [notifications] = useState(3);

  const getRoleDisplay = () => {
    switch (userRole) {
      case "customer": return "Beneficiary";
      case "delivery": return "Delivery Partner";
      case "admin": return "Admin";
      default: return "User";
    }
  };

  return (
    <header className="bg-background border-b border-border shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold gradient-gold bg-clip-text text-transparent">
              JADAYU
            </h1>
            <div className="hidden md:block text-sm text-muted-foreground">
              Smart Ration Delivery Service
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium">{userName}</div>
                    <div className="text-xs text-muted-foreground">{getRoleDisplay()}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};