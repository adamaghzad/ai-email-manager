"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn, formatDate, truncate, stripHtml } from "@/lib/utils"
import {
  Search,
  Inbox,
  Send,
  FileText,
  Trash2,
  Star,
  Archive,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

type Email = {
  id: string
  fromAddress: string
  fromName: string | null
  subject: string
  snippet: string | null
  bodyText: string | null
  bodyHtml: string | null
  category: string
  priority: string
  status: string
  read: boolean
  starred: boolean
  createdAt: string
  folder: string
  _count?: { replies: number }
}

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

const folders = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileText },
  { key: "trash", label: "Trash", icon: Trash2 },
]

export default function EmailsPage() {
  const [folder, setFolder] = useState("inbox")
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reanalyzing, setReanalyzing] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams({ folder })
    if (q) params.set("q", q)
    const res = await fetch(`/api/emails?${params}`)
    if (res.ok) setEmails(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder])

  async function handleStar(e: React.MouseEvent, id: string, starred: boolean) {
    e.stopPropagation()
    e.preventDefault()
    setEmails((prev) => prev.map((x) => (x.id === id ? { ...x, starred: !starred } : x)))
    await fetch(`/api/emails/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starred: !starred }) })
  }

  async function handleTrash(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    e.preventDefault()
    setEmails((prev) => prev.filter((x) => x.id !== id))
    await fetch(`/api/emails/${id}`, { method: "DELETE" })
    toast.success("Moved to trash")
  }

  async function analyzeAll() {
    toast.promise(Promise.all(emails.map((e) => fetch(`/api/emails/${e.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "ai-analyze" }) }))), {
      loading: "AI is analyzing your inbox...",
      success: () => { load(); return "Inbox analyzed!" },
      error: "Failed to analyze",
    })
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 border-b border-zinc-200 bg-white/60 px-8 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="relative flex-1 max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search emails..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load() }}
          />
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14}/> Refresh</Button>
        <Button variant="gradient" size="sm" onClick={analyzeAll}><Sparkles size={14}/> Analyze all with AI</Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Folders */}
        <div className="w-56 shrink-0 border-r border-zinc-200 p-4 dark:border-zinc-800">
          <div className="space-y-1">
            {folders.map((f) => (
              <button
                key={f.key}
                onClick={() => setFolder(f.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  folder === f.key
                    ? "bg-gradient-to-r from-indigo-500/10 to-pink-500/10 text-indigo-700 dark:text-indigo-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                )}
              >
                <f.icon size={16}/> {f.label}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-gradient-to-br from-indigo-50 to-pink-50 p-4 dark:from-indigo-950/40 dark:to-pink-950/40">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={14} className="text-indigo-600"/> AI Triage
            </div>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Categories are auto-assigned. Adjust tone and suggestions per email.
            </p>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-zinc-400"/></div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Inbox size={48} className="mb-3 text-zinc-300"/>
              <p className="font-semibold">No emails in {folder}</p>
              <p className="text-sm text-zinc-500">Try another folder or refresh.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {emails.map((e) => (
                <Link
                  key={e.id}
                  href={`/emails/${e.id}`}
                  className={cn(
                    "flex items-start gap-3 px-8 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                    !e.read && "bg-indigo-50/30 dark:bg-indigo-950/20"
                  )}
                >
                  <button onClick={(ev) => handleStar(ev, e.id, e.starred)} className="mt-1 shrink-0 text-zinc-300 hover:text-amber-400">
                    <Star size={16} fill={e.starred ? "#f59e0b" : "none"} className={e.starred ? "text-amber-400" : ""}/>
                  </button>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/80 to-pink-500/80 text-sm font-semibold text-white">
                    {(e.fromName || e.fromAddress)[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm", !e.read ? "font-bold" : "font-medium")}>{e.fromName || e.fromAddress}</p>
                      <span className="shrink-0 text-xs text-zinc-500">{formatDate(e.createdAt)}</span>
                    </div>
                    <p className={cn("truncate text-sm", !e.read ? "font-semibold" : "")}>{e.subject}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                      {truncate(stripHtml(e.snippet || e.bodyText || e.bodyHtml || ""), 160)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.status === "PENDING_APPROVAL" && (
                      <Badge variant="warning">Awaiting</Badge>
                    )}
                    <Badge variant={categoryColors[e.category] || "outline"}>{e.category.replace("_", " ")}</Badge>
                    <button onClick={(ev) => handleTrash(ev, e.id)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
