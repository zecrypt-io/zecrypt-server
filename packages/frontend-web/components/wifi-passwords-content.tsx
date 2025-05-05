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
  Wifi,
  AlertCircle,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  EyeOff,
  Check,
  Calendar,
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

interface WifiPassword {
  id: string
  ssid: string
  password: string
  created: string
  updated: string
  location?: string
  notes?: string
}

export function WifiPasswordsContent() {
  const sampleWifiPasswords: WifiPassword[] = [
    {
      id: "1",
      ssid: "Home_WiFi_5G",
      password: "StrongPassword123!",
      created: "2023-10-15",
      updated: "2023-11-28",
      location: "Home",
      notes: "Main router on the first floor",
    },
    {
      id: "2",
      ssid: "Office_Network",
      password: "Office@Secure456",
      created: "2023-11-01",
      updated: "2023-11-25",
      location: "Work",
      notes: "Office wifi for employees",
    },
    {
      id: "3",
      ssid: "Guest_Network",
      password: "Welcome789",
      created: "2023-05-10",
      updated: "2023-05-10",
      location: "Home",
      notes: "Guest network for visitors",
    },
    {
      id: "4",
      ssid: "Vacation_Rental",
      password: "BeachHouse2023",
      created: "2023-09-22",
      updated: "2023-11-20",
      location: "Vacation",
      notes: "Beach house rental wifi",
    },
  ]

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddWifiModal, setShowAddWifiModal] = useState(false)
  const [showEditWifiModal, setShowEditWifiModal] = useState(false)
  const [wifiPasswords, setWifiPasswords] = useState<WifiPassword[]>(sampleWifiPasswords)
  const [editingWifi, setEditingWifi] = useState<WifiPassword | null>(null)
  const [viewPassword, setViewPassword] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null)
  const [locationFilter, setLocationFilter] = useState<string | null>(null)

  // New wifi form state
  const [newSSID, setNewSSID] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [newNotes, setNewNotes] = useState("")
  
  // Edit wifi form state
  const [editSSID, setEditSSID] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [editNotes, setEditNotes] = useState("")
  
  const { translate } = useTranslator()

  useEffect(() => {
    const handleAddWifi = () => setShowAddWifiModal(true)

    document.addEventListener("toggle-add-wifi", handleAddWifi)

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "+") {
        e.preventDefault()
        setShowAddWifiModal(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("toggle-add-wifi", handleAddWifi)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const filteredWifiPasswords = wifiPasswords.filter((wifi) => {
    const matchesSearch =
      searchQuery === "" ||
      wifi.ssid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wifi.location && wifi.location.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesLocation = locationFilter === null || locationFilter === "all" || 
      (wifi.location && wifi.location.toLowerCase() === locationFilter.toLowerCase())
    
    return matchesSearch && matchesLocation
  })

  const paginatedWifiPasswords = filteredWifiPasswords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredWifiPasswords.length / itemsPerPage)

  // Extract unique locations for filter
  const locations = [...new Set(wifiPasswords.map(wifi => wifi.location).filter(Boolean))]

  const resetAddForm = () => {
    setNewSSID("")
    setNewPassword("")
    setNewLocation("")
    setNewNotes("")
  }

  const handleCreateWifi = () => {
    // Validation
    if (!newSSID || !newPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    // Create new wifi password
    const newWifiPassword: WifiPassword = {
      id: (wifiPasswords.length + 1).toString(),
      ssid: newSSID,
      password: newPassword,
      location: newLocation,
      notes: newNotes,
      created: new Date().toISOString().split("T")[0],
      updated: new Date().toISOString().split("T")[0],
    }

    setWifiPasswords([...wifiPasswords, newWifiPassword])
    setShowAddWifiModal(false)
    resetAddForm()
    toast({
      title: "WiFi Password Added",
      description: "Your WiFi password has been securely stored.",
    })
  }

  const startEditingWifi = (id: string) => {
    const wifi = wifiPasswords.find((wifi) => wifi.id === id)
    if (wifi) {
      setEditingWifi(wifi)
      setEditSSID(wifi.ssid)
      setEditPassword(wifi.password)
      setEditLocation(wifi.location || "")
      setEditNotes(wifi.notes || "")
      setShowEditWifiModal(true)
    }
  }

  const saveEditedWifi = () => {
    if (!editingWifi) return

    // Validation
    if (!editSSID || !editPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    const updatedWifi: WifiPassword = {
      ...editingWifi,
      ssid: editSSID,
      password: editPassword,
      location: editLocation,
      notes: editNotes,
      updated: new Date().toISOString().split("T")[0],
    }

    setWifiPasswords(
      wifiPasswords.map((wifi) => (wifi.id === editingWifi.id ? updatedWifi : wifi))
    )
    setShowEditWifiModal(false)
    setEditingWifi(null)
    toast({
      title: "WiFi Password Updated",
      description: "Your WiFi password has been updated successfully.",
    })
  }

  const handleDeleteWifi = (id: string) => {
    setWifiPasswords(wifiPasswords.filter((wifi) => wifi.id !== id))
    toast({
      title: "WiFi Password Deleted",
      description: "Your WiFi password has been removed from storage.",
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
    setLocationFilter(null)
    setCurrentPage(1)
  }

  // Create a QR code URL for WiFi network
  const generateWifiQRCode = (ssid: string, password: string) => {
    const wifiString = `WIFI:S:${ssid};T:WPA;P:${password};;`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      wifiString
    )}`
  }

  // Display location badge
  const getLocationBadge = (location?: string) => {
    if (!location) return null
    
    switch (location.toLowerCase()) {
      case "home":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Home
          </Badge>
        )
      case "work":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Work
          </Badge>
        )
      case "vacation":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Vacation
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {location}
          </Badge>
        )
    }
  }

  return (
    <div className="container mx-auto py-8 px-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">WiFi Passwords</h2>
          <p className="text-muted-foreground">
            Securely manage and access your WiFi network credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search networks..."
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
            value={locationFilter || "all"}
            onValueChange={(value) => setLocationFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location || ""}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={clearFilters} variant="outline" size="sm" className="h-10">
            Clear
          </Button>
          <Button onClick={() => setShowAddWifiModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Network
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SSID (Network Name)</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedWifiPasswords.length > 0 ? (
              paginatedWifiPasswords.map((wifi) => (
                <TableRow key={wifi.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-muted-foreground" />
                      {wifi.ssid}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyField(wifi.id, "ssid", wifi.ssid)}
                      >
                        {copiedField?.id === wifi.id && copiedField?.field === "ssid" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {viewPassword === wifi.id ? wifi.password : "••••••••••••"}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewPassword(viewPassword === wifi.id ? null : wifi.id)}
                      >
                        {viewPassword === wifi.id ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyField(wifi.id, "password", wifi.password)}
                      >
                        {copiedField?.id === wifi.id && copiedField?.field === "password" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{wifi.location ? getLocationBadge(wifi.location) : "—"}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={wifi.notes}>
                      {wifi.notes || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {wifi.updated.split("-").reverse().join("/")}
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
                        <DropdownMenuItem
                          onClick={() => {
                            const qrCodeUrl = generateWifiQRCode(wifi.ssid, wifi.password)
                            window.open(qrCodeUrl, "_blank")
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2 h-4 w-4"
                          >
                            <rect width="6" height="6" x="3" y="3" rx="1" />
                            <path d="M21 8v1" />
                            <path d="M3 12h1" />
                            <path d="M12 3v1" />
                            <path d="M21 3v5" />
                            <path d="M21 12v1" />
                            <path d="M21 16v5" />
                            <path d="M16 21h5" />
                            <path d="M12 21v-1" />
                            <path d="M8 21h1" />
                            <path d="M3 16v5" />
                            <path d="M3 8v1" />
                            <rect width="6" height="6" x="3" y="15" rx="1" />
                            <rect width="6" height="6" x="15" y="15" rx="1" />
                            <rect width="6" height="6" x="15" y="3" rx="1" />
                          </svg>
                          Generate QR Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startEditingWifi(wifi.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteWifi(wifi.id)}
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
                  No WiFi passwords found.
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

      {/* Add WiFi Password Dialog */}
      <Dialog open={showAddWifiModal} onOpenChange={setShowAddWifiModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add WiFi Network</DialogTitle>
            <DialogDescription>
              Enter your WiFi network credentials. All information is stored securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ssid">SSID (Network Name)</Label>
              <Input
                id="ssid"
                placeholder="Home_WiFi_5G"
                value={newSSID}
                onChange={(e) => setNewSSID(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="Home, Work, etc."
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Additional information about this network"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddWifiModal(false)
                resetAddForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateWifi}>Save Network</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit WiFi Password Dialog */}
      <Dialog open={showEditWifiModal} onOpenChange={setShowEditWifiModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit WiFi Network</DialogTitle>
            <DialogDescription>
              Update your WiFi network credentials. All information is stored securely.
            </DialogDescription>
          </DialogHeader>
          {editingWifi && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-ssid">SSID (Network Name)</Label>
                <Input
                  id="edit-ssid"
                  placeholder="Home_WiFi_5G"
                  value={editSSID}
                  onChange={(e) => setEditSSID(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Password</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location (Optional)</Label>
                <Input
                  id="edit-location"
                  placeholder="Home, Work, etc."
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes (Optional)</Label>
                <Input
                  id="edit-notes"
                  placeholder="Additional information about this network"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditWifiModal(false)
                setEditingWifi(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedWifi}>Update Network</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 