from flask import Flask, jsonify, request, send_from_directory, session, redirect, url_for
from flask_cors import CORS
from database import init_db, get_db, hash_password
from functools import wraps
from werkzeug.utils import secure_filename
import os
import uuid

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
FRONTEND_DIST = os.path.join(BASE_DIR, 'frontend', 'dist')
ALLOWED_IMAGE_EXT = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_FILE_EXT = {'md', 'markdown', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'doc', 'docx'}

os.makedirs(os.path.join(UPLOAD_FOLDER, 'images'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'files'), exist_ok=True)

app = Flask(__name__, static_folder='static')
app.secret_key = os.environ.get('SECRET_KEY', 'change-this-secret-key-in-production')
CORS(app)

init_db()


@app.errorhandler(500)
def handle_500(e):
    return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@app.errorhandler(404)
def handle_404(_):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Not found'}), 404
    index = os.path.join(FRONTEND_DIST, 'index.html')
    if os.path.exists(index):
        return send_from_directory(FRONTEND_DIST, 'index.html')
    return jsonify({'error': 'Not found'}), 404


# ── Auth helpers ─────────────────────────────────────────────────────────────

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect('/admin/login')
        return f(*args, **kwargs)
    return decorated


def api_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


# ── Serve legacy frontend (fallback when React build not present) ─────────────

@app.route('/shared.css')
def shared_css():
    return send_from_directory('static', 'shared.css')


@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    db = get_db()
    user = db.execute(
        "SELECT * FROM superusers WHERE username=? AND password_hash=?",
        [data.get('username',''), hash_password(data.get('password',''))]
    ).fetchone()
    if user:
        session['admin_logged_in'] = True
        session['admin_username'] = user['username']
        return jsonify({'success': True})
    return jsonify({'error': 'Invalid username or password'}), 401


@app.route('/admin/logout', methods=['POST'])
def admin_logout():
    session.clear()
    return jsonify({'success': True})


# ── Public API — Items ────────────────────────────────────────────────────────

@app.route('/api/items', methods=['GET'])
def get_items():
    db = get_db()
    search   = request.args.get('search', '')
    category = request.args.get('category', '')
    favorite = request.args.get('favorite', '')
    sort     = request.args.get('sort', 'new')

    query  = "SELECT * FROM items WHERE 1=1"
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
        "INSERT INTO items (title, category, notes, favorite, status, image_url, content_type) VALUES (?,?,?,?,?,?,?)",
        [data['title'], data.get('category',''), data.get('notes',''),
         int(data.get('favorite', False)), data.get('status',''), data.get('image_url',''),
         data.get('content_type', 'markdown')]
    )
    db.commit()
    row = db.execute("SELECT * FROM items ORDER BY id DESC LIMIT 1").fetchone()
    return jsonify(dict(row)), 201

