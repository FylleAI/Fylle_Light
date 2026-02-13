import { useState, useRef } from "react";
import { Upload, FileJson, Check, AlertCircle, X } from "lucide-react";
import { useImportPack } from "@/hooks/usePacks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PackImportProps {
  contextId?: string;
  onSuccess?: (result: { pack_id: string; name: string; agents_count: number }) => void;
  onCancel?: () => void;
}

export function PackImport({ contextId, onSuccess, onCancel }: PackImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importPack = useImportPack();

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);

    // Parse and preview
    try {
      const text = await file.text();
      let data;

      if (file.name.endsWith(".json")) {
        data = JSON.parse(text);
      } else {
        setPreviewData(null);
        return;
      }

      setPreviewData(data);
    } catch (error) {
      console.error("Preview error:", error);
      setPreviewData(null);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Import handler
  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const result = await importPack.mutateAsync({
        file: selectedFile,
        contextId,
      });

      if (onSuccess) {
        onSuccess(result);
      }

      // Reset
      setSelectedFile(null);
      setPreviewData(null);
    } catch (error) {
      console.error("Import error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Agent Pack
        </CardTitle>
        <CardDescription>
          Upload a JSON or YAML template to create a new multi-agent workflow
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {!selectedFile ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Upload className="w-8 h-8 text-gray-600" />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Drag and drop your pack template
                </p>
                <p className="text-xs text-gray-500">
                  or click to browse files
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileJson className="w-4 h-4 mr-2" />
                Choose File
              </Button>

              <div className="flex gap-2 justify-center text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <FileJson className="w-3 h-3" />
                  .json format
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewData(null);
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          )}
        </div>

        {/* Preview */}
        {previewData && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Preview</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              {previewData.name && (
                <div>
                  <span className="font-medium">Name:</span> {previewData.name}
                </div>
              )}
              {previewData.description && (
                <div>
                  <span className="font-medium">Description:</span>{" "}
                  {previewData.description}
                </div>
              )}
              {previewData.agents && (
                <div>
                  <span className="font-medium">Agents:</span>{" "}
                  {previewData.agents.length}
                  <div className="ml-4 mt-1 space-y-1 text-xs text-gray-600">
                    {previewData.agents.map((agent: any, idx: number) => (
                      <div key={idx}>
                        {idx + 1}. {agent.name} ({agent.provider}/{agent.model})
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {previewData.brief_questions && (
                <div>
                  <span className="font-medium">Questions:</span>{" "}
                  {previewData.brief_questions.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {importPack.isError && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              {importPack.error instanceof Error
                ? importPack.error.message
                : "Failed to import pack"}
            </span>
          </div>
        )}

        {/* Success Display */}
        {importPack.isSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>
              Pack imported successfully! Created with {importPack.data.agents_count}{" "}
              agents.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleImport}
            disabled={!selectedFile || importPack.isPending}
          >
            {importPack.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Pack
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
