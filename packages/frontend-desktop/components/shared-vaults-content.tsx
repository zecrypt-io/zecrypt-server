"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, SortDesc, Lock, Users, FolderLock } from "lucide-react"
import { CreateVaultDialog } from "@/components/create-vault-dialog"

export function SharedVaultsContent() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const vaults = [
    {
      name: "Development Credentials",
      description: "API keys and development environment credentials",
      members: 8,
      items: 24,
      createdAt: "2023-09-15",
      icon: "D",
    },
    {
      name: "Marketing Team",
      description: "Social media and marketing platform credentials",
      members: 5,
      items: 12,
      createdAt: "2023-10-22",
      icon: "M",
    },
    {
      name: "Executive Access",
      description: "Restricted access credentials for executive team",
      members: 3,
      items: 9,
      createdAt: "2023-11-05",
      icon: "E",
    },
    {
      name: "HR Documents",
      description: "Secure storage for HR documents and credentials",
      members: 4,
      description: "Secure storage for HR documents and credentials",
      members: 4,
      items: 15,
      createdAt: "2024-01-10",
      icon: "H",
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shared Vaults</h1>
          <p className="text-muted-foreground">Manage secure vaults for team collaboration</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Create Vault
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
          <Input type="search" placeholder="Search vaults..." className="pl-8" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vaults.map((vault, index) => (
          <div
            key={index}
            className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                {vault.icon}
              </div>
              <div>
                <h3 className="font-medium">{vault.name}</h3>
                <p className="text-xs text-muted-foreground">{vault.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span>{vault.members} members</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-muted-foreground" />
                <span>{vault.items} items</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Created {vault.createdAt}</span>
              <Button variant="outline" size="sm" className="gap-1">
                <FolderLock className="h-3 w-3" />
                <span>Open</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showCreateDialog && <CreateVaultDialog onClose={() => setShowCreateDialog(false)} />}
    </div>
  )
}

