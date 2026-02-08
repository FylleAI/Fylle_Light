import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="bg-surface-elevated border-0 rounded-2xl my-8 max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-neutral-100 mb-2">
              Qualcosa è andato storto
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              Si è verificato un errore imprevisto. Riprova o ricarica la pagina.
            </p>
            {this.state.error && (
              <p className="text-xs text-neutral-600 bg-neutral-900 rounded-lg p-3 mb-4 font-mono text-left overflow-x-auto">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Riprova
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="bg-accent hover:bg-accent/90 text-black font-medium rounded-xl"
              >
                Ricarica pagina
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
