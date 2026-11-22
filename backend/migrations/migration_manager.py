"""
NavJyoti Database Schema Inspector and Safe Migration Utility
Inspects existing database schema safely without mutating production tables.
"""

from typing import Dict, List
from sqlalchemy import inspect
from sqlalchemy.engine import Engine


def inspect_schema(engine: Engine) -> Dict[str, List[str]]:
    """
    Inspect existing tables and columns in a read-only manner.
    Returns a mapping of table_name -> list of column names.
    """
    inspector = inspect(engine)
    schema_info = {}
    for table_name in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns(table_name)]
        schema_info[table_name] = columns
    return schema_info


def verify_tables_exist(engine: Engine, required_tables: List[str]) -> Dict[str, bool]:
    """Check existence of required tables."""
    inspector = inspect(engine)
    existing = set(inspector.get_table_names())
    return {table: (table in existing) for table in required_tables}
