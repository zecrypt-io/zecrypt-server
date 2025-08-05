"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Mail, Copy, Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InviteMemberDialogProps {
  onClose: () => void
}

export function InviteMemberDialog({ onClose }: InviteMemberDialogProps) {
  const [activeTab, setActiveTab] = useState("email")
  const [email, setEmail] = useState("")
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Invite Team Member</h2>
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
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option>Admin</option>
                <option>Member</option>
                <option>Viewer</option>
              </select>
              <p className="text-xs text-muted-foreground">
                <strong>Admin:</strong> Can manage workspace settings and members
                <br />
                <strong>Member:</strong> Can create and edit passwords
                <br />
                <strong>Viewer:</strong> Can only view passwords
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Personal Message (Optional)</label>
              <textarea
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
              <label className="text-sm font-medium">Invite Link</label>
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly />
                <Button variant="outline" size="icon" onClick={copyInviteLink} className="flex-shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link will expire in 7 days. Anyone with this link can join your workspace.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Default Role for Link Invites</label>
              <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option>Member</option>
                <option>Viewer</option>
              </select>
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

