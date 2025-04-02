"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, Key, Search, Home, User, FileText, Bell, Settings, LogOut, Plus, Lock, Smile } from "lucide-react"
import { useState, useEffect } from "react"

export function openKeyboardShortcutsHelp() {
  document.dispatchEvent(new CustomEvent("open-keyboard-shortcuts"))
}

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts dialog when pressing Shift+?
      if (e.shiftKey && e.key === "?") {
        e.preventDefault()
        setOpen(true)
      }
    }

    const handleOpenShortcuts = () => {
      setOpen(true)
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("open-keyboard-shortcuts", handleOpenShortcuts)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("open-keyboard-shortcuts", handleOpenShortcuts)
    }
  }, [])

  const shortcuts = [
    {
      category: "General",
      items: [
        { keys: ["⌘", "K"], description: "Open command palette", icon: <Command className="h-4 w-4" /> },
        { keys: ["Shift", "?"], description: "Show keyboard shortcuts", icon: <Key className="h-4 w-4" /> },
        { keys: ["/"], description: "Focus search", icon: <Search className="h-4 w-4" /> },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["⌘", "D"], description: "Go to Dashboard", icon: <Home className="h-4 w-4" /> },
        { keys: ["⌘", "A"], description: "Go to Accounts", icon: <User className="h-4 w-4" /> },
        { keys: ["⌘", "F"], description: "Go to Files", icon: <FileText className="h-4 w-4" /> },
        { keys: ["⌘", "N"], description: "Go to Notifications", icon: <Bell className="h-4 w-4" /> },
      ],
    },
    {
      category: "Actions",
      items: [
        { keys: ["⌘", "G"], description: "Generate password", icon: <Key className="h-4 w-4" /> },
        { keys: ["⌘", "P"], description: "Switch project", icon: <Lock className="h-4 w-4" /> },
        { keys: ["⌘", "+"], description: "Add new account", icon: <Plus className="h-4 w-4" /> },
      ],
    },
    {
      category: "Settings",
      items: [
        { keys: ["⌘", "S"], description: "Open settings", icon: <Settings className="h-4 w-4" /> },
        { keys: ["⌘", "T"], description: "Toggle theme", icon: <Smile className="h-4 w-4" /> },
        { keys: ["⌘", "L"], description: "Logout", icon: <LogOut className="h-4 w-4" /> },
      ],
    },
  ]

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-50 gap-2">
        <Key className="h-4 w-4" />
        <span>Keyboard Shortcuts</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Use these keyboard shortcuts to work more efficiently in Zecrypt</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h3 className="font-medium text-lg mb-2">{category.category}</h3>
                <div className="space-y-2">
                  {category.items.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                      <div className="flex items-center gap-2">
                        {shortcut.icon}
                        <span>{shortcut.description}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded border border-border">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && <span>+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted p-4 rounded-md mt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> On Windows and Linux, use{" "}
              <kbd className="px-1 py-0.5 text-xs font-semibold bg-background rounded border border-border">Ctrl</kbd>{" "}
              instead of{" "}
              <kbd className="px-1 py-0.5 text-xs font-semibold bg-background rounded border border-border">⌘</kbd>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

