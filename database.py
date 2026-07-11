import sqlite3
import hashlib
from flask import g

DATABASE = 'tracker.db'


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def init_db():
    db = sqlite3.connect(DATABASE)

    db.execute('''CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        notes TEXT DEFAULT '',
        favorite INTEGER DEFAULT 0,
        image_url TEXT DEFAULT '',
        status TEXT DEFAULT '',
        created_at TEXT DEFAULT (date('now')),
        updated_at TEXT DEFAULT (date('now'))
    )''')

    for col, default in [('image_url', "''"), ('status', "''"), ('updated_at', "(date('now'))"), ('content_type', "'markdown'")]:
        try:
            db.execute(f"ALTER TABLE items ADD COLUMN {col} TEXT DEFAULT {default}")
        except Exception:
            pass

    db.execute('''CREATE TABLE IF NOT EXISTS item_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_type TEXT DEFAULT '',
        file_size INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    )''')

    db.execute('''CREATE TABLE IF NOT EXISTS superusers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
    )''')

    db.execute('''CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color_bg TEXT DEFAULT '#E6F1FB',
        color_text TEXT DEFAULT '#0C447C',
        created_at TEXT DEFAULT (datetime('now'))
    )''')

    db.execute('''CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT (datetime('now'))
    )''')

    db.execute('''CREATE TABLE IF NOT EXISTS platforms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT (datetime('now'))
    )''')

    db.execute('''CREATE TABLE IF NOT EXISTS statuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color_bg TEXT DEFAULT '#E6F1FB',
        color_text TEXT DEFAULT '#0C447C',
        created_at TEXT DEFAULT (datetime('now'))
    )''')

    db.execute('''CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_title TEXT NOT NULL,
        description TEXT DEFAULT '',
        reason TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        admin_note TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
    )''')

    db.execute('''CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        body TEXT DEFAULT '',
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    )''')

    db.commit()

    # Seed superuser
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
        db.execute("INSERT OR IGNORE INTO categories (name,color_bg,color_text) VALUES (?,?,?)", [name,bg,txt])

    # Seed tags
    for t in ['RPG','Action','Multiplayer','Story','Open World','Indie']:
        db.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", [t])

    # Seed platforms
    for p in ['PC','PS5','Xbox','Nintendo Switch','Mobile']:
        db.execute("INSERT OR IGNORE INTO platforms (name) VALUES (?)", [p])

    # Seed statuses
    for name, bg, txt in [
        ('Playing','#E1F5EE','#085041'),
        ('Completed','#E6F1FB','#0C447C'),
        ('Dropped','#FCEBEB','#791F1F'),
        ('Wishlist','#FAEEDA','#633806'),
        ('On Hold','#EEEDFE','#3C3489'),
    ]:
        db.execute("INSERT OR IGNORE INTO statuses (name,color_bg,color_text) VALUES (?,?,?)", [name,bg,txt])

    db.commit()
    db.close()


def ensure_requests_table():
    """Run once to add requests table if missing (safe to call repeatedly)."""
    db = sqlite3.connect(DATABASE)
    db.execute('''CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_title TEXT NOT NULL,
        description TEXT DEFAULT '',
        reason TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        admin_note TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
    )''')
    db.commit()
    db.close()