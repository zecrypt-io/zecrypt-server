"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { ProjectSwitcherDialog } from "@/components/project-switcher-dialog"

export function ProjectSwitcher() {
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [currentProject, setCurrentProject] = useState("Test Project")

  return (
    <>
      <Button variant="outline" className="w-full justify-between" onClick={() => setShowProjectDialog(true)}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-zinc-700"></div>
          <span>{currentProject}</span>
        </div>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {showProjectDialog && (
        <ProjectSwitcherDialog
          onClose={() => setShowProjectDialog(false)}
          onSelect={(project) => {
            setCurrentProject(project)
            setShowProjectDialog(false)
          }}
        />
      )}
    </>
  )
}

