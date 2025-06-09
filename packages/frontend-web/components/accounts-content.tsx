"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Key, Plus, Search, Copy, Check, Eye, EyeOff, ExternalLink, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Star, AlertTriangle, Trash, Filter
} from "lucide-react";
import { AddAccountDialog } from "@/components/add-account-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { EditAccountDialog } from "@/components/edit-account-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslator } from "@/hooks/use-translations";
import { useRouter } from "next/navigation";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { useFormatter } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { getWebsiteIcon } from "@/libs/icon-mappings";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAccountManagement } from "@/hooks/use-account-management";
import { SortButton, SortButton2 } from "@/components/ui/sort-button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Account {
  doc_id: string;
  name?: string;
  title?: string;
  lower_name: string;
  user_name?: string;
  username?: string;
  password?: string;
  data?: string | { username: string; password: string };
  website?: string | null;
  url?: string | null;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
}

export function AccountsContent() {
  const { translate } = useTranslator();
  const router = useRouter();
  const format = useFormatter();

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const {
    accountsToDisplay,
    isLoading,
    totalCount,
    currentPage,
    setCurrentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteAccount: handleDeleteAccountFromHook,
    fetchAccounts,
    clearFilters,
    nextPage,
    prevPage,
    goToPage
  } = useAccountManagement({
    selectedWorkspaceId,
    selectedProjectId,
    initialItemsPerPage: 5
  });

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<Account | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [viewPassword, setViewPassword] = useState<string | null>(null);
  const [viewUsername, setViewUsername] = useState<string | null>(null);

  useEffect(() => {
    const handleAddAccountListener = () => setShowAddAccount(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "+") {
        e.preventDefault();
        setShowAddAccount(true);
      }
    };
    document.addEventListener("toggle-add-account", handleAddAccountListener);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("toggle-add-account", handleAddAccountListener);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const copyToClipboard = useCallback(async (doc_id: string, field: string, value: string | undefined) => {
    try {
      if (!value) return;
      await navigator.clipboard.writeText(value);
      setCopiedField({ doc_id, field });
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: translate("copied", "accounts", { default: "Copied" }),
        description: translate("field_copied", "accounts", {
          default: "Value copied to clipboard",
        }),
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({ 
        title: translate("error", "common"), 
        description: translate("copy_failed", "accounts"), 
        variant: "destructive" 
      });
    }
  }, [translate]);

  const togglePasswordVisibility = useCallback((doc_id: string) => {
    setViewPassword(prev => (prev === doc_id ? null : doc_id));
  }, []);

  const toggleUsernameVisibility = useCallback((doc_id: string) => {
    setViewUsername(prev => (prev === doc_id ? null : doc_id));
  }, []);

  const handleOpenEditDialog = (account: Account) => {
    setSelectedAccountForEdit(account);
    setShowEditAccount(true);
  };

  const handleAccountUpdated = useCallback(() => {
    setShowEditAccount(false);
    setSelectedAccountForEdit(null);
    fetchAccounts();
    toast({ title: translate("success", "common"), description: translate("account_updated_successfully", "accounts") });
  }, [fetchAccounts, translate]);

  const confirmDelete = (doc_id: string) => {
    setAccountToDelete(doc_id);
    setShowDeleteConfirmation(true);
  };

  const executeDeleteAccount = async () => {
    if (!accountToDelete) return;
    setIsProcessingDelete(true);
    await handleDeleteAccountFromHook(accountToDelete);
    setShowDeleteConfirmation(false);
    setAccountToDelete(null);
    setIsProcessingDelete(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{translate("accounts", "accounts")}</h1>
          <p className="text-muted-foreground">{translate("manage_your_saved_accounts_and_passwords", "accounts")}</p>
        </div>
      </div>

      {/* Search, Filter, Sort and Add */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={translate("search_accounts", "accounts")}
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
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={translate("filter_by_tag", "accounts", { default: "Filter by tag" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translate("all_accounts", "accounts")}</SelectItem>
              <SelectItem value="personal">{translate("personal", "accounts")}</SelectItem>
              <SelectItem value="work">{translate("work", "accounts")}</SelectItem>
              <SelectItem value="finance">{translate("finance", "accounts")}</SelectItem>
              <SelectItem value="favorite">{translate("favorite", "accounts")}</SelectItem>
              {uniqueTags
                .filter(tag => !["personal", "work", "finance", "favorite"].includes(tag.toLowerCase()))
                .map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
          
          <div className="w-40">
            <SortButton
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              namespace="accounts"
              options={[
                { field: "title", label: translate("account", "accounts") },
                { field: "created_at", label: translate("date_created", "accounts", { default: "Date Created" }) }
              ]}
            />
          </div>
          
          {(searchQuery || selectedCategory !== "all" || sortConfig) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              {translate("clear_filters", "accounts")}
            </Button>
          )}
        </div>
        
        <Button onClick={() => setShowAddAccount(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_account", "accounts")}
        </Button>
      </div>

      {/* Accounts Table */}
      <div className="border border-border/30 rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{translate("loading_accounts", "accounts")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="accounts-table-header">
              <TableRow>
                <TableHead className="w-[200px]">
                  {translate("account", "accounts")}
                </TableHead>
                <TableHead>
                  {translate("username", "accounts")}
                </TableHead>
                <TableHead>{translate("password", "accounts")}</TableHead>
                <TableHead>{translate("website", "accounts")}</TableHead>
                <TableHead>{translate("tags", "accounts")}</TableHead>
                <TableHead>
                  {translate("last_modified", "accounts")}
                </TableHead>
                <TableHead className="text-right">{translate("actions", "accounts")}</TableHead>
              </TableRow>
            </TableHeader>
            {accountsToDisplay.length > 0 ? (
              <TableBody>
                {accountsToDisplay.map((account) => (
                  <TableRow key={account.doc_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                          {getWebsiteIcon((account.url || account.website || '') as string, "h-4 w-4")}
                        </div>
                        <span>{account.title || account.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="relative max-w-[120px] truncate">
                          {account.username}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyToClipboard(account.doc_id, "username", account.username)}
                              >
                                {copiedField?.doc_id === account.doc_id && copiedField?.field === "username" ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {copiedField?.doc_id === account.doc_id && copiedField?.field === "username"
                                ? translate("copied", "accounts")
                                : translate("copy_username", "accounts")}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="relative max-w-[120px] truncate font-mono">
                          {viewPassword === account.doc_id ? account.password : "••••••••"}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => togglePasswordVisibility(account.doc_id)}
                              >
                                {viewPassword === account.doc_id ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {viewPassword === account.doc_id
                                ? translate("hide_password", "accounts")
                                : translate("show_password", "accounts")}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyToClipboard(account.doc_id, "password", account.password)}
                              >
                                {copiedField?.doc_id === account.doc_id && copiedField?.field === "password" ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {copiedField?.doc_id === account.doc_id && copiedField?.field === "password"
                                ? translate("copied", "accounts")
                                : translate("copy_password", "accounts")}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell>
                      {account.website || account.url ? (
                        <div className="flex items-center gap-2">
                          <span className="max-w-[120px] truncate">
                            {account.website || account.url}
                          </span>
                          {(account.website || account.url) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      const url = account.website || account.url;
                                      if (url) window.open(url, "_blank");
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{translate("open_website", "accounts")}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {account.tags && account.tags.length > 0 ? (
                          account.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="capitalize">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {account.updated_at
                        ? format.dateTime(new Date(account.updated_at), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(account)}>
                            {translate("edit", "accounts")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => confirmDelete(account.doc_id)}>
                            {translate("delete", "accounts")}
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-muted-foreground">
                        {searchQuery || selectedCategory !== "all"
                          ? translate("no_matching_accounts", "accounts", { default: "No matching accounts" })
                          : translate("no_accounts", "accounts", { default: "No accounts" })}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddAccount(true)}
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {translate("add_account", "accounts")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {translate("showing", "accounts")} {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, totalCount)} {translate("of", "accounts")} {totalCount}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      prevPage();
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {getPaginationRange().map((page, i) => (
                  <PaginationItem key={i}>
                    {page === "..." ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goToPage(page as number);
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      nextPage();
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {showAddAccount && (
        <AddAccountDialog
          open={showAddAccount}
          onOpenChange={setShowAddAccount}
          onClose={() => setShowAddAccount(false)}
          onAccountAdded={() => {
            fetchAccounts();
            toast({ title: translate("success", "common"), description: translate("account_added_successfully", "accounts") });
          }}
        />
      )}

      {showEditAccount && selectedAccountForEdit && (
        <EditAccountDialog
          account={selectedAccountForEdit}
          onClose={() => setShowEditAccount(false)}
          onAccountUpdated={handleAccountUpdated}
        />
      )}

      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translate("confirm_delete", "accounts")}</AlertDialogTitle>
            <AlertDialogDescription>
              {translate("delete_account_confirmation", "accounts")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>
              {translate("cancel", "accounts")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteAccount}
              disabled={isProcessingDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessingDelete ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {translate("deleting", "accounts")}
                </div>
              ) : (
                translate("delete", "accounts")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}