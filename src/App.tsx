import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import CandidateProfile from "./pages/CandidateProfile";
import Organizations from "./pages/Organizations";
import OrganizationDetail from "./pages/OrganizationDetail";
import Settings from "./pages/Settings";
import JourneyDashboard from "./pages/JourneyDashboard";
import CommandCentre from "./pages/CommandCentre";
import AdminDossiers from "./pages/AdminDossiers";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import InsightsLogin from "./pages/InsightsLogin";
import InsightsReport from "./pages/InsightsReport";
import DossierPublicView from "./pages/DossierPublicView";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-radial flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-bold text-sm">S</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/candidate/:id" element={<CandidateProfile />} />
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/organizations/:id" element={<OrganizationDetail />} />
        <Route path="/journeys" element={<JourneyDashboard />} />
        <Route path="/command-centre" element={isAdmin ? <CommandCentre /> : <Navigate to="/" replace />} />
        <Route path="/dossiers" element={isAdmin ? <AdminDossiers /> : <Navigate to="/" replace />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DemoModeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/dossier/:code" element={<DossierPublicView />} />
            <Route path="/insights/:accessCode" element={<InsightsLogin />} />
            <Route path="/insights/:accessCode/report" element={<InsightsReport />} />
            <Route path="/*" element={<ProtectedRoutes />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </DemoModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
