"use client"

import { Button } from "@/components/ui/button"
import { Key } from "lucide-react"
import { openKeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"

export function ShortcutsButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => openKeyboardShortcutsHelp()}
      className="fixed bottom-4 right-4 z-50 gap-2"
    >
      <Key className="h-4 w-4" />
      <span>Keyboard Shortcuts</span>
    </Button>
  )
}

