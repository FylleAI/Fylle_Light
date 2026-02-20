from uuid import UUID

from app.config.supabase import get_supabase_admin


class RunTracker:
    def __init__(self, run_id: UUID):
        self.run_id = run_id
        self.db = get_supabase_admin()

    def log(self, level: str, message: str, **kwargs):
        self.db.table("run_logs").insert(
            {
                "run_id": str(self.run_id),
                "level": level,
                "message": message,
                "agent_name": kwargs.get("agent_name"),
                "step_number": kwargs.get("step_number"),
                "tokens_used": kwargs.get("tokens_used"),
                "cost_usd": kwargs.get("cost_usd"),
                "duration_ms": kwargs.get("duration_ms"),
                "metadata": kwargs.get("metadata", {}),
            }
        ).execute()

    def info(self, msg, **kw):
        self.log("INFO", msg, **kw)

    def error(self, msg, **kw):
        self.log("ERROR", msg, **kw)

    def warn(self, msg, **kw):
        self.log("WARN", msg, **kw)

    def update_run(self, **fields):
        self.db.table("workflow_runs").update(fields).eq("id", str(self.run_id)).execute()
