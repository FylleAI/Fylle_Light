# Design Lab - L'Intera Interfaccia Post-Onboarding

Il **Design Lab** NON e solo la chat di editing. E l'intera shell dell'applicazione che l'utente vede dopo aver completato l'onboarding. Include: home dashboard, gestione agent pack, contesto operativo, outputs, chat editing, review.

Codice reference completo: `existing_code/design_lab/` (types, data mock, routes, helpers)

---

## Architettura a 2 Assi

Il Design Lab si divide in due assi paralleli che partono dalla Home:

```
                    ┌─────────────────────────┐
                    │      DESIGN LAB HOME     │
                    │      /design-lab         │
                    │                          │
                    │  Hero + Pack Carousel    │
                    │  + Contesto Operativo    │
                    └────────────┬─────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
       ┌────────┴────────┐              ┌─────────┴─────────┐
       │  CONTESTO       │              │  OUTPUTS           │
       │  /context       │              │  /outputs          │
       │  (Configuraz.)  │              │  (Lavoro consegn.) │
       └────────┬────────┘              └─────────┬──────────┘
                │                                  │
    ┌───────────┼───────────┐            ┌─────────┼──────────┐
    │     │     │     │     │            │                    │
  Fonti  Fonti Brand Oper. Agent    Newsletter Pack     Blog Pack
  Info   Merc.       ativo  Pack     Outputs             Outputs
                            │            │                    │
                     Brief List    ┌─────┴──────┐       Brief List
                            │      │     │      │            │
                     Brief Detail  W.B2B Edit. Nurt.    Editorial AI
                                   │     │      │            │
                              Contenuti per brief       Contenuti
                              + Chat + Review           + Chat + Review
```

---

## 1. HOME DASHBOARD (`/design-lab`)

Questa e la pagina dello screenshot. L'utente la vede dopo aver completato l'onboarding.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Benvenuto, {nome}.                                              │
│  Scegli un Agent Pack e Fylle si occupa dell'esecuzione,         │
│  ogni settimana.                                                 │
│  (?) Come funziona?                                              │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  I tuoi Agent Pack                                               │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │ [icon] ● Attivo│  │ [icon] Dispon. │  │ [icon] In arrivo│    │
│  │                │  │                │  │                 │     │
│  │ Newsletter Pack│  │ Blog Pack      │  │ Social Pack     │     │
│  │ Newsletter     │  │ Articoli SEO   │  │ Piano e post    │     │
│  │ pronta ogni    │  │ pubblicati con │  │ multi-canale    │     │
│  │ settimana.     │  │ continuita.    │  │ pubblicati.     │     │
│  │                │  │                │  │                 │     │
│  │ [Apri →]       │  │ [Attiva →]     │  │ [Notify me 🔔]  │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
│  ← carousel scrollabile →                                       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Il tuo contesto operativo                                       │
│  Fylle mantiene aggiornate le informazioni che guidano ogni      │
│  esecuzione. Tu dai feedback, il sistema migliora.               │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │ [📄] Fonti          │  │ [📈] Fonti di       │               │
│  │ Informative         │  │ Mercato             │               │
│  │ Sito web, fonti     │  │ Trend, competitor,  │               │
│  │ dati, documenti     │  │ news, database      │               │
│  └─────────────────────┘  └─────────────────────┘               │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │ [🎨] Brand          │  │ [⚙] Contesto       │               │
│  │ Colori, tono di     │  │ Operativo          │               │
│  │ voce, asset visivi  │  │ Prodotto, target,  │               │
│  │                     │  │ campagne, topic    │               │
│  └─────────────────────┘  └─────────────────────┘               │
│  ┌─────────────────────┐                                        │
│  │ [🤖] Agent Pack     │                                        │
│  │ Brief per           │                                        │
│  │ Newsletter, Blog    │                                        │
│  └─────────────────────┘                                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Agent Pack - 3 Stati

| Stato | Badge | CTA | Comportamento |
|-------|-------|-----|---------------|
| `active` | ● verde "Attivo" | "Apri →" (arancione pieno) | Va ai contenuti del pack |
| `available` | "Disponibile" | "Attiva →" (arancione pieno) | Avvia creazione Brief |
| `coming_soon` | "In arrivo" | "Notify me 🔔" (outline) | Registra interesse |

