"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  React.useEffect(() => {
    const handleThemeToggle = () => {
      // Toggle between light and dark based on the current resolved theme
      if (resolvedTheme === "dark") {
        setTheme("light")
      } else {
        setTheme("dark")
      }
    }

    document.addEventListener("toggle-theme-event", handleThemeToggle)

    // Also handle Cmd+T shortcut directly
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "t") {
        e.preventDefault()
        handleThemeToggle()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("toggle-theme-event", handleThemeToggle)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [resolvedTheme, setTheme])

  // Direct toggle function for the button
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="rounded-full h-8 w-8"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

