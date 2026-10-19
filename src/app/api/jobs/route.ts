import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

export async function GET() {
  try {
    const user = await requireUser()
    const jobs = await prisma.jobApplication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { cv: true, sentEmail: true },
    })
    return NextResponse.json(jobs)
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const { company, position, recruiterEmail, recruiterName, jobDescription, coverLetter } = body
    if (!company || !position || !recruiterEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const cv = await prisma.cV.findUnique({ where: { userId: user.id } })
    const job = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        company,
        position,
        recruiterEmail,
        recruiterName: recruiterName || null,
        notes: jobDescription || null,
        coverLetter: coverLetter || null,
        cvId: cv?.id,
        status: "DRAFT",
      },
    })

    return NextResponse.json(job)
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
