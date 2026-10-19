"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

type DialogContextValue = { open: boolean; setOpen: (v: boolean) => void }
const DialogContext = React.createContext<DialogContextValue | null>(null)

export function Dialog({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (v: boolean) => void
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen)
  const open = controlledOpen ?? uncontrolled
  const setOpen = (v: boolean) => {
    onOpenChange?.(v)
    if (controlledOpen === undefined) setUncontrolled(v)
  }
  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
}

export function DialogTrigger({ children }: { children: React.ReactElement<any> }) {
  const ctx = React.useContext(DialogContext)
  if (!ctx) return children
  return React.cloneElement(children as React.ReactElement<any>, {
    onClick: (e: React.MouseEvent) => {
      (children.props as any)?.onClick?.(e)
      ctx.setOpen(true)
    },
  })
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(DialogContext)
  if (!ctx || !ctx.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => ctx.setOpen(false)} />
      <div className={cn("relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl animate-in fade-in zoom-in-95", className)}>
        <button onClick={() => ctx.setOpen(false)} className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-1.5 mb-4", className)}>{children}</div>
}
export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
}
export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-zinc-500 dark:text-zinc-400", className)}>{children}</p>
}
export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex justify-end gap-2 mt-6", className)}>{children}</div>
}
