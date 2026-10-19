"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Send, Sparkles, Loader2, Paperclip } from "lucide-react"
import { toast } from "sonner"

export default function ComposePage() {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [polishing, setPolishing] = useState(false)

  async function polish() {
    if (!body.trim()) return toast.error("Write something first!")
    setPolishing(true)
    const res = await fetch("/api/ai/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: body, action: "polish" }),
    })
    if (res.ok) {
      const data = await res.json()
      setBody(data.text)
      toast.success("Text polished!")
    } else {
      toast.error("Polish failed")
    }
    setPolishing(false)
  }

  async function send() {
    if (!to || !subject || !body) return toast.error("Fill all fields")
    setSending(true)
    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, text: body }),
    })
    if (res.ok) {
      const data = await res.json()
      const sendRes = await fetch(`/api/emails/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", replyText: body }),
      })
      if (sendRes.ok) {
        toast.success("Email sent!")
        setTo(""); setSubject(""); setBody("")
      } else {
        toast.error("Could not send (check SMTP settings)")
      }
    } else {
      toast.error("Failed to create email")
    }
    setSending(false)
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Compose email</h1>
      <p className="text-sm text-zinc-500">Write freely — AI can polish it for you before sending.</p>

      <Card className="mt-6 shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="to">To</Label>
            <Input id="to" className="col-span-3" placeholder="recipient@example.com" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" className="col-span-3" placeholder="Subject line" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email here..."
              className="min-h-[300px] text-base leading-relaxed"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={polish} disabled={polishing}>
              {polishing ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>} Polish with AI
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost"><Paperclip size={16}/> Attach</Button>
              <Button variant="gradient" onClick={send} disabled={sending}>
                {sending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Send email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
