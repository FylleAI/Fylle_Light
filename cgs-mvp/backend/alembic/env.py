"""Alembic environment configuration for CGS-MVP.

Reads DATABASE_URL from app settings (pydantic-settings).
Runs migrations in "offline" (SQL generation) or "online" (direct DB) mode.

This project uses Alembic in SQL-only mode:
- No SQLAlchemy models (we use supabase-py for queries)
- No autogenerate (migrations are written manually)
- target_metadata = None
"""

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# Add backend/ to sys.path so we can import app.config.settings
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Alembic Config object (access to alembic.ini values)
config = context.config

# Setup Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# No SQLAlchemy models — we use SQL-only migrations
target_metadata = None


def get_database_url() -> str:
    """Get DATABASE_URL from app settings, with fallback to alembic.ini."""
    try:
        from app.config.settings import get_settings
        settings = get_settings()
        if settings.database_url:
            return settings.database_url
    except Exception:
        pass

    # Fallback: read from alembic.ini (sqlalchemy.url)
    url = config.get_main_option("sqlalchemy.url", "")
    if url:
        return url

    raise RuntimeError(
        "DATABASE_URL not configured. "
        "Set it in backend/.env or in alembic.ini [alembic] sqlalchemy.url. "
        "Get it from Supabase Dashboard > Settings > Database > Connection string (Direct connection)."
    )


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL without connecting to DB.

    Useful for reviewing SQL before applying, or for environments where
    you can't connect directly to the database.

    Usage: alembic upgrade head --sql
    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode — connects directly to DB.

    This is the standard mode for applying migrations.
    """
    # Build engine configuration
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_database_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # No connection pooling for migrations
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