### Notifiche (pallino rosso pulsante)

Quando un pack ha `isNew: true` su almeno un contenuto:
- Pallino rosso pulsante sull'icona del pack nella Home
- Pallino rosso sul Brief nel Context Hub
- Badge "Nuovo" pulsante sul contenuto nella lista
- Bordo laterale primario sulla riga del contenuto

---

## 2. CONTESTO OPERATIVO (`/design-lab/context`)

Il Context Hub mostra le **5 aree** del contesto. Queste aree NON sono le 8 cards direttamente - sono un raggruppamento superiore.

### Mapping: 5 Aree UI → Entita Backend

| Area UI | ID | Cosa mostra | Entita Backend |
|---------|----|-------------|----------------|
| **Fonti Informative** | `fonti-informative` | Sito web, fonti dati, documenti aziendali | `context.company_info`, dati onboarding |
| **Fonti di Mercato** | `fonti-mercato` | Trend, competitor, news, database | `context.research_data`, card `competitor` |
| **Brand** | `brand` | Tono di voce, asset visivi, linee guida | `context.voice_info`, card `brand_voice` |
| **Contesto Operativo** | `operativo` | Prodotto, target, campagne, topic | Cards: `product`, `target`, `campaigns`, `topic`, `performance`, `feedback` |
| **Agent Pack** | `agent-pack` | Brief configurati per ogni pack | `briefs` raggruppati per `agent_packs` |

### Pagine Contesto (Livello 1)

Ogni area del contesto e una pagina che mostra i dati in modo leggibile e editabile:

- `/design-lab/context/fonti-informative` - Vista su company_info + sito web
- `/design-lab/context/fonti-mercato` - Vista su research_data + competitor card
- `/design-lab/context/brand` - Vista su voice_info + brand_voice card
- `/design-lab/context/operativo` - Vista sulle cards product, target, campaigns, topic, etc.
- `/design-lab/context/agent-pack` - Lista pack attivi con i loro brief

### Da Agent Pack → Brief Detail

`/design-lab/context/agent-pack` mostra i pack con i brief sotto ciascuno.
Click su un brief → `/design-lab/brief/:briefSlug` (dettaglio brief con tutte le sezioni).

---

## 3. OUTPUTS HUB (`/design-lab/outputs`)

L'Outputs Hub mostra i contenuti prodotti raggruppati per pack.

### Layout Outputs Hub

```
┌──────────────────────────────────────────────────┐
│ Lavoro consegnato                                │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ [📧] Newsletter Pack              ● 2 nuovi │ │
│ │                                              │ │
│ │ Welcome B2B (4 contenuti, ultimo: #16)       │ │
│ │ Editoriale (3 contenuti, ultimo: #5) ● 1 da │ │
│ │ Nurturing (1 contenuto, #1) ● NUOVO          │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ [📝] Blog Pack                               │ │
│ │                                              │ │
│ │ Editorial AI (3 contenuti, ultimo: #8)       │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Layout Pack Outputs (Livello 1)

Click su "Newsletter Pack" → `/design-lab/outputs/newsletter`

```
┌──────────────────────────────────────────────────────────────────┐
│ Newsletter Pack                                                  │
│                                                                  │
│ ─── Welcome B2B ────────────────────────────────────────────     │
│                                                                  │
│ #16 │ Newsletter - Welcome_b2b - 16 │ 16/12 │ Denise │ adattato │
│ #15 │ Newsletter - Welcome_b2b - 15 │ 15/12 │ Denise │ completato│
│ #14 │ Newsletter - Welcome_b2b - 14 │ 14/12 │ Denise │ completato│
│ #13 │ Newsletter - Welcome_b2b - 13 │ 13/12 │ Denise │ completato│
│                                                                  │
│ ─── Editoriale ─────────────────────────────────────────────     │
│                                                                  │
│ #5  │ Newsletter - Editoriale - 5   │ 17/12 │ Milo  │ ● da_app.│
│ #4  │ Newsletter - Editoriale - 4   │ 10/12 │ Milo  │ completato│
│ #3  │ Newsletter - Editoriale - 3   │ 03/12 │ Milo  │ completato│
│                                                                  │
│ ─── Nurturing ──────────────────────────────────────────────     │
│                                                                  │
│ #1  │ GenW - Market Volatility...   │ 04/02 │ Milo  │ ●● NUOVO │
└──────────────────────────────────────────────────────────────────┘
```

### ContentItem - Struttura

```typescript
interface ContentItem {
  id: string;
  number: number;                                    // Progressivo nel brief
  title: string;
  date: string;                                      // DD/MM/YYYY
  author: string;
  status: "da_approvare" | "completato" | "adattato";
  adaptedNote?: string;                              // Nota se adattato da feedback
  preview: string;                                   // Markdown
  htmlPreview?: string;                              // HTML (per newsletter)
  chatHistory?: ChatMessage[];                       // Storico feedback
  isNew?: boolean;                                   // Appena arrivato
}
```

### Workflow Approvazione Contenuto

```
da_approvare → [Approva] → completato
             → [Richiedi modifica via chat] → rigenera → adattato
