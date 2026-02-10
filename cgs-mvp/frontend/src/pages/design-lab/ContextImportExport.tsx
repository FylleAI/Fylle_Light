import { FileCode, BookOpen } from "lucide-react";
import ContextImport from "@/components/design-lab/ContextImport";
import ContextExport from "@/components/design-lab/ContextExport";

export default function ContextImportExport() {
  const handleDownloadExample = () => {
    // Download the example template
    fetch('/templates/example-context.json')
      .then(response => response.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'example-context.json';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('Failed to download example template:', err);
      });
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-100 mb-2">
          Import / Export Contexts
        </h1>
        <p className="text-neutral-400 text-sm">
          Bulk import contexts from template files or export existing contexts for reuse
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-surface-elevated border border-neutral-700 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-semibold text-neutral-200">
            How It Works
          </h2>
        </div>
        <div className="text-xs text-neutral-400 space-y-2">
          <p>
            <strong className="text-neutral-300">Import:</strong> Upload a JSON or YAML file containing a complete context definition (company info, audience info, voice info, goals, and cards). Perfect for bulk onboarding or migrating data.
          </p>
          <p>
            <strong className="text-neutral-300">Export:</strong> Download any existing context as a reusable template. Great for creating backups or sharing context structures across teams.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={handleDownloadExample}
            className="flex items-center gap-2 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <FileCode className="w-4 h-4" />
            Download Example Template
          </button>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <div>
          <ContextImport />
        </div>

        {/* Export Section */}
        <div>
          <ContextExport />
        </div>
      </div>

      {/* Template Schema Reference */}
      <div className="bg-surface border border-neutral-700 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-200">
          Template Schema Reference
        </h3>
        <div className="text-xs text-neutral-400 space-y-2">
          <p>Your template file must include:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><code className="text-accent">version</code> and <code className="text-accent">template_type</code> (metadata)</li>
            <li><code className="text-accent">context</code>: brand_name, name, company_info, audience_info, voice_info, goals_info</li>
            <li><code className="text-accent">cards</code>: 1-8 cards with card_type, title, and content</li>
          </ul>
          <p className="pt-2">
            Valid card types: <code className="text-accent">product</code>, <code className="text-accent">target</code>, <code className="text-accent">brand_voice</code>, <code className="text-accent">competitor</code>, <code className="text-accent">topic</code>, <code className="text-accent">campaigns</code>, <code className="text-accent">performance</code>, <code className="text-accent">feedback</code>
          </p>
        </div>
      </div>
    </div>
  );
}
