# NexusChat

A **real-time chat application** — think Discord or Slack, but built from scratch as a portfolio project. You can message friends one-on-one, create group chats, react to messages with emojis, and see who's online right now.

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO_v4-010101?style=flat-square&logo=socket.io)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework — pages, API routes, and server components |
| **Language** | TypeScript | Type-safe code across the entire project |
| **Authentication** | Clerk | Sign up, sign in, user profiles — fully managed |
| **Real-time** | Socket.IO v4 | Instant message delivery, typing indicators, presence |
| **Scaling** | Redis *(optional)* | Pub/sub adapter for running multiple server instances |
| **Database** | PostgreSQL | Persistent storage for messages, users, groups, friends |
| **ORM** | Prisma | Type-safe database queries and schema management |
| **UI Components** | shadcn/ui + Radix UI | Accessible, unstyled components styled with Tailwind |
| **Styling** | Tailwind CSS | Utility-first CSS, dark/light theme support |
| **State Management** | Zustand | Lightweight client-side state (modals, unread counts) |
| **Form Handling** | React Hook Form + Zod | Form validation with TypeScript-safe schemas |
| **Icons** | Lucide React | Consistent icon set |
| **Package Manager** | pnpm | Fast, disk-efficient package management |

---

## What can you do with NexusChat?

### Chat with friends
- **Direct Messages** — have a private conversation with any friend
- **Group Chats** — create a group, invite people, and chat together
- Messages appear instantly for everyone in the chat — no refresh needed
- See animated dots when someone is typing a reply

### Stay in the loop
- **Unread badges** — red notification circles (like WhatsApp) appear on conversations and groups when new messages arrive while you're away
- The badge shows the exact count and disappears when you open the chat
- Counts are preserved across logout — if you had 3 unread messages and logged out, you'll still see 3 when you log back in

### React and express yourself
- **Emoji reactions** — hover a message and pick an emoji to react (like Slack/Discord)
- **Edit messages** — made a typo? Edit it inline
- **Delete messages** — remove your own messages; admins can remove anyone's

### Manage your groups
- **Invite links** — generate a shareable link to let anyone join your group (expires after 7 days)
- **Roles** — every group has an Owner, Admins, Moderators, and regular Members
- Each role has different permissions (see the table below)

### Know who's online
- Green dot = online right now, grey dot = offline
- Updates live as people connect and disconnect

### Comfort features
- **Dark mode / Light mode** — toggle anytime, remembers your preference
- Works on mobile, tablet, and desktop

---

## Role Permissions (Groups)

| What you can do | Owner | Admin | Moderator | Member |
|---|:-:|:-:|:-:|:-:|
| Delete any message | ✅ | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | Members only | ❌ |
| Promote/demote Moderators | ✅ | ✅ | ❌ | ❌ |
| Promote to Admin | ✅ | ❌ | ❌ | ❌ |
| Delete the group | ✅ | ❌ | ❌ | ❌ |
| Edit & delete own messages | ✅ | ✅ | ✅ | ✅ |

---

## Setting Up Locally (for developers)

### What you need before starting