@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    db  = get_db()
    row = db.execute("SELECT * FROM items WHERE id=?", [item_id]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(dict(row))

@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    db  = get_db()
    row = db.execute("SELECT * FROM items WHERE id=?", [item_id]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    cols = row.keys()
    db.execute(
        "UPDATE items SET title=?, category=?, notes=?, favorite=?, status=?, image_url=?, content_type=?, updated_at=date('now') WHERE id=?",
        [data.get('title', row['title']),
         data.get('category', row['category']),
         data.get('notes', row['notes']),
         int(data.get('favorite', row['favorite'])),
         data.get('status', row['status'] if 'status' in cols else ''),
         data.get('image_url', row['image_url'] if 'image_url' in cols else ''),
         data.get('content_type', row['content_type'] if 'content_type' in cols else 'markdown'),
         item_id]
    )
    db.commit()
    return jsonify(dict(db.execute("SELECT * FROM items WHERE id=?", [item_id]).fetchone()))

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    db  = get_db()
    row = db.execute("SELECT * FROM items WHERE id=?", [item_id]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    db.execute("DELETE FROM items WHERE id=?", [item_id])
    db.commit()
    return jsonify({'message': 'Deleted successfully'})

# ── Public API — Master data (read-only for normal users) ────────────────────

@app.route('/api/categories')
def get_categories():
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM categories ORDER BY name").fetchall()])

@app.route('/api/tags')
def get_tags():
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM tags ORDER BY name").fetchall()])

@app.route('/api/platforms')
def get_platforms():
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM platforms ORDER BY name").fetchall()])

@app.route('/api/statuses')
def get_statuses():
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM statuses ORDER BY name").fetchall()])

@app.route('/api/announcements')
def get_announcements():
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM announcements WHERE active=1 ORDER BY created_at DESC").fetchall()])

# ── Admin API — Categories ────────────────────────────────────────────────────

@app.route('/api/admin/categories', methods=['GET'])
@api_admin_required
def admin_get_categories():
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM categories ORDER BY name").fetchall()])

@app.route('/api/admin/categories', methods=['POST'])
@api_admin_required
def admin_create_category():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Name required'}), 400
    db = get_db()
    try:
        db.execute("INSERT INTO categories (name,color_bg,color_text) VALUES (?,?,?)",
                   [data['name'], data.get('color_bg','#E6F1FB'), data.get('color_text','#0C447C')])
        db.commit()
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    return jsonify({'success': True}), 201

@app.route('/api/admin/categories/<int:cid>', methods=['DELETE'])
@api_admin_required
def admin_delete_category(cid):
    db = get_db()
    db.execute("DELETE FROM categories WHERE id=?", [cid])
    db.commit()
    return jsonify({'success': True})

# ── Admin API — Tags ──────────────────────────────────────────────────────────

@app.route('/api/admin/tags', methods=['GET'])
@api_admin_required
def admin_get_tags():
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM tags ORDER BY name").fetchall()])

@app.route('/api/admin/tags', methods=['POST'])
@api_admin_required
def admin_create_tag():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Name required'}), 400
    db = get_db()
    try:
        db.execute("INSERT INTO tags (name) VALUES (?)", [data['name']])
        db.commit()
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    return jsonify({'success': True}), 201

@app.route('/api/admin/tags/<int:tid>', methods=['DELETE'])
@api_admin_required
def admin_delete_tag(tid):
    db = get_db()
    db.execute("DELETE FROM tags WHERE id=?", [tid])
    db.commit()
    return jsonify({'success': True})

# ── Admin API — Platforms ─────────────────────────────────────────────────────

@app.route('/api/admin/platforms', methods=['GET'])
@api_admin_required
def admin_get_platforms():
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM platforms ORDER BY name").fetchall()])

@app.route('/api/admin/platforms', methods=['POST'])
@api_admin_required
def admin_create_platform():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Name required'}), 400
    db = get_db()
    try:
        db.execute("INSERT INTO platforms (name) VALUES (?)", [data['name']])
        db.commit()
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    return jsonify({'success': True}), 201

@app.route('/api/admin/platforms/<int:pid>', methods=['DELETE'])
@api_admin_required
def admin_delete_platform(pid):
    db = get_db()
    db.execute("DELETE FROM platforms WHERE id=?", [pid])
    db.commit()
    return jsonify({'success': True})

# ── Admin API — Statuses ──────────────────────────────────────────────────────

@app.route('/api/admin/statuses', methods=['GET'])
@api_admin_required
def admin_get_statuses():
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM statuses ORDER BY name").fetchall()])

@app.route('/api/admin/statuses', methods=['POST'])
@api_admin_required
def admin_create_status():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Name required'}), 400
    db = get_db()
    try:
        db.execute("INSERT INTO statuses (name,color_bg,color_text) VALUES (?,?,?)",
                   [data['name'], data.get('color_bg','#E6F1FB'), data.get('color_text','#0C447C')])
        db.commit()
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    return jsonify({'success': True}), 201

@app.route('/api/admin/statuses/<int:sid>', methods=['DELETE'])
@api_admin_required
def admin_delete_status(sid):
    db = get_db()
    db.execute("DELETE FROM statuses WHERE id=?", [sid])
    db.commit()
    return jsonify({'success': True})

# ── Admin API — Announcements ─────────────────────────────────────────────────

@app.route('/api/admin/announcements', methods=['GET'])
@api_admin_required
def admin_get_announcements():
    db = get_db()
    return jsonify([dict(r) for r in db.execute("SELECT * FROM announcements ORDER BY created_at DESC").fetchall()])

@app.route('/api/admin/announcements', methods=['POST'])
@api_admin_required
def admin_create_announcement():
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'error': 'Title required'}), 400
    db = get_db()
    db.execute("INSERT INTO announcements (title,body,active) VALUES (?,?,?)",
               [data['title'], data.get('body',''), int(data.get('active', True))])
    db.commit()
    return jsonify({'success': True}), 201

@app.route('/api/admin/announcements/<int:aid>', methods=['PUT'])
@api_admin_required
def admin_update_announcement(aid):
    data = request.get_json()
    db = get_db()
    row = db.execute("SELECT * FROM announcements WHERE id=?", [aid]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    db.execute("UPDATE announcements SET title=?, body=?, active=? WHERE id=?",
               [data.get('title', row['title']), data.get('body', row['body']),
                int(data.get('active', row['active'])), aid])
    db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/announcements/<int:aid>', methods=['DELETE'])
@api_admin_required
def admin_delete_announcement(aid):
    db = get_db()
    db.execute("DELETE FROM announcements WHERE id=?", [aid])
    db.commit()
    return jsonify({'success': True})

# ── Admin API — Superusers ────────────────────────────────────────────────────

@app.route('/api/admin/superusers', methods=['GET'])
@api_admin_required
def admin_get_superusers():
    db = get_db()
    rows = db.execute("SELECT id, username, created_at FROM superusers").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/admin/superusers', methods=['POST'])
@api_admin_required
def admin_create_superuser():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    db = get_db()
    try:
        db.execute("INSERT INTO superusers (username, password_hash) VALUES (?,?)",
                   [data['username'], hash_password(data['password'])])
        db.commit()
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    return jsonify({'success': True}), 201

@app.route('/api/admin/superusers/<int:uid>', methods=['DELETE'])
@api_admin_required
def admin_delete_superuser(uid):
    db = get_db()
    # prevent deleting yourself
    me = db.execute("SELECT id FROM superusers WHERE username=?",
                    [session.get('admin_username')]).fetchone()
    if me and me['id'] == uid:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    db.execute("DELETE FROM superusers WHERE id=?", [uid])
    db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/me')
@api_admin_required
def admin_me():
    return jsonify({'username': session.get('admin_username')})


# ── Public API — Requests ─────────────────────────────────────────────────────

@app.route('/api/requests', methods=['POST'])
def create_request():
    data = request.get_json()
    if not data or not data.get('game_title'):
        return jsonify({'error': 'Game title is required'}), 400
    db = get_db()
    db.execute(
        "INSERT INTO requests (game_title, description, reason) VALUES (?,?,?)",
        [data['game_title'], data.get('description',''), data.get('reason','')]
    )
    db.commit()
    return jsonify({'success': True, 'message': 'Request submitted!'}), 201


@app.route('/api/requests/recent', methods=['GET'])
def get_recent_requests():
    db = get_db()
    rows = db.execute("SELECT * FROM requests ORDER BY created_at DESC LIMIT 20").fetchall()
    return jsonify([dict(r) for r in rows])

# ── Admin API — Requests ──────────────────────────────────────────────────────

@app.route('/api/admin/requests', methods=['GET'])
@api_admin_required
def admin_get_requests():
    db = get_db()
    status = request.args.get('status', '')
    query = "SELECT * FROM requests"
    params = []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC"
    return jsonify([dict(r) for r in db.execute(query, params).fetchall()])

@app.route('/api/admin/requests/<int:rid>', methods=['PUT'])
@api_admin_required
def admin_update_request(rid):
    data = request.get_json()
    db = get_db()
    row = db.execute("SELECT * FROM requests WHERE id=?", [rid]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    db.execute(
        "UPDATE requests SET status=?, admin_note=? WHERE id=?",
        [data.get('status', row['status']), data.get('admin_note', row['admin_note']), rid]
    )
    db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/requests/<int:rid>', methods=['DELETE'])
@api_admin_required
def admin_delete_request(rid):
    db = get_db()
    db.execute("DELETE FROM requests WHERE id=?", [rid])
    db.commit()
    return jsonify({'success': True})

# ── General image upload (for embedding in markdown descriptions) ────────────

@app.route('/api/upload-image', methods=['POST'])
def upload_general_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file'}), 400
    f = request.files['image']
    if not f.filename:
        return jsonify({'error': 'No file selected'}), 400
    ext = f.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        return jsonify({'error': 'Invalid image type'}), 400
    filename = f"images/{uuid.uuid4().hex}.{ext}"
    f.save(os.path.join(UPLOAD_FOLDER, filename))
    return jsonify({'url': f'/uploads/{filename}', 'name': f.filename, 'type': 'image'})


@app.route('/api/upload-file', methods=['POST'])
def upload_general_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'No file selected'}), 400
    ext = f.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_FILE_EXT:
        return jsonify({'error': 'File type not allowed'}), 400
    original_name = secure_filename(f.filename)
    is_image = ext in ALLOWED_IMAGE_EXT
    sub = 'images' if is_image else 'files'
    filename = f"{sub}/{uuid.uuid4().hex}.{ext}"
    f.save(os.path.join(UPLOAD_FOLDER, filename))
    return jsonify({'url': f'/uploads/{filename}', 'name': original_name, 'type': 'image' if is_image else 'file'})


# ── File Upload — Item Images ────────────────────────────────────────────────

@app.route('/api/items/<int:item_id>/image', methods=['POST'])
def upload_item_image(item_id):
    db = get_db()
    row = db.execute("SELECT * FROM items WHERE id=?", [item_id]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    if 'image' not in request.files:
        return jsonify({'error': 'No image file'}), 400
    f = request.files['image']
    if not f.filename:
        return jsonify({'error': 'No file selected'}), 400
    ext = f.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        return jsonify({'error': 'Invalid image type'}), 400
    filename = f"images/{uuid.uuid4().hex}.{ext}"
    f.save(os.path.join(UPLOAD_FOLDER, filename))
    # Remove old image
    old_url = row['image_url'] if 'image_url' in row.keys() else ''
    if old_url:
        old_path = os.path.join(UPLOAD_FOLDER, old_url)
        if os.path.exists(old_path):
            os.remove(old_path)
    db.execute("UPDATE items SET image_url=?, updated_at=date('now') WHERE id=?", [filename, item_id])
    db.commit()
    return jsonify({'image_url': filename})


@app.route('/api/items/<int:item_id>/image', methods=['DELETE'])
def delete_item_image(item_id):
    db = get_db()
    row = db.execute("SELECT * FROM items WHERE id=?", [item_id]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    old_url = row['image_url'] if 'image_url' in row.keys() else ''
    if old_url:
        old_path = os.path.join(UPLOAD_FOLDER, old_url)
        if os.path.exists(old_path):
            os.remove(old_path)
    db.execute("UPDATE items SET image_url='', updated_at=date('now') WHERE id=?", [item_id])
    db.commit()
    return jsonify({'success': True})


# ── File Upload — Item Attachments ───────────────────────────────────────────

@app.route('/api/items/<int:item_id>/files', methods=['GET'])
def get_item_files(item_id):
    db = get_db()
    rows = db.execute("SELECT * FROM item_files WHERE item_id=? ORDER BY created_at DESC", [item_id]).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route('/api/items/<int:item_id>/files', methods=['POST'])
def upload_item_file(item_id):
    db = get_db()
    row = db.execute("SELECT * FROM items WHERE id=?", [item_id]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'No file selected'}), 400
    ext = f.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_FILE_EXT:
        return jsonify({'error': 'File type not allowed'}), 400
    original_name = secure_filename(f.filename)
    filename = f"files/{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    f.save(filepath)
    file_size = os.path.getsize(filepath)
    file_type = 'image' if ext in ALLOWED_IMAGE_EXT else ext
    db.execute(
        "INSERT INTO item_files (item_id, filename, original_name, file_type, file_size) VALUES (?,?,?,?,?)",
        [item_id, filename, original_name, file_type, file_size]
    )
    db.commit()
    return jsonify({'success': True}), 201


@app.route('/api/items/<int:item_id>/files/<int:file_id>', methods=['DELETE'])
def delete_item_file(item_id, file_id):
    db = get_db()
    row = db.execute("SELECT * FROM item_files WHERE id=? AND item_id=?", [file_id, item_id]).fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    filepath = os.path.join(UPLOAD_FOLDER, row['filename'])
    if os.path.exists(filepath):
        os.remove(filepath)
    db.execute("DELETE FROM item_files WHERE id=?", [file_id])
    db.commit()
    return jsonify({'success': True})


# ── Stats endpoint ───────────────────────────────────────────────────────────

@app.route('/api/stats')
def get_stats():
    db = get_db()
    total = db.execute("SELECT COUNT(*) as c FROM items").fetchone()['c']
    favs = db.execute("SELECT COUNT(*) as c FROM items WHERE favorite=1").fetchone()['c']
    cats = db.execute("SELECT COUNT(DISTINCT category) as c FROM items").fetchone()['c']
    return jsonify({'total': total, 'favorites': favs, 'categories': cats})


# ── Serve uploaded files ─────────────────────────────────────────────────────

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# ── Serve React SPA (production) ─────────────────────────────────────────────

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    if path.startswith('api/') or path.startswith('admin/') or path.startswith('uploads/'):
        return jsonify({'error': 'Not found'}), 404
    filepath = os.path.join(FRONTEND_DIST, path)
    if path and os.path.exists(filepath):
        return send_from_directory(FRONTEND_DIST, path)
    index = os.path.join(FRONTEND_DIST, 'index.html')
    if os.path.exists(index):
        return send_from_directory(FRONTEND_DIST, 'index.html')
    return send_from_directory('static', 'index.html')


if __name__ == '__main__':
    app.run(debug=True)