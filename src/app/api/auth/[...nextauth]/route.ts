import NextAuth from "next-auth"
import { buildAuthOptions } from "@/lib/auth"
import type { NextRequest } from "next/server"

const handler = async (req: NextRequest, ctx: any) => {
  return NextAuth(req, ctx, buildAuthOptions(req))
}

export { handler as GET, handler as POST }

// Force dynamic so we have access to request headers for host detection
export const dynamic = "force-dynamic"
