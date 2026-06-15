import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user && !redirecting) {
      setRedirecting(true);
      // Store the intended destination so user can return after login
      const currentPath = location;
      if (currentPath && currentPath !== "/login" && currentPath !== "/signup") {
        sessionStorage.setItem("redirectAfterLogin", currentPath);
      }
      setLocation("/login");
      return;
    }

    // Starter tier is funnel-only — block dashboard access and send to consultation calendar
    if (user && !redirecting) {
      const selectedTier = localStorage.getItem("selectedTier");
      if (selectedTier === "starter") {
        setRedirecting(true);
        setLocation("/book-consultation");
      }
    }
  }, [user, loading, setLocation, redirecting, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
