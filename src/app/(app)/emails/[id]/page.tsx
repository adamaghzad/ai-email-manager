"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { formatFullDate, stripHtml } from "@/lib/utils"
import {
  ArrowLeft,
  Send,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Paperclip,
  Copy,
  Loader2,
  Briefcase,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"

type Attachment = { id: string; filename: string; contentType?: string; size?: number; url?: string; isCV: boolean }
type Email = {
  id: string
  fromAddress: string
  fromName: string | null
  toAddress: string
  subject: string
  bodyHtml?: string | null
  bodyText?: string | null
  snippet?: string | null
  category: string
  priority: string
  status: string
  read: boolean
  starred: boolean
  aiSummary?: string | null
  aiCategory?: string | null
  aiSuggestedReply?: string | null
  aiTone?: string | null
  approvedReply?: string | null
  sentAt?: string | null
  receivedAt?: string | null
  createdAt: string
  attachments: Attachment[]
  replies?: Email[]
  parentEmail?: Email | null
  jobApplication?: any
}

const categoryColors: Record<string, any> = {
  JOB_RECRUITMENT: "info",
  INTERVIEW_REQUEST: "warning",
  OFFER: "gradient",
  REJECTION: "destructive",
  FOLLOW_UP: "success",
}

export default function EmailDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [email, setEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState("")
  const [editingAI, setEditingAI] = useState(false)
  const [sending, setSending] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/emails/${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setEmail(data)
      setReply(data.approvedReply || data.aiSuggestedReply || "")
    }
    setLoading(false)
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [params.id])

  async function regenerate() {
    if (!email) return
    setRegenerating(true)
    const res = await fetch(`/api/emails/${email.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ai-reply" }),
    })
    if (res.ok) {
      const data = await res.json()
      setEmail({ ...email, aiSuggestedReply: data.aiSuggestedReply, status: data.status })
      setReply(data.aiSuggestedReply || "")
      toast.success("Reply regenerated")
    } else {
      toast.error("Failed to regenerate")
    }
    setRegenerating(false)
  }

  async function approveAndSend() {
    if (!email) return
    if (!reply.trim()) { toast.error("Reply is empty"); return }
    setSending(true)
    const res = await fetch(`/api/emails/${email.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve-and-send", replyText: reply }),
    })
    setSending(false)
    if (res.ok) {
      toast.success("Email sent!")
      router.push("/approvals")
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || "Failed to send")
    }
  }

  async function saveDraft() {
    if (!email) return
    await fetch(`/api/emails/${email.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvedReply: reply, status: "APPROVED" }),
    })
    toast.success("Reply saved")
  }

  if (loading || !email) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-zinc-400"/></div>
  }

  const initials = (email.fromName || email.fromAddress)[0]?.toUpperCase()
  const body = email.bodyHtml || (email.bodyText ? email.bodyText.replace(/\n/g, "<br/>") : "")

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/emails">
          <Button variant="ghost" size="sm"><ArrowLeft size={16}/> Back to inbox</Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={categoryColors[email.category] || "outline"}>{email.category.replace("_", " ")}</Badge>
          {email.status === "PENDING_APPROVAL" && <Badge variant="warning">Needs approval</Badge>}
          {email.status === "SENT" && <Badge variant="success">Sent</Badge>}
        </div>
      </div>

      <h1 className="text-2xl font-bold">{email.subject}</h1>
      <div className="mt-4 flex items-start gap-4">
        <Avatar className="h-12 w-12"><AvatarFallback className="text-lg">{initials}</AvatarFallback></Avatar>
        <div className="flex-1">
          <p className="font-semibold">{email.fromName || email.fromAddress}</p>
          <p className="text-sm text-zinc-500">{email.fromAddress} → {email.toAddress}</p>
          <p className="mt-1 text-xs text-zinc-500">{formatFullDate(email.receivedAt || email.createdAt)}</p>
        </div>
        {email.jobApplication && (
          <Link href={`/jobs/${email.jobApplication.id}`}>
            <Badge variant="info"><Briefcase size={12}/> {email.jobApplication.company}</Badge>
          </Link>
        )}
      </div>

      {email.attachments.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {email.attachments.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <Paperclip size={14}/> {a.filename}
              {a.isCV && <Badge variant="info">CV</Badge>}
            </div>
          ))}
        </div>
      )}

      {/* AI Summary */}
      {email.aiSummary && (
        <Card className="mt-6 border-indigo-200 bg-gradient-to-br from-indigo-50 to-pink-50 dark:border-indigo-900 dark:from-indigo-950/50 dark:to-pink-950/40">
          <CardContent className="p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
              <Sparkles size={14}/> AI Summary
            </p>
            <p className="mt-2 text-sm">{email.aiSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Body */}
      <Card className="mt-6">
        <CardContent className="prose-email p-6 text-sm leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: body }} />
        </CardContent>
      </Card>

      {/* Replies thread */}
      {email.replies && email.replies.length > 0 && (
        <div className="mt-6 space-y-4">
          {email.replies.map((r) => (
            <Card key={r.id} className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20">
              <CardContent className="p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <Send size={14}/> Sent on {formatFullDate(r.sentAt || r.createdAt)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{stripHtml(r.bodyText || "")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply composer */}
      {email.status !== "SENT" && email.toAddress !== email.fromAddress && (
        <Card className="mt-6 border-indigo-200 shadow-lg dark:border-indigo-900">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600"/>
                <h3 className="text-lg font-semibold">AI-drafted reply</h3>
                <Badge variant="info" className="capitalize">{email.aiTone || "professional"}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingAI(!editingAI)}>
                  <Pencil size={14}/> {editingAI ? "Preview" : "Edit"}
                </Button>
                <Button variant="outline" size="sm" onClick={regenerate} disabled={regenerating}>
                  {regenerating ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>} Regenerate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(reply); toast.success("Copied") }}>
                  <Copy size={14}/>
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="min-h-[220px] border-0 focus-visible:ring-0"
                placeholder="Your reply..."
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Email will be sent from <b>{email.toAddress}</b> to <b>{email.fromAddress}</b>.
                Review carefully before sending.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveDraft}>Save draft</Button>
                <Button variant="destructive" size="sm" onClick={() => setReply("")}><X size={14}/> Clear</Button>
                <Button variant="gradient" onClick={approveAndSend} disabled={sending}>
                  {sending ? <Loader2 size={14} className="animate-spin"/> : <Check size={16}/>}
                  Approve & send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
