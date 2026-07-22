import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import ClaimBuilder from "@/pages/ClaimBuilder";
import Profile from "@/pages/Profile";
import ServiceHistory from "@/pages/ServiceHistory";
import MedicalHistory from "@/pages/MedicalHistory";
import LayStatement from "@/pages/LayStatement";
import BuddyStatement from "@/pages/BuddyStatement";
import Evidence from "@/pages/Evidence";
import Appeals from "@/pages/Appeals";
import TDIU from "@/pages/TDIU";
import Coach from "@/pages/Coach";
import Education from "@/pages/Education";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import ReferralProgram from "@/pages/ReferralProgram";
import FunnelContacts from "@/pages/FunnelContacts";
import Notifications from "@/pages/Notifications";
import ConsultationBooking from "@/pages/ConsultationBooking";
import BookingCalendar from "@/pages/BookingCalendar";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import ComplianceNotice from "@/pages/ComplianceNotice";
import AffiliatePage from "@/pages/AffiliatePage";
import AffiliateLogin from "@/pages/AffiliateLogin";
import AffiliateDashboard from "@/pages/AffiliateDashboard";

// Capture an affiliate referral (?ref=CODE) once per page load. The server
// records the click and drops a 30-day attribution cookie so a later purchase
// is credited to the referring affiliate.
function useAffiliateReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (!ref) return;
      // Avoid re-posting the same ref repeatedly within a session.
      const key = `aff_ref_tracked_${ref}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      fetch("/api/affiliates/track", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref }),
      }).catch(() => {});
    } catch {
      /* no-op */
    }
  }, []);
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/signup" component={AuthPage} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/book-consultation" component={ConsultationBooking} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/compliance-notice" component={ComplianceNotice} />
      {/* ── Affiliate Program Routes (Public + Authenticated) ── */}
      <Route path="/affiliates" component={AffiliatePage} />
      <Route path="/affiliate/login" component={AffiliateLogin} />
      <Route path="/affiliate/dashboard" component={AffiliateDashboard} />

      {/* Dashboard Routes - Protected */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/service-history">
        <ProtectedRoute>
          <ServiceHistory />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/medical-history">
        <ProtectedRoute>
          <MedicalHistory />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/claim-builder">
        <ProtectedRoute>
          <ClaimBuilder />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/lay-statement">
        <ProtectedRoute>
          <LayStatement />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/buddy-statement">
        <ProtectedRoute>
          <BuddyStatement />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/evidence">
        <ProtectedRoute>
          <Evidence />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/appeals">
        <ProtectedRoute>
          <Appeals />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/tdiu">
        <ProtectedRoute>
          <TDIU />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/calendar">
        <ProtectedRoute>
          <BookingCalendar />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/coach">
        <ProtectedRoute>
          <Coach />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/education">
        <ProtectedRoute>
          <Education />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/referrals">
        <ProtectedRoute>
          <ReferralProgram />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/funnel-contacts">
        <ProtectedRoute>
          <FunnelContacts />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/notifications">
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      </Route>

      {/* Admin Route */}
      <Route path="/admin">
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useAffiliateReferralCapture();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
