"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserPlus, Search, Filter, SortDesc } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InviteMemberDialog } from "@/components/invite-member-dialog"

export function TeamMembersContent() {
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const teamMembers = [
    {
      name: "Sadik Ali",
      email: "sadik@example.com",
      role: "Admin",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "active",
      lastActive: "Just now",
    },
    {
      name: "John Doe",
      email: "john@example.com",
      role: "Member",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "active",
      lastActive: "5 minutes ago",
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Member",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "active",
      lastActive: "1 hour ago",
    },
    {
      name: "Robert Johnson",
      email: "robert@example.com",
      role: "Viewer",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "inactive",
      lastActive: "2 days ago",
    },
    {
      name: "Emily Davis",
      email: "emily@example.com",
      role: "Member",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "pending",
      lastActive: "Never",
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">Manage your workspace team members and permissions</p>
        </div>
        <Button className="gap-2" onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <SortDesc className="h-4 w-4" />
            Sort
          </Button>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search members..." className="pl-8" />
        </div>
      </div>

      <div className="border rounded-md border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-sm">User</th>
              <th className="text-left p-3 font-medium text-sm">Role</th>
              <th className="text-left p-3 font-medium text-sm">Status</th>
              <th className="text-left p-3 font-medium text-sm">Last Active</th>
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
                <td className="p-3 text-sm">{member.lastActive}</td>
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

      {showInviteDialog && <InviteMemberDialog onClose={() => setShowInviteDialog(false)} />}
    </div>
  )
}

