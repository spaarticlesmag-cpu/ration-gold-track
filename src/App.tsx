
import React, { useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";

import Landing from "./pages/Landing";
import Shop from "./pages/Shop";
import Quota from "./pages/Quota";
import Orders from "./pages/Orders";
import OrdersAdmin from "./pages/OrdersAdmin";
import OrdersCustomer from "./pages/OrdersCustomer";

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
import ShopPickup from "./pages/ShopPickup";

import Beneficiaries from "./pages/Beneficiaries";
import IncomingOrders from "./pages/IncomingOrders";

const queryClient = new QueryClient();

// Route Tracker Component to remember last visited page
const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Save current path to sessionStorage
    sessionStorage.setItem('lastVisitedPath', location.pathname);
  }, [location.pathname]);

  return null;
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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Simple Dashboard Route Component
const DashboardRoute = () => {
  const { profile } = useAuth();

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

// Main App Component
function AppContent() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <RouteTracker />
              <TooltipProvider>
                <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/verify" element={<Verify />} />

                    {/* Role-based dashboard */}
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />

                    {/* Protected routes */}

                    <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                    <Route path="/quota" element={<ProtectedRoute><Quota /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/orders-admin" element={<ProtectedRoute><OrdersAdmin /></ProtectedRoute>} />
                    <Route path="/orders-customer" element={<ProtectedRoute><OrdersCustomer /></ProtectedRoute>} />

                    <Route path="/beneficiaries" element={<ProtectedRoute><Beneficiaries /></ProtectedRoute>} />
                    <Route path="/incoming-orders" element={<ProtectedRoute><IncomingOrders /></ProtectedRoute>} />
                    <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                    <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                    <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/qr-scanner" element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />
                    <Route path="/shop-pickup" element={<ProtectedRoute><ShopPickup /></ProtectedRoute>} />


                  </Routes>

                  {/* Toast containers */}
                  <Toaster />
                  <Sonner />
                </div>
              </TooltipProvider>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return <AppContent />;
}