```

---

## 4. CONTENUTO + CHAT INLINE (Livello 2)

Click su un contenuto → si apre il **pannello di dettaglio** con preview + chat.

### Layout Contenuto

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Back to Newsletter Pack                                        │
│                                                                  │
│ Newsletter - Editoriale - 5                                      │
│ 17/12/2024 • Milo • da_approvare                                │
│                                                                  │
├────────────────────────────────┬─────────────────────────────────┤
│                                │                                 │
│ PREVIEW (60%)                  │ CHAT (40%)                      │
│                                │                                 │
│ ## Il futuro del Content       │ Feedback                        │
│ Marketing e gia qui            │ ─────────────────────────────── │
│                                │                                 │
│ La settimana scorsa abbiamo    │ 🤖 Sistema: Ecco il contenuto  │
│ visto come l'AI stia...        │    generato. Rivedi e approva   │
│                                │    oppure richiedi modifiche.   │
│ ### 3 insight dalla settimana: │                                 │
│                                │ 👤 Tu: Il tono e troppo        │
│ 1. Google SGE cambia le        │    informale per il target      │
│    regole SEO                  │    C-level                      │
│ 2. Il ROI del content          │                                 │
│    automation +40%...          │ 🤖 Sistema: Ho adattato il     │
│ 3. La qualita non si           │    contenuto con un tono piu    │
│    automatizza                 │    autorevole. [adattato]       │
│                                │                                 │
│                                │ [Input feedback...]        [→]  │
│                                │                                 │
│                                │ ─────────────────────────────── │
│                                │ [✓ Approva e invia]             │
│                                │                                 │
└────────────────────────────────┴─────────────────────────────────┘
```

### Flusso Approvazione con Animazione

Quando l'utente clicca "Approva e invia":

```
Phase 1: "sending" (1.8 secondi)
  - Icona Rocket
  - Barra progresso animata
  - "Invio in corso..."

Phase 2: "sent"
  - Icona CheckCircle verde
  - "Contenuto approvato"
  - Badge piattaforma di distribuzione
  - Bottone "Chiudi"
```

### Chat Agent (stile Notion)

L'utente puo:
- **Approvare** direttamente → il contenuto viene marcato come `completato`
- **Richiedere modifiche** via chat → il sistema rigenera → contenuto diventa `adattato`

Il chat agent del Design Lab puo fare 3 cose (come da backend):
1. `edit_output` → crea nuova versione del contenuto
2. `update_context` → aggiorna il Context (miglioramento permanente)
3. `update_brief` → aggiorna il Brief (miglioramento permanente)

---

## 5. BRIEF DETAIL (`/design-lab/brief/:briefSlug`)

Pagina dettaglio di un brief con tutte le sezioni.

### Struttura Brief

```typescript
interface Brief {
  id: string;
  slug: string;                  // URL-safe
  name: string;
  packId: string;
  packName: string;
  type: "newsletter" | "blog" | "social" | "podcast";
  description: string;
  status: "configurato" | "da_configurare";
  objective?: string;            // Obiettivo strategico
  targetAudience?: string;       // Target
  toneOfVoice?: string;          // Tono
  frequency?: string;            // Frequenza pubblicazione
  topics?: string[];             // Argomenti
  guidelines?: string;           // Linee guida
  fullContent?: string;          // Brief completo in Markdown
}
```

