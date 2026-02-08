import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import NotificationDot from "./NotificationDot";

export interface ContextAreaInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  count?: number;
  hasNew?: boolean;
}

interface ContextAreaCardProps {
  area: ContextAreaInfo;
}

export default function ContextAreaCard({ area }: ContextAreaCardProps) {
  const [, navigate] = useLocation();

  return (
    <Card
      className="bg-surface-elevated border-0 rounded-2xl cursor-pointer hover:bg-surface-elevated/80 transition-all hover:-translate-y-0.5"
      onClick={() => navigate(area.route)}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className="text-2xl flex-shrink-0">{area.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-neutral-200">
              {area.title}
            </h3>
            {area.hasNew && <NotificationDot />}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">
            {area.description}
          </p>
        </div>
        {area.count !== undefined && (
          <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
            {area.count}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />
      </CardContent>
    </Card>
  );
}
