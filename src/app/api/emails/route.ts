import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)
    const folder = searchParams.get("folder") || "inbox"
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const q = searchParams.get("q")

    const where: any = { userId: user.id }
    if (folder === "inbox") where.folder = "inbox"
    else if (folder === "sent") where.status = "SENT"
    else if (folder === "drafts") where.status = "DRAFTED"
    else if (folder === "trash") where.status = "TRASHED"
    if (category) where.category = category
    if (status) where.status = status
    if (q) {
      where.OR = [
        { subject: { contains: q, mode: "insensitive" } },
        { fromName: { contains: q, mode: "insensitive" } },
        { fromAddress: { contains: q, mode: "insensitive" } },
        { bodyText: { contains: q, mode: "insensitive" } },
      ]
    }

    const emails = await prisma.email.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { attachments: true, _count: { select: { replies: true } } },
    })
    return NextResponse.json(emails)
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const { to, subject, text, html, category = "OTHER", attachments = [] } = body

    if (!to || !subject) {
      return NextResponse.json({ error: "Missing to/subject" }, { status: 400 })
    }

    const email = await prisma.email.create({
      data: {
        userId: user.id,
        fromAddress: user.email!,
        fromName: user.name || user.email!,
        toAddress: to,
        subject,
        bodyText: text,
        bodyHtml: html,
        snippet: (text || "").slice(0, 120),
        category,
        status: "DRAFTED",
        folder: "drafts",
      },
    })
    return NextResponse.json(email)
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
