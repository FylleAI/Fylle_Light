import { useState } from "react";
import { useContextItems, useUpdateContextItem } from "@/hooks/useContextItems";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  Folder,
  Save,
  X,
  Pencil,
} from "lucide-react";
import type { ContextItem } from "@/types/design-lab";
import ContextCSVImport from "@/components/design-lab/ContextCSVImport";

// ── Single tree node ──
function TreeNode({
  item,
  depth = 0,
}: {
  item: ContextItem;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2); // auto-expand first 2 levels
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content || "");
  const updateItem = useUpdateContextItem();

  const hasChildren = item.children && item.children.length > 0;
  const isLeaf = !hasChildren;

  const handleSave = () => {
    updateItem.mutate(
      { itemId: item.id, data: { content: editContent } },
      {
        onSuccess: () => setEditing(false),
      }
    );
  };

  const handleCancel = () => {
    setEditContent(item.content || "");
    setEditing(false);
  };

  return (
    <div className="select-none">
      {/* Node row */}
      <div
        className={`
          group flex items-start gap-2 py-1.5 px-2 rounded-lg
          hover:bg-surface-elevated/50 transition-colors
          ${depth === 0 ? "mt-1" : ""}
        `}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand/Collapse toggle */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-0.5 p-0.5 rounded hover:bg-neutral-700/50 text-neutral-500 hover:text-neutral-300 transition-colors flex-shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" /> // spacer for leaves
        )}

        {/* Icon */}
        {isLeaf ? (
          <FileText className="w-4 h-4 mt-0.5 text-neutral-600 flex-shrink-0" />
        ) : expanded ? (
          <FolderOpen className="w-4 h-4 mt-0.5 text-accent/70 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 mt-0.5 text-accent/70 flex-shrink-0" />
        )}

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium truncate ${
                depth === 0
                  ? "text-neutral-100"
                  : depth === 1
                  ? "text-neutral-200"
                  : "text-neutral-300"
              }`}
            >
              {item.name}
            </span>

            {/* Level badge */}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 flex-shrink-0">
              L{item.level}
            </span>

            {/* Edit button (visible on hover) */}
            {item.content !== null && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-700/50 text-neutral-600 hover:text-neutral-300 transition-all"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Content preview (when not editing) */}
          {item.content && !editing && (
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
              {item.content}
            </p>
          )}

          {/* Inline editor */}
          {editing && (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full bg-surface border border-neutral-700 rounded-lg p-3 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-y"
                placeholder="Enter content..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateItem.isPending}
                  className="h-7 text-xs bg-accent hover:bg-accent/90"
                >
                  {updateItem.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Save className="w-3 h-3 mr-1" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-7 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {item.children!.map((child) => (
            <TreeNode key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stats summary ──
function TreeStats({ items }: { items: ContextItem[] }) {
  let totalNodes = 0;
  let leafNodes = 0;
  let maxDepth = 0;

  function countNodes(nodes: ContextItem[], depth: number) {
    for (const node of nodes) {
      totalNodes++;
      if (depth > maxDepth) maxDepth = depth;
      if (!node.children || node.children.length === 0) {
        leafNodes++;
      } else {
        countNodes(node.children, depth + 1);
      }
    }
  }
  countNodes(items, 0);

  return (
    <div className="flex gap-4 text-xs text-neutral-500">
      <span>
        <span className="text-neutral-300 font-medium">{totalNodes}</span> items
      </span>
      <span>
        <span className="text-neutral-300 font-medium">{leafNodes}</span> with content
      </span>
      <span>
        <span className="text-neutral-300 font-medium">{maxDepth + 1}</span> levels deep
      </span>
    </div>
  );
}

// ── Main component ──
export default function ContextItemsTree() {
  const { data: items, isLoading, error } = useContextItems();
  const [expandAll, setExpandAll] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm py-4">
        Error loading context data: {(error as Error).message}
      </div>
    );
  }

  const hasItems = items && items.length > 0;

  return (
    <div className="space-y-6">
      <p className="text-neutral-400 text-sm">
        Hierarchical context data imported from CSV. This data is injected into
        the LLM prompt during content generation.
      </p>

      {/* CSV Import section */}
      <ContextCSVImport />

      {/* Tree view */}
      {hasItems ? (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-5">
            {/* Header with stats */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">🌳</span>
                <h3 className="text-sm font-semibold text-neutral-200">
                  Context Data Tree
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <TreeStats items={items} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandAll(!expandAll)}
                  className="text-xs text-neutral-400 hover:text-neutral-200 h-7"
                >
                  {expandAll ? "Collapse All" : "Expand All"}
                </Button>
              </div>
            </div>

            {/* Tree */}
            <div className="border border-neutral-800 rounded-lg p-2 max-h-[600px] overflow-y-auto scrollbar-thin">
              {items.map((item) => (
                <TreeNode
                  key={`${item.id}-${expandAll}`}
                  item={item}
                  depth={0}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3">📂</div>
            <h3 className="text-sm font-medium text-neutral-300 mb-1">
              No context data imported yet
            </h3>
            <p className="text-xs text-neutral-500">
              Upload a CSV file above to populate your hierarchical context data.
              The data will be used to enrich LLM prompts during content generation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
