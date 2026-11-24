# PageCast

Real-time digital signage and advertainment system built **100% with Next.js (App Router)**. Control multiple displays individually or in broadcast mode using native Server-Sent Events (SSE) and automatic filesystem-based page discovery—with zero external backend or database required.

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-Styling-06B6D4?style=flat&logo=tailwindcss)

---

## Features

- **Per-Screen & Broadcast Control**: Switch pages on a single display (e.g., `Lobby TV`) or push updates to every connected screen simultaneously using **All Displays** mode.
- **Zero-Config Page Discovery**: Drop any new Next.js page into `app/screen/<slug>/page.tsx` and it automatically appears in the Controller dashboard, API validation, and auto-rotate playlists.
- **Real-Time Sync via SSE**: Instant route switching without page reloads. Screens keep a single persistent `EventSource` connection inside `app/screen/layout.tsx` and navigate smoothly with `router.push()`.
- **Per-Screen Auto-Rotate**: Independently cycle through discovered pages on any screen (`10s`, `15s`, `20s`, `30s`, `60s` intervals).
- **Live Announcement Banners**: Push or clear real-time bottom-bar ticker messages to individual screens or all displays without changing the active page.
- **Persistent Screen Identity**: Screens retain their unique ID and assigned page across browser refreshes and brief network drops.
- **Role-Based Access**: Lightweight HMAC-SHA256 signed HTTP-only cookie authentication separating **Controller** and **Screen** sessions via `middleware.ts`.
- **Clean Light-Mode Dashboard**: Minimal 2-column control interface with a live `16:9` preview `<iframe>`.

---

## How It Works

1. **Login (`/login`)**: Devices authenticate as either a **Screen** (with a custom display name) or a **Controller**.
2. **Persistent Connection (`/api/stream`)**:
   - Screens open an SSE connection with their `screenId` and `name`, registering themselves in the in-memory store (`lib/screenStore.ts`).
   - Controllers open an SSE connection to receive live roster updates (online/offline status and active routes).
3. **Instant Switching (`/api/control`)**: When a controller selects a page, toggles auto-rotate, or publishes a banner, the server updates `screenStore` and emits a targeted event to the matching screen(s).
4. **Seamless Navigation (`app/screen/layout.tsx`)**: Because Next.js preserves the parent layout across child route transitions, screens stay connected while navigating between `/screen/*` pages.

---

## Project Structure

```text
├── .env.example
├── middleware.ts                     # Role-based route & API protection
├── lib/
│   ├── auth.ts                       # HMAC-SHA256 cookie signing & verification
│   ├── pageDiscovery.ts              # Filesystem scanner for app/screen/*/page.tsx
│   └── screenStore.ts                # globalThis EventEmitter, per-screen state & timers
└── app/
    ├── login/page.tsx                # Dual-mode login (Screen / Controller)
    ├── controller/page.tsx           # Light-mode multi-screen controller dashboard
    ├── api/
    │   ├── auth/
    │   │   ├── login/route.ts
    │   │   └── logout/route.ts
    │   ├── pages/route.ts            # Returns auto-discovered screen pages
    │   ├── stream/route.ts           # SSE endpoint for screens & controllers
    │   └── control/route.ts          # Targeted control actions (route, rotate, ticker)
    └── screen/
        ├── layout.tsx                # Persistent SSE listener + ticker overlay
        ├── page.tsx                  # Redirects to assigned active route
        ├── welcome/page.tsx          # Default welcome display
        ├── promo/page.tsx            # Featured product / offer showcase
        ├── schedule/page.tsx         # Live agenda & timetable
        ├── sponsors/page.tsx         # Partner & sponsor spotlight
        └── standby/page.tsx          # Ambient clock & standby screen

```

---

## Getting Started

### 1. Clone & Install

```bash
git clone [https://github.com/](https://github.com/)<your-username>/pagecast.git
cd pagecast
npm install

```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and set your passcodes and secret:

```bash
cp .env.example .env.local

```

```env
AUTH_SECRET=replace-with-a-long-random-secret
CONTROLLER_PASSCODE=admin123
SCREEN_PASSCODE=screen123

```

### 3. Run Locally

```bash
npm run dev

```

1. Open `http://localhost:3000/login` in a normal browser window and sign in as **Controller**.
2. Open `http://localhost:3000/login` in an incognito window (or another device), sign in as **Screen**, and give it a name (e.g., `Lobby TV`).
3. Switch pages, toggle auto-rotate, or publish a banner from `/controller` and watch the screen update immediately.

---

## Adding New Display Pages

No manual registration is required. Create a new folder under `app/screen/` with a `page.tsx` file:

```text
app/screen/flash-sale/
├── page.tsx        # Your 16:9 React/Next.js display component
└── meta.json       # Optional custom title & sort order

```

**Optional `meta.json`:**

```json
{
  "title": "Flash Sale Promo",
  "order": 2
}

```

If `meta.json` is omitted, the folder name is automatically converted to Title Case (e.g., `flash-sale` → **Flash Sale**). Click the **Refresh** button in the Controller dashboard to load newly added pages immediately.

---

## Deployment Notes

* **Self-Hosted (Recommended — VPS, EC2, Docker, Railway, Render)**: Works out of the box with `npm run build && npm start` since a single Node.js process maintains the in-memory `EventEmitter` and SSE connections.
* **Serverless (Vercel)**: Serverless functions do not share memory across instances. To deploy on Vercel, replace the in-memory `EventEmitter` in `lib/screenStore.ts` with a pub/sub or state layer such as **Upstash Redis**, **Supabase Realtime**, or **Pusher**.

---

## License

MIT

```

```