### Layout Brief Detail

```
┌──────────────────────────────────────────────────┐
│ ← Back to Agent Pack                             │
│                                                  │
│ Welcome B2B                                      │
│ Newsletter Pack • configurato                    │
│                                                  │
│ ┌── Obiettivo ─────────────────────────────────┐ │
│ │ Accogliere i nuovi clienti B2B e guidarli    │ │
│ │ nell'utilizzo della piattaforma...           │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌── Target ────────────────────────────────────┐ │
│ │ Nuovi clienti B2B, decision maker e team     │ │
│ │ operativi.                                   │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌── Tono di voce ─────────────────────────────┐ │
│ │ Professionale ma amichevole, orientato al    │ │
│ │ valore.                                      │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌── Frequenza ────────────────────────────────┐ │
│ │ Settimanale per le prime 4 settimane        │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌── Topics ───────────────────────────────────┐ │
│ │ • Onboarding prodotto                       │ │
│ │ • Best practices                            │ │
│ │ • Case study clienti                        │ │
│ │ • Tips & tricks                             │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌── Linee guida ──────────────────────────────┐ │
│ │ CTA chiara, max 600 parole, almeno un dato  │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [Modifica Brief]     [Vai ai contenuti →]        │
└──────────────────────────────────────────────────┘
```

---

## 6. MAPPA ROUTE COMPLETA

| Route | Livello | Pagina | Componente |
|-------|---------|--------|------------|
| `/design-lab` | 0 | Home Dashboard | `DesignLabHome.tsx` |
| `/design-lab/context` | 0 | Context Hub | `ContextHub.tsx` |
| `/design-lab/context/fonti-informative` | 1 | Fonti Informative | `FontiInformative.tsx` |
| `/design-lab/context/fonti-mercato` | 1 | Fonti di Mercato | `FontiMercato.tsx` |
| `/design-lab/context/brand` | 1 | Brand | `BrandContext.tsx` |
| `/design-lab/context/operativo` | 1 | Contesto Operativo | `ContextOperativo.tsx` |
| `/design-lab/context/agent-pack` | 1 | Agent Pack (lista brief) | `AgentPackList.tsx` |
| `/design-lab/brief/:briefSlug` | 2 | Brief Detail | `BriefDetail.tsx` |
| `/design-lab/outputs` | 0 | Outputs Hub | `OutputsHub.tsx` |
| `/design-lab/outputs/:packType` | 1 | Pack Outputs | `PackOutputs.tsx` |
| `/design-lab/outputs/:packType/:contentId` | 2 | Contenuto + Chat | `ContentView.tsx` |

**Pagine fuori dal Design Lab:**
| Route | Pagina |
|-------|--------|
| `/login` | Login |
| `/register` | Register |
| `/onboarding` | Wizard Onboarding |
| `/onboarding/cards` | Cards review (post-onboarding, prima di entrare nel Design Lab) |

---

## 7. MAPPING COMPLETO: UI → Backend

### Agent Pack

| UI (Design Lab) | Backend | DB |
|-----------------|---------|-----|
| Pack card con icon, name, outcome, status | `GET /api/v1/packs` | `agent_packs` |
| Badge "Attivo" / "Disponibile" / "In arrivo" | `status` field | Va aggiunto `status` a `agent_packs` |
| "Apri" → va a outputs del pack | Route `/design-lab/outputs/:type` | - |
| "Attiva" → crea primo brief | `POST /api/v1/briefs` | `briefs` |
| Pallino rosso "nuovi contenuti" | Query outputs con `isNew` | Va aggiunto `is_new` a `outputs` o calcolato |

### Contesto Operativo

| Area UI | Backend endpoint | Entita DB |
|---------|------------------|-----------|
| Fonti Informative | `GET /api/v1/contexts/{id}` → company_info | `contexts.company_info` |
| Fonti di Mercato | `GET /api/v1/contexts/{id}` → research_data | `contexts.research_data` |
| Brand | `GET /api/v1/contexts/{id}/cards/brand_voice` + voice_info | `cards` + `contexts.voice_info` |
| Contesto Operativo | `GET /api/v1/contexts/{id}/cards` (product, target, etc.) | `cards` filtrate per tipo |
| Agent Pack (brief) | `GET /api/v1/briefs?context_id=X` | `briefs` |

