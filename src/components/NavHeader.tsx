import { useState } from "react";
import { User, Bell, Menu, LogOut, ShoppingCart, BadgePercent, MapPin, History, QrCode, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

interface NavHeaderProps {
  userName?: string;
  userRole?: "customer" | "delivery" | "admin";
}

export const NavHeader = ({ userName, userRole }: NavHeaderProps) => {
  const { profile, signOut } = useAuth();
  const [notifications] = useState(3);

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
      // The auth context will handle the redirect to /auth
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-background border-b border-border shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-bold gradient-gold bg-clip-text text-transparent">
              JADAYU
            </Link>
            <div className="hidden md:block text-sm text-muted-foreground">
              Smart Ration Delivery Service
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
            {/* Show different navigation items based on user role */}
            {displayRole === 'customer' && (
              <>
                <Button asChild variant="ghost">
                  <Link to="/shop" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Shop
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/cart" className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" /> Cart
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/quota" className="flex items-center gap-2">
                    <BadgePercent className="h-4 w-4" /> Quota
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/track" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Track
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/history" className="flex items-center gap-2">
                    <History className="h-4 w-4" /> History
                  </Link>
                </Button>
              </>
            )}
            {displayRole === 'delivery_partner' && (
              <>
                <Button asChild variant="ghost">
                  <Link to="/track" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Track
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/qr-scanner" className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" /> QR Scanner
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/history" className="flex items-center gap-2">
                    <History className="h-4 w-4" /> History
                  </Link>
                </Button>
              </>
            )}
            {displayRole === 'admin' && (
              <>
                <Button asChild variant="ghost">
                  <Link to="/track" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Track
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/beneficiaries" className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Beneficiaries
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/history" className="flex items-center gap-2">
                    <History className="h-4 w-4" /> History
                  </Link>
                </Button>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="px-3 py-2 text-sm font-medium">Notifications</div>
                <div className="px-3 pb-2 text-xs text-muted-foreground">Incoming and delivered orders</div>
                <div className="max-h-60 overflow-auto">
                  {/* TODO: Replace with live data from Supabase */}
                  <div className="px-3 py-2 hover:bg-muted/50 cursor-default">
                    <div className="text-sm">Order #ORD001 is incoming</div>
                    <div className="text-xs text-muted-foreground">2 min ago</div>
                  </div>
                  <div className="px-3 py-2 hover:bg-muted/50 cursor-default">
                    <div className="text-sm">Order #ORD003 delivered successfully</div>
                    <div className="text-xs text-muted-foreground">12 min ago</div>
                  </div>
                </div>
                <div className="px-3 py-2 text-center text-xs">
                  <Link to="/incoming-orders" className="text-primary hover:underline">View Incoming Orders</Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium">{displayName}</div>
                    <div className="text-xs text-muted-foreground">{getRoleDisplay()}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {displayRole === 'customer' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/shop">Shop</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/cart">Cart</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/quota">Quota</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/track">Track</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/history">History</Link>
                    </DropdownMenuItem>
                  </>
                )}
                {displayRole === 'delivery_partner' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/track">Track</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/qr-scanner">QR Scanner</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/history">History</Link>
                    </DropdownMenuItem>
                  </>
                )}
                {displayRole === 'admin' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/track">Track</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/beneficiaries">Beneficiaries</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/incoming-orders">Incoming Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/history">History</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};