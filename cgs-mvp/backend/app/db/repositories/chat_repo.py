from .base import BaseRepository


class ChatRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "chat_messages")
