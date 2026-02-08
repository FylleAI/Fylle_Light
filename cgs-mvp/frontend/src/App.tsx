import { Route, Switch, Redirect } from "wouter";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

// Layouts
import OnboardingLayout from "@/components/layout/OnboardingLayout";
import DesignLabLayout from "@/components/layout/DesignLabLayout";

// Auth pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";

// Onboarding pages
import Onboarding from "@/pages/Onboarding";
import OnboardingCards from "@/pages/OnboardingCards";

// Design Lab pages
import DesignLabHome from "@/pages/design-lab/DesignLabHome";
import ContextHub from "@/pages/design-lab/ContextHub";
import ContextArea from "@/pages/design-lab/ContextArea";
import OutputsHub from "@/pages/design-lab/OutputsHub";
import PackOutputs from "@/pages/design-lab/PackOutputs";
import ContentView from "@/pages/design-lab/ContentView";
import BriefCreate from "@/pages/design-lab/BriefCreate";
import BriefDetail from "@/pages/design-lab/BriefDetail";
import Execute from "@/pages/design-lab/Execute";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neutral-400" />
        <p className="text-neutral-500 text-sm">Caricamento...</p>
      </div>
    </div>
  );
}

/** Redirects unauthenticated users to /login */
function ProtectedRoute({
  children,
  requireContext,
}: {
  children: React.ReactNode;
  requireContext?: boolean;
}) {
  const user = useAppStore((s) => s.user);
  const contextId = useAppStore((s) => s.contextId);

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (requireContext && !contextId) {
    return <Redirect to="/onboarding" />;
  }

  return <>{children}</>;
}

export default function App() {
  // Initialize auth — this hook checks the session on mount
  useAuth();

  const isAuthReady = useAppStore((s) => s.isAuthReady);

  if (!isAuthReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Switch>
        {/* ── Public routes ── */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

        {/* ── Onboarding routes (auth required, no context required) ── */}
        <Route path="/onboarding">
          <ProtectedRoute>
            <OnboardingLayout>
              <Onboarding />
            </OnboardingLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/onboarding/cards">
          <ProtectedRoute>
            <OnboardingLayout>
              <OnboardingCards />
            </OnboardingLayout>
          </ProtectedRoute>
        </Route>

        {/* ── Design Lab routes (auth + context required) ── */}
        <Route path="/design-lab">
          <ProtectedRoute requireContext>
            <DesignLabLayout>
              <DesignLabHome />
            </DesignLabLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/design-lab/context">
          <ProtectedRoute requireContext>
            <DesignLabLayout>
              <ContextHub />
            </DesignLabLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/design-lab/context/:areaId">
          {(params) => (
            <ProtectedRoute requireContext>
              <DesignLabLayout>
                <ContextArea areaId={params.areaId} />
              </DesignLabLayout>
            </ProtectedRoute>
          )}
        </Route>

        {/* Brief routes */}
        <Route path="/design-lab/brief/create/:packId">
          {(params) => (
            <ProtectedRoute requireContext>
              <DesignLabLayout>
                <BriefCreate packId={params.packId} />
              </DesignLabLayout>
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/design-lab/brief/:briefSlug">
          {(params) => (
            <ProtectedRoute requireContext>
              <DesignLabLayout>
                <BriefDetail briefSlug={params.briefSlug} />
              </DesignLabLayout>
            </ProtectedRoute>
          )}
        </Route>

        {/* Execute route */}
        <Route path="/design-lab/execute/:briefId">
          {(params) => (
            <ProtectedRoute requireContext>
              <DesignLabLayout>
                <Execute briefId={params.briefId} />
              </DesignLabLayout>
            </ProtectedRoute>
          )}
        </Route>

        {/* Outputs routes */}
        <Route path="/design-lab/outputs">
          <ProtectedRoute requireContext>
            <DesignLabLayout>
              <OutputsHub />
            </DesignLabLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/design-lab/outputs/:packType">
          {(params) => (
            <ProtectedRoute requireContext>
              <DesignLabLayout>
                <PackOutputs packType={params.packType} />
              </DesignLabLayout>
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/design-lab/outputs/:packType/:contentId">
          {(params) => (
            <ProtectedRoute requireContext>
              <DesignLabLayout>
                <ContentView
                  packType={params.packType}
                  contentId={params.contentId}
                />
              </DesignLabLayout>
            </ProtectedRoute>
          )}
        </Route>

        {/* ── Default redirect ── */}
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}
