from uuid import UUID
from supabase import Client


class BaseRepository:
    def __init__(self, db: Client, table_name: str):
        self.db = db
        self.table = table_name

    def get_by_id(self, id: UUID):
        res = self.db.table(self.table).select("*").eq("id", str(id)).single().execute()
        return res.data

    def list_by_user(self, user_id: UUID, limit: int = 50, offset: int = 0):
        res = (self.db.table(self.table)
               .select("*")
               .eq("user_id", str(user_id))
               .order("created_at", desc=True)
               .range(offset, offset + limit - 1)
               .execute())
        return res.data

    def create(self, data: dict):
        res = self.db.table(self.table).insert(data).execute()
        return res.data[0]

    def update(self, id: UUID, data: dict):
        res = self.db.table(self.table).update(data).eq("id", str(id)).execute()
        return res.data[0] if res.data else None

    def delete(self, id: UUID):
        self.db.table(self.table).delete().eq("id", str(id)).execute()
