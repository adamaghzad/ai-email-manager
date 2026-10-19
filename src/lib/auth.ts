import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import type { NextRequest } from "next/server"

async function hashPassword(password: string): Promise<string> {
  const bcrypt = (await import("bcryptjs")).default
  return bcrypt.hash(password, 12)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = (await import("bcryptjs")).default
  return bcrypt.compare(password, hash)
}

export { hashPassword, verifyPassword }

const VERCEL_ENV = process.env.VERCEL_ENV
const DEFAULT_NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

function isHttps(url: string) {
  return url.startsWith("https://") || url.includes("vercel.app") || url.includes("e2b.app")
}

export function buildAuthOptions(req?: NextRequest): NextAuthOptions {
  // Dynamically detect host from the incoming request so cookies work on Arena previews
  let detectedOrigin = DEFAULT_NEXTAUTH_URL.replace(/\/$/, "")
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host")
    const proto = req.headers.get("x-forwarded-proto") || (host?.includes("e2b.app") || host?.includes("vercel.app") ? "https" : "http")
    if (host) detectedOrigin = `${proto}://${host}`
  }

  const isPreview = detectedOrigin.includes("e2b.app") || detectedOrigin.includes("vercel.app")
  const secure = isHttps(detectedOrigin) || VERCEL_ENV === "production" || isPreview
  // In cross-origin preview contexts (Arena iframe), SameSite=None is required
  const sameSite: "strict" | "lax" | "none" = isPreview ? "none" : "lax"
  const cookiePrefix = secure ? "__Secure-" : ""

  return {
    adapter: PrismaAdapter(prisma) as any,
    session: { strategy: "jwt" },
    useSecureCookies: secure,
    cookies: {
      sessionToken: {
        name: `${cookiePrefix}next-auth.session-token`,
        options: { httpOnly: true, sameSite, path: "/", secure },
      },
      callbackUrl: {
        name: `${cookiePrefix}next-auth.callback-url`,
        options: { sameSite, path: "/", secure },
      },
      csrfToken: {
        name: secure ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
        options: { httpOnly: true, sameSite, path: "/", secure },
      },
      pkceCodeVerifier: {
        name: `${cookiePrefix}next-auth.pkce.code_verifier`,
        options: { httpOnly: true, sameSite, path: "/", secure },
      },
      state: {
        name: `${cookiePrefix}next-auth.state`,
        options: { httpOnly: true, sameSite, path: "/", secure },
      },
      nonce: {
        name: `${cookiePrefix}next-auth.nonce`,
        options: { httpOnly: true, sameSite, path: "/", secure },
      },
    },
    pages: { signIn: "/login", newUser: "/register" },
    providers: [
      CredentialsProvider({
        name: "Email",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          })
          if (!user || !user.password) return null
          const isValid = await verifyPassword(credentials.password, user.password)
          if (!isValid) return null
          return { id: user.id, email: user.email, name: user.name, image: user.image }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) token.id = user.id
        return token
      },
      async session({ session, token }) {
        if (session.user) session.user.id = token.id as string
        return session
      },
      async redirect({ url, baseUrl }) {
        // Use detected origin (passed via baseUrl from handler)
        if (url.startsWith("/")) return `${baseUrl}${url}`
        try {
          const target = new URL(url)
          const base = new URL(baseUrl)
          if (target.origin === base.origin || target.hostname.endsWith("e2b.app") || target.hostname.endsWith("vercel.app")) {
            return url
          }
        } catch {}
        return baseUrl
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
}

// For places that need a static authOptions (they won't have host detection)
export const authOptions: NextAuthOptions = buildAuthOptions()
