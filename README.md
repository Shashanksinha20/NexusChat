# NexusChat

A **real-time chat application** — think Discord or Slack, but built from scratch as a portfolio project. You can message friends one-on-one, create group chats, react to messages with emojis, and see who's online right now.

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO_v4-010101?style=flat-square&logo=socket.io)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma)
![NextAuth](https://img.shields.io/badge/NextAuth.js-black?style=flat-square&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework — pages, API routes, and server components |
| **Language** | TypeScript | Type-safe code across the entire project |
| **Authentication** | NextAuth.js (Credentials) | Self-hosted sign up / sign in with bcrypt-hashed passwords — no external service |
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

> **No external auth service needed.** Authentication is fully self-hosted using NextAuth.js with email + password. No Clerk, no OAuth keys required.

> **Redis is optional for local development.** You only need it if you want to run multiple server instances. Skip it to get started quickly.

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

> If you get a permissions error on Windows, try deleting the `node_modules` folder and running `pnpm install` again.

---

### Step 3 — Create your environment file

Create a `.env` file in the root with the following:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000

# NextAuth — authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any-random-string-you-make-up

# Database — replace with your PostgreSQL connection string
# Neon example:  postgresql://user:pass@host.neon.tech/dbname?sslmode=require
# Local example: postgresql://postgres:password@localhost:5432/nexuschat
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexuschat

# Redis (optional — only needed for multi-instance scaling)
# REDIS_URL=redis://localhost:6379
```

> `NEXTAUTH_SECRET` can be any random string locally. For production, generate one with `openssl rand -base64 32`.

---

### Step 4 — Set up the database

```bash
# Creates all the tables in your database
pnpm db:push

# Generate the Prisma client (TypeScript types for your DB)
pnpm db:generate
```

---

### Step 5 — Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — hit **Sign up**, create an account, and start chatting!

---

## Database Commands

```bash
pnpm db:push        # Apply schema changes to your database (no migration files)
pnpm db:migrate     # Apply schema changes and create migration history
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
│   │   ├── (auth)/             # Sign-in / sign-up pages (custom forms)
│   │   ├── (main)/             # App pages (conversations, groups, friends)
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth route + register endpoint
│   │   │   ├── conversations/  # Direct message API
│   │   │   ├── groups/         # Group API + role management
│   │   │   ├── friends/        # Friend request API
│   │   │   ├── invites/        # Invite link API
│   │   │   ├── messages/       # Message edit/delete API
│   │   │   └── users/          # User search API
│   │   └── invite/             # Public invite landing page
│   ├── components/
│   │   ├── chat/               # Message list, input box, message item
│   │   ├── layout/             # Sidebar, mobile nav, unread mark-read
│   │   ├── providers/          # Socket.IO, theme, session, and modal providers
│   │   └── ui/                 # Reusable UI components (Button, Dialog, etc.)
│   ├── store/
│   │   ├── modal-store.ts      # Which modal dialog is open
│   │   └── unread-store.ts     # Unread message counts per conversation/group
│   ├── lib/
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── db.ts               # Database connection
│   │   └── utils.ts            # Shared helper functions
│   ├── middleware.ts            # Protects routes — redirects unauthenticated users
│   └── types/
│       ├── index.ts            # TypeScript types for the whole app
│       └── next-auth.d.ts      # Session type extensions for NextAuth
└── .env                        # Your local environment variables (not committed)
```

---

## Deploying to Production (Render)

This app uses a custom Node.js server with Socket.IO, so it needs a platform that supports persistent processes — **not** Vercel. [Render](https://render.com) free tier works.

### Step 1 — Push your code to GitHub

Make sure your latest changes are pushed.

### Step 2 — Create a PostgreSQL database on Render

1. Go to [render.com](https://render.com) → **New** → **PostgreSQL**
2. Give it a name, pick the free tier, create it
3. Copy the **Internal Database URL** — you'll need it in Step 4

### Step 3 — Create a Web Service on Render

1. **New** → **Web Service** → connect your GitHub repo
2. Set the following:
   - **Build command:** `pnpm install && pnpm build && pnpm db:push`
   - **Start command:** `pnpm start`
   - **Environment:** Node

### Step 4 — Add environment variables on Render

In your Web Service → **Environment**, add:

| Variable | Value |
|---|---|
| `NEXTAUTH_URL` | `https://your-app-name.onrender.com` |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` and paste the result |
| `DATABASE_URL` | The Internal Database URL from Step 2 |
| `NEXT_PUBLIC_APP_URL` | `https://your-app-name.onrender.com` |
| `PORT` | `10000` |

> Redis is optional. Add `REDIS_URL` only if you set up a Redis instance.

### Step 5 — Deploy

Click **Deploy**. Render will build the app, push the database schema, and start the server. Once it's live, go to your Render URL and sign up for a new account.

> **Note:** Render free tier spins down after 15 minutes of inactivity. The first request after idle takes ~30 seconds to wake up.

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

Built with Next.js, Socket.IO, NextAuth.js, PostgreSQL, and shadcn/ui.
