import { NavHeader } from "@/components/NavHeader";
import { NavLink } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container mx-auto px-4 py-6 pb-24">
        {children}
      </main>
      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="mx-auto max-w-lg">
          <div className="grid grid-cols-4">
            <NavLink
              to="/shop"
              className={({ isActive }) => `flex flex-col items-center justify-center py-3 tap-target text-sm ${isActive ? 'text-primary' : ''}`}
            >
              <span className="sr-only">Shop</span>
              <svg viewBox="0 0 24 24" className="icon-lg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6h15l-1.5 9h-12z" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              <span>Shop</span>
            </NavLink>
            <NavLink
              to="/quota"
              className={({ isActive }) => `flex flex-col items-center justify-center py-3 tap-target text-sm ${isActive ? 'text-primary' : ''}`}
            >
              <span className="sr-only">Quota</span>
              <svg viewBox="0 0 24 24" className="icon-lg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>Quota</span>
            </NavLink>
            <NavLink
              to="/track"
              className={({ isActive }) => `flex flex-col items-center justify-center py-3 tap-target text-sm ${isActive ? 'text-primary' : ''}`}
            >
              <span className="sr-only">Track</span>
              <svg viewBox="0 0 24 24" className="icon-lg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Track</span>
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => `flex flex-col items-center justify-center py-3 tap-target text-sm ${isActive ? 'text-primary' : ''}`}
            >
              <span className="sr-only">History</span>
              <svg viewBox="0 0 24 24" className="icon-lg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                <path d="M12 7v5l3 3" />
              </svg>
              <span>History</span>
            </NavLink>
          </div>
        </div>
      </nav>
    </div>
  );
}


