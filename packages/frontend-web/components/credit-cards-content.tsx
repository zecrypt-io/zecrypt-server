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
  CreditCard,
  AlertCircle,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Eye,
  EyeOff,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslator } from "@/hooks/use-translations"
import { cn } from "@/libs/utils"

interface CreditCard {
  id: string
  card_holder_name: string
  brand: string
  number: string
  expiry_month: string
  expiry_year: string
  cvv: string
  created: string
  updated: string
}

export function CreditCardsContent() {
  const sampleCards: CreditCard[] = [
    {
      id: "1",
      card_holder_name: "JOHN DOE",
      brand: "Visa",
      number: "4111 1111 1111 1111",
      expiry_month: "05",
      expiry_year: "2025",
      cvv: "123",
      created: "2023-10-15",
      updated: "2023-11-28",
    },
    {
      id: "2",
      card_holder_name: "JANE SMITH",
      brand: "Mastercard",
      number: "5555 5555 5555 4444",
      expiry_month: "12",
      expiry_year: "2026",
      cvv: "321",
      created: "2023-11-01",
      updated: "2023-11-25",
    },
    {
      id: "3",
      card_holder_name: "EMMA WILSON",
      brand: "American Express",
      number: "3782 8224 6310 005",
      expiry_month: "07",
      expiry_year: "2024",
      cvv: "1234",
      created: "2023-05-10",
      updated: "2023-05-10",
    },
    {
      id: "4",
      card_holder_name: "MICHAEL JOHNSON",
      brand: "Discover",
      number: "6011 1111 1111 1117",
      expiry_month: "03",
      expiry_year: "2025",
      cvv: "456",
      created: "2023-09-22",
      updated: "2023-11-20",
    },
  ]

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const [showEditCardModal, setShowEditCardModal] = useState(false)
  const [creditCards, setCreditCards] = useState<CreditCard[]>(sampleCards)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [viewCardNumber, setViewCardNumber] = useState<string | null>(null)
  const [viewCVV, setViewCVV] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null)

  // New card form state
  const [newCardHolderName, setNewCardHolderName] = useState("")
  const [newCardBrand, setNewCardBrand] = useState("Visa")
  const [newCardNumber, setNewCardNumber] = useState("")
  const [newExpiryMonth, setNewExpiryMonth] = useState("")
  const [newExpiryYear, setNewExpiryYear] = useState("")
  const [newCVV, setNewCVV] = useState("")
  
  // Edit card form state
  const [editCardHolderName, setEditCardHolderName] = useState("")
  const [editCardBrand, setEditCardBrand] = useState("")
  const [editCardNumber, setEditCardNumber] = useState("")
  const [editExpiryMonth, setEditExpiryMonth] = useState("")
  const [editExpiryYear, setEditExpiryYear] = useState("")
  const [editCVV, setEditCVV] = useState("")
  
  const { translate } = useTranslator()

  useEffect(() => {
    const handleAddCard = () => setShowAddCardModal(true)

    document.addEventListener("toggle-add-card", handleAddCard)

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "+") {
        e.preventDefault()
        setShowAddCardModal(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("toggle-add-card", handleAddCard)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const filteredCards = creditCards.filter((card) => {
    return (
      searchQuery === "" ||
      card.card_holder_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.number.replace(/\s/g, "").includes(searchQuery.replace(/\s/g, ""))
    )
  })

  const paginatedCards = filteredCards.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredCards.length / itemsPerPage)

  const resetAddForm = () => {
    setNewCardHolderName("")
    setNewCardBrand("Visa")
    setNewCardNumber("")
    setNewExpiryMonth("")
    setNewExpiryYear("")
    setNewCVV("")
  }

  const handleCreateCard = () => {
    // Validation
    if (!newCardHolderName || !newCardNumber || !newExpiryMonth || !newExpiryYear || !newCVV) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    // Create new card
    const newCard: CreditCard = {
      id: (creditCards.length + 1).toString(),
      card_holder_name: newCardHolderName.toUpperCase(),
      brand: newCardBrand,
      number: newCardNumber,
      expiry_month: newExpiryMonth,
      expiry_year: newExpiryYear,
      cvv: newCVV,
      created: new Date().toISOString().split("T")[0],
      updated: new Date().toISOString().split("T")[0],
    }

    setCreditCards([...creditCards, newCard])
    setShowAddCardModal(false)
    resetAddForm()
    toast({
      title: "Card Added",
      description: "Your credit card has been securely stored.",
    })
  }

  const startEditingCard = (id: string) => {
    const card = creditCards.find((card) => card.id === id)
    if (card) {
      setEditingCard(card)
      setEditCardHolderName(card.card_holder_name)
      setEditCardBrand(card.brand)
      setEditCardNumber(card.number)
      setEditExpiryMonth(card.expiry_month)
      setEditExpiryYear(card.expiry_year)
      setEditCVV(card.cvv)
      setShowEditCardModal(true)
    }
  }

  const saveEditedCard = () => {
    if (!editingCard) return

    // Validation
    if (!editCardHolderName || !editCardNumber || !editExpiryMonth || !editExpiryYear || !editCVV) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    const updatedCard: CreditCard = {
      ...editingCard,
      card_holder_name: editCardHolderName.toUpperCase(),
      brand: editCardBrand,
      number: editCardNumber,
      expiry_month: editExpiryMonth,
      expiry_year: editExpiryYear,
      cvv: editCVV,
      updated: new Date().toISOString().split("T")[0],
    }

    setCreditCards(
      creditCards.map((card) => (card.id === editingCard.id ? updatedCard : card))
    )
    setShowEditCardModal(false)
    setEditingCard(null)
    toast({
      title: "Card Updated",
      description: "Your credit card has been updated successfully.",
    })
  }

  const handleDeleteCard = (id: string) => {
    setCreditCards(creditCards.filter((card) => card.id !== id))
    toast({
      title: "Card Deleted",
      description: "Your credit card has been removed from storage.",
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

  // Format card number with spaces
  const formatCardNumber = (number: string) => {
    return number.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim()
  }

  // Mask card number
  const maskCardNumber = (number: string) => {
    const last4 = number.replace(/\s/g, "").slice(-4)
    return `•••• •••• •••• ${last4}`
  }

  // Get card brand logo or text
  const getCardBrandDisplay = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <CreditCard className="mr-1 h-3 w-3" />
            Visa
          </Badge>
        )
      case "mastercard":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <CreditCard className="mr-1 h-3 w-3" />
            Mastercard
          </Badge>
        )
      case "american express":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CreditCard className="mr-1 h-3 w-3" />
            Amex
          </Badge>
        )
      case "discover":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <CreditCard className="mr-1 h-3 w-3" />
            Discover
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <CreditCard className="mr-1 h-3 w-3" />
            {brand}
          </Badge>
        )
    }
  }

  return (
    <div className="container mx-auto py-8 px-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Credit Cards</h2>
          <p className="text-muted-foreground">
            Securely manage and access your credit card information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search cards..."
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
          <Button onClick={() => setShowAddCardModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Card
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cardholder Name</TableHead>
              <TableHead>Card Type</TableHead>
              <TableHead>Card Number</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>CVV</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCards.length > 0 ? (
              paginatedCards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-medium">{card.card_holder_name}</TableCell>
                  <TableCell>{getCardBrandDisplay(card.brand)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {viewCardNumber === card.id ? formatCardNumber(card.number) : maskCardNumber(card.number)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewCardNumber(viewCardNumber === card.id ? null : card.id)}
                      >
                        {viewCardNumber === card.id ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyField(card.id, "card number", card.number)}
                      >
                        {copiedField?.id === card.id && copiedField?.field === "card number" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {card.expiry_month}/{card.expiry_year}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyField(card.id, "expiry", `${card.expiry_month}/${card.expiry_year}`)}
                      >
                        {copiedField?.id === card.id && copiedField?.field === "expiry" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {viewCVV === card.id ? card.cvv : "•••"}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewCVV(viewCVV === card.id ? null : card.id)}
                      >
                        {viewCVV === card.id ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyField(card.id, "cvv", card.cvv)}
                      >
                        {copiedField?.id === card.id && copiedField?.field === "cvv" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
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
                        <DropdownMenuItem onClick={() => startEditingCard(card.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteCard(card.id)}
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
                  No credit cards found.
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

      {/* Add Credit Card Dialog */}
      <Dialog open={showAddCardModal} onOpenChange={setShowAddCardModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Credit Card</DialogTitle>
            <DialogDescription>
              Enter your credit card details. All information is stored securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cardholder-name">Cardholder Name</Label>
              <Input
                id="cardholder-name"
                placeholder="JOHN DOE"
                value={newCardHolderName}
                onChange={(e) => setNewCardHolderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-brand">Card Type</Label>
              <Select value={newCardBrand} onValueChange={setNewCardBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select card type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Visa">Visa</SelectItem>
                  <SelectItem value="Mastercard">Mastercard</SelectItem>
                  <SelectItem value="American Express">American Express</SelectItem>
                  <SelectItem value="Discover">Discover</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={newCardNumber}
                onChange={(e) => setNewCardNumber(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry-month">Expiry Month</Label>
                <Select value={newExpiryMonth} onValueChange={setNewExpiryMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = (i + 1).toString().padStart(2, "0")
                      return <SelectItem key={month} value={month}>{month}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-year">Expiry Year</Label>
                <Select value={newExpiryYear} onValueChange={setNewExpiryYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = (new Date().getFullYear() + i).toString()
                      return <SelectItem key={year} value={year}>{year}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  maxLength={4}
                  value={newCVV}
                  onChange={(e) => setNewCVV(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCardModal(false)
                resetAddForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCard}>Save Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Credit Card Dialog */}
      <Dialog open={showEditCardModal} onOpenChange={setShowEditCardModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Credit Card</DialogTitle>
            <DialogDescription>
              Update your credit card details. All information is stored securely.
            </DialogDescription>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-cardholder-name">Cardholder Name</Label>
                <Input
                  id="edit-cardholder-name"
                  placeholder="JOHN DOE"
                  value={editCardHolderName}
                  onChange={(e) => setEditCardHolderName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-card-brand">Card Type</Label>
                <Select value={editCardBrand} onValueChange={setEditCardBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select card type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="American Express">American Express</SelectItem>
                    <SelectItem value="Discover">Discover</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-card-number">Card Number</Label>
                <Input
                  id="edit-card-number"
                  placeholder="1234 5678 9012 3456"
                  value={editCardNumber}
                  onChange={(e) => setEditCardNumber(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expiry-month">Expiry Month</Label>
                  <Select value={editExpiryMonth} onValueChange={setEditExpiryMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = (i + 1).toString().padStart(2, "0")
                        return <SelectItem key={month} value={month}>{month}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expiry-year">Expiry Year</Label>
                  <Select value={editExpiryYear} onValueChange={setEditExpiryYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="YYYY" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = (new Date().getFullYear() + i).toString()
                        return <SelectItem key={year} value={year}>{year}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cvv">CVV</Label>
                  <Input
                    id="edit-cvv"
                    placeholder="123"
                    maxLength={4}
                    value={editCVV}
                    onChange={(e) => setEditCVV(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditCardModal(false)
                setEditingCard(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedCard}>Update Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 