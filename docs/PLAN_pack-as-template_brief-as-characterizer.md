# Piano di Ristrutturazione: Pack-as-Template / Brief-as-Characterizer

> **Stato:** Proposta
> **Data:** 2026-02-19
> **Scope:** Backend (models, workflow engine, brief service) + Frontend (types, wizard BriefCreate/BriefEdit)

---

## 1. Il Problema

Il sistema attuale ha un'**inversione di responsabilità** tra Pack e Brief:

### Pack (oggi): troppo specifico
- Contiene prompt con riferimenti brand-specific hardcoded (es. "Address readers as Wealthbuilders", `blog.siebert.com`, sign-off personalizzati)
- Ogni variazione di contenuto richiede un pack dedicato: Newsletter Siebert ≠ Newsletter Valor ≠ Newsletter generico
- Il workflow (ricerca → scrittura → revisione) è identico tra pack dello stesso tipo, ma viene duplicato interamente

### Brief (oggi): troppo generico
- Contiene solo risposte a 3-4 domande di formato (tono, lunghezza, sezioni)
- Non ha capacità di caratterizzare il contenuto né di influenzare il comportamento degli agenti
- È poco più di un form di configurazione

### Conseguenza pratica
Se domani un utente vuole due newsletter diverse — una "Weekly Digest" e una "Product Update" — servono **due pack separati**, quando logicamente il workflow è identico. Cambia solo la caratterizzazione.

---

## 2. Il Modello Proposto

### Principio chiave
> **Il Pack definisce il "come" (workflow astratto). Il Brief definisce il "cosa" e il "per chi" (caratterizzazione).**

### Struttura target

```
PACK (template astratto)                    BRIEF (istanza caratterizzante)
─────────────────────────                   ─────────────────────────────────
"Blog Pack"                                 "Brief Valor"
  ├─ agents pipeline:                         ├─ answers alle brief_questions
  │   researcher → writer → editor            ├─ agent_overrides:
  ├─ struttura generica del workflow          │   ├─ writer: { prompt_append: "Scrivi in prima persona,
  ├─ tool assignments per agent               │   │            tono tecnico-finanziario" }
  ├─ output format skeleton                   │   └─ editor: { prompt_append: "Verifica compliance CONSOB" }
  ├─ brief_questions (domande da porre)       ├─ settings globali (modello LLM, lingua)
  └─ default LLM config                      └─ compiled_brief (narrativa per LLM)

                                            "Brief SPS" (stesso pack!)
                                              ├─ answers diverse
                                              ├─ agent_overrides:
                                              │   ├─ researcher: { prompt_append: "Solo fonti peer-reviewed" }
                                              │   └─ writer: { prompt_append: "Tono divulgativo, target Gen Z" }
                                              ├─ settings globali diversi
                                              └─ compiled_brief diverso
```

### Override parziali e granulari

Un brief non deve necessariamente configurare tutti gli agenti. Il modello è a **override opzionale**:

- Se il brief non definisce override per un agente → l'agente usa il prompt template del pack così com'è
- Se il brief definisce un `prompt_append` → viene aggiunto in coda al template del pack
- Se il brief definisce un `prompt_prepend` → viene anteposto al template del pack
- Se il brief definisce un `model`/`provider` per un agente → quello specifico agente usa quel modello

Questo permette brief "semplici" (zero override, il pack basta) e brief "avanzati" (override chirurgici per agente).

---

## 3. Analisi dello Stato Attuale

### 3.1 Flusso dati attuale: Pack → Brief → Workflow

```
1. BriefService.create()
   └─ Copia brief_questions dal pack (snapshot)
   └─ Compila compiled_brief dalle answers
   └─ Salva nel DB con settings = {}

2. WorkflowService.execute()
   └─ Carica: run, brief, context, pack, cards, context_items
   └─ Costruisce exec_context (brand data + cards + brief + topic)
   └─ Costruisce archive_prompt (references + guardrails)
   └─ Per ogni agente in pack.agents_config:
       ├─ Esegue tools (perplexity, image_gen)
       ├─ Prende il prompt da agent["prompt"] (o fallback a prompt_templates)
       ├─ Renderizza con Jinja2 (topic, context, agent outputs precedenti)
       ├─ Assembla system prompt: rendered + archive + exec_context + tool results
       └─ Chiama LLM con pack.default_llm_provider / pack.default_llm_model
```

