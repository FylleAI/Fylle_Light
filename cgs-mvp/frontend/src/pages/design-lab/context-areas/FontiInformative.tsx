import { useState } from "react";
import { useContext as useContextData, useUpdateContext } from "@/hooks/useContexts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fieldLabels: Record<string, { label: string; icon: string }> = {
  name: { label: "Company Name", icon: "🏢" },
  description: { label: "Description", icon: "📝" },
  industry: { label: "Industry", icon: "🏭" },
  products: { label: "Products/Services", icon: "📦" },
  key_offerings: { label: "Key Offerings", icon: "⭐" },
  usp: { label: "Unique Selling Proposition", icon: "💎" },
  values: { label: "Values", icon: "❤️" },
  target_market: { label: "Target Market", icon: "🎯" },
  mission: { label: "Mission", icon: "🚀" },
};

export default function FontiInformative() {
  const { data: context, isLoading } = useContextData();
  const updateContext = useUpdateContext();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  const companyInfo = (context?.company_info || {}) as Record<string, unknown>;
  const website = (context as unknown as Record<string, unknown>)?.website as string | undefined;
  const hasData = Object.keys(companyInfo).length > 0 || !!website;

  if (!hasData && !isEditing) {
    return (
      <div className="space-y-4">
        <p className="text-neutral-500 text-sm italic py-4">
          No data available. Complete onboarding to populate information sources.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditData({});
            setIsEditing(true);
          }}
          className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg"
        >
          <Pencil className="w-3.5 h-3.5 mr-2" />
          Add Data
        </Button>
      </div>
    );
  }

  const startEditing = () => {
    setEditData({ ...companyInfo });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditData({});
    setIsEditing(false);
  };

  const handleSave = () => {
    updateContext.mutate(
      { updates: { company_info: editData } },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({ title: "Company info updated" });
        },
        onError: (error) => {
          toast({
            title: "Update failed",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const updateField = (key: string, value: unknown) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  const renderValue = (value: unknown) => {
    if (typeof value === "string") {
      return <p className="text-sm text-neutral-300 whitespace-pre-wrap">{value}</p>;
    }
    if (Array.isArray(value)) {
      return (
        <ul className="space-y-1">
          {value.map((item, i) => (
            <li key={i} className="text-sm text-neutral-300 flex items-start">
              <span className="text-neutral-600 mr-2">•</span>
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof value === "object" && value !== null) {
      return (
        <div className="space-y-1">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="text-neutral-500">{k}: </span>
              <span className="text-neutral-300">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-sm text-neutral-300">{String(value)}</p>;
  };

  const renderEditField = (key: string, value: unknown) => {
    if (Array.isArray(value)) {
      return (
        <textarea
          value={(value as string[]).join("\n")}
          onChange={(e) =>
            updateField(
              key,
              e.target.value.split("\n").filter((s) => s.trim())
            )
          }
          rows={Math.max(3, (value as string[]).length + 1)}
          placeholder="One item per line..."
          className="w-full bg-surface text-neutral-200 text-sm rounded-xl px-4 py-3 resize-none border border-neutral-700 focus:border-accent/50 focus:outline-none placeholder:text-neutral-600"
        />
      );
    }
    if (typeof value === "string" && value.length > 80) {
      return (
        <textarea
          value={value}
          onChange={(e) => updateField(key, e.target.value)}
          rows={3}
          className="w-full bg-surface text-neutral-200 text-sm rounded-xl px-4 py-3 resize-none border border-neutral-700 focus:border-accent/50 focus:outline-none placeholder:text-neutral-600"
        />
      );
    }
    return (
      <input
        type="text"
        value={typeof value === "string" ? value : JSON.stringify(value)}
        onChange={(e) => updateField(key, e.target.value)}
        className="w-full bg-surface text-neutral-200 text-sm rounded-xl px-4 py-3 border border-neutral-700 focus:border-accent/50 focus:outline-none placeholder:text-neutral-600"
      />
    );
  };

  const displayData = isEditing ? editData : companyInfo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-neutral-400 text-sm">
          Information collected from the website and company sources.
        </p>
        {!isEditing ? (
          <Button
            size="sm"
            variant="outline"
            onClick={startEditing}
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg"
          >
            <Pencil className="w-3.5 h-3.5 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={cancelEditing}
              className="border-neutral-600 text-neutral-400 hover:bg-neutral-700 rounded-lg"
            >
              <X className="w-3.5 h-3.5 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateContext.isPending}
              className="bg-accent hover:bg-accent/90 text-black font-medium rounded-lg"
            >
              {updateContext.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-2" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>

      {website && (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌐</span>
              <h3 className="text-sm font-medium text-neutral-200">Website</h3>
            </div>
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline"
            >
              {website}
            </a>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(displayData).map(([key, value]) => {
          if (!isEditing && (!value || (Array.isArray(value) && value.length === 0)))
            return null;
          const meta = fieldLabels[key] || {
            label: key.replace(/_/g, " "),
            icon: "📋",
          };
          return (
            <Card key={key} className="bg-surface-elevated border-0 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{meta.icon}</span>
                  <h3 className="text-xs text-neutral-500 uppercase tracking-wide">
                    {meta.label}
                  </h3>
                </div>
                {isEditing ? renderEditField(key, value) : renderValue(value)}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
