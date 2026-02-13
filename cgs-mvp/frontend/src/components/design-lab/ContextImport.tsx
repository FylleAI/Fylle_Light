import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useImportContext } from "@/hooks/useContextsList";
import { useAppStore } from "@/lib/store";

export default function ContextImport() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const importContext = useImportContext();
  const setContextId = useAppStore((s) => s.setContextId);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.match(/\.(json|yaml|yml)$/)) {
      setError("File must be .json, .yaml, or .yml");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Parse and preview
    try {
      const text = await selectedFile.text();
      const data = selectedFile.name.endsWith('.json')
        ? JSON.parse(text)
        : JSON.parse(text); // For YAML support, would need js-yaml library

      setPreview({
        brand_name: data.context?.brand_name,
        cards_count: data.cards?.length || 0,
        has_company_info: !!data.context?.company_info,
        has_audience_info: !!data.context?.audience_info,
        has_voice_info: !!data.context?.voice_info,
        has_goals_info: !!data.context?.goals_info
      });
    } catch (err) {
      setError("Invalid file format. Could not parse template.");
      setPreview(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const result = await importContext.mutateAsync(file);
      toast({
        title: "Context imported successfully",
        description: `"${result.brand_name}" with ${result.cards_count} cards`
      });

      // Auto-select the newly imported context
      setContextId(result.context_id);
      localStorage.setItem('contextId', result.context_id);

      // Reset form
      setFile(null);
      setPreview(null);

      // Redirect to home after import
      setTimeout(() => navigate("/design-lab"), 1500);
    } catch (err: any) {
      toast({
        title: "Import failed",
        description: err.message || "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-surface-elevated border-0">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-accent" />
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">
              Import Context Template
            </h3>
            <p className="text-xs text-neutral-500">
              Upload a JSON template file
            </p>
          </div>
        </div>

        {/* File Input */}
        <div className="border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            id="template-upload"
          />
          <label
            htmlFor="template-upload"
            className="cursor-pointer block"
          >
            <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
            <p className="text-sm text-neutral-400">
              {file ? file.name : "Click to select template file"}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Supports .json format
            </p>
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="bg-surface border border-neutral-700 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <CheckCircle2 className="w-4 h-4" />
              <p className="text-sm font-medium">Template Valid</p>
            </div>
            <div className="text-xs text-neutral-400 space-y-1">
              <p>Brand: <span className="text-neutral-300">{preview.brand_name}</span></p>
              <p>Cards: <span className="text-neutral-300">{preview.cards_count}</span></p>
              <p>
                Info Sections:
                {preview.has_company_info && " Company"}
                {preview.has_audience_info && " • Audience"}
                {preview.has_voice_info && " • Voice"}
                {preview.has_goals_info && " • Goals"}
              </p>
            </div>
          </div>
        )}

        {/* Import Button */}
        <Button
          onClick={handleImport}
          disabled={!file || !!error || importContext.isPending}
          className="w-full bg-accent hover:bg-accent/90"
        >
          {importContext.isPending ? "Importing..." : "Import Context"}
        </Button>
      </CardContent>
    </Card>
  );
}
