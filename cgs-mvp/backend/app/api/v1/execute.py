from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from uuid import UUID
import json
from app.api.deps import get_current_user, get_db
from app.domain.models import RunCreate
from app.services.workflow_service import WorkflowService
from app.middleware.rate_limit import limiter

router = APIRouter()


@router.post("")
@limiter.limit("10/minute")
async def start_execution(request: Request, data: RunCreate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    # Verifica che il brief appartenga all'utente
    brief = (db.table("briefs")
             .select("id")
             .eq("id", str(data.brief_id))
             .eq("user_id", str(user_id))
             .single()
             .execute())
    if not brief.data:
        raise HTTPException(404, "Brief not found")

    # Crea run
    run = db.table("workflow_runs").insert({
        "brief_id": str(data.brief_id),
        "user_id": str(user_id),
        "topic": data.topic,
        "input_data": data.input_data,
        "status": "pending",
    }).execute().data[0]

    return {"run_id": run["id"]}


@router.get("/{run_id}")
async def get_run(run_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    run = (db.table("workflow_runs")
           .select("*")
           .eq("id", str(run_id))
           .eq("user_id", str(user_id))
           .single()
           .execute())
    if not run.data:
        raise HTTPException(404, "Run not found")
    return run.data


@router.get("/{run_id}/stream")
async def stream_execution(run_id: UUID, user_id: UUID = Depends(get_current_user)):
    async def event_stream():
        service = WorkflowService()
        async for event in service.execute(run_id, user_id):
            yield f"data: {json.dumps(event)}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")
