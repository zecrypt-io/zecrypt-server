"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  Edit,
  Plus,
  Trash2,
  Key,
  AlertCircle,
  Check,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Clock,
  Shield,
  Tag,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ApiKey {
  id: string
  name: string
  key: string
  created: string
  lastUsed: string | null
  status: "active" | "expired" | "revoked"
  permissions: string[]
  type: "test" | "live"
  expiresIn: string
}

export function ApiKeysContent() {
  // Sample API keys data
  const allApiKeys: ApiKey[] = [
    {
      id: "1",
      name: "Production API Key",
      key: "zk_live_••••••••••••••••••••••••••••••",
      created: "2023-10-15",
      lastUsed: "2023-11-28",
      status: "active",
      permissions: ["read", "write"],
      type: "live",
      expiresIn: "Never",
    },
    {
      id: "2",
      name: "Testing API Key",
      key: "zk_test_••••••••••••••••••••••••••••••",
      created: "2023-11-01",
      lastUsed: "2023-11-25",
      status: "active",
      permissions: ["read"],
      type: "test",
      expiresIn: "30 days",
    },
    {
      id: "3",
      name: "Legacy API Key",
      key: "zk_legacy_••••••••••••••••••••••••••••",
      created: "2023-05-10",
      lastUsed: null,
      status: "expired",
      permissions: ["read", "write", "delete"],
      type: "live",
      expiresIn: "Expired",
    },
    {
      id: "4",
      name: "Development API Key",
      key: "zk_test_••••••••••••••••••••••••••••••",
      created: "2023-09-22",
      lastUsed: "2023-11-20",
      status: "active",
      permissions: ["read", "write"],
      type: "test",
      expiresIn: "60 days",
    },
    {
      id: "5",
      name: "Staging Environment",
      key: "zk_test_••••••••••••••••••••••••••••••",
      created: "2023-10-05",
      lastUsed: "2023-11-15",
      status: "active",
      permissions: ["read", "write"],
      type: "test",
      expiresIn: "45 days",
    },
    {
      id: "6",
      name: "Mobile App Integration",
      key: "zk_live_••••••••••••••••••••••••••••••",
      created: "2023-08-12",
      lastUsed: "2023-11-27",
      status: "active",
      permissions: ["read"],
      type: "live",
      expiresIn: "Never",
    },
    {
      id: "7",
      name: "Analytics Service",
      key: "zk_live_••••••••••••••••••••••••••••••",
      created: "2023-07-30",
      lastUsed: "2023-11-26",
      status: "active",
      permissions: ["read"],
      type: "live",
      expiresIn: "Never",
    },
    {
      id: "8",
      name: "Temporary Access",
      key: "zk_test_••••••••••••••••••••••••••••••",
      created: "2023-11-10",
      lastUsed: null,
      status: "active",
      permissions: ["read", "write", "delete"],
      type: "test",
      expiresIn: "7 days",
    },
  ]

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  // New API Key form state
  const [showAddKeyModal, setShowAddKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [readPermission, setReadPermission] = useState(true)
  const [writePermission, setWritePermission] = useState(false)
  const [deletePermission, setDeletePermission] = useState(false)
  const [keyType, setKeyType] = useState<"test" | "live">("test")
  const [keyExpiration, setKeyExpiration] = useState<"never" | "30days" | "90days" | "1year">("never")
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [showKeyDialog, setShowKeyDialog] = useState(false)

  // Edit API Key state
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null)
  const [editKeyName, setEditKeyName] = useState("")
  const [editReadPermission, setEditReadPermission] = useState(false)
  const [editWritePermission, setEditWritePermission] = useState(false)
  const [editDeletePermission, setEditDeletePermission] = useState(false)

  // State for API keys with CRUD operations
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(allApiKeys)

  // Filter and paginate API keys
  const filteredApiKeys = apiKeys.filter((key) => {
    const matchesSearch =
      searchQuery === "" ||
      key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.key.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === null || key.status === statusFilter
    const matchesType = typeFilter === null || key.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const totalPages = Math.ceil(filteredApiKeys.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredApiKeys.slice(indexOfFirstItem, indexOfLastItem)

  const resetAddForm = () => {
    setNewKeyName("")
    setReadPermission(true)
    setWritePermission(false)
    setDeletePermission(false)
    setKeyType("test")
    setKeyExpiration("never")
  }

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for your API key",
        variant: "destructive",
      })
      return
    }

    const permissions = []
    if (readPermission) permissions.push("read")
    if (writePermission) permissions.push("write")
    if (deletePermission) permissions.push("delete")

    if (permissions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one permission",
        variant: "destructive",
      })
      return
    }

    // Generate a fake API key
    const generatedKey = `zk_${keyType}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    setNewlyCreatedKey(generatedKey)
    setShowKeyDialog(true)

    // Map expiration selection to display text
    let expiresIn = "Never"
    if (keyExpiration === "30days") expiresIn = "30 days"
    if (keyExpiration === "90days") expiresIn = "90 days"
    if (keyExpiration === "1year") expiresIn = "1 year"

    const newKey: ApiKey = {
      id: (apiKeys.length + 1).toString(),
      name: newKeyName,
      key: `zk_${keyType}_••••••••••••••••••••••••••••••`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: null,
      status: "active",
      permissions,
      type: keyType,
      expiresIn,
    }

    setApiKeys([...apiKeys, newKey])
    resetAddForm()
    setShowAddKeyModal(false)
  }

  const startEditingKey = (id: string) => {
    const keyToEdit = apiKeys.find((key) => key.id === id)
    if (!keyToEdit) return

    setEditingKeyId(id)
    setEditKeyName(keyToEdit.name)
    setEditReadPermission(keyToEdit.permissions.includes("read"))
    setEditWritePermission(keyToEdit.permissions.includes("write"))
    setEditDeletePermission(keyToEdit.permissions.includes("delete"))
  }

  const cancelEditingKey = () => {
    setEditingKeyId(null)
  }

  const saveEditedKey = (id: string) => {
    if (!editKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for your API key",
        variant: "destructive",
      })
      return
    }

    const permissions = []
    if (editReadPermission) permissions.push("read")
    if (editWritePermission) permissions.push("write")
    if (editDeletePermission) permissions.push("delete")

    if (permissions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one permission",
        variant: "destructive",
      })
      return
    }

    setApiKeys(
      apiKeys.map((key) =>
        key.id === id
          ? {
              ...key,
              name: editKeyName,
              permissions,
            }
          : key,
      ),
    )

    setEditingKeyId(null)

    toast({
      title: "API Key Updated",
      description: "The API key has been successfully updated.",
    })
  }

  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.map((key) => (key.id === id ? { ...key, status: "revoked" } : key)))

    toast({
      title: "API Key Revoked",
      description: "The API key has been successfully revoked.",
    })
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      title: "Copied to clipboard",
      description: "API key has been copied to your clipboard.",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case "expired":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Expired
          </Badge>
        )
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "live":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
            Live
          </Badge>
        )
      case "test":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
            Test
          </Badge>
        )
      default:
        return null
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter(null)
    setTypeFilter(null)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="h-full flex-1 flex-col space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">Manage your API keys for programmatic access to Zecrypt services.</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-1 gap-4 w-full md:w-auto">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search API keys..."
              className="pl-8 bg-background w-full"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset to first page on search
              }}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={statusFilter || ""}
              onValueChange={(value) => {
                setStatusFilter(value || null)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={typeFilter || ""}
              onValueChange={(value) => {
                setTypeFilter(value || null)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="test">Test</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter || typeFilter) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
        <Button
          onClick={() => setShowAddKeyModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Add API Key Modal */}
      <Dialog open={showAddKeyModal} onOpenChange={setShowAddKeyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>Enter the details for your new API key.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="key-name">API Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., Production Backend"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Key Type</Label>
              <RadioGroup
                value={keyType}
                onValueChange={(value) => setKeyType(value as "test" | "live")}
                className="flex gap-4 mt-1.5"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="test-key" value="test" />
                  <Label htmlFor="test-key" className="font-normal">
                    Test
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="live-key" value="live" />
                  <Label htmlFor="live-key" className="font-normal">
                    Live
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Key Preview</Label>
              <div className="mt-1.5 border rounded-md bg-muted/30 overflow-hidden">
                <div className="p-3 h-20 flex items-center">
                  <code className="text-sm font-mono w-full break-all">{`zk_${keyType}_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</code>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                The actual key will be generated when you click "Create API Key"
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddKeyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} className="bg-primary text-primary-foreground">
              <Key className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Keys Table */}
      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[120px]">Created</TableHead>
                <TableHead className="w-[120px]">Expires</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((key) => (
                  <TableRow
                    key={key.id}
                    className={cn(
                      "group hover:bg-muted/50 transition-colors",
                      key.status !== "active" && "opacity-60",
                      editingKeyId === key.id && "bg-blue-50/50 dark:bg-blue-900/20",
                    )}
                  >
                    <TableCell>
                      {editingKeyId === key.id ? (
                        <Input value={editKeyName} onChange={(e) => setEditKeyName(e.target.value)} className="h-8" />
                      ) : (
                        <div className="font-medium">{key.name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{key.key}</span>
                        {key.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopyKey(key.key)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {key.type === "live" ? (
                          <Shield className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                          <Tag className="h-3.5 w-3.5 text-purple-500" />
                        )}
                        {getTypeBadge(key.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {key.created}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {key.expiresIn}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(key.status)}</TableCell>
                    <TableCell className="text-right">
                      {editingKeyId === key.id ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditingKey}
                            className="h-8 px-2 text-muted-foreground"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => saveEditedKey(key.id)}
                            className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          {key.status === "active" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                  API Key Options
                                </DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => startEditingKey(key.id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyKey(key.key)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  <span>Copy Key</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleRevokeKey(key.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Revoke</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    {filteredApiKeys.length === 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-10 w-10 text-muted-foreground/50" />
                        <h3 className="font-medium">No API keys found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                          Clear filters
                        </Button>
                      </div>
                    ) : (
                      "No API keys found. Create one to get started."
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredApiKeys.length > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredApiKeys.length)} of{" "}
              {filteredApiKeys.length} keys
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 mr-4">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
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

      {/* New API Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your New API Key</DialogTitle>
            <DialogDescription>
              This key will only be displayed once. Please copy it now and store it securely.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="newApiKey" className="sr-only">
                API Key
              </Label>
              <Input id="newApiKey" value={newlyCreatedKey} readOnly className="font-mono text-sm" />
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => newlyCreatedKey && handleCopyKey(newlyCreatedKey)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Important Security Notice</p>
              <p className="mt-1">
                This API key grants access to your Zecrypt account. Never share it publicly or commit it to version
                control.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              onClick={() => {
                setNewlyCreatedKey(null)
                setShowKeyDialog(false)
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

