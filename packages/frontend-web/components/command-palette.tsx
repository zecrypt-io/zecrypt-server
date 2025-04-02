"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Key,
  Settings,
  Smile,
  User,
  FileText,
  Share,
  Clock,
  HardDrive,
  Bell,
  Lock,
  Plus,
  Search,
  Home,
  LogOut,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    // Add a small delay to ensure the command palette is closed before executing the command
    setTimeout(() => {
      command()
    }, 100)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/accounts"))}>
            <User className="mr-2 h-4 w-4" />
            <span>Accounts</span>
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/files"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>My Files</span>
            <CommandShortcut>⌘F</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/shared"))}>
            <Share className="mr-2 h-4 w-4" />
            <span>Shared with me</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/recent"))}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Recent</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/storage"))}>
            <HardDrive className="mr-2 h-4 w-4" />
            <span>Storage</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/notifications"))}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => document.dispatchEvent(new CustomEvent("toggle-generate-password")))}
          >
            <Key className="mr-2 h-4 w-4" />
            <span>Generate Password</span>
            <CommandShortcut>⌘G</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => document.dispatchEvent(new CustomEvent("toggle-project-dialog")))}
          >
            <Lock className="mr-2 h-4 w-4" />
            <span>Switch Project</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => document.dispatchEvent(new CustomEvent("toggle-add-account")))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Add New Account</span>
            <CommandShortcut>⌘+</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => document.dispatchEvent(new CustomEvent("toggle-search-focus")))}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Focus Search</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/user-settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => document.dispatchEvent(new CustomEvent("toggle-theme-event")))}>
            <Smile className="mr-2 h-4 w-4" />
            <span>Toggle Theme</span>
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => document.dispatchEvent(new CustomEvent("open-keyboard-shortcuts")))}
          >
            <Key className="mr-2 h-4 w-4" />
            <span>Keyboard Shortcuts</span>
            <CommandShortcut>Shift+?</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                console.log("Logging out...")
                // In a real app, this would call your logout function
                // For example: auth.signOut().then(() => router.push('/login'))
              })
            }
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
            <CommandShortcut>⌘L</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

