"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Building, Users, Plus } from "lucide-react"
import { WorkspaceSwitcherDialog } from "@/components/workspace-switcher-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function WorkspaceSwitcher() {
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false)
  const [currentWorkspace, setCurrentWorkspace] = useState({
    name: "Personal Workspace",
    type: "personal",
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              {currentWorkspace.type === "personal" ? (
                <Users className="h-4 w-4 text-primary" />
              ) : (
                <Building className="h-4 w-4 text-primary" />
              )}
              <span className="truncate">{currentWorkspace.name}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setCurrentWorkspace({
                name: "Personal Workspace",
                type: "personal",
              })
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Personal Workspace</span>
            {currentWorkspace.name === "Personal Workspace" && (
              <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setCurrentWorkspace({
                name: "Acme Corp",
                type: "organization",
              })
            }}
          >
            <Building className="mr-2 h-4 w-4" />
            <span>Acme Corp</span>
            {currentWorkspace.name === "Acme Corp" && <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setCurrentWorkspace({
                name: "Startup Inc",
                type: "organization",
              })
            }}
          >
            <Building className="mr-2 h-4 w-4" />
            <span>Startup Inc</span>
            {currentWorkspace.name === "Startup Inc" && (
              <span className="ml-auto h-2 w-2 rounded-full bg-primary"></span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => setShowWorkspaceDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Workspace</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => setShowWorkspaceDialog(true)}>
            <Users className="mr-2 h-4 w-4" />
            <span>Manage Workspaces</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showWorkspaceDialog && (
        <WorkspaceSwitcherDialog
          onClose={() => setShowWorkspaceDialog(false)}
          onSelect={(workspace) => {
            setCurrentWorkspace(workspace)
            setShowWorkspaceDialog(false)
          }}
        />
      )}
    </>
  )
}

