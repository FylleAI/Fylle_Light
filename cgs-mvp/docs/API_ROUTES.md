# Fylle MVP — API Routes Definitive

Mappa completa e corretta di tutte le API routes.
Tutte le incongruenze dello starter kit sono state risolte in questo documento.

---

## Convenzioni

- Tutte le route sotto `/api/v1/`
- Auth via header `Authorization: Bearer <JWT>`
- Risposte JSON, errori con `{detail: "..."}`
- Query params per filtri (`?brief_id=X`, `?context_id=X`)

---

## AUTH

```
METHOD  PATH                        AUTH    DESCRIZIONE
──────  ────                        ────    ───────────
POST    /api/v1/auth/register       No      Registra utente (email + password)
POST    /api/v1/auth/login          No      Login, ritorna access_token + refresh_token
POST    /api/v1/auth/refresh        No      Rinnova access_token con refresh_token
POST    /api/v1/auth/logout         Si      Logout (invalida sessione)
```

## USERS

```
METHOD  PATH                        AUTH    DESCRIZIONE
──────  ────                        ────    ───────────
GET     /api/v1/users/profile       Si      Ritorna profilo utente corrente
PATCH   /api/v1/users/profile       Si      Aggiorna profilo (full_name, avatar_url, settings)
```

## ONBOARDING

```
METHOD  PATH                                AUTH    DESCRIZIONE
──────  ────                                ────    ───────────
POST    /api/v1/onboarding/start            Si      Avvia onboarding: research + genera domande
                                                    Input: {brand_name, website?, email}
                                                    Output: {session_id, questions[], research_summary}
GET     /api/v1/onboarding/{id}/status      Si      Stato sessione onboarding
POST    /api/v1/onboarding/{id}/answers     Si      Processa risposte → crea Context + 8 Cards
                                                    Input: {answers: {q1: "...", q2: "..."}}
                                                    Output: {context_id, cards_count}
```

## CONTEXTS

```
METHOD  PATH                                    AUTH    DESCRIZIONE
──────  ────                                    ────    ───────────
GET     /api/v1/contexts                        Si      Lista contexts dell'utente
GET     /api/v1/contexts/{id}                   Si      Dettaglio context con cards
POST    /api/v1/contexts                        Si      Crea context manuale
PATCH   /api/v1/contexts/{id}                   Si      Aggiorna context (company_info, voice_info, etc.)
DELETE  /api/v1/contexts/{id}                   Si      Elimina context (cascade su cards, briefs)
GET     /api/v1/contexts/{id}/cards             Si      Lista 8 cards del context
PATCH   /api/v1/contexts/{id}/cards/{type}      Si      Aggiorna singola card per tipo
GET     /api/v1/contexts/{id}/summary           Si      Vista aggregata 5 aree per Design Lab Home
```

## PACKS

```
METHOD  PATH                        AUTH    DESCRIZIONE
──────  ────                        ────    ───────────
GET     /api/v1/packs               Si      Lista agent packs con user_status calcolato
                                            (active se l'utente ha brief, altrimenti status del pack)
GET     /api/v1/packs/{id}          No      Dettaglio singolo pack (pubblico)
```

## BRIEFS

```
METHOD  PATH                            AUTH    DESCRIZIONE
──────  ────                            ────    ───────────
GET     /api/v1/briefs                  Si      Lista briefs dell'utente
                                                ?context_id=X  filtra per context
                                                ?pack_id=X     filtra per pack
GET     /api/v1/briefs/{id}             Si      Dettaglio brief per UUID
GET     /api/v1/briefs/by-slug/{slug}   Si      Dettaglio brief per slug (usato dal frontend routing)
POST    /api/v1/briefs                  Si      Crea brief
                                                Input: {context_id, pack_id, name, answers}
                                                Auto-genera slug dal nome
                                                Auto-copia questions dal pack
PATCH   /api/v1/briefs/{id}             Si      Aggiorna brief (answers, compiled_brief, status)
DELETE  /api/v1/briefs/{id}             Si      Elimina brief
POST    /api/v1/briefs/{id}/duplicate   Si      Duplica brief con nuovo nome
```

## EXECUTE (Workflow)

