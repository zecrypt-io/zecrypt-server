"use client"

import * as React from "react"
import { Check, Palette } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
    // Get the current theme from localStorage or default to blue
    const savedTheme = localStorage.getItem("color-theme") || "theme-blue"
    setCurrentTheme(savedTheme)

    // Apply the theme to the document
    document.documentElement.classList.remove(...themes.map((t) => t.value))
    document.documentElement.classList.add(savedTheme)
  }, [])

  const setTheme = (theme: string) => {
    // Remove all theme classes and add the selected one
    document.documentElement.classList.remove(...themes.map((t) => t.value))
    document.documentElement.classList.add(theme)

    // Save to localStorage
    localStorage.setItem("color-theme", theme)
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

