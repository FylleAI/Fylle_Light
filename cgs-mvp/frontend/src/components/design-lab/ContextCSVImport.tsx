import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useImportContextCSV } from "@/hooks/useContextItems";

export default function ContextCSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    rows: number;
    levels: string[];
    firstItems: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importCSV = useImportContextCSV();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setError("File must be a .csv");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Preview: parse first few rows
    try {
      const text = await selectedFile.text();
      const lines = text.split("\n").filter((l) => l.trim());
      const headers = lines[0]?.split(",").map((h) => h.trim().replace(/"/g, ""));

      // Find Level columns
      const levelCols = headers?.filter((h) => h.startsWith("Level ")) || [];
      // Get first items from each level
      const firstItems: string[] = [];
      for (let i = 1; i < Math.min(lines.length, 4); i++) {
        // Simple CSV parse (handle quoted fields)
        const match = lines[i].match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g);
        if (match && match.length > 1) {
          const val = match[1]?.replace(/^,/, "").replace(/^"|"$/g, "").trim();
          if (val && !firstItems.includes(val)) firstItems.push(val);
        }
      }

      setPreview({
        rows: lines.length - 1, // exclude header
        levels: levelCols,
        firstItems: firstItems.slice(0, 5),
      });
    } catch {
      setError("Cannot read CSV file");
      setPreview(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      await importCSV.mutateAsync(file);
      // Reset after success
      setFile(null);
      setPreview(null);
    } catch {
      // Error handled by the hook's onError
    }
  };

  return (
    <Card className="bg-surface-elevated border-0">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-accent" />
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">
              Import Context from CSV
            </h3>
            <p className="text-xs text-neutral-500">
              Upload a CSV with Level 0-3 columns and Content
            </p>
          </div>
        </div>

        {/* File Input */}
        <div className="border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer block">
            <Upload className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
            <p className="text-sm text-neutral-400">
              {file ? file.name : "Click to select CSV file"}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Columns: Level 0, Level 1, Level 2, Level 3, Contenuto
            </p>
          </label>
        </div>

        {/* Error */}
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
              <p className="text-sm font-medium">CSV Valid</p>
            </div>
            <div className="text-xs text-neutral-400 space-y-1">
              <p>
                Rows: <span className="text-neutral-300">{preview.rows}</span>
              </p>
              <p>
                Levels:{" "}
                <span className="text-neutral-300">
                  {preview.levels.join(", ")}
                </span>
              </p>
              {preview.firstItems.length > 0 && (
                <p>
                  Sections:{" "}
                  <span className="text-neutral-300">
                    {preview.firstItems.join(", ")}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Import Button */}
        <Button
          onClick={handleImport}
          disabled={!file || !!error || importCSV.isPending}
          className="w-full bg-accent hover:bg-accent/90"
        >
          {importCSV.isPending ? "Importing..." : "Import CSV Context Data"}
        </Button>
      </CardContent>
    </Card>
  );
}
