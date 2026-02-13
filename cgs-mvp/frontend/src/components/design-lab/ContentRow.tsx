import { useLocation } from "wouter";
import NotificationDot from "./NotificationDot";
import type { ContentStatus } from "@/types/design-lab";

interface ContentRowProps {
  id: string;
  number: number;
  title: string;
  date: string;
  author: string;
  status: ContentStatus;
  isNew?: boolean;
  packSlug: string;
}

const statusConfig: Record<
  ContentStatus,
  { label: string; bg: string; text: string }
> = {
  pending_review: {
    label: "Pending Review",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
  },
  completed: {
    label: "Completed",
    bg: "bg-green-500/10",
    text: "text-green-400",
  },
  adapted: {
    label: "Adapted",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function ContentRow({
  id,
  number,
  title,
  date,
  author,
  status,
  isNew,
  packSlug,
}: ContentRowProps) {
  const [, navigate] = useLocation();
  const config = statusConfig[status] || statusConfig.pending_review;

  return (
    <button
      type="button"
      onClick={() => navigate(`/design-lab/outputs/${packSlug}/${id}`)}
      className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left hover:bg-surface-elevated/80 group ${
        isNew
          ? "bg-surface-elevated border-l-2 border-l-accent"
          : "bg-surface-elevated/50"
      }`}
    >
      {/* Number */}
      <span className="text-xs text-neutral-500 font-mono w-8 flex-shrink-0 text-right">
        #{number}
      </span>

      {/* Title */}
      <span className="text-sm text-neutral-200 flex-1 truncate group-hover:text-neutral-100">
        {title}
      </span>

      {/* Date */}
      <span className="text-xs text-neutral-500 hidden sm:block flex-shrink-0">
        {formatDate(date)}
      </span>

      {/* Author */}
      <span className="text-xs text-neutral-400 hidden md:block flex-shrink-0 w-16 text-right">
        {author}
      </span>

      {/* Status badge */}
      <span
        className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>

      {/* New indicator */}
      {isNew && (
        <div className="flex-shrink-0">
          <NotificationDot />
        </div>
      )}
    </button>
  );
}
