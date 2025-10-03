import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  ShoppingCart, 
  BadgePercent, 
  MapPin, 
  History, 
  QrCode, 
  Users, 
  User,
  LogOut,
  Bell
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MobileSidebarProps {
  userName?: string;
  userRole?: "customer" | "delivery" | "admin";
}

export const MobileSidebar = ({ userName, userRole }: MobileSidebarProps) => {
  const [open, setOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();

  // Use auth data if available, otherwise fall back to props
  const displayName = profile?.full_name || userName || "User";
  const displayRole = profile?.role || userRole || "customer";

  const getRoleDisplay = () => {
    switch (displayRole) {
      case "customer": return "Beneficiary";
      case "delivery_partner": return "Delivery Partner";
      case "admin": return "Admin";
      default: return "User";
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getNavItems = () => {
    switch (displayRole) {
      case 'customer':
        return [
          { to: "/shop", label: "Shop", icon: ShoppingCart },
          { to: "/cart", label: "Cart", icon: ShoppingCart },
          { to: "/quota", label: "Quota", icon: BadgePercent },
          { to: "/track", label: "Track", icon: MapPin },
          { to: "/history", label: "History", icon: History },
        ];
      case 'delivery_partner':
        return [
          { to: "/track", label: "Track", icon: MapPin },
          { to: "/qr-scanner", label: "QR Scanner", icon: QrCode },
          { to: "/history", label: "History", icon: History },
        ];
      case 'admin':
        return [
          { to: "/track", label: "Track", icon: MapPin },
          { to: "/beneficiaries", label: "Beneficiaries", icon: Users },
          { to: "/history", label: "History", icon: History },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden tap-target">
          <Menu className="icon-lg" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <Link 
                  to="/" 
                  className="text-2xl font-bold gradient-gold bg-clip-text text-transparent"
                  onClick={() => setOpen(false)}
                >
                  JADAYU
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  Smart Ration Delivery Service
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-premium rounded-full flex items-center justify-center text-primary-foreground">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="text-lg font-semibold">{displayName}</div>
                <Badge variant="outline" className="text-sm">
                  {getRoleDisplay()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-6">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center space-x-3 p-4 rounded-lg text-lg font-medium transition-colors tap-target ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="icon-lg" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border space-y-3">
            <Link
              to="/incoming-orders"
              onClick={() => setOpen(false)}
              className="flex items-center w-full justify-start text-lg tap-target p-2 rounded-md hover:bg-muted"
            >
              <Bell className="icon-lg mr-3" />
              <span>Notifications</span>
            </Link>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center w-full justify-start text-lg tap-target p-2 rounded-md hover:bg-muted"
            >
              <User className="icon-lg mr-3" />
              <span>Profile</span>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-lg text-destructive hover:text-destructive tap-target"
              onClick={handleLogout}
            >
              <LogOut className="icon-lg mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
