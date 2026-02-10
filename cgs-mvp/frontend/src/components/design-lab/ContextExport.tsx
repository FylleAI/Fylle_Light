import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useContextsList, useExportContext } from "@/hooks/useContextsList";
import { useToast } from "@/hooks/use-toast";

export default function ContextExport() {
  const { data: contexts, isLoading } = useContextsList();
  const exportContext = useExportContext();
  const { toast } = useToast();

  const handleExport = async (contextId: string, brandName: string) => {
    try {
      await exportContext.mutateAsync(contextId);
      toast({
        title: "Context exported",
        description: `Template downloaded: ${brandName}_template.json`
      });
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err.message || "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-surface-elevated border-0">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-accent" />
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">
              Export Existing Context
            </h3>
            <p className="text-xs text-neutral-500">
              Download a context as a reusable template
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : contexts && contexts.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {contexts.map((context) => (
              <div
                key={context.id}
                className="flex items-center justify-between p-3 bg-surface border border-neutral-700 rounded-lg hover:bg-surface/80 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-200 truncate">
                    {context.brand_name}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    Created {new Date(context.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport(context.id, context.brand_name)}
                  disabled={exportContext.isPending}
                  className="ml-3 text-xs border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg"
                >
                  {exportContext.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500 text-center py-8">
            No contexts available to export
          </p>
        )}
      </CardContent>
    </Card>
  );
}
