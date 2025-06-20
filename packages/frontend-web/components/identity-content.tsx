"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User, Plus, Search, Copy, Check, Eye, EyeOff, MoreHorizontal,
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useIdentityManagement } from "@/hooks/use-identity-management";
import { AddIdentityDialog } from "./add-identity-dialog";
import { EditIdentityDialog } from "./edit-identity-dialog";
import { SortButton } from "@/components/ui/sort-button";
import { Identity } from "@/hooks/use-identity-management";

export function IdentityContent() {
  const { translate } = useTranslator();
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const [showAddIdentity, setShowAddIdentity] = useState(false);
  const [showEditIdentity, setShowEditIdentity] = useState(false);
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null);
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null);
  const [viewSensitiveData, setViewSensitiveData] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [identityToDelete, setIdentityToDelete] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const {
    identitiesToDisplay,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    handleDeleteIdentity: handleDeleteIdentityFromHook,
    fetchIdentities,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
    uniqueTags,
    sortConfig,
    setSortConfig
  } = useIdentityManagement({
    selectedWorkspaceId,
    selectedProjectId,
    initialItemsPerPage: 5
  });

  const handleAddIdentity = () => {
    setShowAddIdentity(true);
  };

  const handleEditIdentity = (identity: Identity) => {
    setSelectedIdentity(identity);
    setShowEditIdentity(true);
  };

  const confirmDelete = (doc_id: string) => {
    setIdentityToDelete(doc_id);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteIdentity = async () => {
    if (!identityToDelete) return;
    
    setIsProcessingDelete(true);
    try {
      await handleDeleteIdentityFromHook(identityToDelete);
      setShowDeleteConfirmation(false);
      setIdentityToDelete(null);
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
        title: translate("copied", "identity", { default: "Copied" }),
        description: translate("field_copied", "identity", { default: "Field copied to clipboard" }),
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: translate("copy_failed", "identity", { default: "Copy failed" }),
        description: translate("failed_to_copy_field", "identity", { default: "Failed to copy field to clipboard" }),
        variant: "destructive",
      });
    }
  };

  const toggleDataVisibility = (id: string) => {
    setViewSensitiveData(prev => (prev === id ? null : id));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const maskSensitiveData = (id: string, data: string) => {
    return viewSensitiveData === id ? data : data.replace(/[a-zA-Z0-9]/g, '•');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{translate("identities", "identity", { default: "Identities" })}</h1>
          <p className="text-muted-foreground">{translate("manage_your_personal_identities", "identity", { default: "Manage your personal identity information securely" })}</p>
        </div>
      </div>

      {/* Search, Filter, Sort and Add */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={translate("search_across_all_fields", "identity", { default: "Search across all fields..." })}
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
          
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={translate("filter_by_tag", "identity", { default: "Filter by tag" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translate("all_tags", "identity", { default: "All Tags" })}</SelectItem>
              {uniqueTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="w-40">
            <SortButton 
              sortConfig={sortConfig} 
              onSortChange={setSortConfig} 
              namespace="identity"
              options={[
                { field: "title", label: translate("name", "identity", { default: "Name" }) },
                { field: "created_at", label: translate("date_created", "identity", { default: "Date Created" }) }
              ]}
            />
          </div>
          
          {(searchQuery || selectedTag !== 'all' || sortConfig) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              {translate("clear_filters", "identity", { default: "Clear Filters" })}
            </Button>
          )}
        </div>
        
        <Button onClick={handleAddIdentity} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_identity", "identity", { default: "Add Identity" })}
        </Button>
      </div>

      {/* Identity Table */}
      <div className="border border-border/30 rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{translate("loading_identities", "identity")}</p>
          </div>
        ) : (
          <div className="rounded-md border border-border/30">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    {translate("name", "identity")}
                  </TableHead>
                  <TableHead>{translate("email", "identity")}</TableHead>
                  <TableHead>{translate("phone", "identity")}</TableHead>
                  <TableHead>{translate("country", "identity")}</TableHead>
                  <TableHead>{translate("tags", "identity")}</TableHead>
                  <TableHead>{translate("last_modified", "identity")}</TableHead>
                  <TableHead className="text-right">{translate("actions", "identity")}</TableHead>
                </TableRow>
              </TableHeader>
              {identitiesToDisplay.length > 0 ? (
                <TableBody>
                  {identitiesToDisplay.map((identity: Identity) => (
                    <TableRow key={identity.doc_id}>
                      <TableCell className="font-medium">
                        {identity.title}
                      </TableCell>
                      <TableCell>
                        {identity.email}
                      </TableCell>
                      <TableCell>
                        {identity.phone}
                      </TableCell>
                      <TableCell>
                        {identity.country}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {identity.tags?.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(identity.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditIdentity(identity)}>
                              {translate("edit", "identity", { default: "Edit" })}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDelete(identity.doc_id)} className="text-red-500">
                              {translate("delete", "identity", { default: "Delete" })}
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
                      <p className="text-muted-foreground">
                        {searchQuery || selectedTag !== 'all'
                          ? translate("no_matching_identities", "identity", { default: "No matching identities found" })
                          : translate("no_identities_found", "identity", { default: "No identities found" })}
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleAddIdentity}
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {translate("add_identity", "identity", { default: "Add Identity" })}
                      </Button>
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
              {translate("showing_results", "identity", {
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

      {/* Add Identity Dialog */}
      <AddIdentityDialog
        open={showAddIdentity}
        onOpenChange={setShowAddIdentity}
        onIdentityAdded={fetchIdentities}
        selectedWorkspaceId={selectedWorkspaceId}
        selectedProjectId={selectedProjectId}
      />

      {/* Edit Identity Dialog */}
      <EditIdentityDialog
        open={showEditIdentity}
        onOpenChange={setShowEditIdentity}
        onIdentityUpdated={fetchIdentities}
        selectedWorkspaceId={selectedWorkspaceId}
        selectedProjectId={selectedProjectId}
        identity={selectedIdentity}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translate("confirm_deletion", "identity", { default: "Confirm Deletion" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {translate("delete_identity_confirmation", "identity", { default: "Are you sure you want to delete this identity? This action cannot be undone." })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>
              {translate("cancel", "identity", { default: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIdentity} disabled={isProcessingDelete} className="bg-red-600 hover:bg-red-700">
              {isProcessingDelete
                ? translate("deleting", "identity", { default: "Deleting..." })
                : translate("delete", "identity", { default: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 