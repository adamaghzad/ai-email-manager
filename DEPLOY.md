# 🚀 Deploy InboxAI to Vercel (step by step)

Your Neon database is already created and migrations applied. All you need to do is connect the GitHub repo to Vercel.

## 1. Push to GitHub

Create a new repo at https://github.com/new, then:
```bash
cd /home/user/ai-email-manager
git init
git add .
git commit -m "InboxAI — initial release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inboxai.git
git push -u origin main
```

## 2. Import in Vercel

1. Go to https://vercel.com/new
2. Pick the `inboxai` repo you just pushed
3. **Framework preset**: Next.js (auto-detected)
4. **Build command**: `prisma generate && next build`
5. **Install command**: `npm install`

## 3. Environment variables (required)

Add these in **Project → Settings → Environment Variables** (select Production, Preview, Development):

| Key | Value |
|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_wi9yp7GHJAZt@ep-autumn-tree-b5c6tqtt-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `DATABASE_DIRECT_URL` | `postgresql://neondb_owner:npg_wi9yp7GHJAZt@ep-autumn-tree-b5c6tqtt.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_SECRET` | `7A+uvs4pl/uu4qgZSiD9mP6nQe7yKfR3tX8wV2bC1aZ0uL5oG9kJpMhAwIrDtYvN` |
| `AUTH_TRUST_HOST` | `true` |

AI (required for smart classification & reply drafting):

| Key | Value |
|---|---|
| `OPENROUTER_API_KEY` | `sk-or-v1-…` (from https://openrouter.ai/keys — free tier works!) |
| `AI_MODEL` | `google/gemma-4-31b-it:free` (Gemma 4 31B free) |
| `AI_MODEL_FALLBACK` | `nvidia/nemotron-3.5-lightning:free,google/gemma-4-26b-a4b-it:free` (fallback when the primary is rate-limited) |

Optional:

| Key | Value |
|---|---|
| `OPENAI_API_KEY` | `sk-…` (if you want to use OpenAI instead of OpenRouter) |
| `RESEND_API_KEY` | `re_…` (from https://resend.com — easiest way to send email) |
| `EMAIL_FROM` | `InboxAI <you@yourdomain.com>` |

Or if you use Gmail / Outlook SMTP instead of Resend:

| Key | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` (or `smtp.office365.com`) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your email |
| `SMTP_PASS` | your Gmail App Password |

> **Important:** leave `NEXTAUTH_URL` **empty**. Vercel auto-sets `VERCEL_URL` and InboxAI auto-detects the host from the request so previews + production all work.

## 4. Deploy!

Hit **Deploy**. After the first deploy succeeds, run database migrations once (Neon is Postgres-compatible). You can do this from your local machine:

```bash
# From the project directory on your machine
DATABASE_URL="postgresql://neondb_owner:npg_wi9yp7GHJAZt@ep-autumn-tree-b5c6tqtt.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  npx prisma migrate deploy
```

Or from the Vercel dashboard → project → **Storage → Neon** → "Run Query" to create tables manually.

> Note: migrations were already applied against your Neon DB during setup here, so this step may not be necessary.

## 5. Open your site, configure in Settings

1. Click "Register" and create your account.
2. Go to **Settings** and:
   - (Optional) paste your OpenAI API key
   - Paste SMTP credentials or Resend key, click **Test connection** then **Send test email**
   - Upload your CV (PDF)
3. On the Dashboard, click **Load demo emails** to see AI triage.
4. Create a new job application under **Jobs** → AI will write a cover letter, and Send will attach your CV automatically.

## Troubleshooting

- **"Invalid SMTP"** — for Gmail you MUST use an **App Password** (not your regular password) → https://myaccount.google.com/apppasswords
- **"Cannot send" in demo mode** — if no SMTP/Resend is configured, emails are logged to the server console and the "sent" record is still created, so you can test the UX end-to-end.
- **Auth loop on preview** — clear cookies, or open the preview URL directly in a new tab (not inside an iframe).
