"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Mail, Copy, Check, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddTeamMemberDialogProps {
  onClose: () => void
}

export function AddTeamMemberDialog({ onClose }: AddTeamMemberDialogProps) {
  const [activeTab, setActiveTab] = useState("email")
  const [emails, setEmails] = useState<string[]>([])
  const [currentEmail, setCurrentEmail] = useState("")
  const [copied, setCopied] = useState(false)
  const inviteLink = "https://zecrypt.app/invite/abc123xyz456"

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  const addEmail = () => {
    if (currentEmail && !emails.includes(currentEmail)) {
      setEmails([...emails, currentEmail])
      setCurrentEmail("")
    }
  }

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addEmail()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Team Members</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="email">Email Invite</TabsTrigger>
            <TabsTrigger value="link">Invite Link</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Addresses</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button type="button" onClick={addEmail} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {emails.length > 0 && (
              <div className="border rounded-md border-border p-2 space-y-2">
                {emails.map((email, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                    <span className="text-sm">{email}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeEmail(email)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select defaultValue="member">
                <SelectTrigger id="role">
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
              <Label htmlFor="personal-message">Personal Message (Optional)</Label>
              <textarea
                id="personal-message"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[100px]"
                placeholder="Add a personal message to your invitation..."
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button className="gap-2">
                <Mail className="h-4 w-4" />
                Send Invitation
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-link">Invite Link</Label>
              <div className="flex items-center gap-2">
                <Input id="invite-link" value={inviteLink} readOnly />
                <Button variant="outline" size="icon" onClick={copyInviteLink} className="flex-shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link will expire in 7 days. Anyone with this link can join your workspace.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-role">Default Role for Link Invites</Label>
              <Select defaultValue="member">
                <SelectTrigger id="default-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button className="gap-2" onClick={copyInviteLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

