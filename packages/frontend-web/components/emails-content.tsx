"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Plus,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  MoreHorizontal,
  X,
  AlertTriangle,
  Filter,
  ArrowDownAZ,
  Clock
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
import { useEmailManagement } from "../hooks/use-email-management";
import { AddEmailDialog } from "./add-email-dialog";
import { EditEmailDialog } from "./edit-email-dialog";
import { SortButton } from "@/components/ui/sort-button";

interface Email {
  doc_id: string;
  title: string;
  lower_title: string;
  data: string;
  email_address: string;
  imap_server: string;
  smtp_server: string;
  username: string;
  password: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

export function EmailsContent() {
  const { translate } = useTranslator();
  const format = useFormatter();
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  const [showAddEmail, setShowAddEmail] = useState(false);
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [viewPassword, setViewPassword] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const {
    emailsToDisplay,
    allEmails,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteEmail: handleDeleteEmailFromHook,
    fetchEmails,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
    filterByTag,
  } = useEmailManagement({
    selectedWorkspaceId,
    selectedProjectId,
    initialItemsPerPage: 5,
  });

  const handleAddEmail = () => {
    setShowAddEmail(true);
  };

  const handleEditEmail = (email: Email) => {
    setSelectedEmail(email);
    setShowEditEmail(true);
  };

  const confirmDelete = (doc_id: string) => {
    setEmailToDelete(doc_id);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteEmail = async () => {
    if (!emailToDelete) return;

    setIsProcessingDelete(true);
    try {
      await handleDeleteEmailFromHook(emailToDelete);
      setShowDeleteConfirmation(false);
      setEmailToDelete(null);
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
          title: translate("copied", "emails", { default: "Copied" }),
          description: translate("field_copied", "emails", {
            default: "Value copied to clipboard",
          }),
        });
      } catch (err) {
        console.error("Failed to copy:", err);
        toast({
          title: translate("copy_failed", "emails", { default: "Copy failed" }),
          description: translate("failed_to_copy_value", "emails", {
            default: "Failed to copy value to clipboard",
          }),
          variant: "destructive",
        });
      }
    },
    [translate]
  );

  const togglePasswordVisibility = useCallback((doc_id: string) => {
    setViewPassword((prev) => (prev === doc_id ? null : doc_id));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "k") {
        e.preventDefault();
        setShowAddEmail(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle tag filter change
  const handleTagChange = (tag: string | null) => {
    setSelectedTag(tag);
    filterByTag(tag);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {translate("email_accounts", "emails", { default: "Email Accounts" })}
          </h1>
          <p className="text-muted-foreground">
            {translate("manage_your_email_accounts", "emails", { default: "Manage your email accounts and server settings securely" })}
          </p>
        </div>
      </div>

      {/* Search, Filter, Sort and Add */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={translate("search_email_accounts", "emails", { default: "Search email accounts..." })}
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
          
          <div className="w-40">
            <Select
              value={selectedTag || "all"}
              onValueChange={(value) => handleTagChange(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full h-9">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder={translate("filter_by_tag", "emails", { default: "Filter by tag" })} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {translate("all_tags", "emails", { default: "All Tags" })}
                </SelectItem>
                {uniqueTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-40">
            <SortButton
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              namespace="emails"
              options={[
                { 
                  field: "title", 
                  label: translate("title", "emails", { default: "Title" }),
                  icon: <ArrowDownAZ className="mr-2 h-4 w-4" />
                },
                { 
                  field: "created_at", 
                  label: translate("date_created", "emails", { default: "Date Created" }),
                  icon: <Clock className="mr-2 h-4 w-4" />
                }
              ]}
            />
          </div>
          
          {(searchQuery || sortConfig || selectedTag) && (
            <Button variant="outline" size="sm" onClick={() => {
              clearFilters();
              setSelectedTag(null);
            }}>
              <X className="h-3 w-3 mr-1" />
              {translate("clear_filters", "emails", { default: "Clear filters" })}
            </Button>
          )}
        </div>
        
        <Button onClick={handleAddEmail} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_email", "emails", { default: "Add Email" })}
        </Button>
      </div>

      {/* Email accounts table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {translate("loading", "emails", { default: "Loading..." })}
            </p>
          </div>
        ) : emailsToDisplay.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? translate("no_results_found", "emails", { default: "No results found" })
                : translate("no_email_accounts", "emails", { default: "No email accounts" })}
            </p>
            <Button
              variant="outline"
              onClick={handleAddEmail}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              {translate("add_email", "emails", { default: "Add Email" })}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  {translate("title", "emails", { default: "Title" })}
                </TableHead>
                <TableHead className="w-[250px]">
                  {translate("email_address", "emails", { default: "Email Address" })}
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  {translate("servers", "emails", { default: "Servers" })}
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  {translate("username", "emails", { default: "Username" })}
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  {translate("password", "emails", { default: "Password" })}
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  {translate("tags", "emails", { default: "Tags" })}
                </TableHead>
                <TableHead>
                  <span className="sr-only">{translate("actions", "emails", { default: "Actions" })}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailsToDisplay.map((email) => (
                <TableRow key={email.doc_id}>
                  <TableCell className="font-medium overflow-hidden text-ellipsis">
                    {email.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="truncate max-w-[120px] md:max-w-[200px]">
                        {email.email_address}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(email.doc_id, "email_address", email.email_address)}
                            >
                              {copiedField?.doc_id === email.doc_id && copiedField?.field === "email_address" ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                              <span className="sr-only">{translate("copy", "emails", { default: "Copy" })}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{translate("copy_to_clipboard", "emails", { default: "Copy to clipboard" })}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-muted-foreground">IMAP:</span>
                        <span className="text-xs truncate max-w-[100px]">{email.imap_server}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(email.doc_id, "imap_server", email.imap_server)}
                              >
                                {copiedField?.doc_id === email.doc_id && copiedField?.field === "imap_server" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{translate("copy_to_clipboard", "emails", { default: "Copy to clipboard" })}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-muted-foreground">SMTP:</span>
                        <span className="text-xs truncate max-w-[100px]">{email.smtp_server}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(email.doc_id, "smtp_server", email.smtp_server)}
                              >
                                {copiedField?.doc_id === email.doc_id && copiedField?.field === "smtp_server" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{translate("copy_to_clipboard", "emails", { default: "Copy to clipboard" })}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center space-x-2">
                      <span className="truncate max-w-[100px]">{email.username}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(email.doc_id, "username", email.username)}
                            >
                              {copiedField?.doc_id === email.doc_id && copiedField?.field === "username" ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{translate("copy_to_clipboard", "emails", { default: "Copy to clipboard" })}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono truncate max-w-[100px]">
                        {viewPassword === email.doc_id ? email.password : "••••••••"}
                      </span>
                      <div className="flex space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => togglePasswordVisibility(email.doc_id)}
                              >
                                {viewPassword === email.doc_id ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {viewPassword === email.doc_id
                                  ? translate("hide_password", "emails", { default: "Hide password" })
                                  : translate("show_password", "emails", { default: "Show password" })}
                              </p>
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
                                onClick={() => copyToClipboard(email.doc_id, "password", email.password)}
                              >
                                {copiedField?.doc_id === email.doc_id && copiedField?.field === "password" ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{translate("copy_to_clipboard", "emails", { default: "Copy to clipboard" })}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {email.tags && email.tags.length > 0 ? (
                        email.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{translate("open_menu", "emails", { default: "Open menu" })}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditEmail(email)}>
                          {translate("edit", "emails", { default: "Edit" })}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => confirmDelete(email.doc_id)}
                        >
                          {translate("delete", "emails", { default: "Delete" })}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination - only show if more than 1 page */}
      {!isLoading && emailsToDisplay.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {translate("showing_results", "emails", {
              default: "Showing {start} to {end} of {total} results",
              start: Math.min(1 + (currentPage - 1) * itemsPerPage, totalCount),
              end: Math.min(currentPage * itemsPerPage, totalCount),
              total: totalCount,
            })}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={prevPage}
                  aria-disabled={currentPage === 1}
                  tabIndex={currentPage === 1 ? -1 : 0}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {getPaginationRange().map((page, i) => (
                typeof page === 'number' ? (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={i}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={nextPage}
                  aria-disabled={currentPage === totalPages}
                  tabIndex={currentPage === totalPages ? -1 : 0}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add email dialog */}
      {showAddEmail && (
        <AddEmailDialog
          open={showAddEmail}
          onOpenChange={setShowAddEmail}
          onEmailAdded={fetchEmails}
          existingEmails={allEmails}
        />
      )}

      {/* Edit email dialog */}
      {showEditEmail && selectedEmail && (
        <EditEmailDialog
          open={showEditEmail}
          onOpenChange={setShowEditEmail}
          onEmailUpdated={fetchEmails}
          existingEmails={allEmails.filter((e) => e.doc_id !== selectedEmail.doc_id)}
          email={selectedEmail}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {translate("confirm_delete", "emails", { default: "Confirm deletion" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translate("delete_email_confirmation", "emails", {
                default: "Are you sure you want to delete this email account? This action cannot be undone.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>
              {translate("cancel", "emails", { default: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteEmail();
              }}
              disabled={isProcessingDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessingDelete
                ? translate("deleting", "emails", { default: "Deleting..." })
                : translate("delete", "emails", { default: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 