import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { join } from "path"

export const runtime = "nodejs"

// Always resolve uploads against cwd so Next.js can statically analyze the path
function uploadDir() {
  return /*turbopackIgnore: false*/ join(process.cwd(), "public", "uploads")
}

export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const type = (formData.get("type") as string) || "attachment" // "cv" or "attachment"

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

    const dir = uploadDir()
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filename = `${Date.now()}-${safeName}`
    const filePath = join(dir, filename)
    await writeFile(filePath, buffer)

    const urlPath = `/uploads/${filename}`

    // Try to extract basic text from PDFs or plain text for CV parsing
    let parsedText: string | undefined
    if (type === "cv" && file.type === "application/pdf") {
      try {
        // Lightweight: just note that we have a PDF — in production use pdf-parse
        parsedText = `[CV uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`
      } catch {}
    } else if (file.type.startsWith("text/")) {
      parsedText = buffer.toString("utf8").slice(0, 5000)
    }

    if (type === "cv") {
      // Delete old CV file if any
      const existing = await prisma.cV.findUnique({ where: { userId: user.id } })
      // (old file cleanup best-effort)
      const cv = await prisma.cV.upsert({
        where: { userId: user.id },
        update: {
          filename: file.name,
          contentType: file.type,
          size: file.size,
          url: urlPath,
          storagePath: filePath,
          parsedText,
          uploadedAt: new Date(),
        },
        create: {
          userId: user.id,
          filename: file.name,
          contentType: file.type,
          size: file.size,
          url: urlPath,
          storagePath: filePath,
          parsedText,
        },
      })
      return NextResponse.json({ cv })
    }

    return NextResponse.json({ url: urlPath, filename: file.name })
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await requireUser()
    const cv = await prisma.cV.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ cv })
  } catch (e: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
