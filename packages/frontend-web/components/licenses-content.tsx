"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  Edit,
  Plus,
  Trash2,
  KeySquare,
  AlertCircle,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Clock,
  Check,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/libs/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslator } from "@/hooks/use-translations"

interface License {
  id: string
  software_name: string
  license_key: string
  expiry_date: string
  purchase_date?: string
  purchase_price?: string
  website?: string
  created: string
  updated: string
  status: "active" | "expired" | "expiring_soon"
}

export function LicensesContent() {
  const sampleLicenses: License[] = [
    {
      id: "1",
      software_name: "Adobe Creative Cloud",
      license_key: "ABCD-1234-EFGH-5678-IJKL",
      expiry_date: "2024-12-31",
      purchase_date: "2023-01-15",
      purchase_price: "$599.99",
      website: "adobe.com",
      created: "2023-10-15",
      updated: "2023-11-28",
      status: "active",
    },
    {
      id: "2",
      software_name: "Microsoft Office 365",
      license_key: "XXXX-YYYY-ZZZZ-1111-2222",
      expiry_date: "2024-06-30",
      purchase_date: "2023-06-01",
      purchase_price: "$99.99",
      website: "microsoft.com",
      created: "2023-11-01",
      updated: "2023-11-25",
      status: "active",
    },
    {
      id: "3",
      software_name: "Sublime Text",
      license_key: "ST-1234567890-ABCDEFG",
      expiry_date: "2023-12-15",
      purchase_date: "2020-05-10",
      purchase_price: "$80.00",
      website: "sublimetext.com",
      created: "2021-05-10",
      updated: "2021-05-10",
      status: "expiring_soon",
    },
    {
      id: "4",
      software_name: "Antivirus Pro 2023",
      license_key: "AVP-2023-1234-5678-90AB",
      expiry_date: "2023-08-22",
      purchase_date: "2022-08-22",
      purchase_price: "$49.99",
      website: "antiviruspro.com",
      created: "2022-09-22",
      updated: "2022-11-20",
      status: "expired",
    },
  ]

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showAddLicenseModal, setShowAddLicenseModal] = useState(false)
  const [showEditLicenseModal, setShowEditLicenseModal] = useState(false)
  const [licenses, setLicenses] = useState<License[]>(sampleLicenses)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null)

  // New license form state
  const [newSoftwareName, setNewSoftwareName] = useState("")
  const [newLicenseKey, setNewLicenseKey] = useState("")
  const [newExpiryDate, setNewExpiryDate] = useState("")
  const [newPurchaseDate, setNewPurchaseDate] = useState("")
  const [newPurchasePrice, setNewPurchasePrice] = useState("")
  const [newWebsite, setNewWebsite] = useState("")
  
  // Edit license form state
  const [editSoftwareName, setEditSoftwareName] = useState("")
  const [editLicenseKey, setEditLicenseKey] = useState("")
  const [editExpiryDate, setEditExpiryDate] = useState("")
  const [editPurchaseDate, setEditPurchaseDate] = useState("")
  const [editPurchasePrice, setEditPurchasePrice] = useState("")
  const [editWebsite, setEditWebsite] = useState("")
  
  const { translate } = useTranslator()

  useEffect(() => {
    const handleAddLicense = () => setShowAddLicenseModal(true)

    document.addEventListener("toggle-add-license", handleAddLicense)

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "+") {
        e.preventDefault()
        setShowAddLicenseModal(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("toggle-add-license", handleAddLicense)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch =
      searchQuery === "" ||
      license.software_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.license_key.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === null || statusFilter === "all" || license.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const paginatedLicenses = filteredLicenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage)

  const resetAddForm = () => {
    setNewSoftwareName("")
    setNewLicenseKey("")
    setNewExpiryDate("")
    setNewPurchaseDate("")
    setNewPurchasePrice("")
    setNewWebsite("")
  }

  const handleCreateLicense = () => {
    // Validation
    if (!newSoftwareName || !newLicenseKey || !newExpiryDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    // Determine status based on expiry date
    const today = new Date()
    const expiryDate = new Date(newExpiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    
    let status: "active" | "expired" | "expiring_soon" = "active"
    
    if (expiryDate < today) {
      status = "expired"
    } else if (expiryDate <= thirtyDaysFromNow) {
      status = "expiring_soon"
    }

    // Create new license
    const newLicense: License = {
      id: (licenses.length + 1).toString(),
      software_name: newSoftwareName,
      license_key: newLicenseKey,
      expiry_date: newExpiryDate,
      purchase_date: newPurchaseDate,
      purchase_price: newPurchasePrice,
      website: newWebsite,
      created: new Date().toISOString().split("T")[0],
      updated: new Date().toISOString().split("T")[0],
      status: status,
    }

    setLicenses([...licenses, newLicense])
    setShowAddLicenseModal(false)
    resetAddForm()
    toast({
      title: "License Added",
      description: "Your software license has been securely stored.",
    })
  }

  const startEditingLicense = (id: string) => {
    const license = licenses.find((license) => license.id === id)
    if (license) {
      setEditingLicense(license)
      setEditSoftwareName(license.software_name)
      setEditLicenseKey(license.license_key)
      setEditExpiryDate(license.expiry_date)
      setEditPurchaseDate(license.purchase_date || "")
      setEditPurchasePrice(license.purchase_price || "")
      setEditWebsite(license.website || "")
      setShowEditLicenseModal(true)
    }
  }

  const saveEditedLicense = () => {
    if (!editingLicense) return

    // Validation
    if (!editSoftwareName || !editLicenseKey || !editExpiryDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    // Determine status based on expiry date
    const today = new Date()
    const expiryDate = new Date(editExpiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    
    let status: "active" | "expired" | "expiring_soon" = "active"
    
    if (expiryDate < today) {
      status = "expired"
    } else if (expiryDate <= thirtyDaysFromNow) {
      status = "expiring_soon"
    }

    const updatedLicense: License = {
      ...editingLicense,
      software_name: editSoftwareName,
      license_key: editLicenseKey,
      expiry_date: editExpiryDate,
      purchase_date: editPurchaseDate,
      purchase_price: editPurchasePrice,
      website: editWebsite,
      updated: new Date().toISOString().split("T")[0],
      status: status,
    }

    setLicenses(
      licenses.map((license) => (license.id === editingLicense.id ? updatedLicense : license))
    )
    setShowEditLicenseModal(false)
    setEditingLicense(null)
    toast({
      title: "License Updated",
      description: "Your software license has been updated successfully.",
    })
  }

  const handleDeleteLicense = (id: string) => {
    setLicenses(licenses.filter((license) => license.id !== id))
    toast({
      title: "License Deleted",
      description: "Your software license has been removed from storage.",
    })
  }

  const handleCopyField = (id: string, field: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField({ id, field })
    setTimeout(() => setCopiedField(null), 2000)
    toast({
      title: "Copied to Clipboard",
      description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been copied to clipboard.`,
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter(null)
    setCurrentPage(1)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "—"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDateString: string): number | null => {
    if (!expiryDateString) return null
    
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const expiryDate = new Date(expiryDateString)
      expiryDate.setHours(0, 0, 0, 0)
      
      const diffTime = expiryDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays
    } catch (e) {
      return null
    }
  }

  // Get status badge
  const getStatusBadge = (license: License) => {
    const daysUntilExpiry = getDaysUntilExpiry(license.expiry_date)
    
    if (license.status === "expired" || (daysUntilExpiry !== null && daysUntilExpiry < 0)) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Expired
        </Badge>
      )
    } else if (license.status === "expiring_soon" || (daysUntilExpiry !== null && daysUntilExpiry <= 30)) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          Expires in {daysUntilExpiry} days
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Active
        </Badge>
      )
    }
  }

  return (
    <div className="container mx-auto py-8 px-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Software Licenses</h2>
          <p className="text-muted-foreground">
            Securely manage and track your software license keys and expiration dates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search licenses..."
              className="w-full bg-background pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-9 w-9 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={clearFilters} variant="outline" size="sm" className="h-10">
            Clear
          </Button>
          <Button onClick={() => setShowAddLicenseModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add License
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Software</TableHead>
              <TableHead>License Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Purchase Info</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLicenses.length > 0 ? (
              paginatedLicenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{license.software_name}</span>
                      {license.website && (
                        <a 
                          href={license.website.startsWith("http") ? license.website : `https://${license.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                        >
                          {license.website}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                        {license.license_key}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyField(license.id, "license key", license.license_key)}
                      >
                        {copiedField?.id === license.id && copiedField?.field === "license key" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(license)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(license.expiry_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {license.purchase_date && (
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground">Purchased:</span> 
                          {formatDate(license.purchase_date)}
                        </div>
                      )}
                      {license.purchase_price && (
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground">Price:</span> 
                          {license.purchase_price}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditingLicense(license.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteLicense(license.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No licenses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <ChevronLeft className="h-4 w-4 -ml-2" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <ChevronRight className="h-4 w-4 -ml-2" />
          </Button>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(parseInt(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="5 per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Add License Dialog */}
      <Dialog open={showAddLicenseModal} onOpenChange={setShowAddLicenseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Software License</DialogTitle>
            <DialogDescription>
              Enter your software license details. All information is stored securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="software-name">Software Name</Label>
              <Input
                id="software-name"
                placeholder="Adobe Creative Cloud"
                value={newSoftwareName}
                onChange={(e) => setNewSoftwareName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-key">License Key</Label>
              <Input
                id="license-key"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={newLicenseKey}
                onChange={(e) => setNewLicenseKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry-date">Expiry Date</Label>
              <Input
                id="expiry-date"
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase-date">Purchase Date (Optional)</Label>
              <Input
                id="purchase-date"
                type="date"
                value={newPurchaseDate}
                onChange={(e) => setNewPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase-price">Purchase Price (Optional)</Label>
              <Input
                id="purchase-price"
                placeholder="$99.99"
                value={newPurchasePrice}
                onChange={(e) => setNewPurchasePrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                placeholder="adobe.com"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddLicenseModal(false)
                resetAddForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateLicense}>Save License</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit License Dialog */}
      <Dialog open={showEditLicenseModal} onOpenChange={setShowEditLicenseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Software License</DialogTitle>
            <DialogDescription>
              Update your software license details. All information is stored securely.
            </DialogDescription>
          </DialogHeader>
          {editingLicense && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-software-name">Software Name</Label>
                <Input
                  id="edit-software-name"
                  placeholder="Adobe Creative Cloud"
                  value={editSoftwareName}
                  onChange={(e) => setEditSoftwareName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-license-key">License Key</Label>
                <Input
                  id="edit-license-key"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={editLicenseKey}
                  onChange={(e) => setEditLicenseKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expiry-date">Expiry Date</Label>
                <Input
                  id="edit-expiry-date"
                  type="date"
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-purchase-date">Purchase Date (Optional)</Label>
                <Input
                  id="edit-purchase-date"
                  type="date"
                  value={editPurchaseDate}
                  onChange={(e) => setEditPurchaseDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-purchase-price">Purchase Price (Optional)</Label>
                <Input
                  id="edit-purchase-price"
                  placeholder="$99.99"
                  value={editPurchasePrice}
                  onChange={(e) => setEditPurchasePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website (Optional)</Label>
                <Input
                  id="edit-website"
                  placeholder="adobe.com"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditLicenseModal(false)
                setEditingLicense(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedLicense}>Update License</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 