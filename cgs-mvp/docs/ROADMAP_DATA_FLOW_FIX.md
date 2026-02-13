# Roadmap Fix — Flusso Dati & Gestione Informazioni Agenti

> Analisi effettuata il 2026-02-12 sul codebase `cgs-mvp`

Questa roadmap organizza i fix in **4 fasi** ordinate per impatto e dipendenze.
Ogni issue ha: evidenza nel codice, impatto, e fix proposto.

---

## Fase 1 — Fix Critici (Correttezza del dato)

Questi fix risolvono problemi dove **dati disponibili non vengono utilizzati** o vengono **passati in modo errato** agli agenti.

### 1.1 Cards non iniettate nel contesto degli agenti

**File:** `backend/app/services/workflow_service.py`

**Evidenza:** Le cards vengono caricate (riga ~35) ma mai utilizzate:
```python
cards = self.db.table("cards").select("*").eq("context_id", brief["context_id"]).execute().data
# ↑ caricate ma mai passate a template_context né a _build_execution_context
```

Nella funzione `_build_execution_context(self, context, brief, cards, topic)`, il parametro
`cards` è ricevuto ma **completamente ignorato** nel body — non c'è nessun riferimento ad esso.

Anche nel `template_context` Jinja2 (riga ~82) le cards non sono presenti:
```python
template_context = {
    "topic": ...,
    "context": { ... },  # solo company_info, audience_info, voice_info, goals_info
    "agent": { ... },
    # ❌ MANCA: "cards": ...
}
```

**Impatto:** Le 8 card specializzate (prodotto, target, brand_voice, competitor, topic,
campaigns, performance, feedback) — che sono il cuore della conoscenza brand — **non
arrivano mai agli agenti LLM**. Tutto il lavoro di onboarding e compilazione card è
inutile per la generazione.

**Fix proposto:**
1. Aggiungere le cards al `template_context` come dizionario indicizzato per tipo:
   ```python
   "cards": {card["card_type"]: card["content"] for card in cards}
   ```
2. Aggiungere una sezione cards in `_build_execution_context()`:
   ```python
   for card in cards:
       lines.append(f"\n## CARD: {card['card_type'].upper()}")
       lines.append(json.dumps(card.get('content', {}), indent=2))
   ```

**Stima effort:** Basso (< 1h)

---

### 1.2 Duplicazione dati nel system prompt

**File:** `backend/app/services/workflow_service.py`

**Evidenza:** Le stesse informazioni arrivano all'LLM **due volte** (o tre):

| Dato | Via Jinja2 template | Via exec_context (append) | Via PREVIOUS AGENT OUTPUTS (append) |
|------|:---:|:---:|:---:|
| context.brand_name | ✅ `{{context.brand_name}}` | ✅ `## CONTEXT: BrandName` | — |
| context.company_info | ✅ `{{context.company_info}}` | ✅ `Company: {JSON}` | — |
| context.audience_info | ✅ `{{context.audience_info}}` | ✅ `Audience: {JSON}` | — |
| context.voice_info | ✅ `{{context.voice_info}}` | ✅ `Voice: {JSON}` | — |
| context.goals_info | ✅ `{{context.goals_info}}` | ✅ `Goals: {JSON}` | — |
| agent outputs precedenti | ✅ `{{agent.Name.output}}` | — | ✅ `- Name: output[:2000]` |
| topic | ✅ `{{topic}}` | ✅ `## TOPIC: topic` | — |
| brief answers | — (non in template_context) | ✅ `Answers: {JSON}` | — |
| compiled_brief | — (non in template_context) | ✅ `Compiled: ...` | — |

Il contesto viene iniettato sia nel template renderizzato sia in append come stringa.
Lo stesso per gli output degli agenti precedenti.

**Impatto:**
- Spreco token (= costo $$) proporzionale alla dimensione del contesto × num_agenti
- Informazioni duplicate possono confondere l'LLM su quale versione seguire
- Con pack da 4+ agenti e contesti ricchi, il system prompt diventa enorme

