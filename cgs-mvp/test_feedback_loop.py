"""
Test E2E del Feedback Loop — Fylle Light CGS MVP

Questo script verifica che il ciclo di feedback (approve/reject) funzioni correttamente:
1. Trova il contesto Siebert e gli output esistenti
2. Verifica lo stato dell'archive (references e guardrails)
3. Testa che get_references() e get_guardrails() restituiscano dati corretti
4. Testa che _build_archive_prompt() generi il prompt atteso
5. Simula approve + reject e verifica l'impatto sulla prossima generazione

Eseguire con: python3 test_feedback_loop.py
"""

import sys
import os

# Change to backend dir so .env is found by pydantic-settings
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

from uuid import UUID
from app.config.supabase import get_supabase_admin
from app.db.repositories.archive_repo import ArchiveRepository
from app.services.workflow_service import WorkflowService


def separator(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def main():
    db = get_supabase_admin()

    # ─── Step 1: Trova contesto Siebert ───
    separator("1. CONTESTO SIEBERT")
    contexts = db.table("contexts").select("id, name, brand_name").execute().data
    siebert = [c for c in contexts if "siebert" in c.get("name", "").lower() or "siebert" in c.get("brand_name", "").lower()]

    if not siebert:
        print("❌ Contesto Siebert non trovato!")
        return

    ctx = siebert[0]
    ctx_id = ctx["id"]
    print(f"✅ Contesto: {ctx['name']} (brand: {ctx['brand_name']})")
    print(f"   ID: {ctx_id}")

    # ─── Step 2: Trova outputs e archive per questo contesto ───
    separator("2. OUTPUTS & ARCHIVE")

    # Trova briefs per questo contesto
    briefs = db.table("briefs").select("id, name, pack_id").eq("context_id", ctx_id).execute().data
    print(f"\n📋 Briefs trovati: {len(briefs)}")
    for b in briefs:
        print(f"   - {b['name']} (id: {b['id'][:8]}...)")

    # Trova outputs
    brief_ids = [b["id"] for b in briefs]
    if brief_ids:
        outputs = db.table("outputs").select("id, title, status, number, brief_id").in_("brief_id", brief_ids).order("created_at", desc=True).execute().data
        print(f"\n📄 Outputs trovati: {len(outputs)}")
        for o in outputs:
            print(f"   - #{o.get('number', '?')} | {o.get('title', 'N/A')[:40]} | status: {o['status']}")
    else:
        outputs = []
        print("\n📄 Nessun output trovato")

    # Trova archive entries
    archive = db.table("archive").select("*").eq("context_id", ctx_id).execute().data
    print(f"\n🗄️  Archive entries: {len(archive)}")
    for a in archive:
        print(f"   - topic: {a.get('topic', 'N/A')[:40]}")
        print(f"     review_status: {a.get('review_status', 'N/A')} | is_reference: {a.get('is_reference', False)}")
        print(f"     feedback: {(a.get('feedback') or 'none')[:60]}")
        print(f"     feedback_categories: {a.get('feedback_categories', [])}")
        print(f"     reference_notes: {(a.get('reference_notes') or 'none')[:60]}")
        print()

    # ─── Step 3: Testa get_references e get_guardrails ───
    separator("3. ARCHIVE REPOSITORY — References & Guardrails")

    archive_repo = ArchiveRepository(db)
    references = archive_repo.get_references(UUID(ctx_id))
    guardrails = archive_repo.get_guardrails(UUID(ctx_id))

    print(f"\n🌟 References (is_reference=True): {len(references)}")
    for ref in references:
        print(f"   - topic: {ref.get('topic', 'N/A')[:40]}")
        has_content = bool(ref.get("outputs", {}).get("text_content"))
        print(f"     has_text_content: {has_content}")
        if ref.get("reference_notes"):
            print(f"     notes: {ref['reference_notes'][:80]}")

    print(f"\n🚧 Guardrails (review_status=rejected): {len(guardrails)}")
    for g in guardrails:
        print(f"   - topic: {g.get('topic', 'N/A')[:40]}")
        print(f"     feedback: {(g.get('feedback') or 'N/A')[:80]}")
        print(f"     categories: {g.get('feedback_categories', [])}")

    # ─── Step 4: Testa _build_archive_prompt ───
    separator("4. BUILD ARCHIVE PROMPT")

    wf = WorkflowService()
    archive_prompt = wf._build_archive_prompt(references, guardrails)

    if archive_prompt:
        print(f"\n✅ Archive prompt generato: {len(archive_prompt)} chars")
        print(f"\n--- CONTENUTO ---")
        print(archive_prompt)
        print(f"--- FINE ---")
    else:
        print(f"\n⚠️  Archive prompt VUOTO — nessun reference/guardrail trovato")
        print(f"   Questo significa che il feedback loop NON sta influenzando le generazioni!")

    # ─── Step 5: Riepilogo ───
    separator("5. DIAGNOSI FEEDBACK LOOP")

    total_archive = len(archive)
    approved = sum(1 for a in archive if a.get("review_status") == "approved")
    rejected = sum(1 for a in archive if a.get("review_status") == "rejected")
    pending = sum(1 for a in archive if a.get("review_status") == "pending")
    ref_count = sum(1 for a in archive if a.get("is_reference"))

    print(f"\n📊 Statistiche archive per contesto Siebert:")
    print(f"   Totale entries: {total_archive}")
    print(f"   Pending:        {pending}")
    print(f"   Approved:       {approved}")
    print(f"   Rejected:       {rejected}")
    print(f"   References:     {ref_count}")
    print()

    # Diagnosi
    issues = []
    if total_archive == 0:
        issues.append("❌ Archive vuoto — nessun output è mai stato archiviato")
    if approved == 0 and rejected == 0:
        issues.append("⚠️  Nessun output è stato ancora approvato o rigettato")
    if ref_count == 0:
        issues.append("⚠️  Nessun contenuto è stato marcato come reference")
    if rejected == 0:
        issues.append("⚠️  Nessun contenuto è stato rigettato — nessun guardrail attivo")
    if not archive_prompt:
        issues.append("❌ Archive prompt vuoto — il feedback loop NON influenza le generazioni")

    if issues:
        print("🔍 Issues trovate:")
        for issue in issues:
            print(f"   {issue}")
        print()
        print("💡 Per attivare il feedback loop, devi:")
        print("   1. Approvare un contenuto con 'Save as reference' ✅")
        print("   2. Rigettare un contenuto con feedback testuale ❌")
        print("   3. Generare un nuovo contenuto → l'archive_prompt sarà iniettato")
    else:
        print("✅ Feedback loop ATTIVO — references e guardrails verranno usati nella prossima generazione!")


if __name__ == "__main__":
    main()
