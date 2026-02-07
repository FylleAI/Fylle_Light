# CGS MVP - Master Plan

## Cosa Costruiamo

Una piattaforma per generare contenuti AI personalizzati. Due macro-fasi:

**FASE A - Onboarding (una tantum)**
1. L'utente fa **Onboarding** (risponde a domande AI) → ottiene un **Context** con 8 **Cards** (chi sei)

**FASE B - Design Lab (uso quotidiano)**
2. Entra nel **Design Lab** (dashboard principale post-onboarding)
3. Sceglie un **Agent Pack** (tipo contenuto) → crea un **Brief** rispondendo a domande (come lo vuoi)
4. Il sistema genera contenuti automaticamente (o su richiesta con topic)
5. L'utente rivede i contenuti, chatta con AI agent per editarli
6. **Approva** (diventa Reference) o **Rifiuta** con feedback (diventa Guardrail)
7. Il sistema **impara** e migliora le generazioni future

Il Design Lab e l'intera shell applicativa post-onboarding: home con pack carousel, contesto operativo (5 aree), outputs hub, chat editing, review.

## Flusso Completo

```
Onboarding → Context + 8 Cards → DESIGN LAB HOME
                                       │
                          ┌─────────────┼──────────────┐
                          │             │              │
                     Agent Pack    Contesto        Outputs Hub
                     Carousel      Operativo       (lavoro consegnato)
                          │        (5 aree)            │
                     Attiva Pack       │          Pack → Brief → Contenuti
                          │            │               │
                     Crea Brief   Fonti, Brand    Preview + Chat
                          │       Cards editabili      │
                     Topic → Genera              Approva / Rifiuta
                          │                            │
                     Output → Chat Editing       Archive (Learning Loop)
                          │                            │
                     Agent puo aggiornare        Migliora generazioni
                     Context/Brief               successive
```

## Output Multi-Formato

| Tipo | Formato | Storage | Preview |
|------|---------|---------|---------|
| Testo | markdown, HTML | Database | Inline rendering |
| Immagini | PNG, WebP | Supabase Storage | Thumbnail + lightbox |
| Audio | MP3, WAV | Supabase Storage | Player integrato |
| Video | MP4, WebM | Supabase Storage | Player + thumbnail |

## Stack Tecnologico

| Layer | Tecnologia | Motivazione |
|-------|------------|-------------|
| Backend | FastAPI (Python 3.11+) | Async-native, auto-docs, tipo-safe |
| Database | Supabase (PostgreSQL) | Auth + DB + Storage + Realtime in uno |
| Auth | Supabase Auth | JWT integrato, social login ready |
| Storage | Supabase Storage | Per file generati (immagini, audio, video) |
| Frontend | React 18 + Vite + TypeScript | Veloce, modulare |
| Styling | Tailwind CSS + shadcn/ui | Componenti pronti, no-code friendly |
| State | Zustand | Leggero, zero boilerplate |
| Data | TanStack Query v5 | Cache, refetch, optimistic updates |
| Streaming | SSE via fetch | Niente WebSocket, piu semplice |

## Target

- Max 10 clienti
- Semplicita e validazione
- NO over-engineering

---

## Fasi di Sviluppo

### FASE 0: Infrastruttura (Settimana 1)

**Obiettivo**: Setup completo, database, configurazione

| Step | File | Descrizione |
|------|------|-------------|
| 0.1 | Struttura cartelle | `mkdir -p cgs-mvp/backend/app/...` |
| 0.2 | `backend/requirements.txt` | Dipendenze Python |
| 0.3 | `backend/.env.example` | Tutte le variabili ambiente |
| 0.4 | `supabase/migrations/*.sql` | Schema DB completo |
| 0.5 | `backend/app/config/settings.py` | Pydantic settings |
| 0.6 | `backend/app/config/supabase.py` | Client Supabase |

**Dettagli**: Vedi `01_DATABASE_SCHEMA.sql` per lo schema completo.

### FASE 1: Backend Core (Settimana 2-3)

**Obiettivo**: Domain models, LLM adapters, tools, storage

