"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  Plus,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  MoreHorizontal,
  X,
  AlertTriangle,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { useFormatter } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useWalletPassphraseManagement } from "../hooks/use-wallet-passphrase-management";
import { AddPassphraseDialog } from "./add-passphrase-dialoge";
import { EditPassphraseDialog } from "./edit-passphrase-dialoge";
import { SortButton } from "@/components/ui/sort-button";

interface WalletPassphrase {
  doc_id: string;
  title: string;
  name: string;
  lower_title: string;
  wallet_type: string;
  data: string;
  passphrase: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
  wallet_address: string;
}

const walletTypes = [
  "all",
  "Bitcoin",
  "Ethereum",
  "Solana",
  "Cardano",
  "Polkadot",
  "Avalanche",
  "Binance Smart Chain",
  "Polygon",
  "Other",
];

export function WalletPassphrasesContent() {
  const { translate } = useTranslator();
  const format = useFormatter();
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  const [showAddPassphrase, setShowAddPassphrase] = useState(false);
  const [showEditPassphrase, setShowEditPassphrase] = useState(false);
  const [selectedPassphrase, setSelectedPassphrase] = useState<WalletPassphrase | null>(null);
  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [viewPassphrase, setViewPassphrase] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [passphraseToDelete, setPassphraseToDelete] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const {
    walletPassphrasesToDisplay,
    allWalletPassphrases,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    selectedWalletType,
    setSelectedWalletType,
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteWalletPassphrase: handleDeleteWalletPassphraseFromHook,
    fetchWalletPassphrases,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  } = useWalletPassphraseManagement({
    selectedWorkspaceId,
    selectedProjectId,
    initialItemsPerPage: 5,
  });

  const handleAddPassphrase = () => {
    setShowAddPassphrase(true);
  };

  const handleEditPassphrase = (passphrase: WalletPassphrase) => {
    setSelectedPassphrase(passphrase);
    setShowEditPassphrase(true);
  };

  const confirmDelete = (doc_id: string) => {
    setPassphraseToDelete(doc_id);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteWalletPassphrase = async () => {
    if (!passphraseToDelete) return;

    setIsProcessingDelete(true);
    try {
      await handleDeleteWalletPassphraseFromHook(passphraseToDelete);
      setShowDeleteConfirmation(false);
      setPassphraseToDelete(null);
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const copyToClipboard = useCallback(
    async (doc_id: string, field: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedField({ doc_id, field });
        setTimeout(() => setCopiedField(null), 2000);
        toast({
          title: translate("copied", "wallet_passphrases", { default: "Copied" }),
          description: translate("passphrase_copied", "wallet_passphrases", {
            default: "Passphrase copied to clipboard",
          }),
        });
      } catch (err) {
        console.error("Failed to copy:", err);
        toast({
          title: translate("copy_failed", "wallet_passphrases", { default: "Copy failed" }),
          description: translate("failed_to_copy_passphrase", "wallet_passphrases", {
            default: "Failed to copy passphrase to clipboard",
          }),
          variant: "destructive",
        });
      }
    },
    [translate]
  );

  const togglePassphraseVisibility = useCallback((doc_id: string) => {
    setViewPassphrase((prev) => (prev === doc_id ? null : doc_id));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "k") {
        e.preventDefault();
        setShowAddPassphrase(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {translate("wallet_passphrases", "wallet_passphrases", { default: "Wallet Passphrases" })}
          </h1>
          <p className="text-muted-foreground">
            {translate("securely_store_and_manage_your_wallet_recovery_phrases", "wallet_passphrases", { 
              default: "Securely store and manage your wallet recovery phrases" 
            })}
          </p>
        </div>
      </div>

      {/* Search, Filter, Sort and Add */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={translate("search_across_all_fields", "wallet_passphrases", {
                default: "Search across all fields...",
              })}
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
          
          <Select value={selectedWalletType} onValueChange={setSelectedWalletType}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={translate("filter_by_wallet_type", "wallet_passphrases", {
                default: "Filter by wallet type",
              })} />
            </SelectTrigger>
            <SelectContent>
              {walletTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "all"
                    ? translate("all_wallet_types", "wallet_passphrases", { default: "All Wallet Types" })
                    : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="w-40">
            <SortButton 
              sortConfig={sortConfig} 
              onSortChange={setSortConfig} 
              namespace="wallet_passphrases"
              options={[
                { field: "title", label: translate("name", "wallet_passphrases", { default: "Name" }) },
                { field: "created_at", label: translate("date_created", "wallet_passphrases", { default: "Date Created" }) }
              ]}
            />
          </div>
          
          {(searchQuery || selectedWalletType !== "all" || sortConfig) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              {translate("clear_filters", "wallet_passphrases", { default: "Clear Filters" })}
            </Button>
          )}
        </div>
        
        <Button onClick={handleAddPassphrase} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_passphrase", "wallet_passphrases", { default: "Add Passphrase" })}
        </Button>
      </div>

      {/* Wallet Passphrases Table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {translate("loading_passphrases", "wallet_passphrases", { default: "Loading wallet passphrases..." })}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">
                    {translate("name", "wallet_passphrases", { default: "Name" })}
                  </TableHead>
                  <TableHead>{translate("wallet_type", "wallet_passphrases", { default: "Wallet Type" })}</TableHead>
                  <TableHead>{translate("passphrase", "wallet_passphrases", { default: "Passphrase" })}</TableHead>
                  <TableHead>{translate("wallet_address", "wallet_passphrases", { default: "Wallet Address" })}</TableHead>
                  <TableHead>{translate("tags", "wallet_passphrases", { default: "Tags" })}</TableHead>
                  <TableHead>{translate("last_modified", "wallet_passphrases", { default: "Last Modified" })}</TableHead>
                  <TableHead className="text-right">
                    {translate("actions", "wallet_passphrases", { default: "Actions" })}
                  </TableHead>
                </TableRow>
              </TableHeader>
              {walletPassphrasesToDisplay.length > 0 ? (
                <TableBody>
                  {walletPassphrasesToDisplay.map((passphrase: WalletPassphrase) => (
                    <TableRow key={passphrase.doc_id}>
                      <TableCell className="font-medium">{passphrase.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {passphrase.wallet_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <span className="max-w-[200px] truncate">
                            {viewPassphrase === passphrase.doc_id ? passphrase.passphrase : "••••••••"}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => togglePassphraseVisibility(passphrase.doc_id)}
                                >
                                  {viewPassphrase === passphrase.doc_id ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {viewPassphrase === passphrase.doc_id
                                  ? translate("hide_passphrase", "wallet_passphrases", { default: "Hide passphrase" })
                                  : translate("show_passphrase", "wallet_passphrases", { default: "Show passphrase" })}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(passphrase.doc_id, "passphrase", passphrase.passphrase)}
                                >
                                  {copiedField?.doc_id === passphrase.doc_id && copiedField?.field === "passphrase" ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {translate("copy_passphrase", "wallet_passphrases", { default: "Copy passphrase" })}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <span className="max-w-[200px] truncate">
                            {passphrase.wallet_address}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(passphrase.doc_id, "wallet_address", passphrase.wallet_address)}
                                >
                                  {copiedField?.doc_id === passphrase.doc_id && copiedField?.field === "wallet_address" ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {translate("copy_wallet_address", "wallet_passphrases", { default: "Copy wallet address" })}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {passphrase.tags?.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {passphrase.updated_at
                          ? format.dateTime(new Date(passphrase.updated_at), {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPassphrase(passphrase)}>
                              {translate("edit", "wallet_passphrases", { default: "Edit" })}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDelete(passphrase.doc_id)}
                              className="text-red-500"
                            >
                              {translate("delete", "wallet_passphrases", { default: "Delete" })}
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
                    <TableCell colSpan={7} className="text-center">
                      {searchQuery || selectedWalletType !== "all"
                        ? translate("no_passphrases_found_search", "wallet_passphrases", { default: "No passphrases match your search criteria" })
                        : translate("no_passphrases_found", "wallet_passphrases", { default: "No wallet passphrases found" })}
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
              {translate("showing_results", "wallet_passphrases", {
                default: `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                  currentPage * itemsPerPage,
                  totalCount
                )} of ${totalCount} results`,
                startIdx: (currentPage - 1) * itemsPerPage + 1,
                endIdx: Math.min(currentPage * itemsPerPage, totalCount),
                totalCount,
              })}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={currentPage === 1 ? () => {} : prevPage}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {getPaginationRange().map((page: number | string, index: number) =>
                  typeof page === "number" ? (
                    <PaginationItem key={index}>
                      <PaginationLink onClick={() => goToPage(page)} isActive={page === currentPage}>
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={index}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={currentPage === totalPages ? () => {} : nextPage}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      {/* Add Passphrase Dialog */}
      <AddPassphraseDialog
        onPassphraseAdded={fetchWalletPassphrases}
        open={showAddPassphrase}
        onOpenChange={setShowAddPassphrase}
        existingPassphrases={allWalletPassphrases}
      />

      {/* Edit Passphrase Dialog */}
      {showEditPassphrase && selectedPassphrase && (
        <EditPassphraseDialog
          passphrase={selectedPassphrase}
          onPassphraseUpdated={fetchWalletPassphrases}
          open={showEditPassphrase}
          onOpenChange={(open) => {
            setShowEditPassphrase(open);
            if (!open) {
              setSelectedPassphrase(null);
            }
          }}
          existingPassphrases={allWalletPassphrases}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {translate("confirm_deletion", "wallet_passphrases", { default: "Confirm Deletion" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translate("delete_passphrase_confirmation", "wallet_passphrases", {
                default: "Are you sure you want to delete this wallet passphrase? This action cannot be undone.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>
              {translate("cancel", "wallet_passphrases", { default: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWalletPassphrase}
              disabled={isProcessingDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessingDelete
                ? translate("deleting", "wallet_passphrases", { default: "Deleting..." })
                : translate("delete", "wallet_passphrases", { default: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}