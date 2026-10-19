import nodemailer, { type Transporter } from "nodemailer"
import type { Attachment as EmailAttachment } from "nodemailer/lib/mailer"
import fs from "fs"
import path from "path"

export type MailOptions = {
  to: string
  subject: string
  text?: string
  html?: string
  from?: string
  attachments?: Array<{
    filename: string
    path?: string
    content?: Buffer | string
    contentType?: string
  }>
  replyTo?: string
  inReplyTo?: string
  references?: string
}

let transporter: Transporter | null = null

export function getTransporter(smtp?: {
  host?: string
  port?: number
  user?: string
  pass?: string
}) {
  if (transporter) return transporter

  const host = smtp?.host || process.env.SMTP_HOST
  const port = Number(smtp?.port || process.env.SMTP_PORT || 587)
  const user = smtp?.user || process.env.SMTP_USER
  const pass = smtp?.pass || process.env.SMTP_PASS

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
    return transporter
  }

  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_your")) {
    transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: process.env.RESEND_API_KEY },
    })
    return transporter
  }

  // Dev fallback: ethereal-like JSON transport that logs to console
  console.warn("[email] No SMTP/Resend configured — emails are logged, not sent.")
  transporter = nodemailer.createTransport({ jsonTransport: true })
  return transporter
}

export async function sendMail(opts: MailOptions) {
  const t = getTransporter()
  const from = opts.from || process.env.EMAIL_FROM || "AI Email Manager <no-reply@example.com>"

  const attachments: EmailAttachment[] = opts.attachments?.map((a) => {
    if (a.path && fs.existsSync(a.path)) {
      return { filename: a.filename, path: a.path, contentType: a.contentType }
    }
    return { filename: a.filename, content: a.content || "", contentType: a.contentType }
  }) || []

  const info = await t.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html || opts.text?.replace(/\n/g, "<br/>"),
    attachments,
    inReplyTo: opts.inReplyTo,
    references: opts.references,
    replyTo: opts.replyTo,
  })

  return info
}

export function resolveUploadPath(rel: string): string {
  return path.join(process.cwd(), "public", "uploads", rel)
}
