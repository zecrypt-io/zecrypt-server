"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Key,
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
import { useSSHKeyManagement } from "../hooks/use-ssh-key-management";
import { AddSSHKeyDialog } from "./add-ssh-key-dialog";
import { EditSSHKeyDialog } from "./edit-ssh-key-dialog";
import { SortButton } from "@/components/ui/sort-button";

interface SSHKey {
  doc_id: string;
  title: string;
  name: string;
  lower_title: string;
  data: string;
  ssh_key: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

export function SSHKeysContent() {
  const { translate } = useTranslator();
  const format = useFormatter();
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  const [showAddSSHKey, setShowAddSSHKey] = useState(false);
  const [showEditSSHKey, setShowEditSSHKey] = useState(false);
  const [selectedSSHKey, setSelectedSSHKey] = useState<SSHKey | null>(null);
  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [viewSSHKey, setViewSSHKey] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [sshKeyToDelete, setSSHKeyToDelete] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const {
    sshKeysToDisplay,
    allSSHKeys,
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
    handleDeleteSSHKey: handleDeleteSSHKeyFromHook,
    fetchSSHKeys,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  } = useSSHKeyManagement({
    selectedWorkspaceId,
    selectedProjectId,
    initialItemsPerPage: 5,
  });

  const handleAddSSHKey = () => {
    setShowAddSSHKey(true);
  };

  const handleEditSSHKey = (sshKey: SSHKey) => {
    setSelectedSSHKey(sshKey);
    setShowEditSSHKey(true);
  };

  const confirmDelete = (doc_id: string) => {
    setSSHKeyToDelete(doc_id);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteSSHKey = async () => {
    if (!sshKeyToDelete) return;

    setIsProcessingDelete(true);
    try {
      await handleDeleteSSHKeyFromHook(sshKeyToDelete);
      setShowDeleteConfirmation(false);
      setSSHKeyToDelete(null);
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
          title: translate("copied", "ssh_keys", { default: "Copied" }),
          description: translate("ssh_key_copied", "ssh_keys", {
            default: "SSH key copied to clipboard",
          }),
        });
      } catch (err) {
        console.error("Failed to copy:", err);
        toast({
          title: translate("copy_failed", "ssh_keys", { default: "Copy failed" }),
          description: translate("failed_to_copy_ssh_key", "ssh_keys", {
            default: "Failed to copy SSH key to clipboard",
          }),
          variant: "destructive",
        });
      }
    },
    [translate]
  );

  const toggleSSHKeyVisibility = useCallback((doc_id: string) => {
    setViewSSHKey((prev) => (prev === doc_id ? null : doc_id));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "k") {
        e.preventDefault();
        setShowAddSSHKey(true);
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
            {translate("ssh_keys", "ssh_keys", { default: "SSH Keys" })}
          </h1>
          <p className="text-muted-foreground">
            {translate("manage_your_ssh_keys", "ssh_keys", { default: "Manage your SSH keys securely" })}
          </p>
        </div>
      </div>

      {/* Search, Filter, Sort and Add */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={translate("search_ssh_keys", "ssh_keys", { default: "Search SSH keys..." })}
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
          
          <Select value={""} onValueChange={() => {}}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={translate("filter_by_tag", "ssh_keys", { default: "Filter by tag" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translate("all_tags", "ssh_keys", { default: "All Tags" })}</SelectItem>
              {uniqueTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="w-40">
            <SortButton
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              namespace="ssh_keys"
              options={[
                { field: "name", label: translate("name", "ssh_keys", { default: "Name" }) },
                { field: "created_at", label: translate("date_created", "ssh_keys", { default: "Date Created" }) }
              ]}
            />
          </div>
          
          {(searchQuery || sortConfig) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              {translate("clear_filters", "ssh_keys", { default: "Clear filters" })}
            </Button>
          )}
        </div>
        
        <Button onClick={handleAddSSHKey} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_ssh_key", "ssh_keys", { default: "Add SSH Key" })}
        </Button>
      </div>

      {/* SSH Keys Table */}
      <div className="border border-border/30 rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{translate("loading_ssh_keys", "ssh_keys")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  {translate("name", "ssh_keys")}
                </TableHead>
                <TableHead>{translate("fingerprint", "ssh_keys")}</TableHead>
                <TableHead>{translate("tags", "ssh_keys")}</TableHead>
                <TableHead>{translate("last_modified", "ssh_keys")}</TableHead>
                <TableHead className="text-right">{translate("actions", "ssh_keys")}</TableHead>
              </TableRow>
            </TableHeader>
            {sshKeysToDisplay.length > 0 ? (
              <TableBody>
                {sshKeysToDisplay.map((key) => (
                  <TableRow key={key.doc_id}>
                    <TableCell className="font-medium overflow-hidden text-ellipsis">
                      {key.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-full max-w-[500px]">
                          <div className="font-mono text-xs bg-muted p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap">
                            {viewSSHKey === key.doc_id 
                              ? key.ssh_key 
                              : `${key.ssh_key.substring(0, 30)}...`}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => toggleSSHKeyVisibility(key.doc_id)}
                                >
                                  {viewSSHKey === key.doc_id ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {viewSSHKey === key.doc_id
                                    ? translate("hide_ssh_key", "ssh_keys", { default: "Hide SSH key" })
                                    : translate("show_ssh_key", "ssh_keys", { default: "Show full SSH key" })}
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
                                  onClick={() => copyToClipboard(key.doc_id, "ssh_key", key.ssh_key)}
                                >
                                  {copiedField?.doc_id === key.doc_id && copiedField?.field === "ssh_key" ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{translate("copy_to_clipboard", "ssh_keys", { default: "Copy to clipboard" })}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.tags && key.tags.length > 0 ? (
                          key.tags.map((tag) => (
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
                      {key.updated_at ? format.dateTime(new Date(key.updated_at)) : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">{translate("open_menu", "ssh_keys", { default: "Open menu" })}</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditSSHKey(key)}>
                            {translate("edit", "ssh_keys", { default: "Edit" })}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => confirmDelete(key.doc_id)}
                          >
                            {translate("delete", "ssh_keys", { default: "Delete" })}
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
                    <div className="flex flex-col items-center justify-center gap-4">
                      {searchQuery ? (
                        <>
                          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {translate("no_results_found", "ssh_keys", { default: "No results found" })}
                          </p>
                        </>
                      ) : (
                        <>
                          {/* <Key className="h-5 w-5 text-muted-foreground" /> */}
                          <p className="text-muted-foreground">
                            {translate("no_ssh_keys", "ssh_keys", { default: "No SSH keys" })}
                          </p>
                          <Button
                            variant="outline"
                            onClick={handleAddSSHKey}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {translate("add_ssh_key", "ssh_keys", { default: "Add SSH Key" })}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        )}
      </div>

      {/* Pagination - only show if more than 1 page */}
      {!isLoading && sshKeysToDisplay.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {translate("showing_results", "ssh_keys", {
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
        </div>
      )}

      {/* Add SSH key dialog */}
      {showAddSSHKey && (
        <AddSSHKeyDialog
          open={showAddSSHKey}
          onOpenChange={setShowAddSSHKey}
          onSSHKeyAdded={fetchSSHKeys}
          existingSSHKeys={allSSHKeys}
        />
      )}

      {/* Edit SSH key dialog */}
      {showEditSSHKey && selectedSSHKey && (
        <EditSSHKeyDialog
          open={showEditSSHKey}
          onOpenChange={setShowEditSSHKey}
          onSSHKeyUpdated={fetchSSHKeys}
          existingSSHKeys={allSSHKeys.filter((s) => s.doc_id !== selectedSSHKey.doc_id)}
          sshKey={selectedSSHKey}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {translate("confirm_delete", "ssh_keys", { default: "Confirm deletion" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translate("delete_ssh_key_confirmation", "ssh_keys", {
                default: "Are you sure you want to delete this SSH key? This action cannot be undone.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>
              {translate("cancel", "ssh_keys", { default: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSSHKey();
              }}
              disabled={isProcessingDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessingDelete
                ? translate("deleting", "ssh_keys", { default: "Deleting..." })
                : translate("delete", "ssh_keys", { default: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}