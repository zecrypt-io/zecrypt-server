"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash, Check, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProjectDialogProps {
  onClose: () => void
}

export function ProjectDialog({ onClose }: ProjectDialogProps) {
  const [activeTab, setActiveTab] = useState("select")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const projects = [
    {
      id: "1",
      name: "Personal Vault",
      description: "Store your personal passwords and documents",
      color: "#4f46e5", // indigo
      items: 24,
      isDefault: true,
    },
    {
      id: "2",
      name: "Work Credentials",
      description: "Professional accounts and passwords",
      color: "#0ea5e9", // sky blue
      items: 15,
      isDefault: false,
    },
    {
      id: "3",
      name: "Family Documents",
      description: "Shared family information and credentials",
      color: "#10b981", // emerald
      items: 8,
      isDefault: false,
    },
    {
      id: "4",
      name: "Travel Information",
      description: "Passports, bookings, and travel accounts",
      color: "#f59e0b", // amber
      items: 12,
      isDefault: false,
    },
  ]

  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId)
    // In a real app, this would update the current project in state/context
    onClose()
  }

  const handleEditProject = (projectId: string) => {
    setSelectedProject(projectId)
    setShowEditDialog(true)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Projects</DialogTitle>
          <DialogDescription>Select a project or create a new one</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Select Project</TabsTrigger>
            <TabsTrigger value="manage">Manage Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-4 py-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-6 border-dashed"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-5 w-5" />
              <span>Create New Project</span>
            </Button>

            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary cursor-pointer transition-colors"
                  onClick={() => handleSelectProject(project.id)}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    <div className="h-5 w-5 rounded-full" style={{ backgroundColor: project.color }}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{project.name}</p>
                      {project.isDefault && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Default</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{project.items} items</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 py-4">
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary transition-colors"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    <div className="h-5 w-5 rounded-full" style={{ backgroundColor: project.color }}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{project.name}</p>
                      {project.isDefault && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Default</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditProject(project.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!project.isDefault && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete project</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{project.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Create New Project</span>
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Edit Project Dialog */}
      {showEditDialog && selectedProject && (
        <EditProjectDialog
          project={projects.find((p) => p.id === selectedProject)!}
          onClose={() => setShowEditDialog(false)}
        />
      )}

      {/* Create Project Dialog */}
      {showCreateDialog && <CreateProjectDialog onClose={() => setShowCreateDialog(false)} />}
    </Dialog>
  )
}

interface EditProjectDialogProps {
  project: {
    id: string
    name: string
    description: string
    color: string
    isDefault: boolean
  }
  onClose: () => void
}

function EditProjectDialog({ project, onClose }: EditProjectDialogProps) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [color, setColor] = useState(project.color)
  const [isDefault, setIsDefault] = useState(project.isDefault)

  const colors = [
    { name: "Indigo", value: "#4f46e5" },
    { name: "Sky", value: "#0ea5e9" },
    { name: "Emerald", value: "#10b981" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Violet", value: "#8b5cf6" },
  ]

  const handleSave = () => {
    // In a real app, this would update the project in the database
    console.log("Saving project:", { id: project.id, name, description, color, isDefault })
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update your project details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Project Color</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${color === c.value ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                >
                  {color === c.value && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="default-project"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="default-project" className="cursor-pointer">
              Set as default project
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateProjectDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#4f46e5") // Default to indigo

  const colors = [
    { name: "Indigo", value: "#4f46e5" },
    { name: "Sky", value: "#0ea5e9" },
    { name: "Emerald", value: "#10b981" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Violet", value: "#8b5cf6" },
  ]

  const handleCreate = () => {
    // In a real app, this would create a new project in the database
    console.log("Creating project:", { name, description, color })
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Add a new project to organize your passwords and files</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-project-name">Project Name</Label>
            <Input
              id="new-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-project-description">Description (Optional)</Label>
            <Textarea
              id="new-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this project"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Project Color</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${color === c.value ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                >
                  {color === c.value && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

