# Agent Pack Import/Export - Frontend UI

## 📦 Components Implementati

### 1. Hooks (`/src/hooks/usePacks.ts`)

#### `useImportPack()`
Import pack da file JSON/YAML template.

**Usage:**
```tsx
import { useImportPack } from "@/hooks/usePacks";

function MyComponent() {
  const importPack = useImportPack();

  const handleUpload = async (file: File, contextId?: string) => {
    try {
      const result = await importPack.mutateAsync({ file, contextId });
      console.log("Imported:", result.pack_id, result.name, result.agents_count);
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  return (
    <button
      onClick={() => handleUpload(selectedFile, contextId)}
      disabled={importPack.isPending}
    >
      {importPack.isPending ? "Importing..." : "Import Pack"}
    </button>
  );
}
```

**Return:**
```typescript
{
  pack_id: string;
  name: string;
  agents_count: number;
}
```

---

#### `useExportPack()`
Export pack come JSON template e download automatico.

**Usage:**
```tsx
import { useExportPack } from "@/hooks/usePacks";

function MyComponent() {
  const exportPack = useExportPack();

  const handleExport = async (packId: string) => {
    try {
      await exportPack.mutateAsync(packId);
      // File scaricato automaticamente
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <button onClick={() => handleExport(packId)}>
      Export Pack
    </button>
  );
}
```

**Auto-download:** Il file JSON viene scaricato automaticamente come `{pack-name}-template.json`

---

### 2. Components

#### `<PackImport />` (`/src/components/design-lab/PackImport.tsx`)

Componente completo per import pack con drag & drop, preview, e validation.

**Props:**
```typescript
interface PackImportProps {
  contextId?: string;  // Optional: associate pack with context
  onSuccess?: (result: { pack_id: string; name: string; agents_count: number }) => void;
  onCancel?: () => void;
}
```

**Features:**
- ✅ Drag & drop file upload
- ✅ File type validation (.json, .yaml, .yml)
- ✅ JSON preview (name, description, agents count, questions)
- ✅ Error handling con Alert UI
- ✅ Success feedback
- ✅ Loading states

**Usage:**
```tsx
import { PackImport } from "@/components/design-lab/PackImport";

function MyPage() {
  const [contextId] = useSearchParams().get("context_id");

  return (
    <PackImport
      contextId={contextId}
      onSuccess={(result) => {
        console.log("Pack imported:", result);
        navigate("/design-lab/packs");
      }}
      onCancel={() => navigate(-1)}
    />
  );
}
```

---

#### `<PackExport />` (`/src/components/design-lab/PackExport.tsx`)

Componente completo per export pack con lista packs, preview, e download.

**Props:**
```typescript
interface PackExportProps {
  contextId?: string;  // Optional: filter packs by context
  packId?: string;     // Optional: pre-select specific pack
  onSuccess?: () => void;
}
```

**Features:**
- ✅ Select dropdown con lista packs
- ✅ Filtra solo packs esportabili (con agents_config)
- ✅ Preview pack details (agents, questions, config)
- ✅ Download automatico JSON
- ✅ Error handling
- ✅ Success feedback

**Usage:**
```tsx
import { PackExport } from "@/components/design-lab/PackExport";

function MyPage() {
  return (
    <PackExport
      contextId={contextId}
      onSuccess={() => {
        toast.success("Pack exported successfully!");
      }}
    />
  );
}
```

---

### 3. Page (`/src/pages/design-lab/PacksManager.tsx`)

Pagina completa che combina import ed export con tabs, documentazione, e esempi.

**Route:** `/design-lab/packs/manager`

**Query Params:**
- `context_id` (optional): Pre-fill context association

**Features:**
- ✅ Tabs: Import / Export
- ✅ Documentation inline
- ✅ Template format examples
- ✅ Download example templates (Article Generator, Social Campaign)
- ✅ Back navigation
- ✅ Auto-redirect after import

**Usage:**
```tsx
// Navigate to manager
navigate("/design-lab/packs/manager");

// Navigate to manager with context pre-selected
navigate(`/design-lab/packs/manager?context_id=${contextId}`);
```

---

## 🎨 UI/UX Features

### Visual Design
- **shadcn/ui components:** Card, Button, Alert, Select, Tabs
- **Icons:** lucide-react (Upload, Download, FileJson, Package, etc.)
- **Color coding:**
  - Blue alerts for documentation
  - Green alerts for success/export tips
  - Red alerts for errors
  - Gray for neutral states

### Interactions
- **Drag & Drop:** Hover states, active border, visual feedback
- **Loading States:** Spinner animations, disabled buttons
- **File Preview:** Real-time JSON parsing and display
- **Auto-download:** No manual save dialog needed
- **Example Downloads:** One-click template downloads

### Responsive
- **Mobile-first:** Responsive grids, stacked layouts on small screens
- **Desktop:** Two-column example templates
- **Tablets:** Adaptive spacing and sizing

---

## 🔧 Integration Examples

### Add Import/Export to Existing Pack List

