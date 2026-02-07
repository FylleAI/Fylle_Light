from .base import BaseRepository


class CardRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "cards")
