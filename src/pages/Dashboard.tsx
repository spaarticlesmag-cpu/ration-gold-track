import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { profile } = useAuth();

  // This is a simple dashboard component
  // In a full implementation, this would conditionally render
  // different dashboard components based on user role

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Welcome to JADAYU Dashboard
          </h1>
          <p className="text-muted-foreground">
            Your Smart Ration Delivery Platform
          </p>
          {profile && (
            <p className="text-sm mt-4">
              Logged in as: {profile.full_name} ({profile.role})
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