### 3.2 Punti chiave del codice

| File | Ruolo | Righe chiave |
|------|-------|-------------|
| `backend/app/domain/models.py` | Modelli Pydantic | `BriefCreate` (91-97), `BriefUpdate` (100-106), `Brief` (109-123), `AgentPack` (128-147) |
| `backend/app/services/workflow_service.py` | Engine di esecuzione | Loop agenti (84-213), prompt fetch (109-112), Jinja2 context (115-138), LLM call (193-200) |
| `backend/app/services/brief_service.py` | CRUD Brief | `create()` (72-94), `update()` (96-115), `compile_brief()` (25-38) |
| `frontend/src/types/design-lab.ts` | TypeScript types | `AgentPack` (10-47), `Brief` (56-69) |
| `frontend/src/pages/design-lab/BriefCreate.tsx` | Wizard creazione | Steps: name → questions → creating → done |
| `frontend/src/pages/design-lab/BriefEdit.tsx` | Wizard modifica | Stessa struttura di BriefCreate, pre-popolato |
| `supabase/migrations/002_seed.sql` | Pack seed | 4 pack: newsletter, blog, social, podcast |

### 3.3 Elementi già predisposti

- **`Brief.settings`**: campo `JSONB DEFAULT '{}'` già esistente nel DB e nel modello Pydantic — oggi è sempre vuoto
- **`BriefUpdate.settings`**: già accetta `Optional[dict] = None` — il campo è già passabile in update
- **`input_data` spread nel Jinja2 context**: qualsiasi chiave in `run.input_data` è già disponibile come variabile template — estensibile
- **`CreateBriefInput.settings`** nel frontend hook: già tipizzato come `Record<string, unknown>` — pronto all'uso

---

## 4. Piano di Implementazione

### Fase 1 — Backend Models (`models.py`)

**Obiettivo:** Definire strutture typed per agent overrides e brief settings.

**Interventi:**

1. Aggiungere nuovi modelli Pydantic:

```python
class AgentOverride(BaseModel):
    """Override per un singolo agente, definito a livello brief."""
    prompt_append: Optional[str] = None     # Aggiunto in coda al prompt del pack
    prompt_prepend: Optional[str] = None    # Anteposto al prompt del pack
    model: Optional[str] = None             # Override modello LLM per questo agente
    provider: Optional[str] = None          # Override provider LLM per questo agente

class BriefSettings(BaseModel):
    """Settings strutturati per il brief."""
    agent_overrides: dict[str, AgentOverride] = {}  # key = nome agente dal pack
    global_instructions: Optional[str] = None       # Istruzioni aggiunte a TUTTI gli agenti
    default_llm_model: Optional[str] = None         # Override modello default del pack
    default_llm_provider: Optional[str] = None      # Override provider default del pack
```

2. Aggiornare `BriefCreate` per accettare `settings`:

```python
class BriefCreate(BaseModel):
    context_id: UUID
    pack_id: UUID
    name: str
    description: Optional[str] = None
    answers: dict = {}
    settings: dict = {}  # <-- NUOVO
```

**Impatto:** Basso. Aggiunge definizioni, non modifica strutture esistenti.

---

### Fase 2 — Backend Brief Service (`brief_service.py`)

**Obiettivo:** Passare i settings dal payload al DB in create/update.

**Interventi:**

1. Nel metodo `create()` (~riga 87): assicurarsi che `data.settings` venga incluso nel dict di insert. Oggi `data.model_dump()` dovrebbe già includerlo se il campo è definito in `BriefCreate`.

2. Nel metodo `update()` (~riga 98): `data.model_dump(exclude_none=True)` già include `settings` se presente nel payload. Verificare che funzioni.

3. Aggiungere validazione opzionale: i nomi degli agenti in `agent_overrides` devono corrispondere a nomi presenti in `pack.agents_config`. Questo previene override orfani.

**Impatto:** Basso. 5-10 righe di codice.

---

### Fase 3 — Backend Workflow Engine (`workflow_service.py`)

**Obiettivo:** Applicare gli agent overrides del brief durante l'esecuzione del workflow.

**Interventi:**

1. **Prima del loop agenti** (~riga 83): estrarre i settings dal brief

