# Existing Code Reference

Questa cartella contiene il codice frontend dai 2 onboarding esistenti gia funzionanti.
Usalo come reference per costruire il nuovo frontend.

## Cosa contiene

### onboarding_v2/ (PRINCIPALE - usa questo)

La versione piu completa e matura. Include:

- **pages/onboarding.tsx** (~850 righe) - Wizard multi-step con:
  - Session restore (se l'utente torna, riprende da dove era)
  - Polling dello stato (research/generate progress)
  - Gestione errori
  - Animazioni Framer Motion
  - Tutte le validazioni

- **pages/cards.tsx** (~920 righe) - Viewer/editor cards con:
  - Grid per tipologia
  - Drill-down per tipo → lista → dettaglio
  - Inline editing (click per editare qualsiasi campo)
  - Upload JSON esterno
  - Rendering specializzato per tutti 8 tipi di card
  - Metriche, tag, tabelle per i vari tipi

- **pages/brief.tsx** (~660 righe) - Brief wizard con:
  - Caricamento domande dal pack
  - Wizard domanda per domanda
  - Generazione brief
  - Review brief con tutte le sezioni
  - Editor inline per sezioni
  - Approvazione con conferma

- **hooks/useOnboarding.ts** - Hook per API onboarding
- **hooks/useCards.ts** (~320 righe) - Hook completo con TanStack Query:
  - Query da mock, da session, da JSON custom
  - Optimistic updates
  - CRUD cards
- **hooks/useBrief.ts** - Hook per API brief

- **types/onboarding.ts** - Tipi completi per sessioni, snapshot, domande
- **types/cards.ts** - Tipi per tutti 8 tipi di card con interfacce dettagliate
- **types/brief.ts** - Tipi per brief document e domande
- **components_ui/** - Componenti shadcn (Button, Card, Input, Textarea, RadioGroup, Label, Toast)

### onboarding_v3/ (VERSIONE SEMPLIFICATA)

Versione piu leggera e pulita. Utile per:

- **pages/onboarding.tsx** (~380 righe) - Wizard semplificato senza session restore
- **pages/cards.tsx** - Cards viewer semplificato
- **pages/packs.tsx** - Pack detail con lista brief
- **hooks/usePacks.ts** - Hook per agent packs
- **types/packs.ts** - Tipi per pack con DEFAULT_PACKS

### onboarding_v1/ (LEGACY)

La primissima versione con Material UI. Utile per:

- **components_wizard/** - Pattern wizard originale (WizardContainer, WizardStep, WizardQuestion)
- **components_cards/** - Card renderers dettagliati (VoiceDNA, StrategicInsights, AudienceIntelligence)
- **components_steps/** - Step components (CompanyInput, ResearchProgress, SnapshotReview, etc.)
- **store/** - Zustand store originale (onboardingStore, uiStore)

### design_lab/ (DESIGN LAB - Struttura completa post-onboarding)

Contiene i tipi, dati mock, routes e helpers che definiscono l'INTERA interfaccia Design Lab.
Questo e il materiale piu importante per costruire la shell applicativa.

- **types.ts** - Tutti i tipi TypeScript:
  - `AgentPack` con stati (active/available/coming_soon), icon styling
  - `Brief` con sezioni strutturate (objective, targetAudience, toneOfVoice, frequency, topics, guidelines)
  - `ContentItem` con workflow (da_approvare/completato/adattato), isNew flag
  - `ChatMessage` per feedback inline
  - `ContextArea` per le 5 aree del contesto operativo
  - `OutputPackSummary` per vista aggregata outputs
  - `ApprovalPhase` e `ContentReviewState` per il flusso approvazione

- **data.ts** (~500 righe) - Mock data completi:
  - `AGENT_PACKS` (4 pack: newsletter, blog, social, podcast)
  - `BRIEFS` (4 brief con contenuto completo in markdown)
  - `CONTENTS_BY_BRIEF` (contenuti per ogni brief con preview markdown)
  - `CONTEXT_AREAS` (5 aree del contesto operativo)
  - `OUTPUT_PACK_SUMMARIES` (vista aggregata per home/hub)
  - Helper functions: getBriefsByPack, getContentsByBrief, getPendingCountByPack, packHasNewContent

- **routes.ts** - Mappa route completa con gerarchia:
  - `/design-lab` → Home Dashboard
  - `/design-lab/context/*` → 5 sotto-pagine contesto
  - `/design-lab/brief/:slug` → Dettaglio brief
  - `/design-lab/outputs/*` → Outputs per pack

- **index.ts** - Re-export di tutto

## Come usare

1. Parti da `onboarding_v2/` per la fase di onboarding (wizard + cards)
2. Parti da `design_lab/` per la struttura post-onboarding (types, data, routes)
3. Il pattern wizard (AnimatePresence + step state) e validato e funziona bene
4. Il sistema cards con i suoi 8 tipi e completo
5. Il brief wizard e pronto, va solo collegato al nuovo backend
6. Le pagine del Design Lab vanno create seguendo i types/data/routes di `design_lab/`
7. La chat inline segue il pattern descritto in `04_DESIGN_LAB.md`
