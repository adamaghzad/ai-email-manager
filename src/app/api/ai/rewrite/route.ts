import { NextResponse } from "next/server"
import { requireUser } from "@/lib/session"
import { rewriteText } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    await requireUser()
    const { text, action = "polish" } = await req.json()
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 })

    const rewritten = await rewriteText(text, action as any)
    return NextResponse.json({ text: rewritten })
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
