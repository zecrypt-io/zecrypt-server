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
  UserCheck,
  AlertCircle,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Check,
  Eye,
  EyeOff,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

interface Identity {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  date_of_birth: string
  passport_number: string
  national_id: string
  created: string
  updated: string
}

export function IdentitiesContent() {
  const sampleIdentities: Identity[] = [
    {
      id: "1",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      address: "123 Main St, Anytown, CA 90210, USA",
      date_of_birth: "1985-06-15",
      passport_number: "AB1234567",
      national_id: "123-45-6789",
      created: "2023-10-15",
      updated: "2023-11-28",
    },
    {
      id: "2",
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@example.com",
      phone: "+1 (555) 987-6543",
      address: "456 Oak Ave, Somewhere, NY 10001, USA",
      date_of_birth: "1990-03-22",
      passport_number: "CD7654321",
      national_id: "987-65-4321",
      created: "2023-11-01",
      updated: "2023-11-25",
    },
    {
      id: "3",
      first_name: "Alice",
      last_name: "Johnson",
      email: "alice.johnson@example.com",
      phone: "+1 (555) 456-7890",
      address: "789 Pine St, Elsewhere, TX 75001, USA",
      date_of_birth: "1978-11-10",
      passport_number: "EF9876543",
      national_id: "456-78-9012",
      created: "2023-05-10",
      updated: "2023-05-10",
    },
  ]

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddIdentityModal, setShowAddIdentityModal] = useState(false)
  const [showEditIdentityModal, setShowEditIdentityModal] = useState(false)
  const [identities, setIdentities] = useState<Identity[]>(sampleIdentities)
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null)
  const [viewSensitiveData, setViewSensitiveData] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  // New identity form state
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newDateOfBirth, setNewDateOfBirth] = useState("")
  const [newPassportNumber, setNewPassportNumber] = useState("")
  const [newNationalId, setNewNationalId] = useState("")
  
  // Edit identity form state
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editDateOfBirth, setEditDateOfBirth] = useState("")
  const [editPassportNumber, setEditPassportNumber] = useState("")
  const [editNationalId, setEditNationalId] = useState("")
  
  const { translate } = useTranslator()

  useEffect(() => {
    const handleAddIdentity = () => setShowAddIdentityModal(true)

    document.addEventListener("toggle-add-identity", handleAddIdentity)

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "+") {
        e.preventDefault()
        setShowAddIdentityModal(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("toggle-add-identity", handleAddIdentity)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const filteredIdentities = identities.filter((identity) => {
    return (
      searchQuery === "" ||
      `${identity.first_name} ${identity.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      identity.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      identity.phone.includes(searchQuery)
    )
  })

  const paginatedIdentities = filteredIdentities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredIdentities.length / itemsPerPage)

  const resetAddForm = () => {
    setNewFirstName("")
    setNewLastName("")
    setNewEmail("")
    setNewPhone("")
    setNewAddress("")
    setNewDateOfBirth("")
    setNewPassportNumber("")
    setNewNationalId("")
  }

  const handleCreateIdentity = () => {
    // Validation
    if (!newFirstName || !newLastName || !newEmail) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    // Create new identity
    const newIdentity: Identity = {
      id: (identities.length + 1).toString(),
      first_name: newFirstName,
      last_name: newLastName,
      email: newEmail,
      phone: newPhone,
      address: newAddress,
      date_of_birth: newDateOfBirth,
      passport_number: newPassportNumber,
      national_id: newNationalId,
      created: new Date().toISOString().split("T")[0],
      updated: new Date().toISOString().split("T")[0],
    }

    setIdentities([...identities, newIdentity])
    setShowAddIdentityModal(false)
    resetAddForm()
    toast({
      title: "Identity Added",
      description: "Your identity information has been securely stored.",
    })
  }

  const startEditingIdentity = (id: string) => {
    const identity = identities.find((identity) => identity.id === id)
    if (identity) {
      setEditingIdentity(identity)
      setEditFirstName(identity.first_name)
      setEditLastName(identity.last_name)
      setEditEmail(identity.email)
      setEditPhone(identity.phone)
      setEditAddress(identity.address)
      setEditDateOfBirth(identity.date_of_birth)
      setEditPassportNumber(identity.passport_number)
      setEditNationalId(identity.national_id)
      setShowEditIdentityModal(true)
    }
  }

  const saveEditedIdentity = () => {
    if (!editingIdentity) return

    // Validation
    if (!editFirstName || !editLastName || !editEmail) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    const updatedIdentity: Identity = {
      ...editingIdentity,
      first_name: editFirstName,
      last_name: editLastName,
      email: editEmail,
      phone: editPhone,
      address: editAddress,
      date_of_birth: editDateOfBirth,
      passport_number: editPassportNumber,
      national_id: editNationalId,
      updated: new Date().toISOString().split("T")[0],
    }

    setIdentities(
      identities.map((identity) => (identity.id === editingIdentity.id ? updatedIdentity : identity))
    )
    setShowEditIdentityModal(false)
    setEditingIdentity(null)
    toast({
      title: "Identity Updated",
      description: "Your identity information has been updated successfully.",
    })
  }

  const handleDeleteIdentity = (id: string) => {
    setIdentities(identities.filter((identity) => identity.id !== id))
    toast({
      title: "Identity Deleted",
      description: "Your identity information has been removed from storage.",
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

  // Mask sensitive data
  const maskSensitiveData = (value: string, type: string) => {
    if (!value) return "—"
    if (viewSensitiveData === type) return value
    
    switch (type) {
      case "passport":
        return value.substring(0, 2) + "•".repeat(value.length - 2)
      case "nationalId":
        return "•".repeat(value.length - 4) + value.slice(-4)
      default:
        return value
    }
  }

  return (
    <div className="container mx-auto py-8 px-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Identities</h2>
          <p className="text-muted-foreground">
            Securely manage and access your personal identification information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search identities..."
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
          <Button onClick={() => setShowAddIdentityModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Identity
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>IDs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedIdentities.length > 0 ? (
              paginatedIdentities.map((identity) => (
                <TableRow key={identity.id}>
                  <TableCell className="font-medium">
                    {identity.first_name} {identity.last_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {identity.email}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyField(identity.id, "email", identity.email)}
                      >
                        {copiedField?.id === identity.id && copiedField?.field === "email" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {identity.phone || "—"}
                      {identity.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleCopyField(identity.id, "phone", identity.phone)}
                        >
                          {copiedField?.id === identity.id && copiedField?.field === "phone" ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={identity.address}>
                      {identity.address || "—"}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(identity.date_of_birth)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="mr-2">Passport</Badge>
                        {maskSensitiveData(identity.passport_number, "passport")}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setViewSensitiveData(viewSensitiveData === "passport" ? null : "passport")}
                        >
                          {viewSensitiveData === "passport" ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="mr-2">National ID</Badge>
                        {maskSensitiveData(identity.national_id, "nationalId")}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setViewSensitiveData(viewSensitiveData === "nationalId" ? null : "nationalId")}
                        >
                          {viewSensitiveData === "nationalId" ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
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
                        <DropdownMenuItem onClick={() => startEditingIdentity(identity.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteIdentity(identity.id)}
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
                <TableCell colSpan={7} className="h-24 text-center">
                  No identities found.
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

      {/* Add Identity Dialog */}
      <Dialog open={showAddIdentityModal} onOpenChange={setShowAddIdentityModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Identity</DialogTitle>
            <DialogDescription>
              Enter your personal identification information. All data is stored securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  placeholder="John"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  placeholder="Doe"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, Anytown, CA 90210, USA"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-of-birth">Date of Birth</Label>
              <Input
                id="date-of-birth"
                type="date"
                value={newDateOfBirth}
                onChange={(e) => setNewDateOfBirth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passport-number">Passport Number</Label>
              <Input
                id="passport-number"
                placeholder="AB1234567"
                value={newPassportNumber}
                onChange={(e) => setNewPassportNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="national-id">National ID</Label>
              <Input
                id="national-id"
                placeholder="123-45-6789"
                value={newNationalId}
                onChange={(e) => setNewNationalId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddIdentityModal(false)
                resetAddForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateIdentity}>Save Identity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Identity Dialog */}
      <Dialog open={showEditIdentityModal} onOpenChange={setShowEditIdentityModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Identity</DialogTitle>
            <DialogDescription>
              Update your personal identification information. All data is stored securely.
            </DialogDescription>
          </DialogHeader>
          {editingIdentity && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-first-name">First Name</Label>
                  <Input
                    id="edit-first-name"
                    placeholder="John"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-last-name">Last Name</Label>
                  <Input
                    id="edit-last-name"
                    placeholder="Doe"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  placeholder="+1 (555) 123-4567"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  placeholder="123 Main St, Anytown, CA 90210, USA"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date-of-birth">Date of Birth</Label>
                <Input
                  id="edit-date-of-birth"
                  type="date"
                  value={editDateOfBirth}
                  onChange={(e) => setEditDateOfBirth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-passport-number">Passport Number</Label>
                <Input
                  id="edit-passport-number"
                  placeholder="AB1234567"
                  value={editPassportNumber}
                  onChange={(e) => setEditPassportNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-national-id">National ID</Label>
                <Input
                  id="edit-national-id"
                  placeholder="123-45-6789"
                  value={editNationalId}
                  onChange={(e) => setEditNationalId(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditIdentityModal(false)
                setEditingIdentity(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedIdentity}>Update Identity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 