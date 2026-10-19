import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, truncate, stripHtml } from "@/lib/utils"
import {
  Inbox,
  Mail,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Send,
} from "lucide-react"

const categoryColors: Record<string, any> = {
  JOB_RECRUITMENT: "info",
  INTERVIEW_REQUEST: "warning",
  OFFER: "gradient",
  REJECTION: "destructive",
  FOLLOW_UP: "success",
  IMPORTANT: "warning",
  PROMOTIONS: "secondary",
  NEWSLETTER: "secondary",
  SPAM: "outline",
  PERSONAL: "default",
  WORK: "info",
  OTHER: "outline",
  INBOX: "outline",
}

export default async function DashboardPage() {
  const user = await requireUser()

  const [
    totalEmails,
    pendingApprovals,
    jobsCount,
    sentCount,
    recentEmails,
    pendingEmails,
    jobs,
  ] = await Promise.all([
    prisma.email.count({ where: { userId: user.id } }),
    prisma.email.count({ where: { userId: user.id, status: "PENDING_APPROVAL" } }),
    prisma.jobApplication.count({ where: { userId: user.id } }),
    prisma.email.count({ where: { userId: user.id, status: "SENT" } }),
    prisma.email.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { attachments: true },
    }),
    prisma.email.findMany({
      where: { userId: user.id, status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.jobApplication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ])

  const stats = [
    { label: "Emails processed", value: totalEmails, icon: Mail, color: "from-indigo-500 to-purple-500" },
    { label: "Awaiting approval", value: pendingApprovals, icon: Clock, color: "from-amber-500 to-orange-500", href: "/approvals" },
    { label: "Job applications", value: jobsCount, icon: Briefcase, color: "from-cyan-500 to-blue-500", href: "/jobs" },
    { label: "Sent this week", value: sentCount, icon: Send, color: "from-emerald-500 to-teal-500" },
  ]

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Here's what's happening with your inbox today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/compose"><Button variant="outline"><Sparkles size={16}/> New email</Button></Link>
          <Link href="/jobs/new"><Button variant="gradient"><Briefcase size={16}/> New application</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {stats.map((s, i) => (
          <Link key={i} href={s.href || "#"} className={s.href ? "block" : ""}>
            <Card className="transition hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">{s.label}</p>
                    <p className="mt-2 text-3xl font-bold">{s.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow`}>
                    <s.icon size={22} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Pending approvals */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500"/>
              Awaiting your approval
            </CardTitle>
            <Link href="/approvals">
              <Button variant="ghost" size="sm">View all <ArrowRight size={14} /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 size={48} className="mb-3 text-emerald-500"/>
                <p className="font-semibold">Inbox zero! 🎉</p>
                <p className="text-sm text-zinc-500">No emails are waiting for your approval.</p>
                <Link href="/emails" className="mt-4">
                  <Button variant="outline">Browse inbox</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingEmails.map((e) => (
                  <Link key={e.id} href={`/approvals?id=${e.id}`} className="block">
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 transition hover:shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        <Sparkles size={16}/>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-semibold">{e.fromName || e.fromAddress}</p>
                          <span className="shrink-0 text-xs text-zinc-500">{formatDate(e.createdAt)}</span>
                        </div>
                        <p className="truncate text-sm font-medium">{e.subject}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{truncate(e.aiSuggestedReply || stripHtml(e.bodyText || e.bodyHtml || ""), 160)}</p>
                      </div>
                      <Badge variant="warning">Review</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase size={18} className="text-cyan-500"/> Recent applications
            </CardTitle>
            <Link href="/jobs"><Button variant="ghost" size="sm">All <ArrowRight size={14}/></Button></Link>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase size={40} className="mb-2 text-zinc-300"/>
                <p className="text-sm text-zinc-500">No applications yet. Start applying with AI!</p>
                <Link href="/jobs/new" className="mt-3"><Button size="sm" variant="gradient">Apply now</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((j) => (
                  <Link key={j.id} href={`/jobs/${j.id}`} className="block">
                    <div className="rounded-xl border border-zinc-200 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-zinc-800 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/20">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-semibold">{j.position}</p>
                        <Badge variant={j.status === "SENT" ? "success" : j.status === "REJECTED" ? "destructive" : j.status === "INTERVIEW_SCHEDULED" ? "warning" : "secondary"}>
                          {j.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500">{j.company}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent emails */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Inbox size={18}/> Recent emails</CardTitle>
          <Link href="/emails"><Button variant="ghost" size="sm">Open inbox <ArrowRight size={14}/></Button></Link>
        </CardHeader>
        <CardContent>
          {recentEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-lg">
                <Mail size={28}/>
              </div>
              <p className="mt-4 font-semibold">Your inbox is waiting</p>
              <p className="max-w-sm text-sm text-zinc-500">
                Connect your email in Settings or try seeding a few demo emails to see InboxAI in action.
              </p>
              <div className="mt-4 flex gap-2">
                <Link href="/settings"><Button variant="outline">Connect email</Button></Link>
                <form action="/api/seed" method="POST">
                  <Button variant="gradient" type="submit">Load demo emails</Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentEmails.map((e) => (
                <Link key={e.id} href={`/emails/${e.id}`} className="flex items-start gap-4 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50 -mx-2 px-2 rounded-xl">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/80 to-pink-500/80 text-sm font-semibold text-white">
                    {(e.fromName || e.fromAddress)[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${e.read ? "font-medium" : "font-semibold"}`}>{e.fromName || e.fromAddress}</p>
                      <span className="shrink-0 text-xs text-zinc-500">{formatDate(e.createdAt)}</span>
                    </div>
                    <p className={`truncate text-sm ${e.read ? "text-zinc-600 dark:text-zinc-400" : ""}`}>{e.subject}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{truncate(stripHtml(e.snippet || e.bodyText || e.bodyHtml || ""), 140)}</p>
                  </div>
                  <Badge variant={categoryColors[e.category] || "outline"}>{e.category.replace("_", " ")}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
