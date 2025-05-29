"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Key, Plus, Search, Copy, Check, Eye, EyeOff, ExternalLink, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Star, AlertTriangle, Trash
} from "lucide-react";
import { AddAccountDialog } from "@/components/add-account-dialog";
import { GeneratePasswordDialog } from "@/components/generate-password-dialog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccountManagement } from "@/hooks/use-account-management";

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
  const [showGeneratePassword, setShowGeneratePassword] = useState(false);
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
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({ title: translate("error", "common"), description: translate("copy_failed", "accounts"), variant: "destructive" });
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

  if (isLoading && accountsToDisplay.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">{translate("loading_accounts", "accounts")}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{translate("accounts", "accounts")}</h1>
          <p className="text-muted-foreground">{translate("manage_your_saved_accounts_and_passwords", "accounts")}</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setShowAddAccount(true)}>
          <Plus className="h-4 w-4" />
          {translate("add_account", "accounts")}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6 mb-6">
        <div className="flex flex-1 gap-4 w-full md:w-auto">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={translate("search", "accounts")}
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={translate("all_accounts", "accounts")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate("all_accounts", "accounts")}</SelectItem>
                <SelectItem value="personal">{translate("personal", "accounts")}</SelectItem>
                <SelectItem value="work">{translate("work", "accounts")}</SelectItem>
                <SelectItem value="finance">{translate("finance", "accounts")}</SelectItem>
                <SelectItem value="favorite">{translate("favorite", "accounts")}</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || selectedCategory !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                <X className="h-4 w-4 mr-2" />
                {translate("clear", "accounts")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-sm">{translate("account", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("username", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("password", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("website", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("tags", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("last_modified", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("actions", "accounts")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && accountsToDisplay.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    {translate("loading_accounts", "accounts")}
                  </td>
                </tr>
              ) : accountsToDisplay.length > 0 ? (
                accountsToDisplay.map((account) => (
                  <tr key={account.doc_id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium">
                          {(account.title || account.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{account.title || account.name}</p>
                          {(account.website || account.url) && (
                            <a
                              href={((account.website || account.url || "").startsWith("http") ? (account.website || account.url || "") : `https://${account.website || account.url || ""}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              {(account.website || account.url || "").replace(/^https?:\/\//, "")}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">
                          {account.username && account.username.length > 0 && viewUsername === account.doc_id
                            ? account.username
                            : account.username && account.username.length > 0
                            ? "••••••••"
                            : "-"}
                        </span>
                        {account.username && account.username.length > 0 && (
                          <div className="flex items-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleUsernameVisibility(account.doc_id)}>
                                    {viewUsername === account.doc_id ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{viewUsername === account.doc_id ? translate("hide_username", "accounts") : translate("show_username", "accounts")}</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => account.username && copyToClipboard(account.doc_id, "username", account.username)}>
                                    {copiedField?.doc_id === account.doc_id && copiedField?.field === "username" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{copiedField?.doc_id === account.doc_id && copiedField?.field === "username" ? translate("copied", "accounts") : translate("copy_username", "accounts")}</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">
                          {account.password && account.password !== "Error processing data" && viewPassword === account.doc_id
                            ? account.password
                            : account.password && account.password !== "Error processing data"
                            ? "••••••••"
                            : account.password}
                        </span>
                        {account.password && account.password !== "-" && account.password !== "Error processing data" && (
                          <div className="flex items-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePasswordVisibility(account.doc_id)}>
                                    {viewPassword === account.doc_id ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{viewPassword === account.doc_id ? translate("hide_password", "accounts") : translate("show_password", "accounts")}</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => account.password && copyToClipboard(account.doc_id, "password", account.password)}>
                                    {copiedField?.doc_id === account.doc_id && copiedField?.field === "password" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{copiedField?.doc_id === account.doc_id && copiedField?.field === "password" ? translate("copied", "accounts") : translate("copy_password", "accounts")}</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {(account.website || account.url) && (
                        <a
                          href={((account.website || account.url || "").startsWith("http") ? (account.website || account.url || "") : `https://${account.website || account.url || ""}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {(account.website || account.url || "").replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {account.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {account.tags?.some(tag => tag.toLowerCase() === 'favorite') && (
                          <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                            <Star className="h-3 w-3 text-amber-500 mr-1" />
                            {translate("favorite", "accounts")}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {format.dateTime(new Date(account.updated_at), { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-3">
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
                          <DropdownMenuItem className="text-red-500" onClick={() => confirmDelete(account.doc_id)}>
                            {translate("delete", "accounts")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-10 w-10 text-muted-foreground/50" />
                      <h3 className="font-medium">{translate("no_accounts_found", "accounts")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedCategory !== "all"
                          ? translate("no_accounts_tag_specific", "accounts", { category: selectedCategory })
                          : searchQuery
                          ? translate("no_accounts_search_specific", "accounts", { searchQuery: searchQuery })
                          : translate("no_accounts_create", "accounts")
                        }
                      </p>
                      <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                        {translate("clear_filters", "accounts")}
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              {translate("showing", "accounts")}{' '}
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-{Math.min(currentPage * itemsPerPage, totalCount)}{' '}
              {translate("of", "accounts")} {totalCount} {translate("accounts", "accounts")}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 mr-4">
                <span className="text-sm text-muted-foreground">{translate("rows_per_page", "accounts")}</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
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
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevPage} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {getPaginationRange().map((pageNum, index) => (
                  <Button
                    key={`${pageNum}-${index}`}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => typeof pageNum === "number" && goToPage(pageNum)}
                    disabled={pageNum === "..." || currentPage === pageNum}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextPage} disabled={currentPage >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(totalPages)} disabled={currentPage >= totalPages}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translate("confirm_deletion", "accounts")}</DialogTitle>
            <DialogDescription>{translate("confirm_delete_account_description", "accounts")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)} disabled={isProcessingDelete}>
              {translate("cancel", "accounts")}
            </Button>
            <Button variant="destructive" onClick={executeDeleteAccount} disabled={isProcessingDelete}>
              {isProcessingDelete ? `${translate("deleting", "accounts")}...` : translate("delete", "accounts")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showAddAccount && <AddAccountDialog onClose={() => setShowAddAccount(false)} onAccountAdded={fetchAccounts} />}
      {showGeneratePassword && <GeneratePasswordDialog onClose={() => setShowGeneratePassword(false)} />}
      {showEditAccount && selectedAccountForEdit && (
        <EditAccountDialog
          account={selectedAccountForEdit}
          onClose={() => { setShowEditAccount(false); setSelectedAccountForEdit(null); }}
          onAccountUpdated={handleAccountUpdated}
        />
      )}
    </div>
  );
}