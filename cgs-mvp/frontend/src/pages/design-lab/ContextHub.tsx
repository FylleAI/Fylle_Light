import { useContextSummary } from "@/hooks/useContexts";
import { Loader2 } from "lucide-react";
import ContextAreaCard from "@/components/design-lab/ContextAreaCard";
import type { ContextAreaInfo } from "@/components/design-lab/ContextAreaCard";
import { CONTEXT_AREAS } from "@/types/design-lab";

export default function ContextHub() {
  const { data: summary, isLoading } = useContextSummary();

  const contextAreas: ContextAreaInfo[] = CONTEXT_AREAS.map((area) => {
    let count: number | undefined;

    if (summary) {
      switch (area.id) {
        case "fonti-informative":
          count = summary.fonti_informative?.count;
          break;
        case "brand":
          count = summary.brand?.cards?.length;
          break;
        case "operativo":
          count = summary.operativo?.cards?.length;
          break;
        case "agent-pack":
          count = summary.agent_pack?.count;
          break;
      }
    }

    return {
      id: area.id,
      title: area.label,
      description: area.description,
      icon: area.icon,
      route: area.href,
      count,
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-100">
          Operational Context
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          The 5 areas that define your brand context
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {contextAreas.map((area) => (
          <ContextAreaCard key={area.id} area={area} />
        ))}
      </div>
    </div>
  );
}
