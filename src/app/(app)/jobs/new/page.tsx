"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Briefcase, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function NewJobPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    company: "",
    position: "",
    recruiterName: "",
    recruiterEmail: "",
    jobDescription: "",
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      const job = await res.json()
      toast.success("Application created! Generating cover letter...")
      // Auto-generate cover letter
      await fetch(`/api/jobs/${job.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-letter" }),
      })
      router.push(`/jobs/${job.id}`)
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || "Failed to create")
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link href="/jobs"><Button variant="ghost" size="sm"><ArrowLeft size={16}/> Back to jobs</Button></Link>
      <h1 className="mt-4 text-3xl font-bold">New job application</h1>
      <p className="mt-1 text-zinc-500">
        Fill in the basics — we'll generate a tailored cover letter using AI and attach your CV automatically.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase size={18}/> Application details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input id="company" placeholder="Acme Inc." value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input id="position" placeholder="Senior Software Engineer" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required/>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recruiterName">Recruiter name (optional)</Label>
                <Input id="recruiterName" placeholder="Jane Smith" value={form.recruiterName} onChange={(e) => setForm({ ...form, recruiterName: e.target.value })}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recruiterEmail">Recruiter email *</Label>
                <Input id="recruiterEmail" type="email" placeholder="jane@company.com" value={form.recruiterEmail} onChange={(e) => setForm({ ...form, recruiterEmail: e.target.value })} required/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job description / notes (optional, helps AI)</Label>
              <Textarea id="jobDescription" placeholder="Paste the job posting or a few notes about the role. This helps AI personalize your cover letter." className="min-h-[140px]" value={form.jobDescription} onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}/>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Link href="/jobs"><Button type="button" variant="ghost">Cancel</Button></Link>
              <Button type="submit" variant="gradient" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                Create & generate cover letter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
