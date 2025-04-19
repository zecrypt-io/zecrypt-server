"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Folder, Lock, Share, Shield, Users, AlertCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ProjectSettingsContent() {
  const [activeTab, setActiveTab] = useState("general")
  const [projectName, setProjectName] = useState("Personal Vault")
  const [projectDescription, setProjectDescription] = useState("Store your personal passwords and documents")
  const [projectColor, setProjectColor] = useState("#4f46e5") // Indigo
  const [isDefault, setIsDefault] = useState(true)
  const [autoLock, setAutoLock] = useState(true)
  const [autoLockTime, setAutoLockTime] = useState("5")
  const [requireMasterPassword, setRequireMasterPassword] = useState(true)
  
  const colors = [
    { name: "Indigo", value: "#4f46e5" },
    { name: "Sky", value: "#0ea5e9" },
    { name: "Emerald", value: "#10b981" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Violet", value: "#8b5cf6" },
  ]
  
  const teamMembers = [
    {
      id: "1",
      name: "Sadik Ali",
      email: "sadik@example.com",
      role: "Owner",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "2",
      name: "John Doe",
      email: "john@example.com",
      role: "Editor",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "3",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Viewer",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]
  
  const handleSaveGeneral = () => {
    // In a real app, this would save the project details to the database
    console.log("Saving project details:", { projectName, projectDescription, projectColor, isDefault })
  }
  
  const handleSaveSecurity = () => {
    // In a real app, this would save the security settings to the database
    console.log("Saving security settings:", { autoLock, autoLockTime, requireMasterPassword })
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Project Settings</h1>
          <p className="text-muted-foreground">Manage your project preferences and settings</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-3 mb-6">
          <TabsTrigger value="general">
            <Folder className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="sharing">
            <Share className="mr-2 h-4 w-4" />
            Sharing
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Update your project details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input 
                  id="project-name" 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea 
                  id="project-description" 
                  value={projectDescription} 
                  onChange={(e) => setProjectDescription(e.target.value)} 
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Project Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${projectColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setProjectColor(color.value)}
                      title={color.name}
                    >
                      {projectColor === color.value && <Check className="h-5 w-5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="default-project" 
                  checked={isDefault} 
                  onChange={(e) => setIsDefault(e.target.checked)} 
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="default-project" className="cursor-pointer">Set as default project</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveGeneral}>Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="text-red-500">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-400">Irreversible actions that affect your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md border-red-200 dark:border-red-900 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Delete Project</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this project and all its data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950"
                        disabled={isDefault}
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete project</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your project and remove all
                          associated data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-500 hover:bg-red-600">Delete Project</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                {isDefault && (
                  <p className="text-xs text-red-500 mt-2">
                    You cannot delete your default project. Please set another project as default first.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security options for this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-Lock Project</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically lock this project after a period of inactivity
                    </p>
                  </div>
                  <Switch 
                    checked={autoLock} 
                    onCheckedChange={setAutoLock} 
                  />
                </div>
                
                {autoLock && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="auto-lock-time">Lock after (minutes)</Label>
                    <Input 
                      id="auto-lock-time" 
                      type="number" 
                      value={autoLockTime} 
                      onChange={(e) => setAutoLockTime(e.target.value)} 
                      min="1" 
                      max="60" 
                      className="w-24"
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Require Master Password</h3>
                    <p className="text-sm text-muted-foreground">
                      Require master password to access this project, even when logged in
                    </p>
                  </div>
                  <Switch 
                    checked={requireMasterPassword} 
                    onCheckedChange={setRequireMasterPassword} 
                  />
                </div>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-md">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Security Tip</h4>
                    <p className="text-sm text-muted-foreground">
                      For sensitive projects, we recommend enabling both auto-lock and master password requirements.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSecurity}>Save Security Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Sharing Tab */}
        <TabsContent value="sharing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Sharing</CardTitle>
              <CardDescription>Manage who has access to this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Team Members</h3>
                <Button size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Invite Member
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
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="border-t border-border">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            member.role === 'Owner' 
                              ? 'bg-primary/10 text-primary' 
                              : member.role === 'Editor'
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'bg-green-500/10 text-green-500'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {member.role !== 'Owner' && (
                              <>
                                <select className="rounded-md border border-border bg-background px-2 py-1 text-sm">
                                  <option value="editor">Editor</option>
                                  <option value="viewer">Viewer</option>
                                </select>
                                <Button variant="ghost" size="sm" className="text-red-500">
                                  Remove
                                </Button>
                              </>
                            )}
                            {member.role === 'Owner' && (
                              <span className="text-xs text-muted-foreground">Project Owner</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-md">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Sharing Permissions</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Owner:</strong> Full control over the project, including deletion
                      <br />
                      <strong>Editor:</strong> Can add, edit, and delete items in the project
                      <br />
                      <strong>Viewer:</strong> Can only view items, cannot make changes
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sharing Options</CardTitle>
              <CardDescription>Configure how this project can be shared</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Allow Editors to Invite Others</h3>
                  <p className="text-sm text-muted-foreground">
                    Let users with Editor role invite new members to this project
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Allow Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Allow users to export data from this project
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Require Approval for New Members</h3>
                  <p className="text-sm text-muted-foreground">
                    Owner must approve all new member requests
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Sharing Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