**Fix proposto:**
Scegliere **una sola strategia di iniezione**. Raccomandazione:
- **Jinja2 per dati strutturati** (context, cards, agent outputs) — il template dell'agente
  ha il controllo su cosa e come includere
- **Append solo per dati non disponibili in Jinja2** (archive_prompt, tool_results)
- Rendere l'exec_context opzionale: se il template usa `{{context.*}}`, non fare append

Implementazione:
1. Aggiungere brief data al `template_context`:
   ```python
   "brief": {
       "name": brief["name"],
       "answers": brief.get("answers", {}),
       "compiled": brief.get("compiled_brief", ""),
   }
   ```
2. Aggiungere flag `inject_full_context` nel pack config (default `True` per retrocompatibilità)
3. Se il template contiene `{{context.` → non appendere exec_context
4. Se il template contiene `{{agent.` → non appendere PREVIOUS AGENT OUTPUTS

**Stima effort:** Medio (2-4h)

---

### 1.3 Output immagine senza brief_id

**File:** `backend/app/services/workflow_service.py`, metodo `_execute_tool()`

**Evidenza:** Quando viene generata un'immagine, l'output salvato non ha `brief_id`:
```python
self.db.table("outputs").insert({
    "run_id": str(run_id),
    "user_id": str(user_id),
    "output_type": "image",
    ...
    # ❌ MANCA: "brief_id": ...
}).execute()
```

**Impatto:** Le immagini generate non sono collegate al brief, quindi non appaiono
nell'elenco output filtrato per brief (`list_by_brief`) e sono orfane nel Design Lab.

**Fix proposto:** Passare `brief_id` a `_execute_tool()` e includerlo nell'insert.

**Stima effort:** Basso (< 30min)

---

### 1.4 Chat service con contesto parziale

**File:** `backend/app/services/chat_service.py`

**Evidenza:** Il system prompt della chat include solo `voice_info` e `answers`:
```python
messages = [
    {"role": "system", "content": CHAT_SYSTEM_PROMPT + f"""
CURRENT CONTENT: {output.get('text_content', '')}
CONTEXT (brand: {context['brand_name']}):
{json.dumps(context.get('voice_info', {}), indent=2)}
BRIEF (name: {brief['name']}):
{json.dumps(brief.get('answers', {}), indent=2)}"""},
]
```

**Impatto:** L'editor AI nella chat non conosce: company_info, audience_info, goals_info,
industry, cards. Questo limita la qualità delle modifiche suggerite e le azioni
`update_context` / `update_brief`.

**Fix proposto:** Includere il contesto completo (come fa il workflow) ma in forma
sintetica per non esplodere i token:
```python
CONTEXT (brand: {context['brand_name']}, industry: {context.get('industry', 'N/A')}):
Company: {json.dumps(context.get('company_info', {}), indent=2)}
Audience: {json.dumps(context.get('audience_info', {}), indent=2)}
Voice: {json.dumps(context.get('voice_info', {}), indent=2)}
Goals: {json.dumps(context.get('goals_info', {}), indent=2)}
```

**Stima effort:** Basso (< 1h)

---

## Fase 2 — Robustezza (Gestione errori e limiti)

### 2.1 Nessun controllo token pre-chiamata LLM

**File:** `backend/app/services/workflow_service.py`

**Evidenza:** Il system prompt viene assemblato senza nessun controllo sulla lunghezza:
```python
system_prompt = rendered_prompt
system_prompt += "\n\n..." + exec_context + "\n\n" + archive_prompt
if tool_results: system_prompt += ...  # fino a 2000 char per tool
if agent_outputs: system_prompt += ... # fino a 2000 char per agente precedente
# ❌ Nessun controllo sulla lunghezza totale prima di chiamare llm.generate()
```

