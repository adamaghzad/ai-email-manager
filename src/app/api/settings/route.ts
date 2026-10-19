import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

export async function GET() {
  try {
    const user = await requireUser()
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    })
    // Never send secrets back in full — mask password
    return NextResponse.json({
      ...settings,
      smtpPass: settings.smtpPass ? "********" : null,
      imapPass: settings.imapPass ? "********" : null,
      openaiApiKey: settings.openaiApiKey ? "********" : null,
    })
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser()
    const body = await req.json()

    const data: any = { ...body }
    // If password fields are masked values (********), don't overwrite
    if (data.smtpPass === "********" || data.smtpPass === "") delete data.smtpPass
    if (data.imapPass === "********" || data.imapPass === "") delete data.imapPass
    if (data.openaiApiKey === "********" || data.openaiApiKey === "") delete data.openaiApiKey

    // Determine connection status based on SMTP config
    if (data.smtpHost || data.smtpUser) {
      data.emailConnected = !!(data.smtpHost && data.smtpUser && (data.smtpPass || (await prisma.userSettings.findUnique({ where: { userId: user.id } }))?.smtpPass))
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    })

    return NextResponse.json(settings)
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // Test SMTP connection
  try {
    const user = await requireUser()
    const { sendTestEmail } = await req.json().catch(() => ({}))
    const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } })
    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
      return NextResponse.json({ ok: false, error: "SMTP not fully configured" }, { status: 400 })
    }
    const { getTransporter } = await import("@/lib/email")
    const t = getTransporter({
      host: settings.smtpHost, port: settings.smtpPort || 587,
      user: settings.smtpUser, pass: settings.smtpPass,
    })
    await t.verify()
    if (sendTestEmail) {
      const { sendMail } = await import("@/lib/email")
      await sendMail({
        to: user.email!,
        subject: "Test email from InboxAI",
        text: "This is a test email from your InboxAI account. SMTP is configured correctly! 🎉",
      })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
