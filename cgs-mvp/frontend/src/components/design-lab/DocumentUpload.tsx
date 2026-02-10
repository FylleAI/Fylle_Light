import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, Trash2, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@/types/design-lab";
import { getDocumentDownloadUrl } from "@/hooks/useDocuments";

interface DocumentUploadProps {
  documents: Document[];
  isLoading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DocumentUpload({
  documents,
  isLoading,
  onUpload,
  onDelete,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(file);
      toast({ title: "Document uploaded successfully" });
      e.target.value = ""; // Reset input
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await onDelete(id);
      toast({ title: "Document deleted" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (doc: Document, type: "context" | "brief") => {
    try {
      const url = await getDocumentDownloadUrl(doc.id, type);
      window.open(url, "_blank");
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="bg-surface border-neutral-700">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-300">Documents</h3>
          <label className="cursor-pointer">
            <Input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
              disabled={uploading}
            />
            <Button size="sm" disabled={uploading} asChild>
              <span>
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload
              </span>
            </Button>
          </label>
        </div>

        {isLoading ? (
          <div className="text-sm text-neutral-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-sm text-neutral-500 text-center py-8 border border-dashed border-neutral-700 rounded-lg">
            No documents yet. Upload brand guidelines, references, or other
            materials.
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg border border-neutral-700 hover:border-neutral-600 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-neutral-200 truncate">
                      {doc.file_name}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {formatFileSize(doc.file_size_bytes)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleDownload(
                        doc,
                        doc.context_id ? "context" : "brief"
                      )
                    }
                    className="text-neutral-400 hover:text-neutral-200"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="text-red-400 hover:text-red-300"
                  >
                    {deleting === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