Con un pack da 4 agenti, al 4° agente il system prompt contiene:
- Template renderizzato (~500-2000 token)
- exec_context (~500-1500 token)
- archive_prompt (~300-1000 token)
- Tool results (~500-1000 token)
- 3 agent outputs precedenti × 2000 char (~1500-4500 token)
- **Totale stimato: 3000-10000+ token solo di system prompt**

**Impatto:** Rischio di superare la context window del modello → errore API.
Con GPT-4o (128K) il rischio è basso, ma con modelli più piccoli o output lunghi
diventa concreto. Inoltre il costo scala linearmente.

**Fix proposto:**
1. Aggiungere un metodo `estimate_tokens(text) -> int` (euristica: `len(text) / 4`)
2. Definire `max_context_tokens` per modello nel pack config
3. Prima della chiamata LLM, verificare e troncare intelligentemente (priorità:
   template > archive > exec_context > previous outputs > tool results)
4. Loggare un warning se il prompt supera il 70% della context window

**Stima effort:** Medio (3-4h)

---

### 2.2 Nessun retry/fallback sulle chiamate LLM

**File:** `backend/app/services/workflow_service.py`

**Evidenza:** La chiamata LLM è singola, senza retry:
```python
response = await llm.generate(
    messages=[...],
    model=pack.get("default_llm_model"),
)
# ❌ Se fallisce → Exception → workflow fallito
```

Nel try/except esterno:
```python
except Exception as e:
    tracker.error(str(e))
    tracker.update_run(status="failed", error_message=str(e))
    yield {"type": "error", "data": {"error": str(e)}}
```

**Impatto:** Un errore transitorio (rate limit, timeout, network) fa fallire l'intero
workflow, anche se la chiamata successiva andrebbe a buon fine. L'utente perde
l'output di tutti gli agenti già completati.

**Fix proposto:**
1. Retry con backoff esponenziale (3 tentativi, 2s/4s/8s) sugli adapter LLM
2. Fallback provider opzionale nel pack config:
   ```json
   {
     "default_llm_provider": "anthropic",
     "fallback_llm_provider": "openai",
     "fallback_llm_model": "gpt-4o"
   }
   ```
3. Wrappare nel `base.py` un decorator `@with_retry(max_attempts=3)`

**Stima effort:** Medio (2-3h)

---

### 2.3 Troncamento hardcoded a valori arbitrari

**File:** `backend/app/services/workflow_service.py`

**Evidenza:** Valori di troncamento sparsi nel codice:
```python
# Tool results: 2000 char
f"- {k}: {v[:2000]}" for k, v in tool_results.items()

# Previous agent outputs: 2000 char
f"- {k}: {v[:2000]}" for k, v in agent_outputs.items()

# Archive references: 300 char
f"  Example: {ref['outputs']['text_content'][:300]}..."

# Metadata agent outputs: 500 char
"metadata": {"agent_outputs": {k: v[:500] for k, v in agent_outputs.items()}}

# Final output stored: 10000 char
final_output=final_output[:10000]
```

**Impatto:** Se un agente produce un articolo da 5000 char, il successivo ne vede
solo 2000. Se un'immagine ha un prompt lungo, viene troncato. Il troncamento è
brutale (taglia a metà frase) senza nessuna logica semantica.

**Fix proposto:**
1. Centralizzare i limiti in un dict di configurazione:
   ```python
   PROMPT_LIMITS = {
       "tool_result_chars": 3000,
       "agent_output_chars": 4000,
       "archive_example_chars": 500,
       "metadata_output_chars": 1000,
       "stored_final_output_chars": 50000,
   }
   ```
2. Rendere configurabili dal pack se necessario
3. Troncare con logica intelligente (a fine frase/paragrafo)

**Stima effort:** Basso (1-2h)

---

### 2.4 Nessuna validazione di agents_config

**File:** `backend/app/services/workflow_service.py`

