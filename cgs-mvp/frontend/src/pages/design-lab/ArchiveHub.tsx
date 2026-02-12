import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useArchive, useArchiveStats, useArchiveSearch } from "@/hooks/useArchive";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCardsSkeleton, ContentListSkeleton } from "@/components/design-lab/Skeletons";
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Archive,
  ArrowRight,
} from "lucide-react";
import type { ArchiveItem } from "@/hooks/useArchive";

type FilterTab = "all" | "approved" | "rejected" | "references";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const statusConfig = {
  approved: { label: "Approved", icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
  pending: { label: "Pending", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
};

export default function ArchiveHub() {
  const [, navigate] = useLocation();
  const contextId = useAppStore((s) => s.contextId);
  const { data: items, isLoading } = useArchive(contextId ?? undefined);
  const { data: stats } = useArchiveStats(contextId ?? undefined);
  const searchMutation = useArchiveSearch();

  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ArchiveItem[] | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !contextId) return;
    try {
      const results = await searchMutation.mutateAsync({
        query: searchQuery.trim(),
        context_id: contextId,
      });
      setSearchResults(results);
    } catch {
      // Error handled by mutation
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  // Filter items based on active tab
  const displayItems = useMemo(() => {
    const source = searchResults ?? items ?? [];
    switch (filter) {
      case "approved":
        return source.filter((i) => i.review_status === "approved");
      case "rejected":
        return source.filter((i) => i.review_status === "rejected");
      case "references":
        return source.filter((i) => i.is_reference);
      default:
        return source;
    }
  }, [items, searchResults, filter]);

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: stats?.total },
    { key: "approved", label: "Approved", count: stats?.approved },
    { key: "rejected", label: "Rejected", count: stats?.rejected },
    { key: "references", label: "References", count: stats?.references_count },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-100 mb-1">Archive</h1>
        <p className="text-neutral-400 text-sm">
          History of generated outputs with their reviews and feedback.
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-surface-elevated border-0 rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-neutral-100">{stats.total}</p>
              <p className="text-xs text-neutral-500 mt-1">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-surface-elevated border-0 rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
              <p className="text-xs text-neutral-500 mt-1">Approved</p>
            </CardContent>
          </Card>
          <Card className="bg-surface-elevated border-0 rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              <p className="text-xs text-neutral-500 mt-1">Rejected</p>
            </CardContent>
          </Card>
          <Card className="bg-surface-elevated border-0 rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{stats.references_count}</p>
              <p className="text-xs text-neutral-500 mt-1">References</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the archive (semantic search)..."
            className="bg-surface-elevated border-neutral-700 text-neutral-100 h-10 rounded-xl pl-10"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={!searchQuery.trim() || !contextId || searchMutation.isPending}
          className="bg-accent hover:bg-accent/90 text-black font-medium rounded-xl h-10 px-4"
        >
          {searchMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
        {searchResults && (
          <Button
            variant="ghost"
            onClick={clearSearch}
            className="text-neutral-400 hover:text-neutral-200 rounded-xl h-10"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-elevated rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab.key
                ? "bg-neutral-700 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Items list */}
      {isLoading ? (
        <>
          <StatsCardsSkeleton />
          <ContentListSkeleton count={5} />
        </>
      ) : displayItems.length === 0 ? (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-12 text-center">
            <Archive className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm">
              {searchResults
                ? "No results found for the search."
                : "No items in the archive. Generate and review content to populate the archive."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item) => {
            const cfg = statusConfig[item.review_status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <Card
                key={item.id}
                className="bg-surface-elevated border-0 rounded-2xl hover:bg-neutral-800/80 transition-colors cursor-pointer"
                onClick={() => navigate(`/design-lab/archive/${item.output_id}`)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Status icon */}
                  <div className={`p-2 rounded-xl ${cfg.bg}`}>
                    <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-100 truncate">
                        {item.topic || `Output #${item.output_id.slice(0, 8)}`}
                      </p>
                      {item.is_reference && (
                        <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-neutral-600">•</span>
                      <span className="text-xs text-neutral-500">
                        {item.content_type}
                      </span>
                      <span className="text-xs text-neutral-600">•</span>
                      <span className="text-xs text-neutral-500">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    {item.feedback && (
                      <p className="text-xs text-neutral-500 mt-1 truncate">
                        {item.feedback}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
