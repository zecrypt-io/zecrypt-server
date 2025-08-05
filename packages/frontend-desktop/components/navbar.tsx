"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Command, Key, Lock } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { openKeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"

export function Navbar() {
  return (
    <header className="flex h-14 items-center border-b border-border px-4 lg:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <Lock className="h-5 w-5" />
        <span>Zecrypt</span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => openKeyboardShortcutsHelp()}>
          <Key className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
        >
          <Command className="h-4 w-4" />
        </Button>

        <ThemeToggle />
      </div>
    </header>
  )
}

