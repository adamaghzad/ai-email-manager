"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

type SelectContextValue = { value?: string; onChange: (v: string) => void }
const SelectContext = React.createContext<SelectContextValue | null>(null)

export function Select({ children, value, onValueChange, defaultValue }: {
  children: React.ReactNode
  value?: string
  onValueChange?: (v: string) => void
  defaultValue?: string
}) {
  const [internal, setInternal] = React.useState(defaultValue || "")
  const v = value ?? internal
  const onChange = (newV: string) => {
    onValueChange?.(newV)
    if (value === undefined) setInternal(newV)
  }
  return <SelectContext.Provider value={{ value: v, onChange }}>{children}</SelectContext.Provider>
}

export function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(SelectContext)
  const [open, setOpen] = React.useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-left",
          className
        )}
      >
        <span className="truncate">{children}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1 max-h-60 overflow-auto">
            {React.Children.map(children, (c) => c)}
            {/* content injected via SelectContent below but for simplicity we render items within SelectContent */}
          </div>
        </>
      )}
    </div>
  )
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(SelectContext)
  return (
    <button
      type="button"
      onClick={() => {
        ctx?.onChange(value)
      }}
      className={cn(
        "flex w-full items-center px-3 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer",
        ctx?.value === value && "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
      )}
    >
      {children}
    </button>
  )
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext)
  return <>{ctx?.value || <span className="text-zinc-400">{placeholder}</span>}</>
}