| Step | File | Descrizione |
|------|------|-------------|
| 1.1 | `domain/enums.py` | Tutti gli enum |
| 1.2 | `domain/models.py` | Pydantic models per ogni entita |
| 1.3 | `infrastructure/llm/base.py` | Interfaccia LLM |
| 1.4 | `infrastructure/llm/openai_adapter.py` | OpenAI con pricing |
| 1.5 | `infrastructure/llm/anthropic_adapter.py` | Anthropic con pricing |
| 1.6 | `infrastructure/llm/gemini_adapter.py` | Gemini con pricing |
| 1.7 | `infrastructure/llm/factory.py` | Factory per adapter |
| 1.8 | `infrastructure/tools/perplexity.py` | Ricerca web |
| 1.9 | `infrastructure/tools/image_gen.py` | Generazione immagini |
| 1.10 | `infrastructure/storage/supabase_storage.py` | Upload, download, signed URL |
| 1.11 | `infrastructure/logging/tracker.py` | Run tracking su Supabase |
| 1.12 | `db/repositories/base.py` | Base CRUD repository |
| 1.13 | `db/repositories/*.py` | Repository per ogni entita |

**Dettagli**: Vedi `02_BACKEND_ARCHITECTURE.md` per tutto il codice.

### FASE 2: API Endpoints (Settimana 3-4)

**Obiettivo**: Tutti gli endpoint REST

| Step | File | Descrizione |
|------|------|-------------|
| 2.1 | `app/main.py` | FastAPI app con CORS e routing |
| 2.2 | `api/deps.py` | Auth dependency (JWT via Supabase) |
| 2.3 | `api/v1/auth.py` | Register, login, refresh, logout |
| 2.4 | `api/v1/users.py` | Profile GET/PATCH |
| 2.5 | `api/v1/onboarding.py` | Start, research, questions, process |
| 2.6 | `api/v1/contexts.py` | CRUD Context + Cards |
| 2.7 | `api/v1/packs.py` | List agent packs |
| 2.8 | `api/v1/briefs.py` | CRUD Brief + session flow |
| 2.9 | `api/v1/execute.py` | Start run + SSE streaming |
| 2.10 | `api/v1/outputs.py` | List, preview, download |
| 2.11 | `api/v1/archive.py` | Review, stats, semantic search |
| 2.12 | `api/v1/chat.py` | Chat con output (Design Lab) |

### FASE 3: Services (Settimana 4-6) - IL CUORE

**Obiettivo**: Tutta la business logic

| Step | File | Descrizione |
|------|------|-------------|
| 3.1 | `services/onboarding_service.py` | Research → Questions → Context + Cards |
| 3.2 | `services/context_service.py` | CRUD + cards management |
| 3.3 | `services/brief_service.py` | Questions → Compile brief |
| 3.4 | `services/workflow_service.py` | **Orchestrazione agenti + SSE** |
| 3.5 | `services/output_service.py` | Multi-formato (text, image, audio, video) |
| 3.6 | `services/archive_service.py` | Review + learning loop injection |
| 3.7 | `services/chat_service.py` | **Chat agent (Design Lab)** |

### FASE 4: Frontend (Settimana 7-10)

**Obiettivo**: UI completa - Il Design Lab e la shell principale

| Step | File | Descrizione |
|------|------|-------------|
| 4.1 | Setup Vite + React + TS + Tailwind + shadcn | Base project |
| 4.2 | `lib/supabase.ts`, `lib/api.ts`, `lib/store.ts` | Client e state |
| 4.3 | Login.tsx, Register.tsx | Auth pages |
| 4.4 | Onboarding.tsx | Wizard multi-step (DA ESISTENTE v2) |
| 4.5 | OnboardingCards.tsx | Review cards post-onboarding (DA ESISTENTE v2) |
| **4.6** | **DesignLabHome.tsx** | **Home Dashboard: hero + pack carousel + contesto operativo** |
| 4.7 | ContextHub.tsx | Hub 5 aree del contesto |
| 4.8 | FontiInformative.tsx, FontiMercato.tsx, BrandContext.tsx, ContextOperativo.tsx | Pagine contesto (riusano pattern cards v2) |
| 4.9 | AgentPackList.tsx | Lista pack con brief |
| 4.10 | BriefDetail.tsx | Dettaglio brief con sezioni (DA ESISTENTE v2) |
| 4.11 | OutputsHub.tsx | Hub outputs per pack |
| 4.12 | PackOutputs.tsx | Lista contenuti per brief |
| 4.13 | ContentView.tsx + ChatPanel.tsx | **Contenuto + Chat inline (stile Notion)** |
| 4.14 | ApprovalFlow.tsx | Animazione approve (rocket → checkmark) |