### Contenuti (Outputs)

| UI | Backend endpoint | Entita DB |
|----|------------------|-----------|
| Lista contenuti per brief | `GET /api/v1/outputs?brief_id=X` | `outputs` join `workflow_runs` |
| Preview contenuto | `GET /api/v1/outputs/{id}` → text_content | `outputs.text_content` |
| HTML Preview (newsletter) | `GET /api/v1/outputs/{id}` → metadata.html | `outputs.metadata` |
| Chat feedback | `POST /api/v1/chat/outputs/{id}` | `chat_messages` |
| Approva | `POST /api/v1/outputs/{id}/review` | `archive` + `outputs.status` |
| Numero progressivo | Calcolato: count outputs per brief | - |

---

## 8. DELTA: Cosa manca nel Backend per il Design Lab (INTEGRATI)

> **NOTA**: Tutti i delta sono stati integrati direttamente in `01_DATABASE_SCHEMA.sql` e `02_BACKEND_ARCHITECTURE.md`.
> Questa sezione resta come documentazione.
>
> Campi aggiunti nelle CREATE TABLE (non serve ALTER):
> - `agent_packs`: `status`, `outcome`, `route`
> - `outputs`: `status` (da_approvare/completato/adattato), `is_new`, `number`, `brief_id`, `author`
> - `briefs`: `slug`
>
> Endpoint integrati:
> - `GET /api/v1/packs` → arricchito con `user_status`
> - `GET /api/v1/outputs?brief_id=X` → filtro diretto su `outputs.brief_id`
> - `PATCH /api/v1/outputs/{id}` → per `{is_new: false}`
> - `POST /api/v1/outputs/{id}/review` → path unificato (era in archive.py)
> - `GET /api/v1/contexts/{id}/summary` → 5 aree contesto
> - `GET /api/v1/users/profile` + `PATCH` → profilo utente
> - `GET /api/v1/briefs/by-slug/:slug` → lookup per slug
> - `GET /api/v1/briefs?context_id=X` → filtro per context

### BriefService - Compilazione

Il brief nel Design Lab ha sezioni strutturate (objective, targetAudience, toneOfVoice, frequency, topics, guidelines). Il `BriefService.compile_brief()` deve prendere le `answers` del wizard e compilarle in:
1. Un oggetto strutturato (salvato in `briefs.settings` o un nuovo campo)
2. Un markdown (salvato in `briefs.compiled_brief`) per injection nei prompt

---

## 9. LEARNING LOOP nel Design Lab

Il ciclo completo dentro il Design Lab:

```
1. Utente ha un Brief attivo (es. "Editoriale" nel Newsletter Pack)
2. Il sistema genera contenuto automaticamente (o su richiesta con topic)
3. Contenuto appare nella lista con status "da_approvare" e flag isNew
4. L'utente apre il contenuto → vede preview + chat
5. Via chat puo:
   a. Chiedere modifiche → agent rigenera → status "adattato"
   b. Agent puo anche aggiornare Context/Brief → miglioramento permanente
6. L'utente approva → contenuto "completato" → entra in Archive come Reference
7. Oppure rifiuta con feedback → entra in Archive come Guardrail
8. Alla prossima generazione, References e Guardrails migliorano il prompt
9. Il sistema migliora continuamente
```

---

## 10. FILE REFERENCE

| File in `existing_code/design_lab/` | Contenuto |
|--------------------------------------|-----------|
| `README.md` | Documentazione completa originale del Design Lab |
| `types.ts` | Tutti i tipi: AgentPack, Brief, ContentItem, ChatMessage, ContextArea, OutputPackSummary, ApprovalPhase |
| `data.ts` | Mock data completi + helper functions (AGENT_PACKS, BRIEFS, CONTENTS_BY_BRIEF, CONTEXT_AREAS) |
| `routes.ts` | Mappa route con gerarchia e descrizioni |
| `index.ts` | Re-export di tutto |
