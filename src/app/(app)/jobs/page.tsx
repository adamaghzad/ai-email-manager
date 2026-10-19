"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Plus, Building2, MapPin, Calendar, FileText, Loader2, Mail } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

type Job = {
  id: string
  company: string
  position: string
  recruiterEmail: string
  recruiterName: string | null
  status: string
  appliedAt: string | null
  createdAt: string
  followUpDate: string | null
  cv: any
  notes: string | null
}

const statusConfig: Record<string, { label: string; variant: any }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  READY_TO_SEND: { label: "Ready to send", variant: "info" },
  SENT: { label: "Applied", variant: "success" },
  INTERVIEW_SCHEDULED: { label: "Interview", variant: "warning" },
  FOLLOW_UP: { label: "Follow up", variant: "warning" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  OFFER_RECEIVED: { label: "Offer", variant: "gradient" },
  ARCHIVED: { label: "Archived", variant: "outline" },
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/jobs")
    if (res.ok) setJobs(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const stats = {
    total: jobs.length,
    sent: jobs.filter((j) => ["SENT", "INTERVIEW_SCHEDULED", "FOLLOW_UP", "OFFER_RECEIVED"].includes(j.status)).length,
    interviews: jobs.filter((j) => j.status === "INTERVIEW_SCHEDULED" || j.status === "OFFER_RECEIVED").length,
    drafts: jobs.filter((j) => j.status === "DRAFT" || j.status === "READY_TO_SEND").length,
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Applications</h1>
          <p className="mt-1 text-zinc-500">AI-powered job applications. Generate cover letters, attach your CV, send in one click.</p>
        </div>
        <Link href="/jobs/new"><Button variant="gradient"><Plus size={16}/> New application</Button></Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: Briefcase, color: "from-indigo-500 to-purple-500" },
          { label: "Applied", value: stats.sent, icon: Mail, color: "from-emerald-500 to-teal-500" },
          { label: "Interviews / Offers", value: stats.interviews, icon: Building2, color: "from-amber-500 to-orange-500" },
          { label: "Drafts", value: stats.drafts, icon: FileText, color: "from-cyan-500 to-blue-500" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white`}>
                <s.icon size={18}/>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center"><Loader2 className="animate-spin text-zinc-400"/></div>
      ) : jobs.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-lg">
              <Briefcase size={32}/>
            </div>
            <h3 className="mt-6 text-xl font-semibold">No applications yet</h3>
            <p className="mt-2 max-w-md text-sm text-zinc-500">
              Upload your CV, then create your first application. InboxAI will write a personalized cover letter and send it with your CV attached.
            </p>
            <div className="mt-6 flex gap-2">
              <Link href="/settings#cv"><Button variant="outline">Upload CV</Button></Link>
              <Link href="/jobs/new"><Button variant="gradient">Create application</Button></Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {jobs.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`}>
              <Card className="h-full transition hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-pink-100 text-sm font-bold text-indigo-700 dark:from-indigo-950 dark:to-pink-950 dark:text-indigo-300">
                          {j.company[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{j.position}</p>
                          <p className="truncate text-sm text-zinc-500">{j.company}</p>
                        </div>
                      </div>
                      <p className="mt-3 truncate text-xs text-zinc-500">
                        <Mail size={12} className="mr-1 inline" /> {j.recruiterName ? `${j.recruiterName} · ` : ""}{j.recruiterEmail}
                      </p>
                      {j.appliedAt && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                          <Calendar size={12}/> Applied {formatDate(j.appliedAt)}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusConfig[j.status]?.variant || "outline"}>
                      {statusConfig[j.status]?.label || j.status}
                    </Badge>
                  </div>
                  {!j.cv && j.status !== "SENT" && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      ⚠ Upload your CV in Settings to attach it automatically.
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
