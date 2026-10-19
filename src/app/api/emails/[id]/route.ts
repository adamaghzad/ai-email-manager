import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { sendMail, resolveUploadPath } from "@/lib/email"
import fs from "fs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const email = await prisma.email.findFirst({
      where: { id, userId: user.id },
      include: {
        attachments: true,
        replies: { orderBy: { createdAt: "asc" }, include: { attachments: true } },
        parentEmail: { include: { attachments: true } },
        jobApplication: true,
      },
    })
    if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (!email.read) {
      await prisma.email.update({ where: { id }, data: { read: true } })
    }
    return NextResponse.json(email)
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
    const email = await prisma.email.findFirst({ where: { id, userId: user.id } })
    if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await prisma.email.update({
      where: { id },
      data: {
        ...(body.approvedReply !== undefined && { approvedReply: body.approvedReply, approved: true }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.starred !== undefined && { starred: body.starred }),
        ...(body.folder !== undefined && { folder: body.folder, status: body.folder === "trash" ? "TRASHED" : email.status }),
        ...(body.aiSuggestedReply !== undefined && { aiSuggestedReply: body.aiSuggestedReply }),
      },
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    await prisma.email.updateMany({ where: { id, userId: user.id }, data: { status: "TRASHED", folder: "trash" } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// POST with action=approve-and-send
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const { action, replyText } = await req.json()
    const email = await prisma.email.findFirst({
      where: { id, userId: user.id },
      include: { attachments: true, user: { include: { settings: true, cv: true } } },
    })
    if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (action === "approve-and-send" || action === "send") {
      const text = replyText || email.approvedReply || email.aiSuggestedReply
      if (!text) return NextResponse.json({ error: "No reply text" }, { status: 400 })

      // Attach original email's attachments? No — replies typically don't re-attach.
      // If user has CV and the category is job related, do NOT auto-attach unless it's a new app.
      const info = await sendMail({
        to: email.fromAddress,
        from: user.settings?.senderName ? `${user.settings.senderName} <${user.email}>` : user.email!,
        subject: email.subject.toLowerCase().startsWith("re:") ? email.subject : `Re: ${email.subject}`,
        text,
        inReplyTo: email.externalId || undefined,
        references: email.externalId || undefined,
      })

      const reply = await prisma.email.create({
        data: {
          userId: user.id,
          fromAddress: user.email!,
          fromName: user.name || user.email!,
          toAddress: email.fromAddress,
          subject: email.subject.toLowerCase().startsWith("re:") ? email.subject : `Re: ${email.subject}`,
          bodyText: text,
          category: email.category,
          status: "SENT",
          folder: "sent",
          sentAt: new Date(),
          parentEmailId: email.id,
          snippet: text.slice(0, 120),
        },
      })

      await prisma.email.update({
        where: { id },
        data: {
          status: "SENT",
          approved: true,
          approvedReply: text,
          sentAt: new Date(),
        },
      })

      return NextResponse.json({ ok: true, reply, info: { messageId: info.messageId } })
    }

    if (action === "ai-reply") {
      const { generateReply } = await import("@/lib/ai")
      const tone = (email.aiTone as any) || "professional"
      const suggested = await generateReply(email.subject, email.fromAddress, email.bodyText || email.bodyHtml || "", tone)
      const updated = await prisma.email.update({
        where: { id },
        data: { aiSuggestedReply: suggested, status: "PENDING_APPROVAL" },
      })
      return NextResponse.json(updated)
    }

    if (action === "ai-analyze") {
      const { analyzeEmail } = await import("@/lib/ai")
      const analysis = await analyzeEmail(email.subject, email.fromAddress, email.bodyText || email.bodyHtml || "")
      const updated = await prisma.email.update({
        where: { id },
        data: {
          aiSummary: analysis.summary,
          aiCategory: analysis.category,
          aiSuggestedReply: analysis.suggestedReply,
          aiTone: analysis.tone,
          category: analysis.category,
          priority: analysis.priority,
          status: analysis.needsReply && analysis.suggestedReply ? "PENDING_APPROVAL" : "AI_PROCESSED",
        },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e: any) {
    console.error(e)
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
