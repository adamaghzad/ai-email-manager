"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Briefcase, Sparkles, Send, RefreshCw, FileText, Mail, User, Building2, Loader2, Pencil, Check, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatFullDate } from "@/lib/utils"

type Job = {
  id: string
  company: string
  position: string
  recruiterEmail: string
  recruiterName: string | null
  status: string
  notes: string | null
  coverLetter: string | null
  aiGeneratedLetter: string | null
  appliedAt: string | null
  createdAt: string
  followUpDate: string | null
  cv: { id: string; filename: string } | null
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [letter, setLetter] = useState("")
  const [editField, setEditField] = useState(false)
  const [form, setForm] = useState({ company: "", position: "", recruiterName: "", recruiterEmail: "" })
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/jobs/${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setJob(data)
      setLetter(data.coverLetter || data.aiGeneratedLetter || "")
      setForm({
        company: data.company,
        position: data.position,
        recruiterName: data.recruiterName || "",
        recruiterEmail: data.recruiterEmail,
      })
    }
    setLoading(false)
  }, [params.id])

  useEffect(() => { load() }, [load])

  async function regenerate() {
    setGenerating(true)
    const res = await fetch(`/api/jobs/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate-letter" }),
    })
    if (res.ok) {
      const data = await res.json()
      setLetter(data.coverLetter || data.aiGeneratedLetter || "")
      setJob({ ...job!, coverLetter: data.coverLetter, aiGeneratedLetter: data.aiGeneratedLetter, status: data.status })
      toast.success("Cover letter regenerated!")
    } else {
      toast.error("Failed to generate")
    }
    setGenerating(false)
  }

  async function saveLetter() {
    await fetch(`/api/jobs/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter: letter }),
    })
    toast.success("Saved")
  }

  async function saveFields() {
    await fetch(`/api/jobs/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setEditField(false)
    load()
    toast.success("Updated")
  }

  async function sendApplication() {
    if (!letter.trim()) { toast.error("Write a cover letter first"); return }
    if (!confirm(`Send application to ${form.recruiterEmail} at ${form.company}?\n\nCV will be attached automatically if uploaded.`)) return
    setSending(true)
    const res = await fetch(`/api/jobs/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send" }),
    })
    setSending(false)
    if (res.ok) {
      toast.success("Application sent! 🚀")
      load()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || "Failed to send — check SMTP settings")
    }
  }

  async function setStatus(status: string) {
    await fetch(`/api/jobs/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    load()
  }

  async function deleteJob() {
    if (!confirm("Delete this application?")) return
    await fetch(`/api/jobs/${params.id}`, { method: "DELETE" })
    router.push("/jobs")
  }

  if (loading || !job) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-zinc-400"/></div>

  const statusColors: Record<string, any> = {
    DRAFT: "secondary", READY_TO_SEND: "info", SENT: "success",
    INTERVIEW_SCHEDULED: "warning", FOLLOW_UP: "warning",
    REJECTED: "destructive", OFFER_RECEIVED: "gradient", ARCHIVED: "outline",
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <Link href="/jobs"><Button variant="ghost" size="sm"><ArrowLeft size={16}/> Back</Button></Link>

      <div className="mt-4 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 text-2xl font-bold text-white shadow-lg">
            {job.company[0]?.toUpperCase()}
          </div>
          <div>
            {editField ? (
              <div className="space-y-2">
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company"/>
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Position"/>
                <Input value={form.recruiterName} onChange={(e) => setForm({ ...form, recruiterName: e.target.value })} placeholder="Recruiter name"/>
                <Input value={form.recruiterEmail} onChange={(e) => setForm({ ...form, recruiterEmail: e.target.value })} placeholder="Email"/>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveFields}><Check size={14}/> Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditField(false)}><X size={14}/> Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">{job.position}</h1>
                  <Badge variant={statusColors[job.status] || "outline"}>{job.status.replace("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-400">{job.company}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  <User size={13} className="mr-1 inline"/>
                  {job.recruiterName ? `${job.recruiterName} · ` : ""}{job.recruiterEmail}
                </p>
                {job.appliedAt && <p className="mt-1 text-xs text-emerald-600">✓ Sent on {formatFullDate(job.appliedAt)}</p>}
                <button onClick={() => setEditField(true)} className="mt-2 text-xs text-indigo-600 hover:underline"><Pencil size={12} className="inline"/> Edit details</button>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {job.status !== "SENT" && job.status !== "OFFER_RECEIVED" ? (
            <Button variant="gradient" onClick={sendApplication} disabled={sending}>
              {sending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Send application
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" onClick={deleteJob}><Trash2 size={16}/></Button>
        </div>
      </div>

      {!job.cv && job.status !== "SENT" && (
        <Card className="mt-6 border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">No CV attached</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Upload your CV in Settings to automatically attach it to applications.</p>
            </div>
            <Link href="/settings#cv"><Button variant="outline">Upload CV</Button></Link>
          </CardContent>
        </Card>
      )}
      {job.cv && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          <FileText size={16} className="text-emerald-700 dark:text-emerald-400"/>
          <span>CV attached: <b>{job.cv.filename}</b></span>
        </div>
      )}

      {job.status === "SENT" && (
        <Card className="mt-4">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm">Update status after sending:</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setStatus("FOLLOW_UP")}>Mark follow-up</Button>
              <Button size="sm" variant="warning" onClick={() => setStatus("INTERVIEW_SCHEDULED")}>Interview scheduled</Button>
              <Button size="sm" variant="success" onClick={() => setStatus("OFFER_RECEIVED")}>Offer received</Button>
              <Button size="sm" variant="destructive" onClick={() => setStatus("REJECTED")}>Rejected</Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus("ARCHIVED")}>Archive</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {job.notes && (
        <Card className="mt-6">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Job description / notes</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{job.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 border-indigo-200 dark:border-indigo-900">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2"><Sparkles size={18} className="text-indigo-600"/> Cover letter</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={regenerate} disabled={generating}>
              {generating ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>} Regenerate
            </Button>
            <Button variant="ghost" size="sm" onClick={saveLetter}>Save</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea value={letter} onChange={(e) => setLetter(e.target.value)} className="min-h-[300px] text-sm leading-relaxed" placeholder="AI is generating your cover letter..."/>
          <p className="mt-3 text-xs text-zinc-500">
            <Mail size={12} className="mr-1 inline"/> Will be sent to <b>{job.recruiterEmail}</b> with subject "Application: {job.position} at {job.company}"
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