**Design Lab completo**: Vedi `04_DESIGN_LAB.md` per TUTTA la struttura.
**Pattern UI**: Vedi `03_FRONTEND_REFERENCE.md` per i pattern dai 2 onboarding.
**Tipi e mock**: Vedi `existing_code/design_lab/` per types, data, routes.

### FASE 5: Polish (Settimana 11-12)

| Step | Descrizione |
|------|-------------|
| 5.1 | Error handling granulare (try/catch per ogni service) |
| 5.2 | Rate limiting (`slowapi`) |
| 5.3 | Logging strutturato (ogni run tracciato in `run_logs`) |
| 5.4 | Test E2E con 2-3 clienti reali |
| 5.5 | Docker compose per deploy |

---

## API Routes Completa

```yaml
# AUTH
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

# USERS (implementato in users.py)
GET    /api/v1/users/profile
PATCH  /api/v1/users/profile

# ONBOARDING
POST   /api/v1/onboarding/start          # Input: {brand_name, website, email}
GET    /api/v1/onboarding/{id}/status
POST   /api/v1/onboarding/{id}/answers    # Input: {answers: {...}}

# CONTEXTS
GET    /api/v1/contexts
GET    /api/v1/contexts/{id}
POST   /api/v1/contexts
PATCH  /api/v1/contexts/{id}
DELETE /api/v1/contexts/{id}
GET    /api/v1/contexts/{id}/cards
PATCH  /api/v1/contexts/{id}/cards/{type}

# PACKS (include stato user-specific: se l'utente ha brief → "active")
GET    /api/v1/packs
GET    /api/v1/packs/{id}

# BRIEFS
GET    /api/v1/briefs
GET    /api/v1/briefs/{id}
POST   /api/v1/briefs                     # Input: {context_id, pack_id, name, answers}
PATCH  /api/v1/briefs/{id}
DELETE /api/v1/briefs/{id}
POST   /api/v1/briefs/{id}/duplicate

# EXECUTE
POST   /api/v1/execute                    # Input: {brief_id, topic}
GET    /api/v1/execute/{run_id}
GET    /api/v1/execute/{run_id}/stream    # SSE

# OUTPUTS
GET    /api/v1/outputs                    # ?brief_id=X per filtrare per brief
GET    /api/v1/outputs/{id}
GET    /api/v1/outputs/{id}/preview
GET    /api/v1/outputs/{id}/download
PATCH  /api/v1/outputs/{id}               # {is_new: false} per marcare come visto
DELETE /api/v1/outputs/{id}

# CONTEXTS - Vista aggregata per Design Lab
GET    /api/v1/contexts/{id}/summary      # 5 aree con contatori/preview

# CHAT (Design Lab)
POST   /api/v1/chat/outputs/{id}          # Input: {message}
GET    /api/v1/chat/outputs/{id}/history

# ARCHIVE
GET    /api/v1/archive
GET    /api/v1/archive/stats
POST   /api/v1/archive/search             # Input: {query, context_id}

# REVIEW (su outputs, non su archive — path unificato)
POST   /api/v1/outputs/{id}/review        # Input: {status, feedback, is_reference}
```

---

## Struttura File

