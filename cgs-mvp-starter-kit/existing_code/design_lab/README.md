# Design Lab — Documentazione Struttura Completa

## Panoramica

Il **Design Lab** è un'area dell'applicazione Fylle dedicata alla gestione automatizzata della produzione contenuti. L'utente attiva degli **Agent Pack**, configura i **Brief**, e il sistema produce contenuti che l'utente approva o migliora tramite feedback.

---

## Architettura a Livelli

L'intera struttura segue una **gerarchia a 3 livelli** con due assi paralleli: **Contesto** (configurazione) e **Outputs** (contenuti prodotti).

```
                    ┌─────────────┐
                    │  DESIGN LAB │ (Home)
                    │   /design-lab│
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
      ┌───────┴───────┐       ┌────────┴────────┐
      │   CONTESTO    │       │    OUTPUTS       │
      │  /context     │       │   /outputs       │
      │  (Configuraz.)│       │  (Lavoro consegn.)│
      └───────┬───────┘       └────────┬─────────┘
              │                        │
    ┌─────────┼─────────┐     ┌────────┴────────┐
    │         │         │     │                 │
Fonti    Fonti    Brand │  Newsletter    Blog Pack
Info     Mercato        │  Pack Outputs  Outputs
                 Contesto│     │
                 Operativo│     │
                        │     │
              ┌─────────┘     │
              │               │
         AGENT PACK      ┌────┴─────────────┐
         (Lista Brief)   │                  │
              │          Brief: Welcome_b2b  Brief: Editorial_AI
     ┌────────┼────────┐ Brief: Editoriale
     │        │        │ Brief: Nurturing
  Welcome  Editoriale  Nurturing
  B2B                       │
     │                      │
  BRIEF DETAIL          CONTENUTI (Livello 2)
  /brief/:slug          ├─ Contenuto #1  ← da_approvare, isNew
                        ├─ Contenuto #2  ← completato
                        └─ Contenuto #N  ← adattato
```

---

## 1. Agent Pack

### Cos'è
Un **Agent Pack** è l'unità di automazione. Quando un utente attiva un pack, il sistema inizia a produrre contenuti automaticamente secondo i Brief configurati.

### Struttura dati

| Campo           | Tipo                                       | Descrizione                              |
|-----------------|--------------------------------------------|-----------------------------------------|
| `id`            | `string`                                   | Identificatore univoco                   |
| `name`          | `string`                                   | Nome visualizzato                        |
| `outcome`       | `string`                                   | Risultato prodotto dal pack              |
| `status`        | `"active" \| "available" \| "coming_soon"` | Stato attuale                            |
| `type`          | `"newsletter" \| "blog" \| "social" \| "podcast"` | Tipo di contenuto              |
| `route`         | `string?`                                  | Route nell'app                           |
| `hasNewContent` | `boolean?`                                 | Notifica nuovi contenuti                 |
| `iconBg`        | `string`                                   | Classe CSS background icona              |
| `iconColor`     | `string`                                   | Classe CSS colore icona                  |

### Pack disponibili

| ID           | Nome             | Stato        | Brief attivi |
|------------- |------------------|-------------|-------------|
| `newsletter` | Newsletter Pack  | **active**  | 3 (Welcome B2B, Editoriale, Nurturing) |
| `blog`       | Blog Pack        | available   | 1 (Editorial AI) |
| `social`     | Social Pack      | coming_soon | 0 |
| `podcast`    | Podcast Pack     | coming_soon | 0 |

### Ciclo di vita

```
coming_soon → available → active
                              │
                              ├─ L'utente attiva il pack
                              ├─ Configura i Brief
                              └─ Il sistema produce contenuti
```

---

## 2. Brief

### Cos'è
Un **Brief** è una sotto-configurazione di un Agent Pack. Definisce **cosa** produrre, **per chi**, con quale **tono** e **frequenza**. Un Agent Pack può avere più Brief attivi contemporaneamente.

### Esempio concreto
Il **Newsletter Pack** ha 3 Brief:
- **Welcome B2B** → Newsletter di onboarding per nuovi clienti
- **Editoriale** → Thought leadership settimanale
- **Nurturing** → Conversione lead qualificati

### Struttura dati

