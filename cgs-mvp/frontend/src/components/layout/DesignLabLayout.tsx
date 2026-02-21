import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/lib/store";
import {
  Home,
  Layers,
  FileOutput,
  Archive,
  LogOut,
  ChevronRight,
  Package,
} from "lucide-react";
import { cn } from "@/lib/cn";
import ContextSelector from "@/components/design-lab/ContextSelector";

interface DesignLabLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: "/design-lab", label: "Home", icon: Home },
  { path: "/design-lab/context", label: "Context", icon: Layers },
  { path: "/design-lab/packs/manager", label: "Pack Manager", icon: Package },
  { path: "/design-lab/outputs", label: "Outputs", icon: FileOutput },
  { path: "/design-lab/archive", label: "Archive", icon: Archive },
];

export default function DesignLabLayout({ children }: DesignLabLayoutProps) {
  const [location, navigate] = useLocation();
  const { logout } = useAuth();
  const user = useAppStore((s) => s.user);
  const contextId = useAppStore((s) => s.contextId);

  // Build breadcrumbs from current path
  const pathParts = location.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, idx) => ({
    label: part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    path: "/" + pathParts.slice(0, idx + 1).join("/"),
  }));

  return (
    <div className="dark min-h-screen bg-surface text-neutral-100">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-surface/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo + Nav */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate("/design-lab")}
                className="text-lg font-bold text-white tracking-tight"
              >
                Fylle
              </button>

              <nav className="hidden sm:flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    location === item.path ||
                    (item.path !== "/design-lab" &&
                      location.startsWith(item.path));
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        const dest =
                          item.path === "/design-lab/packs/manager" && contextId
                            ? `${item.path}?context_id=${contextId}`
                            : item.path;
                        navigate(dest);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-neutral-800 text-white"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              {/* Context Selector */}
              <ContextSelector />

              <span className="text-sm text-neutral-400 hidden sm:block">
                {user?.full_name || user?.email}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Breadcrumbs ── */}
      {breadcrumbs.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1 text-sm text-neutral-500">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.path} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="w-3 h-3" />}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-neutral-300">{crumb.label}</span>
                ) : (
                  <button
                    onClick={() => navigate(crumb.path)}
                    className="hover:text-neutral-300 transition-colors"
                  >
                    {crumb.label}
                  </button>
                )}
              </span>
            ))}
          </nav>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {children}
      </main>
    </div>
  );
}
