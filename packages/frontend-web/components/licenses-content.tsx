"use client";

import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Key, Plus, Search, Copy, Check, Eye, EyeOff, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, AlertTriangle, Calendar, Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLicenseManagement } from "@/hooks/use-license-management";
import { AddLicenseDialog } from "./add-license-dialog";
import { EditLicenseDialog } from "./edit-license-dialog";
import { SortButton } from "@/components/ui/sort-button";

interface License {
  doc_id: string;
  title: string;
  lower_name?: string;
  license_key: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  project_id?: string;
  expires_at?: string | null;
}

export function LicensesContent() {
  const { translate } = useTranslator();
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const [showAddLicense, setShowAddLicense] = useState(false);
  const [showEditLicense, setShowEditLicense] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null);
  const [viewLicenseKey, setViewLicenseKey] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const {
    licensesToDisplay,
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
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteLicense: handleDeleteLicenseFromHook,
    fetchLicenses,
    clearFilters,
    nextPage,
    prevPage,
    goToPage
  } = useLicenseManagement({
    selectedWorkspaceId,
    selectedProjectId,
    initialItemsPerPage: 5
  });

  const handleAddLicense = () => {
    setShowAddLicense(true);
  };

  const handleEditLicense = (license: License) => {
    setSelectedLicense(license);
    setShowEditLicense(true);
  };

  const confirmDelete = (doc_id: string) => {
    setLicenseToDelete(doc_id);
    setShowDeleteConfirmation(true);
  };

  const executeDeleteLicense = async () => {
    if (!licenseToDelete) return;
    setIsProcessingDelete(true);
    await handleDeleteLicenseFromHook(licenseToDelete);
    setShowDeleteConfirmation(false);
    setLicenseToDelete(null);
    setIsProcessingDelete(false);
  };

  const copyToClipboard = async (id: string, field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField({ id, field });
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: translate("copied", "licenses", { default: "Copied" }),
        description: translate("field_copied", "licenses", { default: "Field copied to clipboard" }),
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: translate("copy_failed", "licenses", { default: "Copy failed" }),
        description: translate("failed_to_copy_field", "licenses", { default: "Failed to copy field to clipboard" }),
        variant: "destructive",
      });
    }
  };

  const toggleLicenseKeyVisibility = (id: string) => {
    setViewLicenseKey(prev => (prev === id ? null : id));
  };

  const handleSearch = () => {
    // Search is handled through the hook with the debounced search query
    // This function is here for explicit search button click
    fetchLicenses();
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

  const isExpired = (dateString: string) => {
    try {
      const expiryDate = new Date(dateString);
      const now = new Date();
      return expiryDate < now;
    } catch (e) {
      return false;
    }
  };

  const daysUntilExpiry = (dateString: string) => {
    try {
      const expiryDate = new Date(dateString);
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return 0;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{translate("software_licenses", "licenses", { default: "Software Licenses" })}</h1>
          <p className="text-muted-foreground">{translate("manage_your_software_licenses", "licenses", { default: "Manage your software licenses and keys" })}</p>
        </div>
      </div>

      {/* Search, Filter, Sort and Add */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={translate("search_across_all_fields", "licenses", { default: "Search across all fields..." })}
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
              <SelectValue placeholder={translate("filter_by_tag", "licenses", { default: "Filter by tag" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translate("all_tags", "licenses", { default: "All Tags" })}</SelectItem>
              {uniqueTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="w-40">
            <SortButton 
              sortConfig={sortConfig} 
              onSortChange={setSortConfig} 
              namespace="licenses"
              options={[
                { field: "title", label: translate("name", "licenses", { default: "Name" }) },
                { field: "created_at", label: translate("date_created", "licenses", { default: "Date Created" }) }
              ]}
            />
          </div>
          
          {(searchQuery || selectedTag !== 'all' || sortConfig) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              {translate("clear_filters", "licenses", { default: "Clear Filters" })}
            </Button>
          )}
        </div>
        
        <Button onClick={handleAddLicense} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_license", "licenses", { default: "Add License" })}
        </Button>
      </div>

      {/* Licenses Table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{translate("loading_licenses", "licenses", { default: "Loading licenses..." })}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{translate("software_name", "licenses", { default: "Software" })}</TableHead>
                  <TableHead>{translate("license_key", "licenses", { default: "License Key" })}</TableHead>
                  <TableHead>{translate("expiry_date", "licenses", { default: "Expiry Date" })}</TableHead>
                  <TableHead>{translate("tags", "licenses", { default: "Tags" })}</TableHead>
                  <TableHead className="text-right">{translate("actions", "licenses", { default: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              {licensesToDisplay.length > 0 ? (
                <TableBody>
                  {licensesToDisplay.map((license) => {
                    return (
                      <TableRow key={license.doc_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span>{license.title || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-2">
                            <span>
                              {viewLicenseKey === license.doc_id ? license.license_key : "••••-••••-••••-••••"}
                            </span>
                            {license.license_key && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleLicenseKeyVisibility(license.doc_id)}
                                >
                                  {viewLicenseKey === license.doc_id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(license.doc_id, "license_key", license.license_key)}
                                >
                                  {copiedField?.id === license.doc_id && copiedField?.field === "license_key" ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {license.expires_at && (
                            <div className="flex items-center gap-2">
                              <span className={`${isExpired(license.expires_at) ? 'text-red-500' : (daysUntilExpiry(license.expires_at) < 30 ? 'text-amber-500' : 'text-green-500')}`}>
                                {formatDate(license.expires_at)}
                              </span>
                              {isExpired(license.expires_at) ? (
                                <Badge variant="destructive" className="text-xs">
                                  {translate("expired", "licenses", { default: "Expired" })}
                                </Badge>
                              ) : daysUntilExpiry(license.expires_at) < 30 ? (
                                <Badge variant="outline" className="text-xs text-amber-500 border-amber-500">
                                  {translate("expiring_soon", "licenses", { default: "Expiring soon" })}
                                </Badge>
                              ) : null}
                            </div>
                          )}
                          {!license.expires_at && '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {license.tags?.map((tag) => (
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
                              <DropdownMenuItem onClick={() => handleEditLicense(license)}>
                                {translate("edit", "licenses", { default: "Edit" })}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => confirmDelete(license.doc_id)} className="text-red-500">
                                {translate("delete", "licenses", { default: "Delete" })}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              ) : (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <p className="text-muted-foreground">
                        {searchQuery || selectedTag !== 'all'
                          ? translate("no_matching_licenses", "licenses", { default: "No matching licenses found" })
                          : translate("no_licenses_found", "licenses", { default: "No licenses found" })}
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleAddLicense}
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {translate("add_license", "licenses", { default: "Add License" })}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {translate("showing_results", "licenses", {
                default: `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} results`,
                startIdx: Math.min((currentPage - 1) * itemsPerPage + 1, totalCount),
                endIdx: Math.min(currentPage * itemsPerPage, totalCount),
                totalCount
              })}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 mr-4">
                <span className="text-sm text-muted-foreground">{translate("rows_per_page", "licenses", { default: "Rows per page" })}</span>
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
        </div>
      )}

      {/* Add License Dialog */}
      <AddLicenseDialog
        isOpen={showAddLicense}
        onClose={() => setShowAddLicense(false)}
        projectId={selectedProjectId || ""}
        refetchLicenses={fetchLicenses}
      />

      {/* Edit License Dialog */}
      {showEditLicense && selectedLicense && (
        <EditLicenseDialog
          license={{
            doc_id: selectedLicense.doc_id,
            title: selectedLicense.title,
            data: "", // We need to add this required field - it will be populated with encrypted data
            license_key: selectedLicense.license_key,
            notes: selectedLicense.notes || "",
            expires_at: selectedLicense.expires_at || undefined,
            tags: selectedLicense.tags || [],
            project_id: selectedLicense.project_id || selectedProjectId || ""
          }}
          isOpen={showEditLicense}
          onClose={() => {
            setShowEditLicense(false);
            setSelectedLicense(null);
          }}
          refetchLicenses={fetchLicenses}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translate("confirm_deletion", "licenses", { default: "Confirm Deletion" })}</DialogTitle>
            <DialogDescription>{translate("confirm_delete_license_description", "licenses", { default: "Are you sure you want to delete this license? This action cannot be undone." })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)} disabled={isProcessingDelete}>
              {translate("cancel", "licenses", { default: "Cancel" })}
            </Button>
            <Button variant="destructive" onClick={executeDeleteLicense} disabled={isProcessingDelete}>
              {isProcessingDelete ? `${translate("deleting", "licenses", { default: "Deleting..." })}...` : translate("delete", "licenses", { default: "Delete" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 