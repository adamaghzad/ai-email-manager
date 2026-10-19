"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Settings as SettingsIcon, Mail, KeyRound, User, FileText, Loader2, Check, Upload, Trash2 } from "lucide-react"
import { toast } from "sonner"

type Settings = {
  smtpHost: string | null
  smtpPort: number | null
  smtpUser: string | null
  smtpPass: string | null
  imapHost: string | null
  imapPort: number | null
  imapUser: string | null
  imapPass: string | null
  emailConnected: boolean
  autoSendEnabled: boolean
  aiModel: string
  openaiApiKey: string | null
  signature: string | null
  senderName: string | null
}

type CV = { id: string; filename: string; size: number; uploadedAt: string; contentType: string }

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [cv, setCv] = useState<CV | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<any>({
    smtpHost: "", smtpPort: 587, smtpUser: "", smtpPass: "",
    imapHost: "", imapPort: 993, imapUser: "", imapPass: "",
    senderName: "", signature: "",
    autoSendEnabled: false,
    openaiApiKey: "",
  })

  async function load() {
    setLoading(true)
    const [s, c] = await Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/uploads").then((r) => r.json()),
    ])
    setSettings(s)
    setCv(c.cv)
    setForm({
      smtpHost: s.smtpHost || "",
      smtpPort: s.smtpPort || 587,
      smtpUser: s.smtpUser || "",
      smtpPass: s.smtpPass || "",
      imapHost: s.imapHost || "",
      imapPort: s.imapPort || 993,
      imapUser: s.imapUser || "",
      imapPass: s.imapPass || "",
      senderName: s.senderName || "",
      signature: s.signature || "",
      autoSendEnabled: s.autoSendEnabled || false,
      openaiApiKey: s.openaiApiKey || "",
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtpHost: form.smtpHost || null,
        smtpPort: Number(form.smtpPort) || 587,
        smtpUser: form.smtpUser || null,
        smtpPass: form.smtpPass && form.smtpPass !== "********" ? form.smtpPass : undefined,
        imapHost: form.imapHost || null,
        imapPort: Number(form.imapPort) || 993,
        imapUser: form.imapUser || null,
        imapPass: form.imapPass && form.imapPass !== "********" ? form.imapPass : undefined,
        senderName: form.senderName || null,
        signature: form.signature || null,
        autoSendEnabled: form.autoSendEnabled,
        openaiApiKey: form.openaiApiKey && form.openaiApiKey !== "********" ? form.openaiApiKey : undefined,
      }),
    })
    setSaving(false)
    if (res.ok) { toast.success("Settings saved"); load() }
    else toast.error("Failed to save")
  }

  async function test(sendTest = false) {
    setTesting(true)
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sendTestEmail: sendTest }),
    })
    const data = await res.json()
    setTesting(false)
    if (data.ok) toast.success(sendTest ? "Test email sent!" : "SMTP connection works!")
    else toast.error(data.error || "Connection failed")
  }

  async function uploadCV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("type", "cv")
    const res = await fetch("/api/uploads", { method: "POST", body: fd })
    setUploading(false)
    if (res.ok) {
      const data = await res.json()
      setCv(data.cv)
      toast.success("CV uploaded!")
    } else {
      toast.error("Upload failed")
    }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-zinc-400"/></div>

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <SettingsIcon size={28}/> Settings
      </h1>
      <p className="mt-1 text-zinc-500">Configure your email connection, AI preferences, and CV.</p>

      {/* Email connection */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail size={18}/> Email connection (SMTP)</CardTitle>
          <CardDescription>
            Used to send emails. For Gmail use an <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-indigo-600 underline">App Password</a>. For Outlook/Office 365 use smtp.office365.com port 587.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            Status:
            {settings?.emailConnected ? (
              <Badge variant="success"><Check size={12}/> Connected</Badge>
            ) : (
              <Badge variant="destructive">Not configured</Badge>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} placeholder="smtp.gmail.com"/>
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input type="number" value={form.smtpPort} onChange={(e) => setForm({ ...form, smtpPort: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label>SMTP Username</Label>
              <Input value={form.smtpUser} onChange={(e) => setForm({ ...form, smtpUser: e.target.value })} placeholder="you@gmail.com"/>
            </div>
            <div className="space-y-2">
              <Label>SMTP Password</Label>
              <Input type="password" value={form.smtpPass} onChange={(e) => setForm({ ...form, smtpPass: e.target.value })} placeholder="App password"/>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => test(false)} disabled={testing}>{testing ? <Loader2 size={14} className="animate-spin"/> : null} Test connection</Button>
            <Button variant="outline" onClick={() => test(true)} disabled={testing}>Send test email</Button>
          </div>

          <Separator/>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-300">Advanced: IMAP (inbox sync — optional)</summary>
            <p className="mt-2 text-xs text-zinc-500">IMAP lets you pull emails automatically into InboxAI. For now, you can use the demo seed or forward emails manually. Full IMAP sync coming soon.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2"><Label>IMAP Host</Label><Input value={form.imapHost} onChange={(e) => setForm({ ...form, imapHost: e.target.value })} placeholder="imap.gmail.com"/></div>
              <div className="space-y-2"><Label>IMAP Port</Label><Input type="number" value={form.imapPort} onChange={(e) => setForm({ ...form, imapPort: e.target.value })}/></div>
              <div className="space-y-2"><Label>IMAP Username</Label><Input value={form.imapUser} onChange={(e) => setForm({ ...form, imapUser: e.target.value })}/></div>
              <div className="space-y-2"><Label>IMAP Password</Label><Input type="password" value={form.imapPass} onChange={(e) => setForm({ ...form, imapPass: e.target.value })}/></div>
            </div>
          </details>
        </CardContent>
      </Card>

      {/* Sender info */}
      <Card className="mt-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><User size={18}/> Sender info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sender name</Label>
            <Input value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} placeholder="Jane Doe"/>
          </div>
          <div className="space-y-2">
            <Label>Email signature (optional)</Label>
            <Textarea value={form.signature} onChange={(e) => setForm({ ...form, signature: e.target.value })} placeholder="Best regards,\nJane Doe\n+1 555 0000"/>
          </div>
        </CardContent>
      </Card>

      {/* AI */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound size={18}/> AI settings</CardTitle>
          <CardDescription>Provide your OpenAI API key for smart classification & reply generation. Leave empty for basic rule-based mode.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>OpenAI API key</Label>
            <Input type="password" value={form.openaiApiKey} onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })} placeholder="sk-..."/>
          </div>
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="font-medium">Auto-send trusted replies</p>
              <p className="text-xs text-zinc-500">If enabled, AI will automatically send replies to safe categories (e.g. confirmations). Job replies always require approval.</p>
            </div>
            <Switch checked={form.autoSendEnabled} onCheckedChange={(v) => setForm({ ...form, autoSendEnabled: v })}/>
          </div>
        </CardContent>
      </Card>

      {/* CV */}
      <Card className="mt-6" id="cv">
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={18}/> CV / Resume</CardTitle>
          <CardDescription>Upload your CV as PDF. It will be attached automatically to job applications.</CardDescription>
        </CardHeader>
        <CardContent>
          {cv ? (
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <FileText className="text-indigo-600" size={24}/>
                <div>
                  <p className="font-medium">{cv.filename}</p>
                  <p className="text-xs text-zinc-500">{(cv.size / 1024).toFixed(1)} KB · uploaded {new Date(cv.uploadedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`/uploads/${cv.filename}`} target="_blank"><Button variant="outline" size="sm">View</Button></a>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild={false}><Upload size={14}/> Replace</Button>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={uploadCV}/>
                </label>
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 py-10 text-center transition hover:border-indigo-500 dark:border-zinc-700">
              {uploading ? <Loader2 className="animate-spin"/> : <Upload size={32} className="mb-2 text-zinc-400"/>}
              <p className="font-medium">{uploading ? "Uploading..." : "Click to upload your CV"}</p>
              <p className="mt-1 text-xs text-zinc-500">PDF, DOC, DOCX up to 10 MB</p>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={uploadCV}/>
            </label>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-2 pb-12">
        <Button variant="outline" onClick={load}>Reset</Button>
        <Button variant="gradient" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} Save settings
        </Button>
      </div>
    </div>
  )
}
