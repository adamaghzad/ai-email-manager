# InboxAI — AI-Powered Email Manager

A complete, production-ready Next.js app that connects to your email, triages your inbox with AI, drafts replies, automates job applications with CV attachment, and sends only after you approve.

![Screenshot](./screenshot.png)

## ✨ Features

- 🤖 **AI email classification** — automatically tags emails as Job recruitment, Interview request, Offer, Rejection, Follow-up, Newsletter, Spam, etc.
- ✍️ **Smart reply drafts** — AI writes contextual replies in the right tone; you approve, edit, or regenerate before sending
- ✅ **Approval workflow** — dedicated queue for messages waiting on you; nothing goes out without your OK (toggleable auto-send)
- 💼 **Job application autopilot** — generate tailored cover letters, attach your CV PDF, send to recruiters in one click, track statuses
- 📎 **CV management** — upload once, auto-attached to every application
- 📬 **Works with any email** — connect via SMTP/IMAP (Gmail app passwords, Outlook, custom). For sending you can also use **Resend**
- 🔐 **Auth included** — email/password auth with NextAuth
- 💾 **Postgres on Neon** — Prisma ORM, ready to connect to a free Neon DB
- ▲ **Deploy to Vercel** in minutes
- 🎨 **Beautiful gradient UI** with Tailwind, Sonner toasts, Framer Motion ready, full dark-mode foundation

## 🚀 Quick start (local)

```bash
cd ai-email-manager
npm install

# 1. Create a free Postgres DB at https://neon.tech and paste the URL in .env
#    (or use a local postgres)
cp .env.example .env
# then edit DATABASE_URL and DATABASE_DIRECT_URL

# 2. Run migrations
npx prisma migrate dev --name init

# 3. Generate Prisma client
npx prisma generate

# 4. Run
npm run dev
```

Visit http://localhost:3000 → create an account → go to **Settings** to:
- Paste your OpenAI API key (if you want full AI; otherwise heuristic mode works)
- Configure SMTP (for Gmail: host `smtp.gmail.com`, port `587`, user = your email, pass = **App Password**)
- Upload your CV as PDF

Then click **Load demo emails** on the dashboard to see AI triage in action.

## ▲ Deploy to Vercel

1. Push this repo to GitHub
2. Go to https://vercel.com/new and import the project
3. Add a **Neon Postgres** storage integration (Vercel Marketplace → Neon → Add) — Vercel will auto-populate `DATABASE_URL`
4. In **Project → Environment Variables** add:
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Vercel preview/production URL (e.g. `https://inboxai.vercel.app`)
   - `OPENAI_API_KEY` — your OpenAI key (optional but strongly recommended)
   - `RESEND_API_KEY` + `EMAIL_FROM` — easiest way to send from Vercel (create free account at https://resend.com)
     - OR use `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` for Gmail/Outlook
5. **Deploy!** After deploy run the Prisma migrations once. You can do this from the Vercel console with the CLI:
   ```bash
   npx vercel env pull .env.production
   DATABASE_URL="your-neon-connection-string" npx prisma migrate deploy
   ```
6. Open your app, register, configure SMTP in Settings, upload your CV, and you're done.

## 📁 Project structure

```
src/
├── app/
│   ├── (auth)/login, register     Public auth pages
│   ├── (app)/                     Authenticated app shell
│   │   ├── dashboard/             Stats + overview
│   │   ├── emails/                Inbox / email list
│   │   ├── emails/[id]/           Email detail + reply composer
│   │   ├── approvals/             Approval queue (bulk review)
│   │   ├── compose/               Compose new email (with AI polish)
│   │   ├── jobs/                  Job applications list
│   │   ├── jobs/new               New application form
│   │   ├── jobs/[id]/             Cover letter editor + send
│   │   └── settings/              SMTP, CV, OpenAI key, sender profile
│   └── api/
│       ├── auth/[...nextauth]     NextAuth credentials provider
│       ├── register               Sign-up
│       ├── emails                 Inbox API (list/get/send/analyze)
│       ├── jobs                   Job-application CRUD + send
│       ├── ai/rewrite             Polish/shorten/rewrite text
│       ├── seed                   Load demo emails
│       ├── uploads                CV / attachment upload
│       └── settings               SMTP + AI preferences
├── components/                    UI primitives + Sidebar
└── lib/                           prisma, auth, ai (OpenAI), email (nodemailer), utils
prisma/schema.prisma               Full data model (User, Email, JobApplication, CV, Attachments…)
```

## 🧠 How the AI works

The `src/lib/ai.ts` module wraps OpenAI with a **graceful fallback**: if no `OPENAI_API_KEY` is set it runs a rule-based heuristic classifier so the app still works out of the box. With a key, you get:

- **Email triage** — category, priority, 1-sentence summary, suggested reply, tone, key points
- **Cover letter generation** — uses company + position + recruiter name + CV text + job description
- **Reply generation / regeneration** — per-email "rewrite my reply"
- **Polish** in the compose screen (polish / shorten / formal / friendly)

## 🔒 Security notes

- Passwords hashed with bcrypt
- Session stored in JWT (HttpOnly cookie via NextAuth)
- SMTP/OpenAI passwords are masked when read back via API
- All app routes protected by middleware; API routes verify session server-side

## 📬 Email notes

- **Sending** works with any SMTP server or with Resend (recommended on Vercel)
- **Receiving**: for a full production two-way sync, connect IMAP in Settings (polling/webhook logic can be added in `lib/email.ts`). For now you can seed demo emails or forward emails via any forwarding-to-webhook service
- Attachments and CVs are stored in `public/uploads` in dev; for production swap to Vercel Blob / S3 (drop-in: replace `fs.writeFile` in `/api/uploads/route.ts`)

## 🛠 Tech stack

- Next.js 15 (App Router, Server Components, Turbopack-ready)
- React 19 + TypeScript
- Tailwind CSS v4
- Prisma 5 + PostgreSQL (Neon)
- NextAuth (Credentials)
- Nodemailer (SMTP/Resend)
- OpenAI gpt-4o-mini
- Sonner, Lucide, Framer Motion (opt-in), Radix primitives

## 📝 License

MIT — feel free to use for yourself or ship it.
