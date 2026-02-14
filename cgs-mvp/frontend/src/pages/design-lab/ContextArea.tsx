import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CONTEXT_AREAS } from "@/types/design-lab";
import FontiInformative from "./context-areas/FontiInformative";
import FontiMercato from "./context-areas/FontiMercato";
import BrandContext from "./context-areas/BrandContext";
import ContextOperativo from "./context-areas/ContextOperativo";
import ContextItemsTree from "./context-areas/ContextItemsTree";
import AgentPackList from "./context-areas/AgentPackList";

const areaComponents: Record<string, React.ComponentType> = {
  "fonti-informative": FontiInformative,
  "fonti-mercato": FontiMercato,
  "brand": BrandContext,
  "operativo": ContextOperativo,
  "context-items": ContextItemsTree,
  "agent-pack": AgentPackList,
};

interface ContextAreaProps {
  areaId: string;
}

export default function ContextArea({ areaId }: ContextAreaProps) {
  const [, navigate] = useLocation();
  const area = CONTEXT_AREAS.find((a) => a.id === areaId);
  const AreaComponent = areaComponents[areaId];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/design-lab/context")}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Context
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-2xl">{area?.icon || "📋"}</span>
        <div>
          <h1 className="text-xl font-bold text-neutral-100">
            {area?.label || areaId}
          </h1>
          <p className="text-neutral-400 text-sm">
            {area?.description || ""}
          </p>
        </div>
      </div>

      {AreaComponent ? (
        <AreaComponent />
      ) : (
        <p className="text-neutral-500 text-sm italic">
          Unrecognized area: {areaId}
        </p>
      )}
    </div>
  );
}
