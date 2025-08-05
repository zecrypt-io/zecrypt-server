"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Key,
  Plus,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  MoreHorizontal,
  Filter,
  SortDesc,
  X,
} from "lucide-react"
import { AddAccountDialog } from "@/components/add-account-dialog"
import { GeneratePasswordDialog } from "@/components/generate-password-dialog"
import { EditAccountDialog } from "@/components/edit-account-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export function FavouritesContent() {
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showGeneratePassword, setShowGeneratePassword] = useState(false)
  const [showEditAccount, setShowEditAccount] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<(typeof accounts)[0] | null>(null)
  const [copiedField, setCopiedField] = useState<{ id: number; field: string } | null>(null)
  const [viewPassword, setViewPassword] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const searchParams = useSearchParams()
  const tagFilter = searchParams?.get("tag") || ""

  const accounts = [
    {
      id: 1,
      name: "Google",
      username: "user@gmail.com",
      password: "••••••••••••",
      actualPassword: "strongpassword1",
      url: "https://google.com",
      logo: "G",
      category: "personal",
      created: "01/09/2024",
      modified: "03/09/2024",
      tags: ["Personal", "Email"],
      isFavorite: true,
    },
    {
      id: 4,
      name: "Netflix",
      username: "family@example.com",
      password: "••••••••••",
      actualPassword: "netflixpass!",
      url: "https://netflix.com",
      logo: "N",
      category: "personal",
      created: "01/09/2024",
      modified: "03/09/2024",
      tags: ["Entertainment", "Personal"],
      isFavorite: true,
    },
  ]

  const copyToClipboard = async (id: number, field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField({ id, field })
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  const togglePasswordVisibility = (id: number) => {
    setViewPassword(viewPassword === id ? null : id)
  }

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || account.category === selectedCategory
    const matchesTag = !tagFilter || (account.tags && account.tags.some((tag) => tag === tagFilter))
    return matchesSearch && matchesCategory && matchesTag
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Favourites</h1>
          <p className="text-muted-foreground">Your favourite accounts and passwords</p>
          {tagFilter && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm">Filtered by tag:</span>
              <Badge variant="secondary" className="flex items-center gap-1">
                {tagFilter}
                <Link href="/dashboard/favourites">
                  <X className="h-3 w-3 ml-1" />
                </Link>
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="finance">Finance</option>
          </select>

          <Button variant="outline" size="icon" className="h-9 w-9">
            <Filter className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" className="h-9 w-9">
            <SortDesc className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search favourites..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            variant="default"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setShowGeneratePassword(true)}
          >
            <Key className="h-4 w-4" />
            Generate
          </Button>

          <Button variant="outline" className="gap-2" onClick={() => setShowAddAccount(true)}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-sm">Account</th>
                <th className="text-left p-3 font-medium text-sm">Username</th>
                <th className="text-left p-3 font-medium text-sm">Password</th>
                <th className="text-left p-3 font-medium text-sm">Category</th>
                <th className="text-left p-3 font-medium text-sm">Tags</th>
                <th className="text-left p-3 font-medium text-sm">Last Modified</th>
                <th className="text-left p-3 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium">
                        {account.logo}
                      </div>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <a
                          href={account.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {account.url.replace("https://", "")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{account.username}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyToClipboard(account.id, "username", account.username)}
                            >
                              {copiedField?.id === account.id && copiedField?.field === "username" ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {copiedField?.id === account.id && copiedField?.field === "username"
                                ? "Copied!"
                                : "Copy username"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {viewPassword === account.id ? account.actualPassword : account.password}
                      </span>
                      <div className="flex items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => togglePasswordVisibility(account.id)}
                              >
                                {viewPassword === account.id ? (
                                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{viewPassword === account.id ? "Hide password" : "Show password"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => copyToClipboard(account.id, "password", account.actualPassword)}
                              >
                                {copiedField?.id === account.id && copiedField?.field === "password" ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {copiedField?.id === account.id && copiedField?.field === "password"
                                  ? "Copied!"
                                  : "Copy password"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {account.category}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {account.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {account.isFavorite && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-amber-100 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
                        >
                          <Star className="h-3 w-3 text-amber-500 mr-1" />
                          Favorite
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{account.modified}</td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAccount(account)
                            setShowEditAccount(true)
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAccounts.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No favourite accounts found. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAccounts.length} of {accounts.length} favourite accounts
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>

      {showAddAccount && <AddAccountDialog onClose={() => setShowAddAccount(false)} />}
      {showGeneratePassword && <GeneratePasswordDialog onClose={() => setShowGeneratePassword(false)} />}
      {showEditAccount && selectedAccount && (
        <EditAccountDialog
          account={selectedAccount}
          onClose={() => {
            setShowEditAccount(false)
            setSelectedAccount(null)
          }}
        />
      )}
    </div>
  )
}

function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

