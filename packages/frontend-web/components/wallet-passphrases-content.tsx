"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wallet, Plus, Pencil, Trash2, Eye, EyeOff, Copy, Check, Search, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { useSelector } from "react-redux"
import { RootState } from "@/libs/Redux/store"
import { 
  createWalletPassphrase, 
  updateWalletPassphrase, 
  deleteWalletPassphrase, 
  getWalletPassphrases 
} from "@/libs/wallet-api"

// Types
interface WalletPassphrase {
  id: string
  name: string
  walletType: string
  passphrase: string
  walletAddress: string
  tags: string[]
  notes: string
  createdAt: Date
  lastAccessed: Date
}

// Wallet types for dropdown
const walletTypes = [
  "Bitcoin",
  "Ethereum",
  "Solana",
  "Cardano",
  "Polkadot",
  "Avalanche",
  "Binance Smart Chain",
  "Polygon",
  "Other",
]

export function WalletPassphrasesContent() {
  const router = useRouter()
  const [walletPassphrases, setWalletPassphrases] = useState<WalletPassphrase[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPassphrases, setFilteredPassphrases] = useState<WalletPassphrase[]>([])
  const [visiblePassphrases, setVisiblePassphrases] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentPassphrase, setCurrentPassphrase] = useState<WalletPassphrase | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    walletType: "Bitcoin",
    passphrase: "",
    walletAddress: "",
    tags: "",
    notes: "",
  })

  // Redux state
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  // Fetch wallet passphrases on component mount or when workspace/project changes
  useEffect(() => {
    const fetchWalletPassphrases = async () => {
      if (!selectedWorkspaceId || !selectedProjectId || !accessToken) {
        console.log("Missing required parameters for fetching wallet passphrases");
        return;
      }

      setIsLoading(true);
      try {
        const response = await getWalletPassphrases(
          selectedWorkspaceId,
          selectedProjectId,
          accessToken
        );

        if (response.data && Array.isArray(response.data)) {
          // Transform API response to match component data structure
          const walletData = response.data.map((wallet: any) => ({
            id: wallet.doc_id,
            name: wallet.name,
            walletType: wallet.wallet_type,
            passphrase: wallet.phrase,
            walletAddress: wallet.wallet_address || "",
            tags: wallet.tag || [],
            notes: wallet.notes || "",
            createdAt: new Date(wallet.created_at),
            lastAccessed: new Date(wallet.last_accessed || wallet.created_at),
          }));

          setWalletPassphrases(walletData);
          console.log("Wallet passphrases loaded:", walletData.length);
        }
      } catch (error) {
        console.error("Failed to fetch wallet passphrases:", error);
        toast({
          title: "Error",
          description: "Failed to load wallet passphrases. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletPassphrases();
  }, [selectedWorkspaceId, selectedProjectId, accessToken]);

  // Filter passphrases based on search term
  useEffect(() => {
    const filtered = walletPassphrases.filter(
      (passphrase) =>
        passphrase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        passphrase.walletType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        passphrase.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        passphrase.notes.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredPassphrases(filtered)
    setCurrentPage(1) // Reset to first page when search changes
  }, [searchTerm, walletPassphrases])

  // Pagination calculations
  const totalPages = Math.ceil(filteredPassphrases.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPassphrases.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Toggle passphrase visibility
  const toggleVisibility = (id: string) => {
    setVisiblePassphrases((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Copy passphrase to clipboard
  const copyToClipboard = (id: string, passphrase: string) => {
    navigator.clipboard.writeText(passphrase)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)

    // Update last accessed
    setWalletPassphrases((prev) => prev.map((item) => (item.id === id ? { ...item, lastAccessed: new Date() } : item)))

    toast({
      title: "Passphrase copied",
      description: "The passphrase has been copied to your clipboard.",
    })
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle wallet type selection
  const handleWalletTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      walletType: value,
    }))
  }

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: "",
      walletType: "Bitcoin",
      passphrase: "",
      walletAddress: "",
      tags: "",
      notes: "",
    })
  }

  // Open add dialog
  const openAddDialog = () => {
    resetFormData()
    setIsAddDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (passphrase: WalletPassphrase) => {
    setCurrentPassphrase(passphrase)
    setFormData({
      name: passphrase.name,
      walletType: passphrase.walletType,
      passphrase: passphrase.passphrase,
      walletAddress: passphrase.walletAddress || "",
      tags: passphrase.tags.join(", "),
      notes: passphrase.notes,
    })
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (passphrase: WalletPassphrase) => {
    setCurrentPassphrase(passphrase)
    setIsDeleteDialogOpen(true)
  }

  // Add new passphrase
  const addPassphrase = async () => {
    if (!selectedWorkspaceId || !selectedProjectId || !accessToken) {
      toast({
        title: "Error",
        description: "No workspace or project selected",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format tags for API
      const formattedTags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      
      // Call API
      const response = await createWalletPassphrase(
        selectedWorkspaceId,
        selectedProjectId,
        accessToken,
        {
          name: formData.name,
          phrase: formData.passphrase,
          wallet_address: formData.walletAddress,
          wallet_type: formData.walletType,
          tag: formattedTags,
        }
      );
      
      console.log('Wallet passphrase created:', response);
      
      // Create new passphrase object for UI
      const newPassphrase: WalletPassphrase = {
        id: response.data?.doc_id || Date.now().toString(),
        name: formData.name,
        walletType: formData.walletType,
        passphrase: formData.passphrase,
        walletAddress: formData.walletAddress,
        tags: formattedTags,
        notes: formData.notes,
        createdAt: new Date(),
        lastAccessed: new Date(),
      };

      setWalletPassphrases((prev) => [...prev, newPassphrase]);
      setIsAddDialogOpen(false);
      resetFormData();

      toast({
        title: "Passphrase added",
        description: "Your wallet passphrase has been securely stored.",
      });
    } catch (error) {
      console.error("Error adding passphrase:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add wallet passphrase",
        variant: "destructive",
      });
    }
  }

  // Edit passphrase
  const editPassphrase = async () => {
    if (!currentPassphrase) return;
    if (!selectedWorkspaceId || !selectedProjectId || !accessToken) {
      toast({
        title: "Error",
        description: "No workspace or project selected",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format tags for API
      const formattedTags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      
      // Call API
      await updateWalletPassphrase(
        selectedWorkspaceId,
        selectedProjectId,
        currentPassphrase.id,
        accessToken,
        {
          name: formData.name,
          phrase: formData.passphrase,
          wallet_address: formData.walletAddress,
          wallet_type: formData.walletType,
          tag: formattedTags,
        }
      );
      
      const updatedPassphrase: WalletPassphrase = {
        ...currentPassphrase,
        name: formData.name,
        walletType: formData.walletType,
        passphrase: formData.passphrase,
        walletAddress: formData.walletAddress,
        tags: formattedTags,
        notes: formData.notes,
      }

      setWalletPassphrases((prev) => prev.map((item) => (item.id === currentPassphrase.id ? updatedPassphrase : item)))

      setIsEditDialogOpen(false)
      setCurrentPassphrase(null)
      resetFormData()

      toast({
        title: "Passphrase updated",
        description: "Your wallet passphrase has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating passphrase:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update wallet passphrase",
        variant: "destructive",
      });
    }
  }

  // Delete passphrase
  const deletePassphrase = async () => {
    if (!currentPassphrase) return;
    if (!selectedWorkspaceId || !selectedProjectId || !accessToken) {
      toast({
        title: "Error",
        description: "No workspace or project selected",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call API
      await deleteWalletPassphrase(
        selectedWorkspaceId,
        selectedProjectId,
        currentPassphrase.id,
        accessToken
      );
      
      setWalletPassphrases((prev) => prev.filter((item) => item.id !== currentPassphrase.id))

      setIsDeleteDialogOpen(false)
      setCurrentPassphrase(null)

      toast({
        title: "Passphrase deleted",
        description: "Your wallet passphrase has been deleted.",
      })
    } catch (error) {
      console.error("Error deleting passphrase:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete wallet passphrase",
        variant: "destructive",
      });
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-4 p-3 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search passphrases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={openAddDialog} className="w-full sm:w-auto h-10">
          <Plus className="mr-2 h-4 w-4" /> Add Passphrase
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="h-12 w-12 rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground animate-spin mb-4"></div>
            <h3 className="text-lg font-medium">Loading wallet passphrases...</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Please wait while we fetch your secure passphrases.
            </p>
          </CardContent>
        </Card>
      ) : filteredPassphrases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No wallet passphrases found</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              {searchTerm
                ? "No passphrases match your search criteria."
                : "You haven't added any wallet passphrases yet."}
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Your First Passphrase
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="p-3 font-medium text-sm">Name</TableHead>
                    <TableHead className="p-3 font-medium text-sm">Wallet Type</TableHead>
                    <TableHead className="p-3 font-medium text-sm">Passphrase</TableHead>
                    <TableHead className="p-3 font-medium text-sm">Wallet Address</TableHead>
                    <TableHead className="p-3 font-medium text-sm">Tags</TableHead>
                    <TableHead className="p-3 font-medium text-sm">Created</TableHead>
                    <TableHead className="p-3 font-medium text-sm">Last Accessed</TableHead>
                    <TableHead className="p-3 font-medium text-sm text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((passphrase) => (
                    <TableRow key={passphrase.id} className="border-t border-border">
                      <TableCell className="p-3 font-medium">{passphrase.name}</TableCell>
                      <TableCell className="p-3">{passphrase.walletType}</TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className="max-w-[200px] truncate font-mono text-sm">
                            {visiblePassphrases[passphrase.id] ? passphrase.passphrase : "••••••••••••••••••••••••"}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleVisibility(passphrase.id)}
                            title={visiblePassphrases[passphrase.id] ? "Hide passphrase" : "Show passphrase"}
                          >
                            {visiblePassphrases[passphrase.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(passphrase.id, passphrase.passphrase)}
                            title="Copy to clipboard"
                          >
                            {copiedId === passphrase.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="max-w-[120px] truncate font-mono text-xs">
                          {passphrase.walletAddress || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {passphrase.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="p-3">{formatDate(passphrase.createdAt)}</TableCell>
                      <TableCell className="p-3">{formatDate(passphrase.lastAccessed)}</TableCell>
                      <TableCell className="p-3 text-right">
                        <div className="flex justify-end space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(passphrase)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(passphrase)}
                            title="Delete"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredPassphrases.length > 0 && (
              <div className="flex items-center justify-between px-4 py-4 border-t bg-card">
                <div className="text-sm text-muted-foreground">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPassphrases.length)} of{" "}
                  {filteredPassphrases.length} passphrases
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
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 3 + i
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
        </>
      )}

      {/* Add Passphrase Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Wallet Passphrase</DialogTitle>
            <DialogDescription>Add a new wallet passphrase to your secure storage.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="My Bitcoin Wallet"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="walletType" className="text-right">
                Wallet Type
              </Label>
              <Select value={formData.walletType} onValueChange={handleWalletTypeChange}>
                <SelectTrigger id="walletType" className="col-span-3">
                  <SelectValue placeholder="Select wallet type" />
                </SelectTrigger>
                <SelectContent>
                  {walletTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="passphrase" className="text-right">
                Passphrase
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="passphrase"
                  name="passphrase"
                  value={formData.passphrase}
                  onChange={handleInputChange}
                  placeholder="Enter your wallet recovery phrase or seed words"
                  className="font-mono"
                  rows={3}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Your passphrase will be encrypted before storage.</p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="walletAddress" className="text-right">
                Wallet Address
              </Label>
              <Input
                id="walletAddress"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Enter your wallet address"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                Tags
              </Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="main, trading, defi (comma separated)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Additional notes about this wallet"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addPassphrase} disabled={!formData.name || !formData.passphrase}>
              Save Passphrase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Passphrase Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Wallet Passphrase</DialogTitle>
            <DialogDescription>Update your wallet passphrase details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-walletType" className="text-right">
                Wallet Type
              </Label>
              <Select value={formData.walletType} onValueChange={handleWalletTypeChange}>
                <SelectTrigger id="edit-walletType" className="col-span-3">
                  <SelectValue placeholder="Select wallet type" />
                </SelectTrigger>
                <SelectContent>
                  {walletTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-passphrase" className="text-right">
                Passphrase
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="edit-passphrase"
                  name="passphrase"
                  value={formData.passphrase}
                  onChange={handleInputChange}
                  className="font-mono"
                  rows={3}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Your passphrase will be encrypted before storage.</p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-walletAddress" className="text-right">
                Wallet Address
              </Label>
              <Input
                id="edit-walletAddress"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Enter your wallet address"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-tags" className="text-right">
                Tags
              </Label>
              <Input
                id="edit-tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="main, trading, defi (comma separated)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="col-span-3"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editPassphrase} disabled={!formData.name || !formData.passphrase}>
              Update Passphrase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this wallet passphrase? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deletePassphrase}>
              Delete Passphrase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}