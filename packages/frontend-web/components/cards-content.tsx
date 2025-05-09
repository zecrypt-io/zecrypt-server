"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreditCard, Plus, Search, Copy, Check, Eye, EyeOff, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Card {
  id: string;
  card_holder_name: string;
  brand: string;
  number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  tags: string[];
  created_at: string;
}

export function CardsContent() {
  const { translate } = useTranslator();
  const [showAddCard, setShowAddCard] = useState(false);
  const [showEditCard, setShowEditCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null);
  const [viewSensitiveData, setViewSensitiveData] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [cards, setCards] = useState<Card[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const mockCards: Card[] = [
    {
      id: "card-1",
      card_holder_name: "John Doe",
      brand: "Visa",
      number: "4111 1111 1111 1111",
      expiry_month: "12",
      expiry_year: "2025",
      cvv: "123",
      tags: ["Personal"],
      created_at: new Date().toISOString()
    },
    {
      id: "card-2",
      card_holder_name: "Jane Smith",
      brand: "Mastercard",
      number: "5555 5555 5555 4444",
      expiry_month: "10",
      expiry_year: "2024",
      cvv: "321",
      tags: ["Business"],
      created_at: new Date().toISOString()
    },
    {
      id: "card-3",
      card_holder_name: "Sarah Connor",
      brand: "American Express",
      number: "3782 822463 10005",
      expiry_month: "07",
      expiry_year: "2026",
      cvv: "1234",
      tags: ["Personal", "Shopping"],
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // Simulate data loading
    setIsLoading(true);
    setTimeout(() => {
      setCards(mockCards);
      setTotalCount(mockCards.length);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleAddCard = () => {
    setShowAddCard(true);
  };

  const handleEditCard = (card: Card) => {
    setSelectedCard(card);
    setShowEditCard(true);
  };

  const handleDeleteCard = (id: string) => {
    // Simulate deletion
    setCards(prevCards => prevCards.filter(card => card.id !== id));
    toast({
      title: translate("card_deleted", "cards", { default: "Card deleted" }),
      description: translate("card_deleted_description", "cards", { default: "The card has been deleted successfully" }),
    });
  };

  const copyToClipboard = async (id: string, field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField({ id, field });
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: translate("copied", "cards", { default: "Copied" }),
        description: translate("field_copied", "cards", { default: "Field copied to clipboard" }),
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: translate("copy_failed", "cards", { default: "Copy failed" }),
        description: translate("failed_to_copy_field", "cards", { default: "Failed to copy field to clipboard" }),
        variant: "destructive",
      });
    }
  };

  const toggleDataVisibility = (id: string) => {
    setViewSensitiveData(prev => (prev === id ? null : id));
  };

  const filterCards = useCallback(() => {
    let filtered = [...mockCards];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(card => 
        card.card_holder_name.toLowerCase().includes(query) ||
        card.brand.toLowerCase().includes(query) ||
        card.number.includes(query)
      );
    }
    
    if (selectedBrand !== "all") {
      filtered = filtered.filter(card => 
        card.brand.toLowerCase() === selectedBrand.toLowerCase()
      );
    }
    
    return filtered;
  }, [searchQuery, selectedBrand, mockCards]);

  const handleSearch = () => {
    const filtered = filterCards();
    setCards(filtered);
    setTotalCount(filtered.length);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("all");
    setCards(mockCards);
    setTotalCount(mockCards.length);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const displayedCards = cards.slice(startIdx, endIdx);
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const formatCardNumber = (number: string) => {
    return number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (month: string, year: string) => {
    return `${month.padStart(2, '0')}/${year.slice(-2)}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{translate("credit_cards", "cards", { default: "Credit Cards" })}</h1>
        <Button onClick={handleAddCard} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_card", "cards", { default: "Add Card" })}
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={translate("search_cards", "cards", { default: "Search cards..." })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={translate("filter_by_brand", "cards", { default: "Filter by brand" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("all_brands", "cards", { default: "All Brands" })}</SelectItem>
            <SelectItem value="visa">Visa</SelectItem>
            <SelectItem value="mastercard">Mastercard</SelectItem>
            <SelectItem value="american express">American Express</SelectItem>
            <SelectItem value="discover">Discover</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" className="w-full" onClick={handleSearch}>
            {translate("search", "cards", { default: "Search" })}
          </Button>
          {(searchQuery || selectedBrand !== "all") && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Cards Table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-10 text-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">{translate("loading_cards", "cards", { default: "Loading cards..." })}</p>
          </div>
        ) : displayedCards.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{translate("no_cards_found", "cards", { default: "No cards found" })}</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              {translate("clear_filters", "cards", { default: "Clear filters" })}
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{translate("card_holder", "cards", { default: "Card Holder" })}</TableHead>
                  <TableHead>{translate("brand", "cards", { default: "Brand" })}</TableHead>
                  <TableHead>{translate("card_number", "cards", { default: "Card Number" })}</TableHead>
                  <TableHead>{translate("expiry", "cards", { default: "Expiry" })}</TableHead>
                  <TableHead>{translate("cvv", "cards", { default: "CVV" })}</TableHead>
                  <TableHead>{translate("tags", "cards", { default: "Tags" })}</TableHead>
                  <TableHead className="text-right">{translate("actions", "cards", { default: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedCards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span>{card.card_holder_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{card.brand}</TableCell>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span>
                          {viewSensitiveData === card.id
                            ? formatCardNumber(card.number)
                            : "•••• •••• •••• " + card.number.slice(-4)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleDataVisibility(card.id)}
                        >
                          {viewSensitiveData === card.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(card.id, "number", card.number)}
                        >
                          {copiedField?.id === card.id && copiedField?.field === "number" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{formatExpiryDate(card.expiry_month, card.expiry_year)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{viewSensitiveData === card.id ? card.cvv : "•••"}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(card.id, "cvv", card.cvv)}
                        >
                          {copiedField?.id === card.id && copiedField?.field === "cvv" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {card.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCard(card)}>
                            {translate("edit", "cards", { default: "Edit" })}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteCard(card.id)} className="text-red-500">
                            {translate("delete", "cards", { default: "Delete" })}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {translate("showing_results", "cards", {
              default: `Showing ${startIdx + 1}-${Math.min(endIdx, totalCount)} of ${totalCount} results`,
              startIdx: startIdx + 1,
              endIdx: Math.min(endIdx, totalCount),
              totalCount
            })}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="mx-2 text-sm">
              {translate("page_of", "cards", {
                default: `Page ${currentPage} of ${totalPages}`,
                currentPage,
                totalPages
              })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("add_new_card", "cards", { default: "Add New Card" })}</DialogTitle>
            <DialogDescription>
              {translate("add_new_card_description", "cards", { default: "Enter your credit card details below" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card_holder_name">{translate("card_holder_name", "cards", { default: "Card Holder Name" })}</Label>
              <Input id="card_holder_name" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">{translate("brand", "cards", { default: "Brand" })}</Label>
              <Select defaultValue="visa">
                <SelectTrigger>
                  <SelectValue placeholder={translate("select_brand", "cards", { default: "Select brand" })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="american express">American Express</SelectItem>
                  <SelectItem value="discover">Discover</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card_number">{translate("card_number", "cards", { default: "Card Number" })}</Label>
              <Input id="card_number" placeholder="4111 1111 1111 1111" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry_month">{translate("expiry_month", "cards", { default: "Expiry Month" })}</Label>
                <Select defaultValue="01">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = (i + 1).toString().padStart(2, '0');
                      return <SelectItem key={month} value={month}>{month}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_year">{translate("expiry_year", "cards", { default: "Expiry Year" })}</Label>
                <Select defaultValue={(new Date().getFullYear()).toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = (new Date().getFullYear() + i).toString();
                      return <SelectItem key={year} value={year}>{year}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">{translate("cvv", "cards", { default: "CVV" })}</Label>
                <Input id="cvv" placeholder="123" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowAddCard(false)}>
              {translate("cancel", "cards", { default: "Cancel" })}
            </Button>
            <Button type="submit" onClick={() => setShowAddCard(false)}>
              {translate("save", "cards", { default: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={showEditCard} onOpenChange={setShowEditCard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("edit_card", "cards", { default: "Edit Card" })}</DialogTitle>
            <DialogDescription>
              {translate("edit_card_description", "cards", { default: "Update your credit card details" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_card_holder_name">{translate("card_holder_name", "cards", { default: "Card Holder Name" })}</Label>
              <Input 
                id="edit_card_holder_name" 
                defaultValue={selectedCard?.card_holder_name} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_brand">{translate("brand", "cards", { default: "Brand" })}</Label>
              <Select defaultValue={selectedCard?.brand.toLowerCase()}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="american express">American Express</SelectItem>
                  <SelectItem value="discover">Discover</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_card_number">{translate("card_number", "cards", { default: "Card Number" })}</Label>
              <Input 
                id="edit_card_number" 
                defaultValue={selectedCard?.number} 
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_expiry_month">{translate("expiry_month", "cards", { default: "Expiry Month" })}</Label>
                <Select defaultValue={selectedCard?.expiry_month}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = (i + 1).toString().padStart(2, '0');
                      return <SelectItem key={month} value={month}>{month}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_expiry_year">{translate("expiry_year", "cards", { default: "Expiry Year" })}</Label>
                <Select defaultValue={selectedCard?.expiry_year}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = (new Date().getFullYear() + i).toString();
                      return <SelectItem key={year} value={year}>{year}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_cvv">{translate("cvv", "cards", { default: "CVV" })}</Label>
                <Input 
                  id="edit_cvv" 
                  defaultValue={selectedCard?.cvv} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowEditCard(false)}>
              {translate("cancel", "cards", { default: "Cancel" })}
            </Button>
            <Button type="submit" onClick={() => setShowEditCard(false)}>
              {translate("update", "cards", { default: "Update" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 