- **Node.js 18 or higher** — [download here](https://nodejs.org)
- **pnpm** — the package manager this project uses (`npm install -g pnpm`)
- **PostgreSQL database** — either local or a free cloud one:
  - [Neon](https://neon.tech) — free PostgreSQL in the cloud, no local install needed
  - [Supabase](https://supabase.com) — another free option
- **A Clerk account** — free at [clerk.com](https://clerk.com) — handles all login/signup

> **Redis is optional for local development.** You only need it if you want to run multiple server instances (production scaling). Skip it to get started quickly.

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/your-username/nexus-chat.git
cd nexus-chat
```

---

### Step 2 — Install dependencies

```bash
pnpm install
```

> If you get a permissions error on Windows, try deleting the `node_modules` folder and running `pnpm install` again. Adding `node_modules` to your antivirus exclusions also helps.

---

### Step 3 — Create your environment file

```bash
cp .env.example .env
```

Open `.env` and fill in each value:

```env
# The URL your app runs at locally
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000

# ── Clerk (Authentication) ─────────────────────────────────────────
# Get these from https://dashboard.clerk.com → your app → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Leave these exactly as shown — they tell Clerk where to redirect after login
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/conversations
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/conversations

# ── Database ───────────────────────────────────────────────────────
# Replace with your PostgreSQL connection string
# Neon example:  postgresql://user:pass@host.neon.tech/dbname?sslmode=require
# Local example: postgresql://postgres:password@localhost:5432/nexuschat
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexuschat

# ── Redis (optional) ───────────────────────────────────────────────
# Comment out or leave blank if you don't have Redis running locally
# REDIS_URL=redis://localhost:6379
```

---

### Step 4 — Clerk dashboard settings (important for localhost)

In your [Clerk Dashboard](https://dashboard.clerk.com):

1. Go to your application → **Configure** → **Attack Protection**
2. Turn **off** bot protection (it blocks local development)

> This step is only needed for localhost. You can re-enable it in production.

---

### Step 5 — Set up the database

```bash
# Creates all the tables in your database
pnpm db:push

# Generate the Prisma client (TypeScript types for your DB)
pnpm db:generate
```

> Run `pnpm db:generate` any time you change `prisma/schema.prisma`.

---

### Step 6 — Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up and start chatting!

> **Note:** The app auto-creates your database profile when you first log in, so you don't need to set up Clerk webhooks just to run it locally. Webhooks are only required for production deployments.

---

## Database Commands

```bash
pnpm db:push        # Apply schema changes to your database (no migration files)
pnpm db:migrate     # Apply schema changes and create migration history (for production)
pnpm db:generate    # Regenerate the Prisma client after schema changes
pnpm db:studio      # Open a GUI to browse your database at http://localhost:5555
```

---

## Project Structure

```
nexus-chat/
├── prisma/
│   └── schema.prisma           # Database table definitions
├── server.ts                   # Custom server: Next.js + Socket.IO on one port
├── src/
│   ├── app/
│   │   ├── (auth)/             # Sign-in / sign-up pages
│   │   ├── (main)/             # App pages (conversations, groups, friends)
│   │   ├── api/                # Backend API routes
│   │   │   ├── webhooks/clerk  # Syncs Clerk users to the database (production)
│   │   │   ├── conversations/  # Direct message API
│   │   │   ├── groups/         # Group API + role management
│   │   │   ├── friends/        # Friend request API
│   │   │   ├── invites/        # Invite link API
│   │   │   └── messages/       # Message edit/delete API
│   │   └── invite/             # Public invite landing page
│   ├── components/
│   │   ├── chat/               # Message list, input box, message item
│   │   ├── layout/             # Sidebar, mobile nav, unread mark-read
│   │   ├── providers/          # Socket.IO, theme, and modal providers
│   │   └── ui/                 # Reusable UI components (Button, Dialog, etc.)
│   ├── store/
│   │   ├── modal-store.ts      # Which modal dialog is open
│   │   └── unread-store.ts     # Unread message counts per conversation/group
│   ├── lib/
│   │   ├── db.ts               # Database connection
│   │   └── utils.ts            # Shared helper functions
│   ├── middleware.ts            # Clerk auth — protects all routes except sign-in/up
│   └── types/
│       └── index.ts            # TypeScript types for the whole app
└── .env.example                # Template for environment variables
```

---

## Deploying to Production

### Railway (Recommended)

Railway handles persistent server processes, which is what Socket.IO needs.

1. Push your code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add a **PostgreSQL** plugin and a **Redis** plugin inside Railway
4. Click **Deploy from GitHub** → select this repo
5. Add all your environment variables in Railway's dashboard (same as `.env`, but with production values)
6. Set `NEXT_PUBLIC_APP_URL` to your Railway domain (e.g. `https://nexus-chat.up.railway.app`)

Railway auto-detects the start command from `package.json`.

### Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Build command: `pnpm install && pnpm build && pnpm db:push`
3. Start command: `pnpm start`
4. Add a PostgreSQL and Redis database from Render's dashboard
5. Set environment variables in Render's environment settings

### Clerk Webhook (required for production)

When deployed, you need Clerk to sync new users to your database automatically:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Webhooks** → **Add Endpoint**
2. URL: `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
4. Copy the **Signing Secret** → add it as `CLERK_WEBHOOK_SECRET` in your environment variables

### Vercel (limited support)

Vercel's serverless architecture does **not** support persistent WebSocket connections. If you deploy to Vercel:
- Deploy the Next.js app to Vercel
- Deploy Socket.IO separately on Railway or Render
- Point `NEXT_PUBLIC_APP_URL` on Vercel to your Socket.IO server URL

---

## Socket.IO Events Reference

### Client → Server

| Event | Description |
|---|---|
| `join-conversation` | Subscribe to a direct message room |
| `join-group` | Subscribe to a group room |
| `send-dm-message` | Send a direct message |
| `send-group-message` | Send a group message |
| `edit-message` | Edit your own message |
| `delete-message` | Delete a message (subject to role permissions) |
| `add-reaction` | React to a message with an emoji |
| `remove-reaction` | Remove your emoji reaction |
| `typing-start` | Tell others you're composing a message |
| `typing-stop` | Tell others you stopped typing |
| `remove-member` | Kick a member from a group (Moderator+) |
| `update-member-role` | Change a member's role (Admin+) |

### Server → Client

| Event | Description |
|---|---|
| `new-message` | A new message was sent |
| `message-updated` | A message was edited |
| `message-deleted` | A message was deleted |
| `reaction-added` | Someone reacted to a message |
| `reaction-removed` | Someone removed their reaction |
| `user-typing` | Someone started typing |
| `user-stop-typing` | Someone stopped typing |
| `user-online` | A user came online |
| `user-offline` | A user went offline |
| `member-removed` | A member was kicked from a group |
| `removed-from-group` | You were removed from a group |
| `member-role-updated` | A member's role was changed |

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## License

MIT — free to use in your own projects or portfolio.

---

Built with Next.js, Socket.IO, Clerk, PostgreSQL, and shadcn/ui.
