import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";

export default function OutputsHub() {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/design-lab")}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Home
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-surface-elevated rounded-2xl flex items-center justify-center mb-6">
          <Package className="w-8 h-8 text-neutral-500" />
        </div>
        <h1 className="text-xl font-bold text-neutral-100 mb-2">
          Outputs Hub
        </h1>
        <p className="text-neutral-500 text-sm max-w-md">
          Qui troverai tutti i contenuti generati dai tuoi Agent Pack.
          <br />
          <span className="text-neutral-600">Coming in FASE 3</span>
        </p>
      </div>
    </div>
  );
}
