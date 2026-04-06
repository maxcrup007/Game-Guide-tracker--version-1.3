# 🎮 My Games & Hobbies Tracker

A full-stack web app to track your favorite games, hobbies, sports, and more.
Built with **Python + Flask + SQLite + REST API**.

---

## Project Structure

```
game_hobby_tracker/
├── app.py            ← Flask app + REST API routes
├── database.py       ← SQLite init & connection helper
├── requirements.txt  ← Python dependencies
├── tracker.db        ← SQLite database (auto-created on first run)
└── static/
    └── index.html    ← Full frontend (HTML + CSS + JS)
```

---

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the app

```bash
python app.py
```

### 3. Open in browser

```
http://localhost:5000
```

---

## REST API Reference

Base URL: `http://localhost:5000/api`

### GET /api/items — List all items

Returns all items. Supports query parameters for filtering.

**Query parameters:**

| Parameter  | Type   | Description                              |
|------------|--------|------------------------------------------|
| `search`   | string | Filter by title or notes (partial match) |
| `category` | string | Filter by category: Game, Hobby, Sport, Music |
| `favorite` | bool   | `true` to show favorites only            |
| `sort`     | string | `new` (default), `old`, `az`             |

**Example:**
```
GET /api/items?category=Game&sort=az
GET /api/items?search=chess&favorite=true
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Chess",
    "category": "Game",
    "notes": "Trying to reach 1500 Elo.",
    "favorite": 1,
    "created_at": "2025-03-10"
  }
]
```

---

### POST /api/items — Create a new item

**Request body (JSON):**
```json
{
  "title": "Guitar",
  "category": "Music",
  "notes": "Learning fingerpicking",
  "favorite": false
}
```

**Response:** `201 Created` with the new item object.

---

### GET /api/items/:id — Get a single item

```
GET /api/items/1
```

**Response:** Single item object or `404` if not found.

---

### PUT /api/items/:id — Update an item

**Request body (JSON) — send only fields to update:**
```json
{
  "title": "Chess",
  "notes": "Updated notes here",
  "favorite": true
}
```

**Response:** Updated item object.

---

### DELETE /api/items/:id — Delete an item

```
DELETE /api/items/1
```

**Response:**
```json
{ "message": "Deleted successfully" }
```

---

## Database Schema

Table: `items`

| Column       | Type    | Description                        |
|--------------|---------|------------------------------------|
| `id`         | INTEGER | Primary key, auto-increment        |
| `title`      | TEXT    | Name of the game/hobby (required)  |
| `category`   | TEXT    | Game, Hobby, Sport, or Music       |
| `notes`      | TEXT    | Free-text notes                    |
| `favorite`   | INTEGER | 0 = no, 1 = yes (favorite)         |
| `created_at` | TEXT    | Date added (ISO format YYYY-MM-DD) |

---

## Features

- **Create** — Add a new item with title, category, and notes
- **Read** — Browse all items in a card grid view
- **Update** — Edit any item or toggle its favorite status
- **Delete** — Remove items with a confirmation prompt
- **Filter** — Search by keyword, filter by category, favorites, and sort order
- **Stats** — Live count of total items, categories, and favorites
- **Toast notifications** — Instant feedback on every action

---

## Categories

| Category | Color |
|----------|-------|
| Game     | Blue  |
| Hobby    | Green |
| Sport    | Amber |
| Music    | Purple|

---

## Adding New Categories

To add new categories, update these two places:

1. **`static/index.html`** — add `<option>` to the `<select>` elements for `fcat` and `f-cat`
2. **`static/index.html`** — add a CSS class `.badge-YourCategory` with your chosen colors

---

## Tech Stack

| Layer     | Technology  |
|-----------|-------------|
| Backend   | Python 3 + Flask |
| Database  | SQLite (via Python `sqlite3`) |
| API style | REST (JSON) |
| Frontend  | HTML5 + CSS3 + Vanilla JS |
| Hosting   | Local / any Python host |

---

## Deployment Tips

To run in production (e.g. on a server), replace:

```bash
python app.py
```

with:

```bash
pip install gunicorn
gunicorn app:app
```

Or deploy to **Railway**, **Render**, or **PythonAnywhere** by uploading the project folder.

---

*Generated with Claude — paste this document into [StackEdit](https://stackedit.io/) to view it rendered.*
