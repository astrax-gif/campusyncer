# UE Dubai — Room Portal

Real-time room availability and scheduling portal for the University of Europe for Applied Sciences, Dubai Campus.

## Features

**Public portal (`index.html`)**
- **Dashboard** — live room stats, "happening now", "coming up next", and a free-room finder
- **Floor Plan** — interactive SVG map across 3 floors with live colour-coded status (free / in session / starting soon / maintenance)
- **Find a Course** — search by course name, code, or professor; see which room your class is in
- **Schedule** — full weekly timetable with day tabs and live "in session" highlighting

**Admin panel (`admin.html`)**  password: `admin2026`
- Manage the **schedule** (add, edit, delete classes; conflict detection; CSV export)
- Manage **rooms** (add rooms, toggle maintenance mode)
- Manage **professors** (add, remove; workload view)
- Post and expire **announcements** (info / warning / urgent banners)
- **Reports** — busiest rooms, classes per day, peak time slots, professor hours
- **Settings** — semester dates, campus info, password change

**REST API (Vercel serverless / local dev server)**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/rooms` | — | All rooms with live status |
| GET | `/api/schedule?day=1-5` | — | Schedule (optionally by day) |
| GET | `/api/announcements?active=1` | — | Announcements |
| POST | `/api/admin/login` | — | Obtain session token |
| GET/POST/PUT/DELETE | `/api/admin/schedule` | ✓ | Manage schedule |
| GET/POST/PUT/DELETE | `/api/admin/rooms` | ✓ | Manage rooms |
| GET/POST/PUT/DELETE | `/api/admin/professors` | ✓ | Manage professors |
| GET/POST/DELETE | `/api/admin/announcements` | ✓ | Manage announcements |

Admin endpoints require an `x-admin-token` header or `adminToken` cookie obtained from `/api/admin/login`.

## Quick start

```bash
git clone https://github.com/astrax-gif/Ue-portal.git
cd Ue-portal
cp _.env.example .env          # edit ADMIN_PASSWORD and ADMIN_SECRET
node scripts/dev-server.js     # or: npm run dev
```

Open **http://localhost:3000** (portal) and **http://localhost:3000/admin.html** (admin).

## Project structure

```
Ue-portal/
├── index.html          # Public portal (single-page, no build step)
├── admin.html          # Admin panel
├── styles.css          # Shared stylesheet
├── data.js             # Client-side data layer (browser)
├── data-server.js      # Server-side data module (Node.js / API layer)
├── api/
│   ├── rooms.js                # GET /api/rooms
│   ├── schedule.js             # GET /api/schedule
│   ├── announcements.js        # GET /api/announcements
│   └── admin/
│       ├── login.js            # POST /api/admin/login
│       ├── schedule.js         # CRUD /api/admin/schedule
│       ├── rooms.js            # CRUD /api/admin/rooms
│       ├── professors.js       # CRUD /api/admin/professors
│       └── announcements.js    # CRUD /api/admin/announcements
├── lib/
│   ├── auth.js         # HMAC-signed session tokens (no JWT dependency)
│   ├── http.js         # Serverless handler wrapper + field validation
│   └── store.js        # In-memory store (swap for DB adapter in prod)
├── db/
│   └── schema.sql      # PostgreSQL schema (Supabase / Neon / Railway)
├── scripts/
│   └── dev-server.js   # Local dev server (Node.js built-ins only)
├── vercel.json         # Vercel deployment config & API rewrites
└── _.env.example       # Environment variable template
```

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel --prod
```

Set environment variables in the Vercel dashboard:  
`ADMIN_PASSWORD`, `ADMIN_SECRET`

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_PASSWORD` | `admin2026` | Admin panel password |
| `ADMIN_SECRET` | `dev-secret-…` | HMAC signing secret for session tokens |
| `DATABASE_URL` | — | Postgres connection string (optional) |
| `PORT` | `3000` | Dev server port |

## Production database

The store in `lib/store.js` is intentionally in-memory for the demo.  
To persist data, replace it with a Supabase or Neon adapter using the schema in `db/schema.sql`.

## License

MIT
