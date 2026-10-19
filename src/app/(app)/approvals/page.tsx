"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle2, X, Send, Sparkles, RefreshCw, Loader2, Inbox, Clock } from "lucide-react"
import { toast } from "sonner"
import { cn, formatDate, truncate, stripHtml } from "@/lib/utils"

type Email = {
  id: string
  fromAddress: string
  fromName: string | null
  subject: string
  bodyText?: string | null
  bodyHtml?: string | null
  snippet?: string | null
  category: string
  priority: string
  aiSummary?: string | null
  aiSuggestedReply?: string | null
  aiTone?: string | null
  approvedReply?: string | null
  createdAt: string
}

export default function ApprovalsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [regeningId, setRegeningId] = useState<string | null>(null)
  const params = useSearchParams()

  async function load() {
    setLoading(true)
    const res = await fetch("/api/emails?status=PENDING_APPROVAL")
    if (res.ok) {
      const data = await res.json()
      setEmails(data)
      const id = params.get("id")
      const first = data[0]?.id
      const selected = id && data.find((e: Email) => e.id === id) ? id : first
      setActiveId(selected || null)
      const act = data.find((e: Email) => e.id === selected)
      setReplyText(act?.aiSuggestedReply || "")
    }
    setLoading(false)
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [])

  useEffect(() => {
    const act = emails.find((e) => e.id === activeId)
    setReplyText(act?.approvedReply || act?.aiSuggestedReply || "")
  }, [activeId, emails])

  async function sendSelected() {
    if (!activeId) return
    if (!replyText.trim()) { toast.error("Reply is empty"); return }
    setSendingId(activeId)
    const res = await fetch(`/api/emails/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve-and-send", replyText }),
    })
    setSendingId(null)
    if (res.ok) {
      toast.success("Sent! ✓")
      setEmails((prev) => prev.filter((e) => e.id !== activeId))
      const remain = emails.filter((e) => e.id !== activeId)
      setActiveId(remain[0]?.id || null)
    } else {
      toast.error("Failed to send")
    }
  }

  async function skip(id: string) {
    await fetch(`/api/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "AI_PROCESSED" }),
    })
    setEmails((prev) => prev.filter((e) => e.id !== id))
    const remain = emails.filter((e) => e.id !== id)
    if (activeId === id) setActiveId(remain[0]?.id || null)
    toast.success("Skipped")
  }

  async function regenerate(id: string) {
    setRegeningId(id)
    const res = await fetch(`/api/emails/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ai-reply" }),
    })
    if (res.ok) {
      const data = await res.json()
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, aiSuggestedReply: data.aiSuggestedReply } : e)))
      if (activeId === id) setReplyText(data.aiSuggestedReply || "")
      toast.success("Regenerated")
    }
    setRegeningId(null)
  }

  const active = emails.find((e) => e.id === activeId)

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-zinc-200 bg-white/60 px-8 py-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
        <h1 className="text-2xl font-bold">Pending Approval</h1>
        <p className="text-sm text-zinc-500">Review AI-drafted replies and send with one click.</p>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center"><Loader2 className="animate-spin text-zinc-400" size={32}/></div>
      ) : emails.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <CheckCircle2 size={64} className="mb-4 text-emerald-500"/>
          <h2 className="text-2xl font-bold">All caught up! 🎉</h2>
          <p className="mt-2 text-zinc-500">No emails are waiting for your approval.</p>
          <Link href="/emails" className="mt-4"><Button variant="gradient">Open inbox</Button></Link>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Queue */}
          <div className="w-96 shrink-0 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between px-6 py-3 text-sm text-zinc-500">
              <span className="flex items-center gap-1"><Clock size={14}/> {emails.length} in queue</span>
            </div>
            <div className="space-y-1 px-3 pb-4">
              {emails.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => setActiveId(e.id)}
                  className={cn(
                    "w-full rounded-xl p-3 text-left transition",
                    activeId === e.id
                      ? "bg-gradient-to-r from-indigo-500/10 to-pink-500/10 ring-1 ring-indigo-500/30"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{(e.fromName || e.fromAddress)[0]?.toUpperCase()}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{e.fromName || e.fromAddress}</p>
                        <span className="shrink-0 text-xs text-zinc-500">{formatDate(e.createdAt)}</span>
                      </div>
                      <p className="truncate text-sm font-medium">{e.subject}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{truncate(e.aiSuggestedReply || stripHtml(e.bodyText || ""), 120)}</p>
                      <div className="mt-2 flex gap-1">
                        <Badge variant="warning" className="capitalize">{e.category.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Review pane */}
          <div className="flex-1 overflow-y-auto p-8">
            {active && (
              <div className="mx-auto max-w-3xl space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12"><AvatarFallback>{(active.fromName || active.fromAddress)[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{active.fromName || active.fromAddress}</p>
                        <p className="text-xs text-zinc-500">{active.fromAddress}</p>
                        <h2 className="mt-2 text-lg font-bold">{active.subject}</h2>
                      </div>
                    </div>
                    {active.aiSummary && (
                      <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm dark:bg-indigo-950/40">
                        <p className="flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300"><Sparkles size={12}/> Summary</p>
                        <p className="mt-1">{active.aiSummary}</p>
                      </div>
                    )}
                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-900">Show original message</summary>
                      <div className="mt-2 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 whitespace-pre-wrap">
                        {stripHtml(active.bodyText || active.bodyHtml || "")}
                      </div>
                    </details>
                  </CardContent>
                </Card>

                <Card className="border-indigo-200 dark:border-indigo-900">
                  <CardContent className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-600"/>
                        <h3 className="font-semibold">Suggested reply</h3>
                        {active.aiTone && <Badge variant="outline" className="capitalize">{active.aiTone}</Badge>}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => regenerate(active.id)} disabled={regeningId === active.id}>
                        {regeningId === active.id ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>} Regenerate
                      </Button>
                    </div>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-[200px]"
                    />
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-zinc-500">Check before sending — AI can make mistakes.</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => skip(active.id)}><X size={14}/> Skip</Button>
                        <Button variant="gradient" onClick={sendSelected} disabled={sendingId === active.id}>
                          {sendingId === active.id ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                          Approve & send
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
