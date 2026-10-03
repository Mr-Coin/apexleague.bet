import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import Layout from "@/components/Layout";
import LockScreen from "@/components/LockScreen";
import RetroPopup from "@/components/RetroPopup";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import DraftSection from "@/components/DraftSection";
import HistorySection from "@/components/HistorySection";
import KeepersSection from "@/components/KeepersSection";
import ProposalsSection from "@/components/ProposalsSection";
import RulesSection from "@/components/RulesSection";
import TeamsSection from "@/components/TeamsSection";
import ParlayPage from "@/components/parlay/ParlayPage";
import NotFound from "@/pages/NotFound";

/** The old site used `#teams`-style hashes; keep those bookmarks working. */
const LEGACY_HASHES = new Set(["home", "teams", "keepers", "history", "proposals", "parlay"]);

function LegacyHashRedirect() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const tab = hash.slice(1);
    if (LEGACY_HASHES.has(tab)) navigate(tab === "home" ? "/" : `/${tab}`, { replace: true });
  }, [hash, navigate]);
  return null;
}

function Home() {
  return (
    <div className="space-y-6">
      <RulesSection />
      <DraftSection />
    </div>
  );
}

function Gate() {
  const { status } = useAuth();
  if (status === "loading") return <div className="min-h-screen" aria-busy="true" />;
  if (status === "anonymous") return <LockScreen />;
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="teams" element={<TeamsSection />} />
          <Route path="keepers" element={<KeepersSection />} />
          <Route path="history" element={<HistorySection />} />
          <Route path="proposals" element={<ProposalsSection />} />
          <Route path="parlay" element={<ParlayPage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <RetroPopup />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <LegacyHashRedirect />
        <Gate />
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  );
}
