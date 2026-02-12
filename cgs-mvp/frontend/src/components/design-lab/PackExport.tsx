import { useState } from "react";
import { Download, FileJson, Check, AlertCircle, Package } from "lucide-react";
import { useExportPack, usePacks } from "@/hooks/usePacks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PackExportProps {
  contextId?: string;
  packId?: string; // If provided, export this specific pack
  onSuccess?: () => void;
}

export function PackExport({ contextId, packId, onSuccess }: PackExportProps) {
  const [selectedPackId, setSelectedPackId] = useState<string>(packId || "");
  const { data: packs, isLoading } = usePacks(contextId);
  const exportPack = useExportPack();

  // Filter only user-owned packs (those with agents_config)
  const exportablePacks = packs?.filter(
    (pack) => pack.agents_config && pack.agents_config.length > 0
  );

  const handleExport = async () => {
    if (!selectedPackId) return;

    try {
      await exportPack.mutateAsync(selectedPackId);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const selectedPack = exportablePacks?.find((p) => p.id === selectedPackId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Agent Pack
        </CardTitle>
        <CardDescription>
          Download a pack as JSON template for sharing or backup
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pack Selection */}
        {!packId && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select Pack
            </label>
            <select
              value={selectedPackId}
              onChange={(e) => setSelectedPackId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a pack to export...</option>
              {isLoading && (
                <option value="" disabled>
                  Loading packs...
                </option>
              )}
              {exportablePacks?.length === 0 && (
                <option value="" disabled>
                  No exportable packs found
                </option>
              )}
              {exportablePacks?.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name}
                  {pack.agents_config
                    ? ` (${pack.agents_config.length} agents)`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selected Pack Info */}
        {selectedPack && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 font-medium text-gray-900">
              <Package className="w-4 h-4" />
              {selectedPack.name}
            </div>
            {selectedPack.description && (
              <p className="text-gray-600">{selectedPack.description}</p>
            )}
            <div className="flex gap-4 text-xs text-gray-500">
              {selectedPack.agents_config && (
                <span>
                  Agents: {selectedPack.agents_config.length}
                </span>
              )}
              {selectedPack.brief_questions && (
                <span>
                  Questions: {selectedPack.brief_questions.length}
                </span>
              )}
              {selectedPack.default_llm_provider && (
                <span>
                  Default: {selectedPack.default_llm_provider}/
                  {selectedPack.default_llm_model}
                </span>
              )}
            </div>

            {/* Agents List */}
            {selectedPack.agents_config && selectedPack.agents_config.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Agents:
                </p>
                <div className="space-y-1">
                  {selectedPack.agents_config.map((agent: any, idx: number) => (
                    <div key={idx} className="text-xs text-gray-600 pl-2">
                      {idx + 1}. {agent.name}{" "}
                      {agent.provider && (
                        <span className="text-gray-400">
                          ({agent.provider}/{agent.model})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {exportPack.isError && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              {exportPack.error instanceof Error
                ? exportPack.error.message
                : "Failed to export pack"}
            </span>
          </div>
        )}

        {/* Success Display */}
        {exportPack.isSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>Pack exported successfully! Check your downloads folder.</span>
          </div>
        )}

        {/* Info Alert */}
        {!selectedPackId && exportablePacks && exportablePacks.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              No packs available for export. Import a pack template first or
              create a pack with agents configured.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4">
          <Button
            onClick={handleExport}
            disabled={!selectedPackId || exportPack.isPending}
            className="w-full sm:w-auto"
          >
            {exportPack.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <FileJson className="w-4 h-4 mr-2" />
                Download JSON
              </>
            )}
          </Button>
        </div>

        {/* Usage Hint */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          <p className="font-medium mb-1">Export Format:</p>
          <p>
            The downloaded JSON file contains the complete pack configuration
            including agents, prompts, questions, and settings. You can modify
            it and re-import to create variations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
