import React, { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Shop from "./pages/Shop";
import Quota from "./pages/Quota";
import Orders from "./pages/Orders";
import OrdersAdmin from "./pages/OrdersAdmin";
import OrdersCustomer from "./pages/OrdersCustomer";
import OrdersDelivery from "./pages/OrdersDelivery";
import History from "./pages/History";
import Cart from "./pages/Cart";
import Payment from "./pages/Payment";
import Verify from "./pages/Verify";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import QRScanner from "./pages/QRScanner";
import CustomerDashboard from "./pages/CustomerDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Beneficiaries from "./pages/Beneficiaries";
import IncomingOrders from "./pages/IncomingOrders";

const queryClient = new QueryClient();

// Public Route Component (accessible without authentication)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, devMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !devMode) {
    return <Navigate to="/landing" replace />;
  }

  return <>{children}</>;
};

// Role-based Route Component
const RoleBasedRoute = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Route based on user role
  switch (profile?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'delivery_partner':
      return <DeliveryDashboard />;
    case 'customer':
    default:
      return <CustomerDashboard />;
  }
};

// Customer-only Route Component
const CustomerOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (profile?.role !== 'customer') {
    return <Navigate to="/orders" replace />;
  }
  return <>{children}</>;
};

// Error Boundary Component to catch crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error?: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error?: Error }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'white', color: 'red', fontFamily: 'monospace' }}>
          <h1>🚨 Error Boundary Caught an Error</h1>
          <p><strong>Error:</strong> {this.state.error?.message}</p>
          <p><strong>Stack:</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{ marginTop: '10px', padding: '8px 16px', background: 'blue', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// FULLY RESTORED APP COMPONENT
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <TooltipProvider>
              <AuthProvider>
                <ErrorBoundary>
                  <Toaster />
                  <Sonner />
                  <CartProvider>
                    <BrowserRouter>
                      <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/dashboard" element={<ProtectedRoute><RoleBasedRoute /></ProtectedRoute>} />
                        <Route path="/index" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                        <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                        <Route path="/quota" element={<ProtectedRoute><Quota /></ProtectedRoute>} />
                        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                        <Route path="/orders-admin" element={<ProtectedRoute><OrdersAdmin /></ProtectedRoute>} />
                        <Route path="/orders-customer" element={<ProtectedRoute><OrdersCustomer /></ProtectedRoute>} />
                        <Route path="/orders-delivery" element={<ProtectedRoute><OrdersDelivery /></ProtectedRoute>} />
                        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                        <Route path="/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/qr-scanner" element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />
                        <Route path="/beneficiaries" element={<ProtectedRoute><Beneficiaries /></ProtectedRoute>} />
                        <Route path="/incoming-orders" element={<ProtectedRoute><IncomingOrders /></ProtectedRoute>} />
                        <Route path="/user/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
                        <Route path="/partner/dashboard" element={<ProtectedRoute><DeliveryDashboard /></ProtectedRoute>} />
                        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                        <Route path="*" element={
                          <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#ffe4e1', color: '#dc143c' }}>
                            <h1>404 - Page Not Found</h1>
                            <p>The page you're looking for doesn't exist.</p>
                            <a href="/" style={{ color: '#0e7c7b', textDecoration: 'underline' }}>Go Home</a>
                          </div>
                        } />
                      </Routes>
                    </BrowserRouter>
                  </CartProvider>
                </ErrorBoundary>
              </AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
