"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Lock, Users, Shield } from "lucide-react"

interface CreateVaultDialogProps {
  onClose: () => void
}

export function CreateVaultDialog({ onClose }: CreateVaultDialogProps) {
  const [vaultName, setVaultName] = useState("")
  const [vaultDescription, setVaultDescription] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Create Shared Vault</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vault Name</label>
            <Input
              placeholder="e.g., Development Team"
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Brief description of this vault's purpose"
              value={vaultDescription}
              onChange={(e) => setVaultDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Access Level</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-md border-border p-3 cursor-pointer hover:border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">Team Access</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  All workspace members can access this vault based on their roles
                </p>
              </div>
              <div className="border rounded-md border-border p-3 cursor-pointer hover:border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-medium">Restricted</span>
                </div>
                <p className="text-xs text-muted-foreground">Only specific members you invite can access this vault</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Security Options</label>
            <div className="flex items-center gap-2 p-3 border rounded-md border-border">
              <div className="flex h-5 w-5 items-center justify-center rounded-md border border-primary bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3 text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Require Master Password</p>
                <p className="text-xs text-muted-foreground">
                  Members must enter their master password to access this vault
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button className="gap-2">
              <Lock className="h-4 w-4" />
              Create Vault
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