```
METHOD  PATH                            AUTH    DESCRIZIONE
──────  ────                            ────    ───────────
POST    /api/v1/execute                 Si      Avvia esecuzione workflow
                                                Input: {brief_id, topic, input_data?}
                                                Output: {run_id}
GET     /api/v1/execute/{run_id}        Si      Stato run (progress, status, output_id)
GET     /api/v1/execute/{run_id}/stream Si      SSE stream per progress real-time
                                                Events: status, progress, agent_complete, completed, error
```

## OUTPUTS

```
METHOD  PATH                                AUTH    DESCRIZIONE
──────  ────                                ────    ───────────
GET     /api/v1/outputs                     Si      Lista outputs dell'utente
                                                    ?brief_id=X  filtra per brief (usa campo denormalizzato)
                                                    Solo output radice (parent_output_id IS NULL)
GET     /api/v1/outputs/summary             Si      Vista aggregata per pack: contatori brief + flag nuovi
                                                    Output: [{pack_id, pack_name, briefs: [{id, name, count, hasNew}]}]
GET     /api/v1/outputs/{id}                Si      Dettaglio singolo output
GET     /api/v1/outputs/{id}/latest         Si      Ultima versione nella chain di editing
GET     /api/v1/outputs/{id}/download       Si      Signed URL per download file (image/audio/video)
PATCH   /api/v1/outputs/{id}                Si      Aggiorna output: {is_new: false} per marcare come visto
DELETE  /api/v1/outputs/{id}                Si      Elimina output
```

## REVIEW (su outputs — path unificato)

> **NOTA**: La review è un'azione sull'output, non sull'archive.
> L'endpoint internamente aggiorna sia `archive.review_status` sia `outputs.status`.

```
METHOD  PATH                                AUTH    DESCRIZIONE
──────  ────                                ────    ───────────
POST    /api/v1/outputs/{id}/review         Si      Review di un output
                                                    Input: {status: "approved"|"rejected",
                                                            feedback?: string,
                                                            feedback_categories?: string[],
                                                            is_reference?: boolean,
                                                            reference_notes?: string}
                                                    Se approved → outputs.status = "completato"
                                                    Se approved + is_reference → archive.is_reference = true
                                                    Se rejected → archive con feedback (guardrail)
```

## CHAT (Design Lab)

```
METHOD  PATH                                    AUTH    DESCRIZIONE
──────  ────                                    ────    ───────────
POST    /api/v1/chat/outputs/{id}               Si      Invia messaggio chat per un output
                                                        Input: {message: string}
                                                        Agent può: edit_output, update_context, update_brief
                                                        Output: {message, updated_output?, context_changes?, brief_changes?}
GET     /api/v1/chat/outputs/{id}/history       Si      Storico chat per un output
```

## ARCHIVE

```
METHOD  PATH                            AUTH    DESCRIZIONE
──────  ────                            ────    ───────────
GET     /api/v1/archive                 Si      Lista archive entries dell'utente
GET     /api/v1/archive/stats           Si      Statistiche: total, approved, rejected, pending, references
POST    /api/v1/archive/search          Si      Semantic search nell'archivio
                                                Input: {query: string, context_id: UUID}
                                                Output: [{id, topic, similarity, is_reference, feedback}]
```

---

## Note su BriefStatus Mapping

| Frontend (Design Lab)  | Backend (DB: briefs.status) |
|------------------------|-----------------------------|
| `"da_configurare"`     | `"draft"`                   |
| `"configurato"`        | `"active"`                  |
| _(non mostrato)_       | `"archived"`                |

## Note su OutputStatus

| Status           | Significato                        | Chi lo setta                    |
|------------------|------------------------------------|---------------------------------|
| `"da_approvare"` | Appena generato, in attesa review  | WorkflowService alla creazione  |
| `"adattato"`     | Modificato via chat                | ChatService dopo edit_output    |
| `"completato"`   | Approvato dall'utente              | Review endpoint (approved)      |

## Note su ReviewRequest (Pydantic)

```python
class ReviewRequest(BaseModel):
    status: ReviewStatus              # "approved" | "rejected"
    feedback: Optional[str] = None    # Testo feedback (per rejected)
    feedback_categories: list[str] = []  # ["Tono sbagliato", "Troppo lungo"]
    is_reference: bool = False        # Promuovi a reference (per approved)
    reference_notes: Optional[str] = None  # Note sulla reference
```
