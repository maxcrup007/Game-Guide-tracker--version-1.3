"""
One-time migration: copy every table from the local SQLite database into a
Postgres database (e.g. Render's managed Postgres).

Usage (PowerShell):
    $env:DATABASE_URL = "postgresql://user:pass@host:5432/dbname"
    python migrate_to_postgres.py                # source defaults to ./tracker.db
    python migrate_to_postgres.py path\to\tracker.db

The target Postgres DB is TRUNCATED and replaced with an exact copy of the
SQLite source, so the result matches your local data (ids and all).
"""
import os
import sys
import sqlite3

# Target must be Postgres — DATABASE_URL has to be set before importing database.
if not os.environ.get('DATABASE_URL', '').startswith('postgres'):
    sys.exit("ERROR: set DATABASE_URL to your Postgres connection string first.")

import database  # noqa: E402  (import after DATABASE_URL is set)

SOURCE = sys.argv[1] if len(sys.argv) > 1 else 'tracker.db'

# Tables copied in FK-safe order (children after parents).
TABLES = [
    'items', 'item_files', 'superusers', 'categories', 'tags',
    'platforms', 'statuses', 'requests', 'announcements', 'edit_requests',
]


def main():
    if not os.path.exists(SOURCE):
        sys.exit(f"ERROR: source SQLite file not found: {SOURCE}")

    print(f"Source SQLite : {SOURCE}")
    print(f"Target Postgres: {os.environ['DATABASE_URL'].rsplit('@', 1)[-1]}")

    # 1. Ensure the Postgres schema exists.
    database.init_db()

    src = sqlite3.connect(SOURCE)
    src.row_factory = sqlite3.Row
    dst = database.connect()  # _PGConnection

    # 2. Wipe the target so this is a clean clone, then copy each table.
    for t in reversed(TABLES):
        dst.execute(f"TRUNCATE TABLE {t} RESTART IDENTITY CASCADE")
    dst.commit()

    for t in TABLES:
        try:
            rows = src.execute(f"SELECT * FROM {t}").fetchall()
        except sqlite3.OperationalError:
            print(f"  - {t}: (missing in source, skipped)")
            continue
        if not rows:
            print(f"  - {t}: 0 rows")
            continue
        cols = rows[0].keys()
        collist = ','.join(cols)
        placeholders = ','.join('?' for _ in cols)
        sql = f"INSERT INTO {t} ({collist}) VALUES ({placeholders})"
        for r in rows:
            dst.execute(sql, [r[c] for c in cols])
        dst.commit()

        # Reset the SERIAL sequence so new inserts don't collide with copied ids.
        if 'id' in cols:
            dst.execute(
                "SELECT setval(pg_get_serial_sequence(?, 'id'), "
                "(SELECT COALESCE(MAX(id), 1) FROM " + t + "))",
                [t],
            )
            dst.commit()
        print(f"  - {t}: {len(rows)} rows")

    src.close()
    dst.close()
    print("Done. Postgres now mirrors your local database.")


if __name__ == '__main__':
    main()
