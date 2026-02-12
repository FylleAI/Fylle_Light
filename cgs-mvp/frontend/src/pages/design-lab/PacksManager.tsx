import { useState } from "react";
import { useLocation } from "wouter";
import { PackImport } from "@/components/design-lab/PackImport";
import { PackExport } from "@/components/design-lab/PackExport";
import { Upload, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PacksManager() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("import");

  // Get context_id from URL query params
  const contextId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("context_id") || undefined
    : undefined;

  const handleImportSuccess = (result: {
    pack_id: string;
    name: string;
    agents_count: number;
  }) => {
    console.log("Import successful:", result);
    // Optionally navigate to the pack detail or packs list
    setTimeout(() => {
      if (contextId) {
        setLocation(`/design-lab/packs?context_id=${contextId}`);
      } else {
        setLocation("/design-lab/packs");
      }
    }, 2000);
  };

  const handleExportSuccess = () => {
    console.log("Export successful");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Agent Pack Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Import and export multi-agent workflow templates
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="grid w-full max-w-md grid-cols-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("import")}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "import"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "export"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "import" && (
          <div className="mt-6">
            <PackImport
              contextId={contextId}
              onSuccess={handleImportSuccess}
            />

            {/* Documentation */}
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Template Format
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  Agent pack templates are JSON or YAML files that define
                  multi-agent workflows with embedded prompts and configurations.
                </p>
                <div className="bg-white/50 p-3 rounded font-mono text-xs overflow-x-auto">
                  <pre>{`{
  "name": "Article Generator",
  "description": "Research + Write",
  "agents": [
    {
      "name": "Researcher",
      "provider": "openai",
      "model": "gpt-4o",
      "prompt": "Research {{topic}}..."
    },
    {
      "name": "Writer",
      "prompt": "Using {{agent.Researcher.output}}..."
    }
  ],
  "brief_questions": [
    {"id": "topic", "question": "Topic?"}
  ]
}`}</pre>
                </div>
                <p className="pt-2">
                  <strong>Template Variables:</strong> Use{" "}
                  <code className="bg-white/70 px-1 py-0.5 rounded">
                    {"{{topic}}"}
                  </code>
                  ,{" "}
                  <code className="bg-white/70 px-1 py-0.5 rounded">
                    {"{{context.brand_name}}"}
                  </code>
                  ,{" "}
                  <code className="bg-white/70 px-1 py-0.5 rounded">
                    {"{{agent.Researcher.output}}"}
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "export" && (
          <div className="mt-6">
            <PackExport
              contextId={contextId}
              onSuccess={handleExportSuccess}
            />

            {/* Documentation */}
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-semibold text-green-900 mb-2">
                Export Tips
              </h3>
              <div className="text-sm text-green-800 space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Exported templates can be modified and re-imported to create
                    variations
                  </li>
                  <li>
                    Share templates with teammates or use as backups
                  </li>
                  <li>
                    Templates include all agent configurations, prompts, and
                    questions
                  </li>
                  <li>
                    Context-specific data (like brand name) is accessed via
                    template variables
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Example Templates */}
        <div className="mt-12 p-6 bg-gray-100 border border-gray-300 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            🚀 Quick Start Examples
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-1">
                Simple Article Generator
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                2-agent workflow: Research → Write
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Download example template
                  const example = {
                    version: "1.0",
                    name: "Simple Article Generator",
                    description: "Research + Write article",
                    icon: "📝",
                    agents: [
                      {
                        name: "Researcher",
                        provider: "openai",
                        model: "gpt-4o",
                        prompt:
                          "Research {{topic}} for {{context.brand_name}}",
                      },
                      {
                        name: "Writer",
                        provider: "anthropic",
                        model: "claude-3-5-sonnet-20241022",
                        prompt:
                          "Using:\n{{agent.Researcher.output}}\n\nWrite article about {{topic}}",
                      },
                    ],
                    brief_questions: [
                      { id: "topic", question: "Topic?", type: "text" },
                    ],
                  };

                  const blob = new Blob([JSON.stringify(example, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "article-generator-template.json";
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="w-3 h-3 mr-1" />
                Download Example
              </Button>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-1">
                Social Media Campaign
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                3-agent workflow: Research → Plan → Create
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const example = {
                    version: "1.0",
                    name: "Social Media Campaign",
                    description: "Research + Plan + Create posts",
                    icon: "📱",
                    agents: [
                      {
                        name: "Researcher",
                        provider: "openai",
                        model: "gpt-4o",
                        prompt: "Research {{topic}} and trending hashtags",
                      },
                      {
                        name: "Strategist",
                        provider: "openai",
                        model: "gpt-4o",
                        prompt:
                          "Using:\n{{agent.Researcher.output}}\n\nPlan campaign strategy",
                      },
                      {
                        name: "Creator",
                        provider: "anthropic",
                        model: "claude-3-5-sonnet-20241022",
                        prompt:
                          "Using:\n{{agent.Strategist.output}}\n\nCreate {{post_count}} posts",
                      },
                    ],
                    brief_questions: [
                      { id: "topic", question: "Campaign topic?", type: "text" },
                      {
                        id: "post_count",
                        question: "Number of posts?",
                        type: "number",
                        default: 5,
                      },
                    ],
                  };

                  const blob = new Blob([JSON.stringify(example, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "social-campaign-template.json";
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="w-3 h-3 mr-1" />
                Download Example
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
