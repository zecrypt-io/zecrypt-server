"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreditCard, Plus, Search, Copy, Check, Eye, EyeOff, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, AlertTriangle, Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCardManagement } from "@/hooks/use-card-management";
import { AddCardDialog } from "@/components/add-card-dialog";
import { EditCardDialog } from "@/components/edit-card-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { SortButton } from "@/components/ui/sort-button";

interface Card {
  doc_id: string;
  title: string;
  card_holder_name: string;
  number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  brand: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
}

export function CardsContent() {
  const { translate } = useTranslator();
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const [showAddCard, setShowAddCard] = useState(false);
  const [showEditCard, setShowEditCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null);
  const [viewSensitiveData, setViewSensitiveData] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const {
    cardsToDisplay,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    selectedBrand,
    setSelectedBrand,
    selectedTag,
    setSelectedTag,
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteCard: handleDeleteCardFromHook,
    fetchCards,
    clearFilters,
    nextPage,
    prevPage,
    goToPage
  } = useCardManagement({
    selectedWorkspaceId,
    selectedProjectId,
    initialItemsPerPage: 5
  });

  const handleAddCard = () => {
    setShowAddCard(true);
  };

  const handleEditCard = (card: Card) => {
    setSelectedCard(card);
    setShowEditCard(true);
  };

  const confirmDelete = (doc_id: string) => {
    setCardToDelete(doc_id);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;
    
    setIsProcessingDelete(true);
    try {
      await handleDeleteCardFromHook(cardToDelete);
      setShowDeleteConfirmation(false);
      setCardToDelete(null);
    } finally {
      setIsProcessingDelete(false);
    }
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

  const formatCardNumber = (number: string) => {
    return number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (month: string, year: string) => {
    return `${month.padStart(2, '0')}/${year.slice(-2)}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{translate("credit_cards", "cards", { default: "Credit Cards" })}</h1>
          <p className="text-muted-foreground">{translate("manage_your_cards", "cards", { default: "Manage your credit and debit card information securely" })}</p>
        </div>
      </div>

      {/* Search, Filter, Sort and Add */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={translate("search_across_all_fields", "cards", { default: "Search across all fields..." })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={translate("filter_by_brand", "cards", { default: "Filter by brand" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translate("all_brands", "cards", { default: "All Brands" })}</SelectItem>
              <SelectItem value="visa">Visa</SelectItem>
              <SelectItem value="mastercard">Mastercard</SelectItem>
              <SelectItem value="american express">American Express</SelectItem>
              <SelectItem value="discover">Discover</SelectItem>
              <SelectItem value="other">{translate("other", "cards", { default: "Other" })}</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-40">
            <SortButton 
              sortConfig={sortConfig} 
              onSortChange={setSortConfig} 
              namespace="cards"
              options={[
                { field: "title", label: translate("title", "cards", { default: "Title" }) },
                { field: "created_at", label: translate("date_created", "cards", { default: "Date Created" }) }
              ]}
            />
          </div>
          
          {(searchQuery || selectedBrand !== 'all' || selectedTag !== 'all' || sortConfig) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              {translate("clear_filters", "cards", { default: "Clear Filters" })}
            </Button>
          )}
        </div>
        
        <Button onClick={handleAddCard} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_card", "cards", { default: "Add Card" })}
        </Button>
      </div>

      {/* Cards Table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{translate("loading_cards", "cards")}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">{translate("name", "cards", { default: "Name" })}</TableHead>
                  <TableHead>{translate("card_number", "cards", { default: "Card Number" })}</TableHead>
                  <TableHead>{translate("expiry", "cards", { default: "Expiry" })}</TableHead>
                  <TableHead>{translate("tags", "cards", { default: "Tags" })}</TableHead>
                  <TableHead className="text-right">{translate("actions", "cards", { default: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              {cardsToDisplay.length > 0 ? (
                <TableBody>
                  {cardsToDisplay.map((card) => (
                    <TableRow key={card.doc_id}>
                      <TableCell className="font-medium">{card.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span>{card.card_holder_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatExpiryDate(card.expiry_month, card.expiry_year)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {card.tags?.map((tag) => (
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
                            <DropdownMenuItem onClick={() => confirmDelete(card.doc_id)} className="text-red-500">
                              {translate("delete", "cards", { default: "Delete" })}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              ) : (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-muted-foreground">
                          {searchQuery
                            ? translate("no_matching_cards", "cards", { default: "No matching cards found" })
                            : translate("no_cards_found", "cards", { default: "No cards found" })}
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleAddCard}
                          className="mt-4"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {translate("add_card", "cards", { default: "Add Card" })}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {translate("showing_results", "cards", {
                default: `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} results`,
                startIdx: (currentPage - 1) * itemsPerPage + 1,
                endIdx: Math.min(currentPage * itemsPerPage, totalCount),
                totalCount
              })}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={prevPage} 
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {getPaginationRange().map((page, index) => (
                  typeof page === 'number' ? (
                    <PaginationItem key={index}>
                      <PaginationLink
                        onClick={() => goToPage(page)}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={index}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={nextPage} 
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      {/* Add Card Dialog */}
      <AddCardDialog
        open={showAddCard}
        onOpenChange={setShowAddCard}
        onCardAdded={fetchCards}
        selectedWorkspaceId={selectedWorkspaceId}
        selectedProjectId={selectedProjectId}
      />

      {/* Edit Card Dialog */}
      <EditCardDialog
        open={showEditCard}
        onOpenChange={setShowEditCard}
        onCardUpdated={fetchCards}
        selectedWorkspaceId={selectedWorkspaceId}
        selectedProjectId={selectedProjectId}
        card={selectedCard}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translate("confirm_delete", "cards", { default: "Confirm Deletion" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {translate("delete_card_confirmation", "cards", { default: "Are you sure you want to delete this card? This action cannot be undone." })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>
              {translate("cancel", "cards", { default: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard} disabled={isProcessingDelete} className="bg-red-600 hover:bg-red-700">
              {isProcessingDelete
                ? translate("deleting", "cards", { default: "Deleting..." })
                : translate("delete", "cards", { default: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 