**Evidenza:** Il pack `agents_config` viene usato direttamente senza validazione:
```python
agents = pack["agents_config"]  # Potrebbe essere None, [], o malformato
total_agents = len(agents)      # ZeroDivisionError se vuoto
for i, agent in enumerate(agents):
    agent_name = agent["name"]  # KeyError se manca "name"
```

**Impatto:** Un pack malformato causa errori criptici (`KeyError`, `ZeroDivisionError`,
`TypeError`) che non aiutano l'utente a capire il problema.

**Fix proposto:**
1. Validare `agents_config` all'inizio di `execute()`:
   ```python
   if not agents or not isinstance(agents, list):
       raise WorkflowException("Pack has no agents configured")
   for i, agent in enumerate(agents):
       if "name" not in agent:
           raise WorkflowException(f"Agent {i} missing required 'name' field")
       if "prompt" not in agent and agent["name"] not in pack.get("prompt_templates", {}):
           raise WorkflowException(f"Agent '{agent['name']}' has no prompt template")
   ```
2. Usare un modello Pydantic `AgentConfig` per la validazione strutturale

**Stima effort:** Basso (1h)

---

## Fase 3 — Ottimizzazione (Costo & Performance)

### 3.1 Lingua output hardcoded

**File:** `backend/app/services/workflow_service.py` (riga ~110),
`backend/app/services/onboarding_service.py` (multiple)

**Evidenza:**
```python
# workflow_service.py
system_prompt += "\n\nIMPORTANT: All generated content MUST be in English."

# onboarding_service.py
"IMPORTANT: All questions and text MUST be in English. Reply ONLY with valid JSON."
"IMPORTANT: All generated content MUST be in English, regardless of the company's language"
```

Mentre gli status nell'applicazione sono in italiano: `"da_approvare"`, `"completato"`,
`"adattato"` (vedi `enums.py`), i label del summary sono misti (`"fonti_informative"`,
`"fonti_mercato"` in `context_service.py`).

**Impatto:** La piattaforma è incoerente: UI potenzialmente italiana, output forzato
in inglese. Non è possibile generare contenuti in altre lingue senza modificare il
codice sorgente. Per un tool di content marketing, la lingua è fondamentale.

**Fix proposto:**
1. Aggiungere `output_language` al modello `Context`:
   ```python
   output_language: str = "en"  # Default English per retrocompatibilità
   ```
2. Usare la lingua dal contesto nel workflow:
   ```python
   lang = context.get("output_language", "en")
   LANG_NAMES = {"en": "English", "it": "Italian", "es": "Spanish", ...}
   system_prompt += f"\n\nIMPORTANT: All generated content MUST be in {LANG_NAMES[lang]}."
   ```
3. Rendere disponibile `{{context.output_language}}` nei template Jinja2

**Stima effort:** Basso (1-2h)

---

### 3.2 Nessun budget/cap di costo per run

**File:** `backend/app/services/workflow_service.py`

**Evidenza:** Il costo viene calcolato e salvato solo alla fine:
```python
total_cost += response.cost_usd
# ... alla fine:
total_cost_usd=float(total_cost)
```

Non c'è nessun check durante l'esecuzione.

**Impatto:** Un pack con 6 agenti su GPT-4o potrebbe costare $1-5 per singola
generazione senza che l'utente ne sia consapevole. Con un errore in un template
che causa output enormi, il costo può esplodere.

**Fix proposto:**
1. Aggiungere `max_cost_usd` ai settings o al pack (default: `1.0`)
2. Check dopo ogni agente:
   ```python
   if total_cost > max_cost_usd:
       raise WorkflowException(f"Cost limit exceeded: ${total_cost:.2f} > ${max_cost_usd:.2f}")
   ```
3. Yield un evento SSE di warning al 70% del budget

**Stima effort:** Basso (1h)

---

### 3.3 Import Jinja2 dentro il loop

**File:** `backend/app/services/workflow_service.py`

