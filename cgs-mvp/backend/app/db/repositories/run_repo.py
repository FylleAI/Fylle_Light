from .base import BaseRepository


class RunRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "workflow_runs")