| Campo            | Tipo                               | Descrizione                           |
|------------------|-------------------------------------|---------------------------------------|
| `id`             | `string`                            | ID univoco (es. `"welcome_b2b"`)      |
| `slug`           | `string`                            | URL-safe (es. `"welcome-b2b"`)        |
| `name`           | `string`                            | Nome visualizzato                     |
| `packId`         | `string`                            | ID Agent Pack padre                   |
| `packName`       | `string`                            | Nome Agent Pack padre                 |
| `type`           | `"newsletter" \| "blog"`            | Tipo contenuto                        |
| `description`    | `string`                            | Descrizione sintetica                 |
| `status`         | `"configurato" \| "da_configurare"` | Stato di setup                        |
| `objective`      | `string?`                           | Obiettivo strategico                  |
| `targetAudience` | `string?`                           | Descrizione target                    |
| `toneOfVoice`    | `string?`                           | Indicazioni sul tono                  |
| `frequency`      | `string?`                           | Frequenza pubblicazione               |
| `topics`         | `string[]?`                         | Lista argomenti                       |
| `guidelines`     | `string?`                           | Linee guida operative                 |
| `fullContent`    | `string?`                           | Brief completo in Markdown            |

### Relazione con Agent Pack

```
AgentPack (1) ──→ (N) Brief ──→ (N) ContentItem
   newsletter        welcome_b2b    Contenuto #16
                     editoriale     Contenuto #5
                     nurturing      Contenuto #1
```

---

## 3. Contenuto (ContentItem)

### Cos'è
Un **ContentItem** è il singolo output prodotto dal sistema. Ogni contenuto appartiene a un Brief specifico e attraversa un workflow di approvazione.

### Struttura dati

| Campo          | Tipo                                           | Descrizione                          |
|----------------|------------------------------------------------|--------------------------------------|
| `id`           | `string`                                       | ID univoco                           |
| `number`       | `number`                                       | Numero progressivo nel brief         |
| `title`        | `string`                                       | Titolo del contenuto                 |
| `date`         | `string`                                       | Data produzione (DD/MM/YYYY)         |
| `author`       | `string`                                       | Autore/responsabile                  |
| `status`       | `"da_approvare" \| "completato" \| "adattato"` | Stato workflow                       |
| `adaptedNote`  | `string?`                                      | Nota se adattato da feedback         |
| `preview`      | `string`                                       | Anteprima Markdown                   |
| `htmlPreview`  | `string?`                                      | HTML completo (per newsletter)       |
| `chatHistory`  | `ChatMessage[]?`                               | Storico feedback                     |
| `isNew`        | `boolean?`                                     | Flag "appena arrivato"               |

### Workflow di approvazione

```
          ┌──────────────┐
          │ da_approvare │ ← Il sistema produce il contenuto
          └──────┬───────┘
                 │
       ┌─────────┴─────────┐
       │                   │
  [Approva]          [Richiedi modifica]
       │                   │
       ▼                   ▼
 ┌───────────┐     ┌─────────────┐
 │ completato│     │  (rigenera)  │
 └───────────┘     └──────┬──────┘
                          │
                    ┌─────┴──────┐
                    │  adattato  │ ← Contenuto modificato in base al feedback
                    └────────────┘
```

### Flag `isNew` e notifiche

Quando `isNew: true`, il contenuto mostra:
1. **Pallino rosso pulsante** sull'icona del Brief (livello 1)
2. **Pallino rosso pulsante** sull'Agent Pack nell'Outputs Hub (livello 0)
3. **Pallino rosso pulsante** sull'Agent Pack nella Home (livello -1)
4. **Badge "Nuovo"** pulsante sul contenuto nella lista (livello 2)
5. **Testo "Appena arrivato"** nei metadati del contenuto
6. **Bordo laterale primario** sulla riga del contenuto

---

## 4. Contesto Operativo

### Cos'è
Il **Contesto** è la base di conoscenza che guida la generazione dei contenuti. È organizzato in 5 aree indipendenti.

### Aree

| ID                  | Nome                | Descrizione                                          |
|---------------------|---------------------|------------------------------------------------------|
| `fonti-informative` | Fonti Informative   | Sito web, fonti dati, documenti aziendali            |
| `fonti-mercato`     | Fonti di Mercato    | Trend, competitor, news, database pubblici            |
| `brand`             | Brand               | Colori, tono di voce, asset visivi, linee guida       |
| `operativo`         | Contesto Operativo  | Prodotto, target, campagne, topic                    |
| `agent-pack`        | Agent Pack          | Brief di configurazione per ogni pack attivo          |

### Relazione con la generazione

