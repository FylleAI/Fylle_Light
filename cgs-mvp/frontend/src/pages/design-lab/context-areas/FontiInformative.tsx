import { useContext as useContextData } from "@/hooks/useContexts";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const fieldLabels: Record<string, { label: string; icon: string }> = {
  name: { label: "Nome Azienda", icon: "🏢" },
  description: { label: "Descrizione", icon: "📝" },
  industry: { label: "Settore", icon: "🏭" },
  products: { label: "Prodotti/Servizi", icon: "📦" },
  key_offerings: { label: "Key Offerings", icon: "⭐" },
  usp: { label: "Unique Selling Proposition", icon: "💎" },
  values: { label: "Valori", icon: "❤️" },
  target_market: { label: "Mercato Target", icon: "🎯" },
  mission: { label: "Mission", icon: "🚀" },
};

export default function FontiInformative() {
  const { data: context, isLoading } = useContextData();

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

  if (!hasData) {
    return (
      <p className="text-neutral-500 text-sm italic py-4">
        Nessun dato disponibile. Completa l'onboarding per popolare le fonti informative.
      </p>
    );
  }

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

  return (
    <div className="space-y-6">
      <p className="text-neutral-400 text-sm">
        Informazioni raccolte dal sito web e da fonti aziendali.
      </p>

      {website && (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌐</span>
              <h3 className="text-sm font-medium text-neutral-200">Sito Web</h3>
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
        {Object.entries(companyInfo).map(([key, value]) => {
          if (!value || (Array.isArray(value) && value.length === 0)) return null;
          const meta = fieldLabels[key] || { label: key.replace(/_/g, " "), icon: "📋" };
          return (
            <Card key={key} className="bg-surface-elevated border-0 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{meta.icon}</span>
                  <h3 className="text-xs text-neutral-500 uppercase tracking-wide">
                    {meta.label}
                  </h3>
                </div>
                {renderValue(value)}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
