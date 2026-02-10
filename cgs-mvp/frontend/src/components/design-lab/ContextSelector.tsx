import { useState } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { useContextsList, useCreateContext } from "@/hooks/useContextsList";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, Check, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/hooks/use-toast";

export default function ContextSelector() {
  const [, navigate] = useLocation();
  const contextId = useAppStore((s) => s.contextId);
  const setContextId = useAppStore((s) => s.setContextId);
  const { data: contexts, isLoading } = useContextsList();
  const createContext = useCreateContext();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newContextName, setNewContextName] = useState("");

  const currentContext = contexts?.find((ctx) => ctx.id === contextId);

  const handleSelectContext = (id: string) => {
    setContextId(id);
    setIsOpen(false);
    localStorage.setItem("contextId", id);
  };

  const handleCreateContext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContextName.trim()) return;

    try {
      const newContext = await createContext.mutateAsync(newContextName.trim());
      setContextId(newContext.id);
      localStorage.setItem("contextId", newContext.id);
      setNewContextName("");
      setIsCreating(false);
      setIsOpen(false);
      toast({
        title: "Context created",
        description: `"${newContextName}" is now active`,
      });
    } catch (error) {
      toast({
        title: "Failed to create context",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-8 w-32 bg-neutral-800 rounded-lg animate-pulse" />
    );
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
          "bg-neutral-800 text-white hover:bg-neutral-700"
        )}
      >
        <span className="font-medium truncate max-w-[120px]">
          {currentContext?.brand_name || "Select Context"}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setIsCreating(false);
            }}
          />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-surface-elevated border border-neutral-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Context List */}
            {!isCreating && (
              <div className="py-2">
                <div className="px-3 py-1.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Your Contexts
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {contexts && contexts.length > 0 ? (
                    contexts.map((ctx) => (
                      <button
                        key={ctx.id}
                        onClick={() => handleSelectContext(ctx.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                          ctx.id === contextId
                            ? "bg-accent/10 text-accent"
                            : "text-neutral-300 hover:bg-neutral-800"
                        )}
                      >
                        <span className="truncate">{ctx.brand_name}</span>
                        {ctx.id === contextId && (
                          <Check className="w-4 h-4 ml-2 flex-shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center text-neutral-500 text-sm">
                      No contexts yet
                    </div>
                  )}
                </div>

                {/* Create New Button */}
                <div className="border-t border-neutral-700 mt-2 pt-2 px-2 space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCreating(true)}
                    className="w-full justify-center border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Context
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/design-lab/context/import");
                    }}
                    className="w-full justify-center border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import / Export
                  </Button>
                </div>
              </div>
            )}

            {/* Create Context Form */}
            {isCreating && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-neutral-200 mb-3">
                  Create New Context
                </h3>
                <form onSubmit={handleCreateContext} className="space-y-3">
                  <input
                    type="text"
                    value={newContextName}
                    onChange={(e) => setNewContextName(e.target.value)}
                    placeholder="Context name (e.g., 'Acme Corp')"
                    autoFocus
                    className="w-full px-3 py-2 bg-surface border border-neutral-700 rounded-lg text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setNewContextName("");
                      }}
                      className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newContextName.trim() || createContext.isPending}
                      className="flex-1 bg-accent text-white hover:bg-accent/90"
                    >
                      {createContext.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
