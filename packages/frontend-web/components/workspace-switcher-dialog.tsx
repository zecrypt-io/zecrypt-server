"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Plus, Building, Users, UserPlus, Settings, Lock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Workspace {
  name: string
  type: "personal" | "organization"
}

interface WorkspaceSwitcherDialogProps {
  onClose: () => void
  onSelect: (workspace: Workspace) => void
}

export function WorkspaceSwitcherDialog({ onClose, onSelect }: WorkspaceSwitcherDialogProps) {
  const [activeTab, setActiveTab] = useState("workspaces")
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)

  const workspaces = [
    { name: "Personal Workspace", type: "personal" as const, members: 1 },
    { name: "Acme Corp", type: "organization" as const, members: 15 },
    { name: "Startup Inc", type: "organization" as const, members: 5 },
  ]

  const teamMembers = [
    { name: "Sadik Ali", email: "sadik@example.com", role: "Admin", avatar: "/placeholder.svg?height=40&width=40" },
    { name: "John Doe", email: "john@example.com", role: "Member", avatar: "/placeholder.svg?height=40&width=40" },
    { name: "Jane Smith", email: "jane@example.com", role: "Member", avatar: "/placeholder.svg?height=40&width=40" },
    {
      name: "Robert Johnson",
      email: "robert@example.com",
      role: "Viewer",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-lg bg-card p-6 border border-border shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Workspace Management</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="workspaces" className="space-y-4">
            {!showCreateForm ? (
              <Button
                className="w-full flex items-center justify-center gap-2 py-6 border-dashed border-2 border-border bg-muted/50 hover:bg-muted"
                variant="outline"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="h-5 w-5" />
                <span>Create New Workspace</span>
              </Button>
            ) : (
              <div className="p-4 border rounded-md border-border mb-4">
                <h3 className="text-lg font-medium mb-4">Create New Workspace</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Workspace Name</label>
                    <Input
                      placeholder="Enter workspace name"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Workspace Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col items-center gap-2 p-4 border rounded-md border-border cursor-pointer hover:border-primary">
                        <Users className="h-8 w-8 text-primary" />
                        <span className="text-sm font-medium">Personal</span>
                        <p className="text-xs text-muted-foreground text-center">
                          For individual use with limited sharing
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-4 border rounded-md border-border cursor-pointer hover:border-primary">
                        <Building className="h-8 w-8 text-primary" />
                        <span className="text-sm font-medium">Organization</span>
                        <p className="text-xs text-muted-foreground text-center">
                          For teams with advanced sharing and roles
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                    <Button>Create Workspace</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Your Workspaces</h3>
              <div className="grid gap-4">
                {workspaces.map((workspace, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-md border-border hover:border-primary cursor-pointer"
                    onClick={() => onSelect(workspace)}
                  >
                    <div className="flex items-center gap-3">
                      {workspace.type === "personal" ? (
                        <Users className="h-10 w-10 p-2 rounded-md bg-primary/10 text-primary" />
                      ) : (
                        <Building className="h-10 w-10 p-2 rounded-md bg-primary/10 text-primary" />
                      )}
                      <div>
                        <h4 className="font-medium">{workspace.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {workspace.type === "personal" ? "Personal" : "Organization"} • {workspace.members}{" "}
                          {workspace.members === 1 ? "member" : "members"}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      {workspace.type === "personal" ? "Manage" : "Settings"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Team Members</h3>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Invite Member</span>
              </Button>
            </div>

            <div className="border rounded-md border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-medium text-sm">User</th>
                    <th className="text-left p-3 font-medium text-sm">Role</th>
                    <th className="text-left p-3 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            member.role === "Admin"
                              ? "bg-primary/10 text-primary"
                              : member.role === "Member"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-500">
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Workspace Settings</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace Name</label>
                <Input defaultValue="Acme Corp" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace Description</label>
                <Input defaultValue="Main workspace for Acme Corporation" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Security Settings</h3>

              <div className="flex items-center justify-between p-4 border rounded-md border-border">
                <div className="flex items-center gap-3">
                  <Lock className="h-10 w-10 p-2 rounded-md bg-primary/10 text-primary" />
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Require 2FA for all workspace members</p>
                  </div>
                </div>
                <Button variant="outline">Enable</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md border-border">
                <div className="flex items-center gap-3">
                  <Settings className="h-10 w-10 p-2 rounded-md bg-primary/10 text-primary" />
                  <div>
                    <h4 className="font-medium">Password Policies</h4>
                    <p className="text-sm text-muted-foreground">Set minimum requirements for passwords</p>
                  </div>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

