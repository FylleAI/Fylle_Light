from .base import BaseRepository


class SessionRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "onboarding_sessions")
