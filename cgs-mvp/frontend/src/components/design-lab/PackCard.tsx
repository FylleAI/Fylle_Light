import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import NotificationDot from "./NotificationDot";

interface PackCardProps {
  id?: string; // pack UUID — needed for "Attiva" navigation
  slug: string;
  name: string;
  description: string;
  icon: string;
  status: "active" | "available" | "coming_soon";
  outcome?: string;
  hasNew?: boolean;
}

export default function PackCard({
  id,
  slug,
  name,
  description,
  icon,
  status,
  outcome,
  hasNew,
}: PackCardProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    if (status === "active") {
      navigate(`/design-lab/outputs/${slug}`);
    } else if (status === "available" && id) {
      navigate(`/design-lab/brief/create/${id}`);
    }
  };

  return (
    <Card
      className={`relative overflow-hidden rounded-2xl border-0 transition-all min-w-[260px] max-w-[300px] flex-shrink-0 ${
        status === "coming_soon"
          ? "bg-surface-elevated/50 opacity-60"
          : "bg-surface-elevated hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
      }`}
      onClick={status !== "coming_soon" ? handleClick : undefined}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-3xl">{icon}</div>
          <div className="flex items-center gap-2">
            {hasNew && <NotificationDot />}
            <span
              className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                status === "active"
                  ? "bg-accent/20 text-accent"
                  : status === "available"
                  ? "bg-neutral-700 text-neutral-300"
                  : "bg-neutral-800 text-neutral-500"
              }`}
            >
              {status === "active"
                ? "Attivo"
                : status === "available"
                ? "Disponibile"
                : "Coming Soon"}
            </span>
          </div>
        </div>

        {/* Name + Description */}
        <h3 className="text-base font-semibold text-neutral-100 mb-1">
          {name}
        </h3>
        <p className="text-neutral-400 text-sm leading-relaxed mb-4 line-clamp-2">
          {outcome || description}
        </p>

        {/* CTA */}
        {status === "active" && (
          <Button
            size="sm"
            className="w-full bg-accent hover:bg-accent/90 text-black font-medium rounded-xl h-9 text-sm"
          >
            Vedi Contenuti
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}
        {status === "available" && (
          <Button
            size="sm"
            variant="outline"
            className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 rounded-xl h-9 text-sm"
          >
            Attiva Pack
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}
        {status === "coming_soon" && (
          <div className="flex items-center justify-center gap-1.5 text-neutral-500 text-sm py-1">
            <Lock className="w-3.5 h-3.5" />
            <span>In arrivo</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
