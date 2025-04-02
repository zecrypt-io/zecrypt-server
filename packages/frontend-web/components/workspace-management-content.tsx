"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Users,
  Shield,
  UserPlus,
  Search,
  Copy,
  Check,
  Trash,
  Edit,
  Save,
  X,
  AlertCircle,
  Briefcase,
  Plus,
  ArrowRight,
  ChevronRight,
  Eye,
} from "lucide-react"
import { AddTeamMemberDialog } from "@/components/add-team-member-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export function WorkspaceManagementContent() {
  const [activeTab, setActiveTab] = useState("members")
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("Acme Corp")
  const [workspaceDescription, setWorkspaceDescription] = useState("Main workspace for Acme Corporation")
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)
  const inviteLink = "https://zecrypt.app/invite/abc123xyz456"
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false)

  // First, let's add a state for editing workspace details
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editedWorkspaceName, setEditedWorkspaceName] = useState("")
  const [editedWorkspaceDescription, setEditedWorkspaceDescription] = useState("")
  const [editedWorkspaceType, setEditedWorkspaceType] = useState("")

  const teamMembers = [
    {
      id: "1",
      name: "Sadik Ali",
      email: "sadik@example.com",
      role: "Admin",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "active",
      lastActive: "Just now",
      workspaces: ["Acme Corp", "Personal"],
      permissions: {
        manageMembers: true,
        manageVaults: true,
        viewAuditLog: true,
        manageSettings: true,
      },
    },
    {
      id: "2",
      name: "John Doe",
      email: "john@example.com",
      role: "Member",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "active",
      lastActive: "5 minutes ago",
      workspaces: ["Acme Corp"],
      permissions: {
        manageMembers: false,
        manageVaults: true,
        viewAuditLog: true,
        manageSettings: false,
      },
    },
    {
      id: "3",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Member",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "active",
      lastActive: "1 hour ago",
      workspaces: ["Acme Corp", "Marketing Team"],
      permissions: {
        manageMembers: false,
        manageVaults: true,
        viewAuditLog: false,
        manageSettings: false,
      },
    },
    {
      id: "4",
      name: "Robert Johnson",
      email: "robert@example.com",
      role: "Viewer",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "inactive",
      lastActive: "2 days ago",
      workspaces: ["Acme Corp"],
      permissions: {
        manageMembers: false,
        manageVaults: false,
        viewAuditLog: false,
        manageSettings: false,
      },
    },
  ]

  const workspaces = [
    {
      id: "1",
      name: "Acme Corp",
      description: "Main workspace for Acme Corporation",
      type: "Business",
      members: 4,
      vaults: 3,
      owner: "Sadik Ali",
      createdAt: "Jan 15, 2023",
    },
    {
      id: "2",
      name: "Personal",
      description: "Personal workspace for Sadik Ali",
      type: "Personal",
      members: 1,
      vaults: 2,
      owner: "Sadik Ali",
      createdAt: "Jan 10, 2023",
    },
    {
      id: "3",
      name: "Marketing Team",
      description: "Workspace for marketing team projects",
      type: "Team",
      members: 2,
      vaults: 1,
      owner: "Sadik Ali",
      createdAt: "Feb 5, 2023",
    },
    {
      id: "4",
      name: "Client Projects",
      description: "Workspace for client-facing projects",
      type: "Business",
      members: 3,
      vaults: 4,
      owner: "Sadik Ali",
      createdAt: "Mar 20, 2023",
    },
  ]

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  const handleViewWorkspaceDetails = (workspaceId: string) => {
    setSelectedWorkspace(workspaceId)
    setActiveTab("workspaceDetails")
  }

  const handleBackToWorkspaces = () => {
    setSelectedWorkspace(null)
    setActiveTab("workspaces")
  }

  // Add this function to handle starting the edit mode
  const handleEditWorkspace = (workspace) => {
    setEditedWorkspaceName(workspace.name)
    setEditedWorkspaceDescription(workspace.description)
    setEditedWorkspaceType(workspace.type.toLowerCase())
    setIsEditingDetails(true)
  }

  // Add this function to handle saving the edited workspace details
  const handleSaveWorkspaceDetails = () => {
    // Here you would typically save the changes to your backend
    // For now, we'll just exit edit mode
    setIsEditingDetails(false)
  }

  const currentWorkspace = selectedWorkspace ? workspaces.find((w) => w.id === selectedWorkspace) : null
  const workspaceMembers = teamMembers.filter(
    (member) => currentWorkspace && member.workspaces.includes(currentWorkspace.name),
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workspace Management</h1>
          <p className="text-muted-foreground">Manage your workspace settings, members, and permissions</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-3 mb-6">
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="workspaces">
            <Briefcase className="mr-2 h-4 w-4" />
            Workspaces
          </TabsTrigger>
          <TabsTrigger value="access">
            <Shield className="mr-2 h-4 w-4" />
            Access Control
          </TabsTrigger>
        </TabsList>

        {/* Team Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search members..." className="pl-8" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={copyInviteLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Invite Link"}
              </Button>
              <Button className="gap-2" onClick={() => setShowAddMemberDialog(true)}>
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            </div>
          </div>

          <div className="border rounded-md border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium text-sm">User</th>
                  <th className="text-left p-3 font-medium text-sm">Role</th>
                  <th className="text-left p-3 font-medium text-sm">Status</th>
                  <th className="text-left p-3 font-medium text-sm">Workspaces</th>
                  <th className="text-left p-3 font-medium text-sm">Last Active</th>
                  <th className="text-left p-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-t border-border">
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
                      {editingMember === member.id ? (
                        <Select defaultValue={member.role.toLowerCase()}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
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
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          member.status === "active"
                            ? "bg-green-500/10 text-green-500"
                            : member.status === "inactive"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {member.status === "active" ? "Active" : member.status === "inactive" ? "Inactive" : "Pending"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {member.workspaces.map((workspace, i) => (
                          <span key={i} className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                            {workspace}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-sm">{member.lastActive}</td>
                    <td className="p-3">
                      {editingMember === member.id ? (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingMember(null)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingMember(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingMember(member.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-500 hover:text-red-500">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove team member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.name} from this workspace? This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-500 hover:bg-red-600">Remove</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Workspaces Tab */}
        <TabsContent value="workspaces" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search workspaces..." className="pl-8" />
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Workspace
            </Button>
          </div>

          <div className="border rounded-md border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium text-sm">Workspace</th>
                  <th className="text-left p-3 font-medium text-sm">Type</th>
                  <th className="text-left p-3 font-medium text-sm">Members</th>
                  <th className="text-left p-3 font-medium text-sm">Vaults</th>
                  <th className="text-left p-3 font-medium text-sm">Owner</th>
                  <th className="text-left p-3 font-medium text-sm">Created</th>
                  <th className="text-left p-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((workspace) => (
                  <tr key={workspace.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div>
                        <p
                          className="font-medium cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                          onClick={() => handleViewWorkspaceDetails(workspace.id)}
                        >
                          {workspace.name}
                          <ChevronRight className="h-4 w-4" />
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{workspace.description}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          workspace.type === "Business"
                            ? "bg-primary/10 text-primary"
                            : workspace.type === "Team"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-green-500/10 text-green-500"
                        }`}
                      >
                        {workspace.type}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{workspace.members}</td>
                    <td className="p-3 text-sm">{workspace.vaults}</td>
                    <td className="p-3 text-sm">{workspace.owner}</td>
                    <td className="p-3 text-sm">{workspace.createdAt}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleViewWorkspaceDetails(workspace.id)}
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-500">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete workspace</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{workspace.name}" workspace? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Workspace Details Tab */}
        <TabsContent value="workspaceDetails" className="space-y-6">
          {currentWorkspace && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Button variant="outline" size="sm" onClick={handleBackToWorkspaces}>
                  <ArrowRight className="h-4 w-4 rotate-180 mr-1" />
                  Back to Workspaces
                </Button>
                <h2 className="text-xl font-semibold">{currentWorkspace.name}</h2>
              </div>

              {/* Add nested tabs for workspace details */}
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="members">Team Members</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6">
                  {/* Overview Card */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle>Workspace Information</CardTitle>
                        {!isEditingDetails && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleEditWorkspace(currentWorkspace)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit Details
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isEditingDetails ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-workspace-name">Workspace Name</Label>
                            <Input
                              id="edit-workspace-name"
                              value={editedWorkspaceName}
                              onChange={(e) => setEditedWorkspaceName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-workspace-description">Description</Label>
                            <Textarea
                              id="edit-workspace-description"
                              value={editedWorkspaceDescription}
                              onChange={(e) => setEditedWorkspaceDescription(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-workspace-type">Workspace Type</Label>
                            <Select value={editedWorkspaceType} onValueChange={setEditedWorkspaceType}>
                              <SelectTrigger id="edit-workspace-type">
                                <SelectValue placeholder="Select workspace type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="team">Team</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setIsEditingDetails(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveWorkspaceDetails}>Save Changes</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-muted-foreground">Type</p>
                                <p className="font-medium">
                                  <span
                                    className={`inline-flex px-2 py-1 rounded-full text-xs ${
                                      currentWorkspace.type === "Business"
                                        ? "bg-primary/10 text-primary"
                                        : currentWorkspace.type === "Team"
                                          ? "bg-blue-500/10 text-blue-500"
                                          : "bg-green-500/10 text-green-500"
                                    }`}
                                  >
                                    {currentWorkspace.type}
                                  </span>
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Owner</p>
                                <p className="font-medium">{currentWorkspace.owner}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Created</p>
                                <p className="font-medium">{currentWorkspace.createdAt}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-muted-foreground">Members</p>
                                <p className="text-2xl font-bold">{currentWorkspace.members}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Vaults</p>
                                <p className="text-2xl font-bold">{currentWorkspace.vaults}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Description</p>
                                <p className="text-sm">{currentWorkspace.description}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Danger Zone Card */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-red-500 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Danger Zone
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md border-red-200 dark:border-red-900 p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <Trash className="h-4 w-4 text-red-500" />
                          </div>
                          <div>
                            <h3 className="font-medium">Delete Workspace</h3>
                            <p className="text-xs text-muted-foreground">
                              Permanently delete this workspace and all its data
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950"
                            >
                              Delete Workspace
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete workspace</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your workspace and remove all
                                associated data from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-500 hover:bg-red-600">
                                Delete Workspace
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Team Members Tab */}
                <TabsContent value="members" className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Team Members</h3>
                    <Button size="sm" className="gap-1" onClick={() => setShowInviteMemberModal(true)}>
                      <UserPlus className="h-4 w-4" />
                      Add Member
                    </Button>
                  </div>

                  <div className="border rounded-md border-border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-3 font-medium text-sm">User</th>
                          <th className="text-left p-3 font-medium text-sm">Role</th>
                          <th className="text-left p-3 font-medium text-sm">Status</th>
                          <th className="text-left p-3 font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workspaceMembers.map((member) => (
                          <tr key={member.id} className="border-t border-border">
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
                              <Select defaultValue={member.role.toLowerCase()}>
                                <SelectTrigger className="w-[120px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  member.status === "active"
                                    ? "bg-green-500/10 text-green-500"
                                    : member.status === "inactive"
                                      ? "bg-yellow-500/10 text-yellow-500"
                                      : "bg-blue-500/10 text-blue-500"
                                }`}
                              >
                                {member.status === "active"
                                  ? "Active"
                                  : member.status === "inactive"
                                    ? "Inactive"
                                    : "Pending"}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <Button>Save Changes</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </TabsContent>

        {/* Access Control Tab */}
        <TabsContent value="access" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>Define what each role can do in your workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Admin</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="admin-manage-members">Manage Team Members</Label>
                      <Switch id="admin-manage-members" defaultChecked disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="admin-manage-vaults">Manage Vaults</Label>
                      <Switch id="admin-manage-vaults" defaultChecked disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="admin-view-audit">View Audit Log</Label>
                      <Switch id="admin-view-audit" defaultChecked disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="admin-manage-settings">Manage Workspace Settings</Label>
                      <Switch id="admin-manage-settings" defaultChecked disabled />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Member</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="member-manage-members">Manage Team Members</Label>
                      <Switch id="member-manage-members" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="member-manage-vaults">Manage Vaults</Label>
                      <Switch id="member-manage-vaults" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="member-view-audit">View Audit Log</Label>
                      <Switch id="member-view-audit" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="member-manage-settings">Manage Workspace Settings</Label>
                      <Switch id="member-manage-settings" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Viewer</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="viewer-manage-members">Manage Team Members</Label>
                      <Switch id="viewer-manage-members" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="viewer-manage-vaults">Manage Vaults</Label>
                      <Switch id="viewer-manage-vaults" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="viewer-view-audit">View Audit Log</Label>
                      <Switch id="viewer-view-audit" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="viewer-manage-settings">Manage Workspace Settings</Label>
                      <Switch id="viewer-manage-settings" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Permissions</CardTitle>
                <CardDescription>Set specific permissions for individual team members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Select defaultValue="1">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 pt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-manage-members">Manage Team Members</Label>
                      <Switch id="custom-manage-members" defaultChecked={teamMembers[0].permissions.manageMembers} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-manage-vaults">Manage Vaults</Label>
                      <Switch id="custom-manage-vaults" defaultChecked={teamMembers[0].permissions.manageVaults} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-view-audit">View Audit Log</Label>
                      <Switch id="custom-view-audit" defaultChecked={teamMembers[0].permissions.viewAuditLog} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-manage-settings">Manage Workspace Settings</Label>
                      <Switch id="custom-manage-settings" defaultChecked={teamMembers[0].permissions.manageSettings} />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button className="w-full">Save Custom Permissions</Button>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <h3 className="text-lg font-medium">Access Requests</h3>
                  <div className="border rounded-md border-border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Emily Davis" />
                          <AvatarFallback>ED</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Emily Davis</p>
                          <p className="text-sm text-muted-foreground">emily@example.com</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Deny
                        </Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {showAddMemberDialog && <AddTeamMemberDialog onClose={() => setShowAddMemberDialog(false)} />}
      {showInviteMemberModal && <InviteMemberModal onClose={() => setShowInviteMemberModal(false)} />}
    </div>
  )
}

const InviteMemberModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md border border-border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Invite Team Member</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invite Team Member</CardTitle>
              <CardDescription>Search for existing users or send an email invitation</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="search" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="search">Search Users</TabsTrigger>
                  <TabsTrigger value="email">Email Invite</TabsTrigger>
                </TabsList>

                <TabsContent value="search" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search users by name or email..." className="pl-8" />
                  </div>

                  <div className="border rounded-md border-border p-2 max-h-[200px] overflow-y-auto">
                    <div className="p-2 hover:bg-muted/50 rounded-md cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Emily Davis" />
                          <AvatarFallback>ED</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">Emily Davis</p>
                          <p className="text-xs text-muted-foreground">emily@example.com</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 hover:bg-muted/50 rounded-md cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Michael Johnson" />
                          <AvatarFallback>MJ</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">Michael Johnson</p>
                          <p className="text-xs text-muted-foreground">michael@example.com</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 hover:bg-muted/50 rounded-md cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Sarah Wilson" />
                          <AvatarFallback>SW</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">Sarah Wilson</p>
                          <p className="text-xs text-muted-foreground">sarah@example.com</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="search-role">Role</Label>
                    <Select defaultValue="member">
                      <SelectTrigger id="search-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full">Add Selected User</Button>
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input id="invite-email" type="email" placeholder="colleague@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select defaultValue="member">
                      <SelectTrigger id="invite-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-message">Personal Message (Optional)</Label>
                    <Textarea
                      id="invite-message"
                      placeholder="Add a personal message to your invitation..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <Button className="w-full">Send Invitation</Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

