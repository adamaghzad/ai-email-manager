"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export function Avatar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white font-semibold text-sm", className)}>
      {children}
    </span>
  )
}
export function AvatarImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null
  return <img src={src} alt={alt} className="h-full w-full object-cover" />
}
export function AvatarFallback({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>
}
