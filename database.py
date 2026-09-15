import sqlite3
import hashlib
import os
from flask import g

# ── Backend selection ─────────────────────────────────────────────────────────
# If DATABASE_URL is set (e.g. Render's managed Postgres), use Postgres.
# Otherwise fall back to a local SQLite file for development.
DATABASE_URL = os.environ.get('DATABASE_URL', '').strip()
USE_POSTGRES = DATABASE_URL.startswith('postgres')

# Local SQLite path (used only when DATABASE_URL is not set).
DATABASE = os.environ.get('DATABASE_PATH', 'tracker.db')

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


# ── Postgres compatibility wrapper ────────────────────────────────────────────
# Mimics the small slice of the sqlite3.Connection API that app.py relies on:
#   conn.execute(sql, params) -> cursor with .fetchone()/.fetchall()
#   conn.commit(), conn.close()
# It rewrites '?' placeholders to '%s' and returns dict-like rows so that
# dict(row), row['col'] and row.keys() keep working unchanged.

def _translate(sql):
    return sql.replace('?', '%s')


class _PGConnection:
    def __init__(self, conn):
        self._conn = conn
        self._cur = None

    def execute(self, sql, params=()):
        if self._cur is None:
            self._cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        self._cur.execute(_translate(sql), params)
        return self._cur

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        try:
            self._conn.close()
        except Exception:
            pass


def connect():
    """Return a raw connection object (Postgres wrapper or sqlite3)."""
    if USE_POSTGRES:
        return _PGConnection(psycopg2.connect(DATABASE_URL))
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def get_db():
    if 'db' not in g:
        g.db = connect()
    return g.db


