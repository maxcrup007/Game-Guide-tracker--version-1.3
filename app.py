from flask import Flask, jsonify, request, send_from_directory
from database import init_db, get_db
import os

app = Flask(__name__, static_folder='static')

init_db()

# ── Serve frontend ──────────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# ── REST API ─────────────────────────────────────────────────────────────────

@app.route('/api/items', methods=['GET'])
def get_items():
    db = get_db()
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    favorite = request.args.get('favorite', '')
    sort = request.args.get('sort', 'new')

    query = "SELECT * FROM items WHERE 1=1"
    params = []

    if search:
        query += " AND (title LIKE ? OR notes LIKE ?)"
        params += [f'%{search}%', f'%{search}%']
    if category:
        query += " AND category = ?"
        params.append(category)
    if favorite == 'true':
        query += " AND favorite = 1"

    if sort == 'az':
        query += " ORDER BY title ASC"
    elif sort == 'old':
        query += " ORDER BY created_at ASC"
    else:
        query += " ORDER BY created_at DESC"

    rows = db.execute(query, params).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route('/api/items', methods=['POST'])
def create_item():
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400

    db = get_db()
    db.execute(
        "INSERT INTO items (title, category, notes, favorite) VALUES (?, ?, ?, ?)",
        [data['title'], data.get('category', 'Game'), data.get('notes', ''), int(data.get('favorite', False))]
    )
    db.commit()
    row = db.execute("SELECT * FROM items ORDER BY id DESC LIMIT 1").fetchone()
    return jsonify(dict(row)), 201


@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    db = get_db()
    row = db.execute("SELECT * FROM items WHERE id = ?", [item_id]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(dict(row))


@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    db = get_db()
    row = db.execute("SELECT * FROM items WHERE id = ?", [item_id]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404

    data = request.get_json()
    db.execute(
        "UPDATE items SET title=?, category=?, notes=?, favorite=? WHERE id=?",
        [
            data.get('title', row['title']),
            data.get('category', row['category']),
            data.get('notes', row['notes']),
            int(data.get('favorite', row['favorite'])),
            item_id
        ]
    )
    db.commit()
    updated = db.execute("SELECT * FROM items WHERE id = ?", [item_id]).fetchone()
    return jsonify(dict(updated))


@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    db = get_db()
    row = db.execute("SELECT * FROM items WHERE id = ?", [item_id]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    db.execute("DELETE FROM items WHERE id = ?", [item_id])
    db.commit()
    return jsonify({'message': 'Deleted successfully'})


if __name__ == '__main__':
    app.run(debug=True)
