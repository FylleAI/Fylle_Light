from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .onboarding import router as onboarding_router
from .contexts import router as contexts_router
from .packs import router as packs_router
from .briefs import router as briefs_router
from .execute import router as execute_router
from .outputs import router as outputs_router
from .archive import router as archive_router
from .chat import router as chat_router
from .documents import router as documents_router

router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(onboarding_router, prefix="/onboarding", tags=["onboarding"])
router.include_router(contexts_router, prefix="/contexts", tags=["contexts"])
router.include_router(packs_router, prefix="/packs", tags=["packs"])
router.include_router(briefs_router, prefix="/briefs", tags=["briefs"])
router.include_router(execute_router, prefix="/execute", tags=["execute"])
router.include_router(outputs_router, prefix="/outputs", tags=["outputs"])
router.include_router(archive_router, prefix="/archive", tags=["archive"])
router.include_router(chat_router, prefix="/chat", tags=["chat"])
router.include_router(documents_router, prefix="/documents", tags=["documents"])