def close_db(_e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


# ── Media storage (files kept in the DB so they survive redeploys) ─────────────

def save_media(db, filename, data, content_type):
    """Insert or replace a stored file's bytes, keyed by its relative filename."""
    if USE_POSTGRES:
        db.execute(
            "INSERT INTO media (filename, data, content_type) VALUES (?,?,?) "
            "ON CONFLICT (filename) DO UPDATE SET data=EXCLUDED.data, "
            "content_type=EXCLUDED.content_type",
            [filename, psycopg2.Binary(data), content_type],
        )
    else:
        db.execute(
            "INSERT OR REPLACE INTO media (filename, data, content_type) VALUES (?,?,?)",
            [filename, sqlite3.Binary(data), content_type],
        )
    db.commit()


def load_media(db, filename):
    """Return (bytes, content_type) for a stored file, or None if absent."""
    row = db.execute("SELECT data, content_type FROM media WHERE filename=?", [filename]).fetchone()
    if not row or row['data'] is None:
        return None
    data = row['data']
    if not isinstance(data, (bytes, bytearray)):
        data = bytes(data)  # psycopg2 returns memoryview for BYTEA
    return bytes(data), row['content_type']


def delete_media(db, filename):
    db.execute("DELETE FROM media WHERE filename=?", [filename])
    db.commit()


# ── Schema ─────────────────────────────────────────────────────────────────────

def init_db():
    db = connect()

    if USE_POSTGRES:
        id_col = "id SERIAL PRIMARY KEY"
        date_default = "CURRENT_DATE::text"        # 'YYYY-MM-DD'
        ts_default = "CURRENT_TIMESTAMP::text"     # 'YYYY-MM-DD HH:MM:SS...'
        blob_type = "BYTEA"
        insert_ignore = "INSERT INTO {t} ({c}) VALUES ({p}) ON CONFLICT DO NOTHING"
    else:
        id_col = "id INTEGER PRIMARY KEY AUTOINCREMENT"
        date_default = "date('now')"
        ts_default = "datetime('now')"
        blob_type = "BLOB"
        insert_ignore = "INSERT OR IGNORE INTO {t} ({c}) VALUES ({p})"

    db.execute(f'''CREATE TABLE IF NOT EXISTS items (
        {id_col},
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        notes TEXT DEFAULT '',
        favorite INTEGER DEFAULT 0,
        image_url TEXT DEFAULT '',
        status TEXT DEFAULT '',
        content_type TEXT DEFAULT 'markdown',
        created_at TEXT DEFAULT ({date_default}),
        updated_at TEXT DEFAULT ({date_default})
    )''')

    # Add columns that may be missing on older databases (idempotent).
    if USE_POSTGRES:
        for col, ddl in [
            ('image_url',    "TEXT DEFAULT ''"),
            ('status',       "TEXT DEFAULT ''"),
            ('updated_at',   f"TEXT DEFAULT ({date_default})"),
            ('content_type', "TEXT DEFAULT 'markdown'"),
        ]:
            db.execute(f"ALTER TABLE items ADD COLUMN IF NOT EXISTS {col} {ddl}")
    else:
        for col, default in [('image_url', "''"), ('status', "''"),
                             ('updated_at', "(date('now'))"), ('content_type', "'markdown'")]:
            try:
                db.execute(f"ALTER TABLE items ADD COLUMN {col} TEXT DEFAULT {default}")
            except Exception:
                pass

    db.execute(f'''CREATE TABLE IF NOT EXISTS item_files (
        {id_col},
        item_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_type TEXT DEFAULT '',
        file_size INTEGER DEFAULT 0,
        created_at TEXT DEFAULT ({ts_default})
    )''')

    db.execute(f'''CREATE TABLE IF NOT EXISTS superusers (
        {id_col},
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT ({ts_default})
    )''')

    db.execute(f'''CREATE TABLE IF NOT EXISTS categories (
        {id_col},
        name TEXT NOT NULL UNIQUE,
        color_bg TEXT DEFAULT '#E6F1FB',
        color_text TEXT DEFAULT '#0C447C',
        created_at TEXT DEFAULT ({ts_default})
    )''')

    db.execute(f'''CREATE TABLE IF NOT EXISTS tags (
        {id_col},
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT ({ts_default})
    )''')

    db.execute(f'''CREATE TABLE IF NOT EXISTS platforms (
        {id_col},
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT ({ts_default})
    )''')

    db.execute(f'''CREATE TABLE IF NOT EXISTS statuses (
        {id_col},
        name TEXT NOT NULL UNIQUE,
        color_bg TEXT DEFAULT '#E6F1FB',
        color_text TEXT DEFAULT '#0C447C',
        created_at TEXT DEFAULT ({ts_default})
    )''')

    db.execute(f'''CREATE TABLE IF NOT EXISTS requests (
        {id_col},
        game_title TEXT NOT NULL,
        description TEXT DEFAULT '',
        reason TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        admin_note TEXT DEFAULT '',
        created_at TEXT DEFAULT ({ts_default})
    )''')

    db.execute(f'''CREATE TABLE IF NOT EXISTS announcements (
        {id_col},
        title TEXT NOT NULL,
        body TEXT DEFAULT '',
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT ({ts_default})
    )''')

    db.execute(f'''CREATE TABLE IF NOT EXISTS edit_requests (
        {id_col},
        item_id INTEGER NOT NULL,
        requester_name TEXT DEFAULT '',
        reason TEXT DEFAULT '',
        proposed_changes TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        admin_note TEXT DEFAULT '',
        created_at TEXT DEFAULT ({ts_default})
    )''')

    db.execute(f'''CREATE TABLE IF NOT EXISTS media (
        filename TEXT PRIMARY KEY,
        data {blob_type} NOT NULL,
        content_type TEXT DEFAULT 'application/octet-stream',
        created_at TEXT DEFAULT ({ts_default})
    )''')

    db.commit()

    # Seed superuser (admin/admin1234) if none exists.
    if not db.execute("SELECT id FROM superusers WHERE username='admin'").fetchone():
        db.execute("INSERT INTO superusers (username, password_hash) VALUES (?,?)",
                   ['admin', hash_password('admin1234')])

    # Seed categories
    for name, bg, txt in [
        ('MineCraft','#E6F1FB','#16a104'),
        ('Monster Hunter Wild','#EAF3DE','#f1f512'),
        ('ARK Survival Ascended','#FAEEDA','#060ae2'),
        ('Red Dead Redemption 2','#EEEDFE','#eb0c0c'),
        ('ELDEN RING','#EEEDFE','#e7a10b'),
        ('FateGO','#EEEDFE','#0d72cf'),
    ]:
        db.execute(insert_ignore.format(t='categories', c='name,color_bg,color_text', p='?,?,?'),
                   [name, bg, txt])

    # Seed tags
    for t in ['RPG','Action','Multiplayer','Story','Open World','Indie']:
        db.execute(insert_ignore.format(t='tags', c='name', p='?'), [t])

    # Seed platforms
    for p in ['PC','PS5','Xbox','Nintendo Switch','Mobile']:
        db.execute(insert_ignore.format(t='platforms', c='name', p='?'), [p])

    # Seed statuses
    for name, bg, txt in [
        ('Playing','#E1F5EE','#085041'),
        ('Completed','#E6F1FB','#0C447C'),
        ('Dropped','#FCEBEB','#791F1F'),
        ('Wishlist','#FAEEDA','#633806'),
        ('On Hold','#EEEDFE','#3C3489'),
    ]:
        db.execute(insert_ignore.format(t='statuses', c='name,color_bg,color_text', p='?,?,?'),
                   [name, bg, txt])

    db.commit()
    db.close()