```
┌─────────────────────────────┐
│       CONTESTO              │
│  ┌───────────────────────┐  │
│  │ Fonti Informative     │──┐
│  │ Fonti di Mercato      │  │
│  │ Brand                 │  ├──→ Sistema AI ──→ Contenuto
│  │ Contesto Operativo    │  │
│  │ Agent Pack (Brief)    │──┘
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## 5. Sistema di Feedback (Chat)

### Cos'è
Ogni contenuto ha una **chat inline stile Notion** per il feedback. L'utente può:
- **Approvare** → il contenuto viene inviato alla piattaforma di distribuzione
- **Richiedere modifiche** → il sistema rigenera con il feedback

### Struttura messaggio

| Campo       | Tipo                                | Descrizione                    |
|-------------|-------------------------------------|-------------------------------|
| `id`        | `string`                            | ID univoco                    |
| `type`      | `"user" \| "system"`               | Mittente                      |
| `text`      | `string`                            | Testo messaggio               |
| `timestamp` | `string`                            | Orario (HH:MM)               |
| `action`    | `"approve" \| "request_change"?`   | Azione (solo per user)        |

### Flusso approvazione con animazione

```
[Utente clicca "Approva"]
        │
        ▼
┌─────────────────┐
│ Phase: "sending" │  1.8 secondi
│ Icona Rocket     │  Barra di progresso
│ "Invio in corso" │  Animazione slide-in
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Phase: "sent"    │
│ Icona CheckCircle│
│ "Contenuto       │
│  approvato"      │
│ Badge piattaforma│
│ Bottone "Chiudi" │
└─────────────────┘
```

---

## 6. Mappa Route

| Route                                      | Livello | Pagina                     |
|-------------------------------------------|---------|----------------------------|
| `/design-lab`                              | 0       | Home (dashboard)           |
| `/design-lab/context`                      | 0       | Context Hub                |
| `/design-lab/context/fonti-informative`    | 1       | Fonti Informative          |
| `/design-lab/context/fonti-mercato`        | 1       | Fonti di Mercato           |
| `/design-lab/context/brand`                | 1       | Brand                      |
| `/design-lab/context/operativo`            | 1       | Contesto Operativo         |
| `/design-lab/context/agent-pack`           | 1       | Agent Pack (lista brief)   |
| `/design-lab/brief/:briefSlug`             | 2       | Brief Detail               |
| `/design-lab/outputs`                      | 0       | Outputs Hub                |
| `/design-lab/outputs/newsletter`           | 1       | Newsletter Pack contenuti  |
| `/design-lab/outputs/blog`                 | 1       | Blog Pack contenuti        |

---

## 7. Come importare in un'altra applicazione

### Installazione

Copia la cartella `design-lab-export/` nel tuo progetto.

### Import

```typescript
// Tutti i tipi
import type { AgentPack, Brief, ContentItem, ChatMessage } from "./design-lab-export";

// Dati e helper
import {
  AGENT_PACKS,
  BRIEFS,
  CONTENTS_BY_BRIEF,
  CONTEXT_AREAS,
  OUTPUT_PACK_SUMMARIES,
  getBriefsByPack,
  getBriefBySlug,
  getContentsByBrief,
  getPendingCountByPack,
  packHasNewContent,
} from "./design-lab-export";

// Route map
import { ROUTES } from "./design-lab-export/routes";
```

### Esempio: ottenere tutti i dati di un pack

```typescript
import { getAgentPack, getBriefsByPack, getContentsByBrief } from "./design-lab-export";

const pack = getAgentPack("newsletter");
//    ^ { id: "newsletter", name: "Newsletter Pack", status: "active", ... }

const briefs = getBriefsByPack("newsletter");
//    ^ [{ id: "welcome_b2b", ... }, { id: "editoriale", ... }, { id: "nurturing", ... }]

const contents = getContentsByBrief("nurturing");
//    ^ [{ id: "1", title: "GenW - Market Volatility...", isNew: true, status: "da_approvare" }]

const pendingCount = getPendingCountByPack("newsletter");
//    ^ 2 (editoriale #5 + nurturing #1)

const hasNew = packHasNewContent("newsletter");
//    ^ true (nurturing ha isNew: true)
```

### Note sull'HTML Preview

Il contenuto HTML della newsletter Nurturing (`htmlPreview`) non è incluso in `data.ts` per mantenere il file leggibile. L'HTML completo si trova in:
- **Nel Design Lab attuale**: `client/src/pages/design-lab/nurturing-html.ts`
- **Per l'export**: puoi copiare quel file nella cartella export e importarlo separatamente

---

## 8. Struttura file della cartella export

```
design-lab-export/
├── README.md        ← Questo file (documentazione completa)
├── index.ts         ← Entry point: re-export di tutto
├── types.ts         ← Tutti i tipi TypeScript (0 dipendenze)
├── data.ts          ← Mock data + helper functions
└── routes.ts        ← Mappa completa delle route
```

Nessun file ha dipendenze esterne. Tutto è autocontenuto e pronto per essere importato in qualsiasi progetto TypeScript/JavaScript.
