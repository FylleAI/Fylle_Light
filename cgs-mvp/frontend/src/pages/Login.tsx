import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/lib/store";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const user = useAppStore((s) => s.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    const contextId = useAppStore.getState().contextId;
    navigate(contextId ? "/design-lab" : "/onboarding");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Credenziali non valide"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-neutral-100">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Fylle</h1>
          <p className="text-neutral-500 text-sm mt-1">
            AI Content Platform
          </p>
        </div>

        <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl">
          <CardContent className="pt-8 pb-8 px-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">
              Accedi
            </h2>
            <p className="text-neutral-500 text-sm mb-6">
              Inserisci le tue credenziali
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tuonome@azienda.com"
                  className="h-12 bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 rounded-xl"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 rounded-xl"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accesso in corso...
                  </>
                ) : (
                  "Accedi"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-500">
                Non hai un account?{" "}
                <button
                  onClick={() => navigate("/register")}
                  className="text-neutral-900 font-medium hover:underline"
                >
                  Registrati
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