```
cgs-mvp/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config/
│   │   │   ├── __init__.py
│   │   │   ├── settings.py
│   │   │   └── supabase.py
│   │   ├── domain/
│   │   │   ├── __init__.py
│   │   │   ├── enums.py
│   │   │   └── models.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── onboarding.py
│   │   │       ├── contexts.py
│   │   │       ├── packs.py
│   │   │       ├── briefs.py
│   │   │       ├── execute.py
│   │   │       ├── outputs.py
│   │   │       ├── archive.py
│   │   │       └── chat.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── onboarding_service.py
│   │   │   ├── context_service.py
│   │   │   ├── brief_service.py
│   │   │   ├── workflow_service.py
│   │   │   ├── output_service.py
│   │   │   ├── archive_service.py
│   │   │   └── chat_service.py
│   │   ├── infrastructure/
│   │   │   ├── llm/
│   │   │   │   ├── base.py
│   │   │   │   ├── openai_adapter.py
│   │   │   │   ├── anthropic_adapter.py
│   │   │   │   ├── gemini_adapter.py
│   │   │   │   └── factory.py
│   │   │   ├── tools/
│   │   │   │   ├── perplexity.py
│   │   │   │   └── image_gen.py
│   │   │   ├── storage/
│   │   │   │   └── supabase_storage.py
│   │   │   └── logging/
│   │   │       └── tracker.py
│   │   └── db/
│   │       └── repositories/
│   │           ├── base.py
│   │           ├── context_repo.py
│   │           ├── card_repo.py
│   │           ├── brief_repo.py
│   │           ├── run_repo.py
│   │           ├── output_repo.py
│   │           ├── archive_repo.py
│   │           ├── session_repo.py
│   │           └── chat_repo.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── api.ts
│   │   │   └── store.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useOnboarding.ts
│   │   │   ├── useContexts.ts
│   │   │   ├── usePacks.ts
│   │   │   ├── useBriefs.ts
│   │   │   ├── useOutputs.ts
│   │   │   └── useChat.ts
│   │   ├── components/
│   │   │   ├── ui/ (shadcn)
│   │   │   ├── layout/
│   │   │   ├── onboarding/
│   │   │   ├── context/
│   │   │   ├── brief/
│   │   │   ├── output/
│   │   │   └── chat/
│   │   └── pages/
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       ├── Onboarding.tsx
│   │       ├── OnboardingCards.tsx
│   │       ├── design-lab/
│   │       │   ├── DesignLabHome.tsx      # Home dashboard
│   │       │   ├── ContextHub.tsx         # Hub 5 aree contesto
│   │       │   ├── FontiInformative.tsx
│   │       │   ├── FontiMercato.tsx
│   │       │   ├── BrandContext.tsx
│   │       │   ├── ContextOperativo.tsx
│   │       │   ├── AgentPackList.tsx
│   │       │   ├── BriefDetail.tsx
│   │       │   ├── OutputsHub.tsx
│   │       │   ├── PackOutputs.tsx
│   │       │   ├── ContentView.tsx        # Preview + Chat
│   │       │   └── ApprovalFlow.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql
│       ├── 002_storage.sql
│       ├── 003_seed_packs.sql
│       └── 004_functions.sql
└── docker-compose.yml
```

---

## Relazioni tra Entita

```
Profile (1) ──< Context (N) ──< Card (8 per context)
                    │
                    ├──< Brief (N) ──< WorkflowRun (N) ──< Output (N)
                    │       │                                    │
                    │       │                              ChatMessage (N)
                    │       │                                    │
                    │       └─────────── Archive (N) ────────────┘
                    │                       │
                    │              ┌────────┤
                    │              │        │
                    │         Reference  Guardrail
                    │              │        │
                    │              └────┬───┘
                    │                   │
                    │            Learning Loop
                    │                   │
                    └───────── Migliora ─┘
                              generazioni

AgentPack (system) ──< Brief
ContentType (system) ──< AgentPack
```

---

## Learning Loop (come funziona)

1. Utente genera output con `POST /api/v1/execute {brief_id, topic}`
2. Output entra in Archive con `review_status = pending`
3. Utente chatta con output via Design Lab `POST /api/v1/chat/outputs/{id}`
4. Chat agent puo: **editare output**, **aggiornare context**, **aggiornare brief**
5. Utente fa review: `POST /api/v1/outputs/{id}/review {status: approved|rejected}`
6. Se **approved** + `is_reference: true` → diventa Reference positiva
7. Se **rejected** + feedback → diventa Guardrail
8. Alla prossima generazione, WorkflowService inietta References e Guardrails nei prompt
9. Il ciclo si ripete: ogni generazione e migliore della precedente

---

## File in Questa Cartella

| File | Contenuto |
|------|-----------|
| `00_MASTER_PLAN.md` | Questo file - piano generale |
| `01_DATABASE_SCHEMA.sql` | Schema Supabase completo (copia-incolla in SQL editor) |
| `02_BACKEND_ARCHITECTURE.md` | Tutto il codice backend con spiegazioni |
| `03_FRONTEND_REFERENCE.md` | Pattern UI estratti dai 2 onboarding esistenti |
| `04_DESIGN_LAB.md` | **L'intera interfaccia Design Lab**: home, context hub, outputs, chat, review, routes, mapping UI→backend |
| `existing_code/onboarding_v2/` | Frontend onboarding + cards + brief (piu completo) |
| `existing_code/onboarding_v3/` | Frontend semplificato + packs |
| `existing_code/onboarding_v1/` | Legacy (wizard, card renderers, store) |
| `existing_code/design_lab/` | **Types, mock data, routes, helpers del Design Lab** - pronto per import |
