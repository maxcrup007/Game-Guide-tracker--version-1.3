import sqlite3
from flask import g
import os

DATABASE = 'tracker.db'


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


def init_db():
    db = sqlite3.connect(DATABASE)
    db.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            category    TEXT    NOT NULL DEFAULT 'Game',
            notes       TEXT    DEFAULT '',
            favorite    INTEGER DEFAULT 0,
            created_at  TEXT    DEFAULT (date('now'))
        )
    ''')
    db.commit()
    db.close()
