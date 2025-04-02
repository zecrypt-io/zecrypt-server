"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, UserPlus, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InviteMemberModalProps {
  onClose: () => void
}

export function InviteMemberModal({ onClose }: InviteMemberModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Invite Team Member</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

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

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button>Add Selected User</Button>
            </div>
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

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button>Send Invitation</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

