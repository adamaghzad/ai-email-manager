"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export function Switch({ checked, onCheckedChange, className, disabled }: {
  checked?: boolean
  onCheckedChange?: (v: boolean) => void
  className?: string
  disabled?: boolean
}) {
  const [internal, setInternal] = React.useState(false)
  const isOn = checked ?? internal
  const toggle = () => {
    if (disabled) return
    const n = !isOn
    onCheckedChange?.(n)
    if (checked === undefined) setInternal(n)
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        isOn ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow",
          isOn ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  )
}
