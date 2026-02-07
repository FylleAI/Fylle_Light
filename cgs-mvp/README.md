# Fylle MVP

Piattaforma SaaS per generare contenuti AI personalizzati con learning loop. Onboarding → Context → Agent Pack → Brief → Genera → Chat → Approva → Migliora.

## Prerequisiti

- Python 3.11+
- Node.js 20+
- Account [Supabase](https://supabase.com) (progetto creato)

## Setup

### 1. Database

Esegui le migration nel SQL Editor di Supabase in ordine:

```bash
supabase/migrations/001_schema.sql     # Tabelle, indici, trigger, RLS
supabase/migrations/002_seed.sql       # Content types + Agent Packs
supabase/migrations/003_storage.sql    # Storage buckets + policies
supabase/migrations/004_functions.sql  # RPC functions (semantic search, stats)
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Configura .env con le credenziali Supabase e API keys
```

### 3. Frontend

```bash
cd frontend
npm install
```

## Avvio

```bash
# Backend (porta 8000)
cd backend
uvicorn app.main:app --reload --port 8000

# Frontend (porta 5173, proxy verso backend)
cd frontend
npm run dev
```

## Avvio con Docker

```bash
docker-compose up --build
```

## Struttura

```
cgs-mvp/
├── backend/          # FastAPI + Supabase + LLM adapters
├── frontend/         # React 18 + Vite + Tailwind + shadcn/ui
├── supabase/         # SQL migrations
├── docs/             # API routes, documentazione
└── docker-compose.yml
```

## API Docs

Con il backend avviato: [http://localhost:8000/docs](http://localhost:8000/docs)

Mappa completa routes: [docs/API_ROUTES.md](docs/API_ROUTES.md)
