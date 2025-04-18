"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { AddAccountDialog } from "@/components/add-account-dialog"
import { GeneratePasswordDialog } from "@/components/generate-password-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { EditAccountDialog } from "@/components/edit-account-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslator } from "@/hooks/use-translations"

export function AccountsContent() {
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showGeneratePassword, setShowGeneratePassword] = useState(false)
  const [showEditAccount, setShowEditAccount] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<(typeof accounts)[0] | null>(null)
  const [copiedField, setCopiedField] = useState<{ id: number; field: string } | null>(null)
  const [viewPassword, setViewPassword] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { translate } = useTranslator();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  useEffect(() => {
    const handleAddAccount = () => setShowAddAccount(true)

    document.addEventListener("toggle-add-account", handleAddAccount)

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "+") {
        e.preventDefault()
        setShowAddAccount(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("toggle-add-account", handleAddAccount)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

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
      id: 2,
      name: "Github",
      username: "devuser",
      password: "••••••••••",
      actualPassword: "gitpass123!",
      url: "https://github.com",
      logo: "GH",
      category: "work",
      created: "01/09/2024",
      modified: "03/09/2024",
      tags: ["Work", "Development"],
      isFavorite: false,
    },
    {
      id: 3,
      name: "Microsoft",
      username: "user@outlook.com",
      password: "•••••••••••••",
      actualPassword: "msft2024secure",
      url: "https://microsoft.com",
      logo: "M",
      category: "work",
      created: "01/09/2024",
      modified: "03/09/2024",
      tags: ["Work", "Email"],
      isFavorite: false,
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
    {
      id: 5,
      name: "Spotify",
      username: "musiclover",
      password: "•••••••••",
      actualPassword: "music2024!",
      url: "https://spotify.com",
      logo: "S",
      category: "personal",
      created: "01/09/2024",
      modified: "03/09/2024",
      tags: ["Entertainment", "Music"],
      isFavorite: false,
    },
    {
      id: 6,
      name: "Notion",
      username: "notes@example.com",
      password: "•••••••••••",
      actualPassword: "notionNotes!",
      url: "https://notion.so",
      logo: "N",
      category: "work",
      created: "01/09/2024",
      modified: "03/09/2024",
      tags: ["Work", "Productivity"],
      isFavorite: false,
    },
    {
      id: 7,
      name: "Twitter",
      username: "tweeter@example.com",
      password: "••••••••••",
      actualPassword: "twitter123!",
      url: "https://twitter.com",
      logo: "T",
      category: "personal",
      created: "02/09/2024",
      modified: "04/09/2024",
      tags: ["Social", "Personal"],
      isFavorite: false,
    },
    {
      id: 8,
      name: "LinkedIn",
      username: "professional@example.com",
      password: "••••••••••••",
      actualPassword: "linkedIn2024!",
      url: "https://linkedin.com",
      logo: "L",
      category: "work",
      created: "02/09/2024",
      modified: "04/09/2024",
      tags: ["Work", "Networking"],
      isFavorite: true,
    },
    {
      id: 9,
      name: "Dropbox",
      username: "files@example.com",
      password: "••••••••••",
      actualPassword: "dropboxFiles!",
      url: "https://dropbox.com",
      logo: "D",
      category: "work",
      created: "03/09/2024",
      modified: "05/09/2024",
      tags: ["Work", "Storage"],
      isFavorite: false,
    },
    {
      id: 10,
      name: "Slack",
      username: "team@example.com",
      password: "••••••••••",
      actualPassword: "slackTeam123!",
      url: "https://slack.com",
      logo: "S",
      category: "work",
      created: "03/09/2024",
      modified: "05/09/2024",
      tags: ["Work", "Communication"],
      isFavorite: false,
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

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setCurrentPage(1)
  }

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || account.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{translate("accounts", "accounts")}</h1>
        <p className="text-muted-foreground">{translate("manage_your_saved_accounts_and_passwords", "accounts")}</p>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-1 gap-4 w-full md:w-auto">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={translate("search", "accounts")}
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || selectedCategory !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 theme-button"
            onClick={() => setShowGeneratePassword(true)}
          >
            <Key className="h-4 w-4" />
            {translate("generate_password", "accounts")}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowAddAccount(true)}>
            <Plus className="h-4 w-4" />
            {translate("add_account", "accounts")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-sm">{translate("account", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("username", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("password", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("category", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("tags", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("last_modified", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("actions", "accounts")}</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((account) => (
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
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-10 text-muted-foreground">
                  {filteredAccounts.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-10 w-10 text-muted-foreground/50" />
                      <h3 className="font-medium">No accounts found</h3>
                      <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
                      <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    "No accounts found. Create one to get started."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredAccounts.length > 0 && (
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            {translate("showing", "accounts")} {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAccounts.length)} {translate("of", "accounts")} {filteredAccounts.length} {translate("accounts", "accounts")}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 mr-4">
              <span className="text-sm text-muted-foreground">{translate("rows_per_page", "accounts")}</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={itemsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1

                // If we have more than 5 pages and we're not at the beginning
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 3 + i

                  // Don't go beyond the total pages
                  if (pageNum > totalPages) {
                    pageNum = totalPages - (4 - i)
                  }
                }

                return (
                  <Button
                    key={i}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={currentPage === pageNum}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
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