**Evidenza:**
```python
for i, agent in enumerate(agents):
    ...
    from jinja2 import Template, TemplateSyntaxError  # ❌ Import ad ogni iterazione
    try:
        template = Template(agent_prompt_template)
```

**Impatto:** Minor ma indicativo di code smell. L'import è cached da Python, ma
la leggibilità ne risente e va contro le best practices.

**Fix proposto:** Spostare l'import a livello di modulo (top of file).

**Stima effort:** Triviale (5min)

---

### 3.4 Nessun check di ownership su stream_execution

**File:** `backend/app/api/v1/execute.py`

**Evidenza:**
```python
@router.get("/{run_id}/stream")
async def stream_execution(run_id: UUID, user_id: UUID = Depends(get_current_user)):
    async def event_stream():
        service = WorkflowService()
        async for event in service.execute(run_id, user_id):
            ...
```

L'endpoint estrae `user_id` dal token ma non verifica che il `run_id` appartenga
effettivamente a quell'utente **prima** di lanciare l'esecuzione. La verifica
avviene implicitamente nel service quando carica il run, ma se il run esiste per
un altro utente, il workflow lo eseguirà ugualmente (il `user_id` passato al service
è quello del richiedente, ma il brief/context caricato potrebbe appartenere ad
un altro utente perché il run non viene filtrato per user_id).

**Impatto:** Potenziale accesso cross-utente: un utente che conosce un `run_id`
di un altro utente potrebbe eseguire il workflow con il contesto dell'altro.

**Fix proposto:**
```python
# In stream_execution, prima di eseguire:
run = db.table("workflow_runs").select("id").eq("id", str(run_id)).eq("user_id", str(user_id)).single().execute()
if not run.data:
    raise HTTPException(404, "Run not found")
```

Oppure nel `WorkflowService.execute()`, filtrare il run per user_id:
```python
run = self.db.table("workflow_runs").select("*").eq("id", str(run_id)).eq("user_id", str(user_id)).single().execute().data
if not run:
    raise NotFoundException("Run not found")
```

**Stima effort:** Basso (< 30min)

---

## Fase 4 — Evoluzione (Miglioramenti architetturali)

### 4.1 get_latest_version con complessità O(N)

**File:** `backend/app/db/repositories/output_repo.py`

**Evidenza:**
```python
def get_latest_version(self, output_id: UUID):
    current = self.get_by_id(output_id)
    while True:
        child = (self.db.table(self.table)
                 .select("*")
                 .eq("parent_output_id", str(current["id"]))
                 .order("version", desc=True)
                 .limit(1)
                 .execute().data)
        if not child:
            return current
        current = child[0]
```

**Impatto:** N query DB per una catena di N versioni. Con molte revisioni via chat,
questo diventa lento.

