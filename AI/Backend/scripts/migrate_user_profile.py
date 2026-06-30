"""One-time migration: add profile columns to the users table (SQLite safe)."""
from app.db.session import engine
from sqlalchemy import inspect, text

NEW_COLUMNS = [
    ("full_name",    "ALTER TABLE users ADD COLUMN full_name VARCHAR"),
    ("email",        "ALTER TABLE users ADD COLUMN email VARCHAR"),
    ("bio",          "ALTER TABLE users ADD COLUMN bio TEXT"),
    ("avatar_color", "ALTER TABLE users ADD COLUMN avatar_color VARCHAR"),
    ("updated_at",   "ALTER TABLE users ADD COLUMN updated_at TIMESTAMP"),
]

insp = inspect(engine)
existing = {c["name"] for c in insp.get_columns("users")}
print("Existing columns:", sorted(existing))

with engine.connect() as conn:
    for col_name, stmt in NEW_COLUMNS:
        if col_name not in existing:
            conn.execute(text(stmt))
            print(f"  [+] Added column: {col_name}")
        else:
            print(f"  [=] Already exists: {col_name}")
    conn.commit()

print("Migration complete.")