```python
brief_settings = brief.get("settings", {})
agent_overrides = brief_settings.get("agent_overrides", {})
global_instructions = brief_settings.get("global_instructions", "")
brief_default_model = brief_settings.get("default_llm_model")
brief_default_provider = brief_settings.get("default_llm_provider")
```

2. **Nel loop, dopo il fetch del prompt** (~riga 112): applicare prepend/append

```python
agent_override = agent_overrides.get(agent_name, {})

if agent_override.get("prompt_prepend"):
    agent_prompt_template = agent_override["prompt_prepend"] + "\n\n" + agent_prompt_template

if agent_override.get("prompt_append"):
    agent_prompt_template += "\n\n" + agent_override["prompt_append"]

if global_instructions:
    agent_prompt_template += "\n\n## GLOBAL INSTRUCTIONS\n" + global_instructions
```

3. **Alla LLM call** (~riga 193): cascata di priorità per il modello

```python
agent_model = (
    agent_override.get("model")
    or brief_default_model
    or pack.get("default_llm_model")
)
agent_provider = (
    agent_override.get("provider")
    or brief_default_provider
    or pack.get("default_llm_provider")
)

llm = get_llm_adapter(agent_provider)
response = await llm.generate(
    messages=[...],
    model=agent_model,
)
```

**Cascata di priorità (da più specifico a più generico):**

```
agent_override.model  →  brief.settings.default_llm_model  →  pack.default_llm_model
agent_override.provider  →  brief.settings.default_llm_provider  →  pack.default_llm_provider
```

**Impatto:** Medio. ~20 righe di codice, ma nel punto più critico del sistema. Richiede test accurati.

---

### Fase 4 — Frontend Types (`design-lab.ts`)

**Obiettivo:** Estendere i tipi TypeScript per riflettere la nuova struttura.

**Interventi:**

```typescript
// Aggiungere all'interfaccia Brief (~riga 69)
export interface AgentOverride {
  prompt_append?: string;
  prompt_prepend?: string;
  model?: string;
  provider?: string;
}

export interface BriefSettings {
  agent_overrides?: Record<string, AgentOverride>;
  global_instructions?: string;
  default_llm_model?: string;
  default_llm_provider?: string;
}

// Estendere Brief
export interface Brief {
  // ... campi esistenti ...
  settings?: BriefSettings;
}
```

**Impatto:** Basso. Solo definizioni di tipo.

---

### Fase 5 — Frontend BriefCreate Wizard (`BriefCreate.tsx`)

**Obiettivo:** Aggiungere uno step opzionale "Personalizza Agenti" nel wizard.

**Interventi:**

1. Estendere la state machine degli step:
   ```
   PRIMA:  name → questions → creating → done
   DOPO:   name → questions → agent_config → creating → done
   ```

2. Nuovo step `agent_config`:
   - Mostra un toggle "Vuoi personalizzare gli agenti?" (default: no)
   - Se attivato, mostra la lista degli agenti del pack (dal `pack.agents_config`)
   - Per ogni agente: nome, ruolo, e una textarea "Istruzioni aggiuntive" (`prompt_append`)
   - Textarea opzionale "Istruzioni globali" (`global_instructions`) che si applica a tutti
   - Pulsante "Avanti" / "Salta" che procede a `creating`

3. Aggiornare `handleSubmit()` per includere `settings` nel payload:
   ```typescript
   createBrief.mutateAsync({
     context_id,
     pack_id,
     name: briefName,
     answers,
     settings: {
       agent_overrides: agentOverrides,  // solo se compilati
       global_instructions: globalInstructions || undefined,
     },
   })
   ```

4. Lo step è **opzionale**: se l'utente non attiva il toggle, si salta direttamente e `settings` resta `{}`.

**Impatto:** Medio-alto. Nuovo componente UI con logica di stato, ma segue pattern esistenti del wizard.

---

### Fase 6 — Frontend BriefEdit (`BriefEdit.tsx`)

**Obiettivo:** Permettere la modifica degli agent overrides su brief esistenti.

**Interventi:**

1. Stessa UI dello step `agent_config` di BriefCreate
2. Pre-popolato con i valori attuali da `brief.settings.agent_overrides`
3. Aggiornare `handleSubmit()` per includere `settings` nel payload di update

