import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Mail, Briefcase, CheckCircle2, Zap, Shield, ArrowRight, Inbox, Send, FileText, BrainCircuit } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 -left-24 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />
      </div>

      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-pink-600 text-white shadow-lg">
            <Sparkles size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight">Inbox<span className="gradient-text">AI</span></span>
        </div>
        <nav className="hidden gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300 md:flex">
          <a href="#features" className="hover:text-zinc-900 dark:hover:text-white">Features</a>
          <a href="#how" className="hover:text-zinc-900 dark:hover:text-white">How it works</a>
          <a href="#pricing" className="hover:text-zinc-900 dark:hover:text-white">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/register"><Button variant="gradient" size="sm">Get started <ArrowRight size={14} /></Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="gradient" className="mb-6">
            <Zap size={12} className="mr-1" /> AI-Powered Email Assistant
          </Badge>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Your inbox, <span className="gradient-text">on autopilot</span>.
          </h1>
          <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 md:text-xl">
            InboxAI reads, classifies and drafts replies for you — with one-click approval.
            Automate job applications, attach your CV, and send personalized emails in seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button variant="gradient" size="lg">
                Start free <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Open dashboard</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-500">Free to start · Connect any email · Deploy to Vercel in 1 click</p>
        </div>

        {/* Hero preview card */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="rounded-3xl border border-zinc-200/70 bg-white/70 p-2 shadow-2xl backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-900/70">
            <div className="rounded-2xl bg-white p-6 dark:bg-zinc-950">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-4 flex h-6 flex-1 items-center rounded-md bg-zinc-100 px-3 text-xs text-zinc-500 dark:bg-zinc-800">inboxai.app/dashboard</div>
              </div>
              <div className="grid grid-cols-12 gap-4 pt-4">
                {/* Sidebar */}
                <div className="col-span-3 space-y-1 text-sm">
                  {[
                    { icon: Inbox, label: "Inbox", count: 24 },
                    { icon: Send, label: "Sent" },
                    { icon: FileText, label: "Drafts", count: 3 },
                    { icon: Briefcase, label: "Jobs", count: 12 },
                    { icon: CheckCircle2, label: "Approvals", count: 5, active: true },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 ${item.active ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" : "text-zinc-600 dark:text-zinc-400"}`}>
                      <span className="flex items-center gap-2"><item.icon size={16} /> {item.label}</span>
                      {item.count && <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-800">{item.count}</span>}
                    </div>
                  ))}
                </div>
                {/* List */}
                <div className="col-span-4 space-y-2">
                  {[
                    { from: "Sarah Chen", subject: "Interview at Stripe — Thursday?", time: "10m", badge: "INTERVIEW", color: "warning" },
                    { from: "Google Recruiting", subject: "Your application to SWE role", time: "1h", badge: "JOB", color: "info" },
                    { from: "Notion Team", subject: "New features this week", time: "2h", badge: "NEWSLETTER", color: "secondary" },
                    { from: "Alex Rivera", subject: "Following up on our chat", time: "3h", badge: "FOLLOW_UP", color: "success" },
                  ].map((m, i) => (
                    <div key={i} className={`rounded-xl border p-3 text-left ${i === 0 ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/30" : "border-zinc-200 dark:border-zinc-800"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{m.from}</span>
                        <span className="text-xs text-zinc-500">{m.time}</span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{m.subject}</p>
                      <div className="mt-2">
                        <Badge variant={m.color as any}>{m.badge}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Preview */}
                <div className="col-span-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500" />
                    <div>
                      <p className="text-sm font-semibold">Sarah Chen</p>
                      <p className="text-xs text-zinc-500">sarah@stripe.com</p>
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold">Interview at Stripe — Thursday?</h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Hi! I loved your profile and would love to schedule a 30-min chat this Thursday at 2pm PT...</p>
                  <div className="mt-4 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950/40">
                    <p className="flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300"><BrainCircuit size={14} /> AI Suggested Reply</p>
                    <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">Hi Sarah, thank you so much for reaching out! Thursday 2pm PT works perfectly...</p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="success">Approve & send</Button>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">Features</Badge>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">Everything you need to tame your inbox</h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Built for job seekers, freelancers, and anyone drowning in emails.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: BrainCircuit, title: "AI Classification", desc: "Emails are automatically tagged as job offers, interviews, promotions, spam, and more — so you know what matters.", color: "from-indigo-500 to-purple-500" },
            { icon: Sparkles, title: "Smart Reply Drafts", desc: "Get context-aware suggested replies written in your tone. One click to approve or edit.", color: "from-pink-500 to-rose-500" },
            { icon: Briefcase, title: "Job Application Autopilot", desc: "Generate cover letters, attach your CV, and send personalized applications in bulk. Track statuses end-to-end.", color: "from-cyan-500 to-blue-500" },
            { icon: Shield, title: "You stay in control", desc: "Nothing gets sent without your approval (unless you toggle auto-send for trusted senders).", color: "from-emerald-500 to-teal-500" },
            { icon: Mail, title: "Works with your email", desc: "Connect any SMTP/IMAP account — Gmail, Outlook, iCloud, or custom domains.", color: "from-amber-500 to-orange-500" },
            { icon: Zap, title: "Ships on Vercel + Neon", desc: "Open source, serverless, and production-ready. Deploy in minutes with your own Postgres database.", color: "from-violet-500 to-fuchsia-500" },
          ].map((f, i) => (
            <div key={i} className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-md`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">How it works</Badge>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">From chaos to clarity in 3 steps</h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            { step: "01", title: "Connect your email", desc: "Plug in Gmail, Outlook, or any SMTP/IMAP. Upload your CV once." },
            { step: "02", title: "Let AI triage", desc: "Every incoming email is analyzed, categorized, and a reply is drafted." },
            { step: "03", title: "Approve & send", desc: "You review in one click, edit if needed, and approve. We handle the sending." },
          ].map((s, i) => (
            <div key={i} className="relative rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
              <span className="gradient-text text-5xl font-black">{s.step}</span>
              <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 text-center text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-4xl font-bold">Ready to reclaim your inbox?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/80">
            Start free, connect your email, and let AI handle the repetitive stuff — so you can focus on what matters.
          </p>
          <div className="relative mt-8 flex justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90">
                Create account <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-10 text-center text-sm text-zinc-500">
        Built with Next.js, Neon Postgres, and OpenAI · Deploy on Vercel
      </footer>
    </div>
  )
}
