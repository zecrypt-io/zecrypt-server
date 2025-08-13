"use client"

import * as React from "react"
import { Check, Palette } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getDb } from "@/libs/sqlite"

const themes = [
  { name: "Blue", value: "theme-blue" },
  { name: "Green", value: "theme-green" },
  { name: "Purple", value: "theme-purple" },
  { name: "Orange", value: "theme-orange" },
  { name: "Pink", value: "theme-pink" },
]

export function ThemeColorPicker() {
  const [currentTheme, setCurrentTheme] = React.useState("theme-blue")

  React.useEffect(() => {
    ;(async () => {
      try {
        const db = await getDb()
        const rows = await db.select('SELECT value FROM settings WHERE key = $1', ['color-theme'])
        const savedTheme = (rows?.[0]?.value as string) || 'theme-blue'
        setCurrentTheme(savedTheme)
        document.documentElement.classList.remove(...themes.map((t) => t.value))
        document.documentElement.classList.add(savedTheme)
      } catch {
        const fallback = 'theme-blue'
        setCurrentTheme(fallback)
        document.documentElement.classList.remove(...themes.map((t) => t.value))
        document.documentElement.classList.add(fallback)
      }
    })()
  }, [])

  const setTheme = (theme: string) => {
    // Remove all theme classes and add the selected one
    document.documentElement.classList.remove(...themes.map((t) => t.value))
    document.documentElement.classList.add(theme)

    // Save to settings (SQLite)
    ;(async () => {
      const db = await getDb()
      await db.execute('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value = excluded.value', ['color-theme', theme])
    })()
    setCurrentTheme(theme)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change accent color</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setTheme(theme.value)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full"
                style={{
                  backgroundColor:
                    theme.value === "theme-blue"
                      ? "hsl(221.2, 83.2%, 53.3%)"
                      : theme.value === "theme-green"
                        ? "hsl(142.1, 76.2%, 36.3%)"
                        : theme.value === "theme-purple"
                          ? "hsl(262.1, 83.3%, 57.8%)"
                          : theme.value === "theme-orange"
                            ? "hsl(24.6, 95%, 53.1%)"
                            : "hsl(346.8, 77.2%, 49.8%)",
                }}
              />
              <span>{theme.name}</span>
            </div>
            {currentTheme === theme.value && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