**Fix proposto:**
1. Aggiungere `root_output_id` alla tabella outputs (referenza all'output originale)
2. Query diretta: `WHERE root_output_id = X ORDER BY version DESC LIMIT 1`
3. Oppure creare una Supabase RPC `get_latest_output_version(output_id UUID)`

**Stima effort:** Medio (2-3h, richiede migration DB)

---

### 4.2 Learning loop: archive senza embedding automatico

**File:** `backend/app/services/workflow_service.py`, `backend/app/db/repositories/archive_repo.py`

**Evidenza:** L'archive ha il supporto per `semantic_search` via pgvector, ma
quando un nuovo output viene archiviato, **non viene generato l'embedding**:
```python
# Creazione archive entry — nessun embedding
self.db.table("archive").insert({
    "output_id": output["id"],
    ...
    "review_status": "pending",
    # ❌ MANCA: "embedding": [...]
}).execute()
```

L'embedding viene generato solo on-demand nella `semantic_search()` dell'`ArchiveService`.

**Impatto:** La ricerca semantica nell'archivio non funzionerà finché non viene
implementato il calcolo embedding al momento della review/approvazione.

**Fix proposto:**
1. Quando l'utente approva/rifiuta un output, generare l'embedding:
   ```python
   # In output_service.review():
   embedding = await generate_embedding(output["text_content"])
   archive_update["embedding"] = embedding
   ```
2. Calcolare embedding in background (non blocking per la review)

**Stima effort:** Medio (2-3h)

---

### 4.3 Esecuzione agenti solo sequenziale

**File:** `backend/app/services/workflow_service.py`

**Evidenza:**
```python
for i, agent in enumerate(agents):
    # ← Sequenziale: ogni agente aspetta il precedente
```

**Impatto:** Se un pack ha agenti indipendenti (es. Researcher + ImageCreator che
non dipendono l'uno dall'altro), vengono comunque eseguiti in sequenza.

**Fix proposto (futuro):**
1. Aggiungere `depends_on: []` alla config di ogni agente
2. Costruire un DAG di dipendenze
3. Eseguire in parallelo con `asyncio.gather()` gli agenti senza dipendenze

**Stima effort:** Alto (1-2 giorni, richiede redesign del workflow engine)

---

## Riepilogo Priorità

| # | Fix | Fase | Effort | Impatto |
|---|-----|------|--------|---------|
| 1.1 | Cards non iniettate | 1 | Basso | **Critico** — dati brand non arrivano all'LLM |
| 1.2 | Duplicazione dati prompt | 1 | Medio | **Alto** — spreco token + confusione LLM |
| 1.3 | Image output senza brief_id | 1 | Basso | **Medio** — immagini orfane nel DB |
| 1.4 | Chat con contesto parziale | 1 | Basso | **Medio** — editor AI limitato |
| 3.4 | Ownership check stream | 3 | Basso | **Critico** — sicurezza cross-utente |
| 2.1 | Controllo token pre-LLM | 2 | Medio | **Alto** — rischio errori API |
| 2.2 | Retry/fallback LLM | 2 | Medio | **Alto** — resilienza workflow |
| 2.3 | Troncamento configurabile | 2 | Basso | **Medio** — perdita informazioni |
| 2.4 | Validazione agents_config | 2 | Basso | **Medio** — error handling |
| 3.1 | Lingua configurabile | 3 | Basso | **Alto** — feature fondamentale |
| 3.2 | Budget cap per run | 3 | Basso | **Medio** — protezione costi |
| 3.3 | Import Jinja2 fuori loop | 3 | Triviale | **Basso** — code quality |
| 4.1 | get_latest_version O(1) | 4 | Medio | **Basso** — performance |
| 4.2 | Embedding automatico archive | 4 | Medio | **Medio** — abilita semantic search |
| 4.3 | Esecuzione parallela agenti | 4 | Alto | **Basso** — ottimizzazione futura |

---

## Ordine di implementazione consigliato

```
Settimana 1: Fase 1 (correttezza) + Fix 3.4 (sicurezza)
├── 1.1 Cards → template_context + exec_context
├── 1.3 Image output → brief_id
├── 1.4 Chat → contesto completo
├── 3.4 Ownership check → stream_execution
└── 1.2 Deduplicazione prompt (parte 1: aggiungere brief a template_context)

Settimana 2: Fase 2 (robustezza)
├── 2.4 Validazione agents_config
├── 2.2 Retry LLM con backoff
├── 2.3 Troncamento configurabile
└── 2.1 Token counting + warning

Settimana 3: Fase 3 (ottimizzazione)
├── 3.3 Import Jinja2 (quick fix)
├── 3.1 Lingua configurabile
├── 3.2 Budget cap
└── 1.2 Deduplicazione prompt (parte 2: rimuovere append ridondanti)

Settimana 4+: Fase 4 (evoluzione)
├── 4.2 Embedding automatico archive
├── 4.1 get_latest_version O(1)
└── 4.3 Esecuzione parallela (design)
```
