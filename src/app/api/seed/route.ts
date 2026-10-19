import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.email.count({ where: { userId: user.id } })
  if (existing > 0) {
    return NextResponse.json({ message: "Inbox already has emails", count: existing })
  }

  const now = new Date()
  const m = (mins: number) => new Date(now.getTime() - mins * 60000)

  const demoEmails: Array<{
      fromAddress: string; fromName: string; toAddress: string; subject: string;
      bodyText: string; category: any; priority: any; createdAt: Date; receivedAt: Date;
    }> = [
    {
      fromAddress: "sarah.chen@stripe.com",
      fromName: "Sarah Chen",
      toAddress: user.email!,
      subject: "Interview at Stripe — Scheduling for this week?",
      bodyText: "Hi there!\n\nI came across your profile and was really impressed. We have an open Senior Software Engineer position on the Payments team that looks like a great match. Would you be available for a 30-minute chat this Thursday at 2pm PT? Happy to work around your schedule.\n\nLooking forward to hearing from you!\nSarah\nTechnical Recruiter, Stripe",
      category: "INTERVIEW_REQUEST" as const,
      priority: "HIGH" as const,
      createdAt: m(10),
      receivedAt: m(10),
    },
    {
      fromAddress: "careers@google.com",
      fromName: "Google Recruiting",
      toAddress: user.email!,
      subject: "Your application to Staff SWE — next steps",
      bodyText: "Hello,\n\nThank you for applying to the Staff Software Engineer position at Google. We reviewed your profile and would love to move forward. Please complete the following technical assessment and let us know your availability for a phone screen.\n\nBest,\nGoogle Recruiting Team",
      category: "JOB_RECRUITMENT" as const,
      priority: "HIGH" as const,
      createdAt: m(60),
      receivedAt: m(60),
    },
    {
      fromAddress: "hr@startup.io",
      fromName: "Alex Rivera",
      toAddress: user.email!,
      subject: "Quick follow-up on our chat last week",
      bodyText: "Hey! Just following up on our conversation about the Lead Engineer role. The team loved your background and we'd like to invite you on-site. Are you still interested? Let me know what works.\n\nCheers,\nAlex",
      category: "FOLLOW_UP" as const,
      priority: "HIGH" as const,
      createdAt: m(180),
      receivedAt: m(180),
    },
    {
      fromAddress: "no-reply@notion.so",
      fromName: "Notion",
      toAddress: user.email!,
      subject: "What's new in Notion: AI blocks, databases, and more",
      bodyText: "Check out what's new this month:\n- AI blocks now in beta\n- New database views\n- Better mobile performance\nSee all updates →",
      category: "NEWSLETTER" as const,
      priority: "LOW" as const,
      createdAt: m(360),
      receivedAt: m(360),
    },
    {
      fromAddress: "offers@spotify.com",
      fromName: "Spotify",
      toAddress: user.email!,
      subject: "🎉 We'd love to extend an offer",
      bodyText: "Dear candidate,\n\nAfter careful consideration, we are delighted to extend an offer for the Senior Backend Engineer position. Please find the offer letter attached. We'd love to have you join the team!\n\nBest,\nSpotify Talent Team",
      category: "OFFER" as const,
      priority: "URGENT" as const,
      createdAt: m(60 * 24),
      receivedAt: m(60 * 24),
    },
    {
      fromAddress: "jobs@company.com",
      fromName: "HR Department",
      toAddress: user.email!,
      subject: "Update on your application",
      bodyText: "Thank you for your interest in the position. After careful review, we have decided to move forward with other candidates whose experience more closely matches our current needs. We appreciate the time you invested and encourage you to apply for future openings.\n\nBest regards,\nHR Team",
      category: "REJECTION" as const,
      priority: "NORMAL" as const,
      createdAt: m(60 * 48),
      receivedAt: m(60 * 48),
    },
  ]

  // Create and AI-process them
  const created = await Promise.all(
    demoEmails.map((data) =>
      prisma.email.create({
        data: { ...data, userId: user.id, snippet: data.bodyText.slice(0, 120), status: "RECEIVED", folder: "inbox" } as any,
      })
    )
  )

  // Generate AI suggestions (using heuristic fallback if no key)
  const { analyzeEmail } = await import("@/lib/ai")
  for (const e of created) {
    const analysis = await analyzeEmail(e.subject, e.fromAddress, e.bodyText || "")
    await prisma.email.update({
      where: { id: e.id },
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
  }

  return NextResponse.json({ message: "Seeded", count: created.length })
}
