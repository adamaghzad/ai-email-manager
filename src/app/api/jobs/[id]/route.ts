import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { sendMail, resolveUploadPath } from "@/lib/email"
import fs from "fs"
import path from "path"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const job = await prisma.jobApplication.findFirst({
      where: { id, userId: user.id },
      include: { cv: true, sentEmail: true },
    })
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(job)
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await req.json()
    const job = await prisma.jobApplication.findFirst({ where: { id, userId: user.id } })
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        ...(body.company !== undefined && { company: body.company }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.recruiterEmail !== undefined && { recruiterEmail: body.recruiterEmail }),
        ...(body.recruiterName !== undefined && { recruiterName: body.recruiterName }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.coverLetter !== undefined && { coverLetter: body.coverLetter, aiGeneratedLetter: body.coverLetter }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.followUpDate !== undefined && { followUpDate: body.followUpDate ? new Date(body.followUpDate) : null }),
      },
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const { action } = await req.json()
    const job = await prisma.jobApplication.findFirst({
      where: { id, userId: user.id },
      include: { cv: true, user: { include: { settings: true } } },
    })
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (action === "generate-letter") {
      const { generateCoverLetter } = await import("@/lib/ai")
      const letter = await generateCoverLetter({
        company: job.company,
        position: job.position,
        recruiterName: job.recruiterName || undefined,
        jobDescription: job.notes || undefined,
        candidateName: user.name || "Candidate",
        cvSummary: job.cv?.parsedText || undefined,
      })
      const updated = await prisma.jobApplication.update({
        where: { id },
        data: { aiGeneratedLetter: letter, coverLetter: letter, status: "READY_TO_SEND" },
      })
      return NextResponse.json(updated)
    }

    if (action === "send") {
      const letter = job.coverLetter || job.aiGeneratedLetter
      if (!letter) return NextResponse.json({ error: "No cover letter. Generate one first." }, { status: 400 })

      const subject = `Application: ${job.position} at ${job.company}`
      const attachments: any[] = []
      if (job.cv && job.cv.storagePath) {
        const p = path.isAbsolute(job.cv.storagePath) ? job.cv.storagePath : resolveUploadPath(path.basename(job.cv.storagePath))
        if (fs.existsSync(p)) {
          attachments.push({ filename: job.cv.filename, path: p, contentType: job.cv.contentType })
        } else if (job.cv.url) {
          attachments.push({ filename: job.cv.filename, path: path.resolve("./public" + job.cv.url) })
        }
      }

      const info = await sendMail({
        to: job.recruiterEmail,
        from: user.settings?.senderName ? `${user.settings.senderName} <${user.email}>` : user.email!,
        subject,
        text: letter,
        attachments,
      })

      // Create sent email record
      const email = await prisma.email.create({
        data: {
          userId: user.id,
          fromAddress: user.email!,
          fromName: user.name || user.email!,
          toAddress: job.recruiterEmail,
          subject,
          bodyText: letter,
          snippet: letter.slice(0, 120),
          category: "JOB_RECRUITMENT",
          status: "SENT",
          folder: "sent",
          sentAt: new Date(),
        },
      })

      const updated = await prisma.jobApplication.update({
        where: { id },
        data: { status: "SENT", sentEmailId: email.id, appliedAt: new Date() },
      })

      return NextResponse.json({ ok: true, job: updated, messageId: info.messageId })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e: any) {
    console.error(e)
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    await prisma.jobApplication.deleteMany({ where: { id, userId: user.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