**Impatto:** Medio. Parallelo a BriefCreate.

---

### Fase 7 — Refactoring Prompt dei Pack Seed (`002_seed.sql`)

**Obiettivo:** Rendere i prompt dei pack template generici e standalone.

**Interventi:**

1. Rimuovere riferimenti brand-specific dai prompt degli agenti nei seed
2. Usare variabili Jinja2 dove oggi c'è testo hardcoded:
   - `{{ context.brand_name }}` al posto di nomi brand specifici
   - `{{ topic }}` è già usato
3. Arricchire le `brief_questions` per catturare ciò che oggi è nei prompt:
   - Tono di voce desiderato
   - Target audience specifico
   - Requisiti di compliance
   - Struttura output preferita
   - Call-to-action tipo

**Impatto:** Medio. È un lavoro di prompt engineering, non di codice. Richiede iterazione per mantenere qualità output.

---

## 5. Ordine di Esecuzione e Dipendenze

```
Step 1: Models (models.py)          ──┐
                                      ├──→ Step 2: Brief Service
                                      ├──→ Step 3: Workflow Engine
Step 4: Frontend Types              ──┤
                                      ├──→ Step 5: BriefCreate Wizard
                                      └──→ Step 6: BriefEdit

Step 7: Pack Seed Refactoring       (indipendente, da fare per ultimo)
```

- Step 1 e 4 possono essere fatti **in parallelo** (backend models e frontend types)
- Step 2 e 3 dipendono da Step 1
- Step 5 e 6 dipendono da Step 4
- Step 7 è indipendente ma va fatto per ultimo (richiede più ragionamento sui prompt)

---

## 6. Database: Nessuna Migration Necessaria

La colonna `settings JSONB DEFAULT '{}'` **esiste già** nella tabella `briefs` (migration `001_schema.sql`). La nuova struttura `BriefSettings` viene semplicemente salvata dentro questo campo JSON.

Non servono nuove colonne, nuove tabelle, o migration SQL. Il cambiamento è puramente applicativo.

---

## 7. Rischi e Mitigazioni

| Rischio | Severità | Mitigazione |
|---------|----------|-------------|
| **Pack troppo generici** — se svuotati troppo, il brief deve fare troppo lavoro e l'utente è sopraffatto | ALTA | Il pack DEVE restare un template funzionante *standalone*. Il brief aggiunge, non sostituisce. `prompt_append` come default, non `prompt_replace` |
| **Migrazione pack utente esistenti** — pack con info brand-specific nei prompt | MEDIA | Migrazione one-shot: estrarre le parti brand-specific e spostarle nelle context cards o nei brief settings |
| **UX del wizard** — lo step "configura agenti" può intimidire utenti non tecnici | MEDIA | Step opzionale con toggle. Default = disattivato. Utenti semplici non lo vedono mai |
| **Snapshot invalidation** — se il pack cambia agenti, i brief vecchi hanno override per agenti che non esistono più | BASSA | Ignorare silenziosamente override per agenti non presenti nel pack. Il workflow service già skippa chiavi sconosciute |
| **Prompt injection via override** — un utente potrebbe inserire istruzioni malevole nei prompt_append | BASSA | Gli override vengono da utenti autenticati per il proprio contenuto. Non è un vettore di attacco cross-tenant |

---

## 8. Backward Compatibility

Il cambiamento è **100% backward compatible**:

- Brief esistenti hanno `settings = {}` → nessun override applicato → comportamento identico a oggi
- Pack esistenti non vengono modificati strutturalmente (Step 7 è opzionale e incrementale)
- Il workflow engine applica override solo se presenti → assenza = comportamento invariato
- Il frontend mostra lo step agent_config solo se attivato → UX invariata per utenti esistenti
- Nessuna migration DB necessaria

---

## 9. Metriche di Successo

- **Riduzione pack:** Da N pack per tipo contenuto a 1 pack generico + N brief caratterizzanti
- **Riuso workflow:** Lo stesso pack "Blog" serve brief diversi senza duplicazione
- **Velocità setup:** Creare un nuovo brand/prodotto richiede solo un nuovo brief, non un nuovo pack
- **Qualità output:** La caratterizzazione via brief produce output almeno alla pari dei pack specifici attuali
