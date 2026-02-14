import { useAppStore } from "@/lib/store";
import { usePacks } from "@/hooks/usePacks";
import { useContextSummary } from "@/hooks/useContexts";
import { Loader2 } from "lucide-react";
import PackCard from "@/components/design-lab/PackCard";
import ContextAreaCard from "@/components/design-lab/ContextAreaCard";
import type { ContextAreaInfo } from "@/components/design-lab/ContextAreaCard";
import { CONTEXT_AREAS } from "@/types/design-lab";
import type { AgentPack } from "@/types/design-lab";

export default function DesignLabHome() {
  const user = useAppStore((s) => s.user);
  const { data: packs, isLoading: packsLoading } = usePacks();
  const { data: summary, isLoading: summaryLoading } = useContextSummary();

  // Map CONTEXT_AREAS into ContextAreaInfo with live data
  const contextAreas: ContextAreaInfo[] = CONTEXT_AREAS.map((area) => {
    let count: number | undefined;
    let description = area.description;

    if (summary) {
      switch (area.id) {
        case "fonti-informative":
          count = summary.fonti_informative?.count;
          break;
        case "fonti-mercato":
          description = summary.fonti_mercato?.has_data
            ? "Market data available"
            : area.description;
          break;
        case "brand":
          count = summary.brand?.cards?.length;
          break;
        case "operativo":
          count = summary.operativo?.cards?.length;
          break;
        case "context-items":
          count = summary.context_items?.count;
          break;
        case "agent-pack":
          count = summary.agent_pack?.count;
          break;
      }
    }

    return {
      id: area.id,
      title: area.label,
      description,
      icon: area.icon,
      route: area.href,
      count,
    };
  });

  const sortedPacks = (packs || []).sort((a: AgentPack, b: AgentPack) => {
    const order = { active: 0, available: 1, coming_soon: 2 };
    const statusA = a.user_status || a.status;
    const statusB = b.user_status || b.status;
    return (order[statusA] ?? 2) - (order[statusB] ?? 2);
  });

  return (
    <div className="space-y-10">
      {/* ── Hero ── */}
      <section className="text-center pt-4">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-100 mb-2">
          Welcome{user?.full_name ? `, ${user.full_name}` : ""}.
        </h1>
        <p className="text-neutral-400 text-base">
          Choose an Agent Pack to start generating content
        </p>
      </section>

      {/* ── Pack Carousel ── */}
      <section>
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
          Agent Pack
        </h2>

        {packsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {sortedPacks.map((pack: AgentPack) => (
              <PackCard
                key={pack.id}
                id={pack.id}
                slug={pack.slug}
                name={pack.name}
                description={pack.description}
                icon={pack.icon}
                status={(pack.user_status || pack.status) as "active" | "available" | "coming_soon"}
                outcome={pack.outcome}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Operational Context ── */}
      <section>
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
          Operational Context
        </h2>

        {summaryLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contextAreas.map((area) => (
              <ContextAreaCard key={area.id} area={area} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
