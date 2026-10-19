import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "InboxAI — Smart Email Manager",
  description:
    "AI-powered email assistant that classifies your inbox, drafts replies, automates job applications, and sends with your approval.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
