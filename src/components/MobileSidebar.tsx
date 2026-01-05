import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Bell,
  Store
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { logger } from '@/lib/logger';

interface MobileSidebarProps {
  userName?: string;
  userRole?: "customer" | "delivery_partner" | "admin";
}

export const MobileSidebar = ({ userName, userRole }: MobileSidebarProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Use auth data if available, otherwise fall back to props
  const displayName = profile?.full_name || userName || "User";
  const displayRole = profile?.role || userRole || "customer";

  const getRoleDisplay = () => {
    switch (displayRole) {
      case "customer": return t("roles.beneficiary");
      case "delivery_partner": return t("roles.deliveryPartner");
      case "admin": return t("roles.admin");
      default: return t("user.user");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
      // Redirect to landing page after successful sign out
      navigate('/', { replace: true });
    } catch (error) {
      logger.error('Logout failed:', error);
    }
  };

  const getNavItems = () => {
    switch (displayRole) {
      case 'customer':
        return [
          { to: "/shop", label: t("nav.shop"), icon: Store },
          { to: "/cart", label: t("nav.cart"), icon: ShoppingCart },
          { to: "/quota", label: t("nav.quota"), icon: BadgePercent },
          { to: "/orders", label: t("nav.orders"), icon: MapPin },
          { to: "/history", label: t("nav.history"), icon: History },
        ];
      case 'delivery_partner':
        return [
          { to: "/qr-scanner", label: t("nav.qrScanner"), icon: QrCode },
          { to: "/history", label: t("nav.history"), icon: History },
        ];
      case 'admin':
        return [
          { to: "/orders", label: t("nav.orders"), icon: MapPin },
          { to: "/beneficiaries", label: t("nav.beneficiaries"), icon: Users },
          { to: "/history", label: t("nav.history"), icon: History },
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
      <SheetContent side="left" className="w-64 p-0 overflow-y-auto">
        <div className="flex flex-col h-full min-h-0">
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
                  {t("app.subtitle")}
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
          <div className="flex-1 p-6 overflow-y-auto">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center space-x-3 p-3 rounded-lg text-base font-medium transition-colors tap-target ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
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
              className="flex items-center w-full justify-start text-base tap-target p-2 rounded-md hover:bg-muted"
            >
              <Bell className="w-5 h-5 mr-3" />
              <span>{t("nav.notifications")}</span>
            </Link>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center w-full justify-start text-base tap-target p-2 rounded-md hover:bg-muted"
            >
              <User className="w-5 h-5 mr-3" />
              <span>{t("nav.profile")}</span>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-base text-destructive hover:text-destructive tap-target"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t("nav.signOut")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
