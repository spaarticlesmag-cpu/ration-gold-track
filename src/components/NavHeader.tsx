import { useState } from "react";
import { useTranslation } from "react-i18next";
import { User, Bell, Menu, LogOut, ShoppingCart, BadgePercent, MapPin, History, QrCode, Users, ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { MobileSidebar } from "@/components/MobileSidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { logger } from '@/lib/logger';

interface NavHeaderProps {
  userName?: string;
  userRole?: "customer" | "delivery_partner" | "admin";
}

export const NavHeader = ({ userName, userRole }: NavHeaderProps) => {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const { totalItems } = useCart();
  const [notifications] = useState(3);
  const navigate = useNavigate();
  const location = useLocation();

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

  const getRoleBranding = () => {
    switch (displayRole) {
      case "delivery_partner":
        return {
          color: "gradient-red bg-clip-text text-transparent",
          subtitle: t("roles.deliveryPartner")
        };
      case "admin":
        return {
          color: "gradient-brown bg-clip-text text-transparent",
          subtitle: t("app.subtitle")
        };
      default:
        return {
          color: "gradient-gold bg-clip-text text-transparent",
          subtitle: t("app.subtitle")
        };
    }
  };

  const branding = getRoleBranding();

  const handleLogout = async () => {
    try {
      await signOut();
      // The auth context will handle the redirect to /auth
    } catch (error) {
      logger.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-background border-b border-border shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back button: show on all pages except home ("/") */}
            {location.pathname !== "/" && (
              <Button
                variant="ghost"
                size="icon"
                className="tap-target mr-1"
                onClick={() => navigate(-1)}
                aria-label={t("user.goBack")}
              >
                <ArrowLeft className="icon-lg" />
              </Button>
            )}
            <Link to="/" className={`text-2xl font-bold ${branding.color}`}>
              JADAYU
            </Link>
            <div className="hidden md:block text-sm text-muted-foreground">
              {branding.subtitle}
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
            {/* Show different navigation items based on user role */}
            {displayRole === 'customer' && (
              <>
                <Button asChild variant={location.pathname === '/shop' ? 'default' : 'ghost'}>
                  <Link to="/shop" className="flex items-center gap-2">
                    <Store className="icon-lg" /> {t("nav.shop")}
                  </Link>
                </Button>
                <Button asChild variant={location.pathname === '/quota' ? 'default' : 'ghost'}>
                  <Link to="/quota" className="flex items-center gap-2">
                    <BadgePercent className="icon-lg" /> {t("nav.quota")}
                  </Link>
                </Button>
                <Button asChild variant={location.pathname === '/orders' ? 'default' : 'ghost'}>
                  <Link to="/orders" className="flex items-center gap-2">
                    <MapPin className="icon-lg" /> {t("nav.orders")}
                  </Link>
                </Button>
                <Button asChild variant={location.pathname === '/history' ? 'default' : 'ghost'}>
                  <Link to="/history" className="flex items-center gap-2">
                    <History className="icon-lg" /> {t("nav.history")}
                  </Link>
                </Button>
              </>
            )}
            {displayRole === 'delivery_partner' && (
              <>
                <Button asChild variant={location.pathname === '/orders' ? 'default' : 'ghost'}>
                  <Link to="/orders" className="flex items-center gap-2">
                    <MapPin className="icon-lg" /> {t("nav.orders")}
                  </Link>
                </Button>
                <Button asChild variant={location.pathname === '/qr-scanner' ? 'default' : 'ghost'}>
                  <Link to="/qr-scanner" className="flex items-center gap-2">
                    <QrCode className="icon-lg" /> {t("nav.qrScanner")}
                  </Link>
                </Button>
                <Button asChild variant={location.pathname === '/history' ? 'default' : 'ghost'}>
                  <Link to="/history" className="flex items-center gap-2">
                    <History className="icon-lg" /> {t("nav.history")}
                  </Link>
                </Button>
              </>
            )}
            {displayRole === 'admin' && (
              <>
                <Button asChild variant={location.pathname === '/orders' ? 'default' : 'ghost'}>
                  <Link to="/orders" className="flex items-center gap-2">
                    <MapPin className="icon-lg" /> {t("nav.orders")}
                  </Link>
                </Button>
                <Button asChild variant={location.pathname === '/beneficiaries' ? 'default' : 'ghost'}>
                  <Link to="/beneficiaries" className="flex items-center gap-2">
                    <Users className="icon-lg" /> {t("nav.beneficiaries")}
                  </Link>
                </Button>
                <Button asChild variant={location.pathname === '/history' ? 'default' : 'ghost'}>
                  <Link to="/history" className="flex items-center gap-2">
                    <History className="icon-lg" /> {t("nav.history")}
                  </Link>
                </Button>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {/* Cart Icon - only for customers */}
            {displayRole === 'customer' && (
              <Button asChild variant="ghost" size="icon" className="relative tap-target">
                <Link to="/cart">
                  <ShoppingCart className="icon-lg" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </Button>
            )}

            {/* Hide notification/profile on small screens to reduce clutter */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative tap-target">
                    <Bell className="icon-lg" />
                    {notifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notifications}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <div className="px-3 py-2 text-sm font-medium">{t("notifications.header")}</div>
                  <div className="px-3 pb-2 text-xs text-muted-foreground">{t("notifications.description")}</div>
                  <div className="max-h-60 overflow-auto">
                    <div className="px-3 py-2 hover:bg-muted/50 cursor-default">
                      <div className="text-sm">{t("notifications.orderIncoming", { orderId: "ORD001" })}</div>
                      <div className="text-xs text-muted-foreground">2 min ago</div>
                    </div>
                    <div className="px-3 py-2 hover:bg-muted/50 cursor-default">
                      <div className="text-sm">{t("notifications.orderDelivered", { orderId: "ORD003" })}</div>
                      <div className="text-xs text-muted-foreground">12 min ago</div>
                    </div>
                  </div>
                  <div className="px-3 py-2 text-center text-xs">
                    <Link to="/incoming-orders" className="text-primary hover:underline">{t("nav.incomingOrders")}</Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 tap-target">
                    <User className="icon-lg" />
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
                      {t("nav.profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <MobileSidebar userName={displayName} userRole={displayRole} />
          </div>
        </div>
      </div>
    </header>
  );
};
