import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";

interface ContentViewProps {
  packType: string;
  contentId: string;
}

export default function ContentView({ packType, contentId }: ContentViewProps) {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/design-lab/outputs/${packType}`)}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {packType.charAt(0).toUpperCase() + packType.slice(1)}
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-surface-elevated rounded-2xl flex items-center justify-center mb-6">
          <Eye className="w-8 h-8 text-neutral-500" />
        </div>
        <h1 className="text-xl font-bold text-neutral-100 mb-2">
          Contenuto #{contentId.slice(0, 8)}
        </h1>
        <p className="text-neutral-500 text-sm max-w-md">
          Preview del contenuto con chat inline per feedback e approvazione.
          <br />
          <span className="text-neutral-600">Coming in FASE 4</span>
        </p>
      </div>
    </div>
  );
}