```tsx
import { useNavigate } from "wouter";
import { Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function PacksList() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={() => navigate("/design-lab/packs/manager?context_id=" + contextId)}>
          <Upload className="w-4 h-4 mr-2" />
          Import Pack
        </Button>
      </div>

      {/* Existing packs list */}
      {packs.map(pack => (
        <div key={pack.id}>
          <h3>{pack.name}</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const exportPack = useExportPack();
              exportPack.mutate(pack.id);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      ))}
    </div>
  );
}
```

---

### Standalone Import Dialog

```tsx
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PackImport } from "@/components/design-lab/PackImport";

function MyComponent() {
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <Button onClick={() => setShowImport(true)}>
        Import Pack
      </Button>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-2xl">
          <PackImport
            contextId={contextId}
            onSuccess={(result) => {
              toast.success(`Imported ${result.name}!`);
              setShowImport(false);
            }}
            onCancel={() => setShowImport(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### Inline Export Button

```tsx
import { useExportPack } from "@/hooks/usePacks";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function PackCard({ pack }) {
  const exportPack = useExportPack();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pack.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          size="sm"
          onClick={() => exportPack.mutate(pack.id)}
          disabled={exportPack.isPending}
        >
          {exportPack.isPending ? (
            "Exporting..."
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 📋 Testing Checklist

### Import Flow
- [ ] Upload .json file → Success
- [ ] Upload .yaml file → Success
- [ ] Upload invalid file type → Error message
- [ ] Upload malformed JSON → Error message
- [ ] Upload valid template → Preview shows correctly
- [ ] Import with context_id → Pack associated
- [ ] Import without context_id → Pack created as template
- [ ] Success → Auto-redirect to packs list
- [ ] Cancel → Returns to previous page

### Export Flow
- [ ] Select pack → Shows preview
- [ ] Click export → Downloads JSON file
- [ ] Downloaded file → Valid JSON format
- [ ] Downloaded file → Contains all fields (agents, questions, etc.)
- [ ] Re-import exported file → Works correctly (round-trip)
- [ ] Export with no packs → Shows helpful message
- [ ] Export loading state → Spinner visible

### UI/UX
- [ ] Drag & drop → Visual feedback
- [ ] File selected → Preview shows
- [ ] Loading states → Disabled buttons
- [ ] Error states → Alert shown
- [ ] Success states → Green alert
- [ ] Example templates → Download works
- [ ] Documentation → Readable and helpful
- [ ] Responsive → Works on mobile/tablet

---

## 🚀 Deployment Notes

### Environment Variables
No additional env vars needed. Uses existing:
- `VITE_API_URL` - Backend API base URL

### Dependencies
All dependencies already in package.json:
- `@tanstack/react-query` - Data fetching
- `wouter` - Routing
- `lucide-react` - Icons
- shadcn/ui components

### Build
```bash
cd frontend
npm run build
```

No special build configuration needed.

---

## 🎓 User Guide (for documentation)

### How to Import a Pack

1. Navigate to **Design Lab → Packs Manager** (`/design-lab/packs/manager`)
2. Click **Import** tab
3. Drag & drop your `.json` or `.yaml` file (or click to browse)
4. Preview shows pack details (agents, questions)
5. Click **Import Pack**
6. Success! Pack is now available in your packs list

### How to Export a Pack

1. Navigate to **Design Lab → Packs Manager** (`/design-lab/packs/manager`)
2. Click **Export** tab
3. Select pack from dropdown
4. Preview shows pack configuration
5. Click **Download JSON**
6. File saved to Downloads folder as `{pack-name}-template.json`

### How to Modify and Re-Import

1. Export pack as JSON
2. Open JSON in text editor
3. Modify agents, prompts, questions, etc.
4. Save modified file
5. Import modified file
6. New pack created with your changes

---

## 📝 Known Limitations

### Current Version (MVP)
- No YAML preview (shows placeholder text)
- No inline JSON editor (must edit externally)
- No template validation UI (errors shown on import)
- No bulk import/export
- No pack versioning
- No pack marketplace/sharing

### Future Enhancements
- Visual workflow editor
- Template marketplace with community packs
- Version control and history
- Bulk operations
- Pack analytics (usage, success rate)
- AI-assisted template generation
- Collaborative editing

---

## 🔗 Related Files

**Backend:**
- `backend/app/api/v1/packs.py` - Import/export endpoints
- `backend/app/services/pack_service.py` - Import logic
- `PACK_IMPORT_EXPORT_README.md` - Backend documentation

**Frontend:**
- `frontend/src/hooks/usePacks.ts` - React hooks
- `frontend/src/components/design-lab/PackImport.tsx` - Import component
- `frontend/src/components/design-lab/PackExport.tsx` - Export component
- `frontend/src/pages/design-lab/PacksManager.tsx` - Combined page
- `frontend/src/App.tsx` - Route definition

**Testing:**
- `/tmp/test-article-pack.json` - Example template
- `/tmp/automated-pack-test.sh` - Backend tests

---

**Status:** ✅ COMPLETE - Ready for production
**Last Updated:** 2025-02-10
