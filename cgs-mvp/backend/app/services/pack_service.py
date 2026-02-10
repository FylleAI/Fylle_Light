"""
Pack service for managing agent packs.
Handles context-specific packs and template packs.
"""

import logging
from uuid import UUID
from typing import Optional, List, Dict, Any

from app.config.supabase import get_supabase_admin
from app.exceptions import NotFoundException, ValidationException

logger = logging.getLogger("cgs-mvp.packs")


class PackService:
    """Service for managing agent packs."""

    def __init__(self):
        self.db = get_supabase_admin()

    def list_packs(
        self, user_id: UUID, context_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        List packs for a user.

        Args:
            user_id: ID of the user
            context_id: Optional context ID to filter by

        Returns:
            List of packs (templates + user's context-specific packs)
        """
        if context_id:
            # Get templates (context_id IS NULL) + context-specific packs
            packs = (
                self.db.table("agent_packs")
                .select("*")
                .eq("is_active", True)
                .or_(f"context_id.is.null,and(context_id.eq.{context_id},user_id.eq.{user_id})")
                .order("sort_order")
                .execute()
                .data
            )
        else:
            # Get all templates + all user's packs across contexts
            packs = (
                self.db.table("agent_packs")
                .select("*")
                .eq("is_active", True)
                .or_(f"context_id.is.null,user_id.eq.{user_id}")
                .order("sort_order")
                .execute()
                .data
            )

        # Calculate user_status based on user's briefs
        briefs = (
            self.db.table("briefs")
            .select("pack_id")
            .eq("user_id", str(user_id))
            .execute()
            .data
        )
        user_pack_ids = {b["pack_id"] for b in briefs}

        # Enrich packs with computed fields
        for pack in packs:
            # user_status
            if pack["id"] in user_pack_ids:
                pack["user_status"] = "active"
            else:
                pack["user_status"] = pack.get("status", "available")

            # Computed flags
            pack["is_template"] = pack["context_id"] is None
            pack["is_editable"] = (
                pack["user_id"] is not None and pack["user_id"] == str(user_id)
            )

        return packs

    def get_pack(self, pack_id: UUID) -> Dict[str, Any]:
        """
        Get a single pack by ID.

        Args:
            pack_id: ID of the pack

        Returns:
            Pack data

        Raises:
            NotFoundException: If pack not found
        """
        result = (
            self.db.table("agent_packs")
            .select("*")
            .eq("id", str(pack_id))
            .single()
            .execute()
        )

        if not result.data:
            raise NotFoundException("Pack not found")

        return result.data

    def clone_pack_to_context(
        self, pack_id: UUID, context_id: UUID, user_id: UUID, name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Clone a pack (template or existing) to a specific context.

        Args:
            pack_id: ID of the pack to clone
            context_id: Target context ID
            user_id: ID of the user
            name: Optional new name (defaults to original name)

        Returns:
            Dict containing the created pack record

        Raises:
            NotFoundException: If pack or context not found
        """
        # Get source pack
        source = self.get_pack(pack_id)

        # Verify context ownership
        context = (
            self.db.table("contexts")
            .select("id")
            .eq("id", str(context_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
        if not context.data:
            raise NotFoundException("Context not found or access denied")

        # Create new pack with all fields from source
        new_pack = {
            "context_id": str(context_id),
            "user_id": str(user_id),
            "slug": f"{source['slug']}-{context_id}"[:50],  # Ensure unique slug
            "name": name or f"{source['name']} (Copy)",
            "description": source["description"],
            "icon": source["icon"],
            "outcome": source["outcome"],
            "status": source["status"],
            "content_type_id": source.get("content_type_id"),
            "sort_order": source.get("sort_order", 0),
            "is_active": True,
        }

        result = self.db.table("agent_packs").insert(new_pack).execute()

        logger.info(f"Cloned pack {pack_id} to context {context_id}: {result.data[0]['id']}")
        return result.data[0]

    def create_pack(
        self, context_id: UUID, user_id: UUID, pack_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a brand new pack for a context.

        Args:
            context_id: ID of the context
            user_id: ID of the user
            pack_data: Pack data (slug, name, description, etc.)

        Returns:
            Dict containing the created pack record

        Raises:
            NotFoundException: If context not found
            ValidationException: If required fields missing
        """
        # Verify context ownership
        context = (
            self.db.table("contexts")
            .select("id")
            .eq("id", str(context_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
        if not context.data:
            raise NotFoundException("Context not found or access denied")

        # Validate required fields
        required = ["slug", "name", "description", "icon", "outcome"]
        missing = [f for f in required if f not in pack_data]
        if missing:
            raise ValidationException(f"Missing required fields: {', '.join(missing)}")

        # Create pack
        new_pack = {
            "context_id": str(context_id),
            "user_id": str(user_id),
            **pack_data,
            "is_active": True,
        }

        result = self.db.table("agent_packs").insert(new_pack).execute()

        logger.info(f"Created pack for context {context_id}: {result.data[0]['id']}")
        return result.data[0]

    def update_pack(
        self, pack_id: UUID, user_id: UUID, updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update a pack (only if user owns it).

        Args:
            pack_id: ID of the pack
            user_id: ID of the user
            updates: Fields to update

        Returns:
            Dict containing the updated pack record

        Raises:
            NotFoundException: If pack not found or not owned by user
        """
        # Verify ownership
        pack = (
            self.db.table("agent_packs")
            .select("*")
            .eq("id", str(pack_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
        if not pack.data:
            raise NotFoundException("Pack not found or access denied")

        # Update pack
        result = (
            self.db.table("agent_packs")
            .update(updates)
            .eq("id", str(pack_id))
            .execute()
        )

        logger.info(f"Updated pack {pack_id}")
        return result.data[0]

    def delete_pack(self, pack_id: UUID, user_id: UUID):
        """
        Delete a pack (only if user owns it, only if no briefs use it).

        Args:
            pack_id: ID of the pack
            user_id: ID of the user

        Raises:
            NotFoundException: If pack not found or not owned by user
            ValidationException: If pack is still in use by briefs
        """
        # Verify ownership
        pack = (
            self.db.table("agent_packs")
            .select("*")
            .eq("id", str(pack_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
        if not pack.data:
            raise NotFoundException("Pack not found or access denied")

        # Check if pack is in use
        briefs = (
            self.db.table("briefs")
            .select("id")
            .eq("pack_id", str(pack_id))
            .limit(1)
            .execute()
            .data
        )
        if briefs:
            raise ValidationException(
                "Cannot delete pack: it is being used by one or more briefs"
            )

        # Delete pack
        self.db.table("agent_packs").delete().eq("id", str(pack_id)).execute()
        logger.info(f"Deleted pack {pack_id}")
