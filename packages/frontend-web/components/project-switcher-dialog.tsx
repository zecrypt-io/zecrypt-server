"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ProjectSwitcherDialogProps {
  onClose: () => void
  onSelect: (project: string) => void
}

export function ProjectSwitcherDialog({ onClose, onSelect }: ProjectSwitcherDialogProps) {
  const projects = ["Test Project", "Personal Project 1", "Personal Project 2"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-zinc-900 p-6">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">Projects</h2>
        </div>

        <div className="mb-6">
          <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-6">
            <PlusIcon className="h-5 w-5" />
            <span>Create New Project</span>
          </Button>
        </div>

        <div className="space-y-2 mb-6">
          {projects.map((project, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-md border border-zinc-800 p-3 cursor-pointer hover:bg-zinc-800"
              onClick={() => onSelect(project)}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700">
                {index === 0 && <div className="h-3 w-3 rounded-full bg-white"></div>}
              </div>
              <span>{project}</span>
            </div>
          ))}
        </div>

        <Button className="w-full" onClick={() => onClose()}>
          Continue
        </Button>

        <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => onClose()}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

