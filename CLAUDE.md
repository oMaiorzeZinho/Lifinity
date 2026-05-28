# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lifinity** is a full-stack personal productivity app with gamification, community, and daily inspiration. Platforms:

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MySQL
- **Mobile**: Native Android (Kotlin/Java) with Retrofit2 — same backend endpoints as web
- **Native Module**: C via N-API for gamification calculations

---

## Running & Building

### Backend

```bash
cd backend
npm install
npx node-gyp configure && npx node-gyp build  # compile C native module
npm run dev
```

Requires: Node.js, Python, Visual Studio Build Tools with C/C++ (for N-API). XAMPP must be running with MySQL.

**backend/.env**:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lifinity_db
JWT_SECRET=your_secret_key_here
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

**frontend/.env**:
```env
VITE_API_URL=http://localhost:3000/api
```

### Startup order

1. XAMPP → MySQL on
2. `cd backend && npm run dev`
3. `cd frontend && npm run dev`

---

## Architecture

### Backend

`backend/index.js` initialises Express and mounts all routes. Pattern: `routes/ → controllers/ → db.js pool → gamification C module → response`.

Key files:
- `src/config/db.js` — MySQL connection pool
- `src/middlewares/authMiddleware.js` — JWT verification (`verifyToken`)
- `src/native/gamification.c` — C module; compiled output loaded by `src/utils/gamification.js`
- `src/utils/achievements.js` — achievement unlock logic called after task completion

### Frontend

`src/App.jsx` sets up React Router with lazy-loaded pages. `Dashboard.jsx` is the authenticated layout wrapper (nav + outlet). All API calls go through Axios with the JWT in the `Authorization` header (token in localStorage).

### Database schema (key tables)

| Table | Purpose |
|---|---|
| USER | username, email, password_hash, xp, level, current_streak |
| TASK | title, description, status, priority, iduser, due_date, archived_at |
| XP_HISTORY | XP earned per task/user |
| GROUP_ENTITY | name, idowner, invite_code |
| GROUP_MEMBER | user↔group links |
| GROUP_TASK | tasks visible to a group |
| TASK_ASSIGNEE | tasks assigned to specific friends |
| TASK_USER_ARCHIVE | per-user archive/hide state |
| FRIENDSHIP | friend requests + accepted state |
| BIBLE_VERSE / FAVORITE_VERSE | inspiration feature |
| BADGE / USER_BADGE | achievement definitions + user progress |

Schema source: `docs/base_dados/estrutura_lifinity.sql`.

---

## Native C Module

`src/native/gamification.c` exposes two N-API functions:

- `CalcularRecompensa()` — XP reward based on priority, speed bonus, streak
- `GetLevelData()` — level derived from total XP

After editing the `.c` file, recompile:
```bash
npx node-gyp configure && npx node-gyp build
```

XP is awarded in `taskController.completeTask()` which calls the C wrapper in `src/utils/gamification.js`.

---

## Task Visibility Logic

Three task types coexist and are merged in `taskController.getTasks()` via subqueries:

- **Personal** — created by the user, no group/assignee
- **Group tasks** — visible to all members via `GROUP_TASK`
- **Assigned tasks** — targeted to a friend via `TASK_ASSIGNEE`

Task completion flow: status → `'concluida'`, `completed_at` set → C module computes XP → `XP_HISTORY` insert → `USER.xp/level` update → achievements checked.

---

## Styling

Tailwind CSS + custom CSS variables in `src/index.css`. Design system: "clayomorphism" — dark green/teal primary, translucent card surfaces. Light mode via `[data-theme="light"]`. Use `--lifinity-bg`, `--lifinity-primary`, etc. for consistency.

---

## Documentation

- `docs/OVERALL_LIFINITY.md` — full feature breakdown and project history
- `docs/SETUP_LIFINITY.md` — detailed machine setup
- `docs/base_dados/` — SQL schema files
