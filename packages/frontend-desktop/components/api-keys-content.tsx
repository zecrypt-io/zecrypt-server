"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Filter,
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
import { useApiKeyManagement } from "@/hooks/use-apikey-management";
import { AddApiKey } from "./add-apikey";
import { EditApiKey } from "./edit-apikey";
import { SortButton } from "@/components/ui/sort-button";
import { secureGetItem, decryptFromLocalStorage } from "@/libs/local-storage-utils";
import { decryptDataField } from "@/libs/encryption";

interface ApiKey {
  doc_id: string;
  title: string;
  lower_title: string;
  data: string;
  notes?: string | null;
  env: "Development" | "Staging" | "Production" | "Testing" | "Local" | "UAT";
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

export function ApiKeysContent() {
  const { translate } = useTranslator();
  const format = useFormatter();
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  
  const selectedProjectName = useMemo(() => {
    if (!workspaces || !selectedWorkspaceId || !selectedProjectId) return null;
    const workspace = workspaces.find(w => w.workspaceId === selectedWorkspaceId);
    if (!workspace) return null;
    const project = workspace.projects.find(p => p.project_id === selectedProjectId);
    return project?.name || null;
  }, [workspaces, selectedWorkspaceId, selectedProjectId]);

  const [showAddApiKey, setShowAddApiKey] = useState(false);
  const [showEditApiKey, setShowEditApiKey] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, string>>({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [apiKeyToDelete, setApiKeyToDelete] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const {
    apiKeysToDisplay,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    selectedEnv,
    setSelectedEnv,
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteApiKey: handleDeleteApiKeyFromHook,
    fetchApiKeys,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  } = useApiKeyManagement({
    selectedWorkspaceId,
    selectedProjectId,
    initialItemsPerPage: 5,
  });

  // Load the project key once when selectedProjectName changes
  useEffect(() => {
    const loadProjectKey = async () => {
      if (selectedProjectName) {
        try {
          console.log("Loading project key for project:", selectedProjectName);
          // Use project name to get encryption key
          const key = await secureGetItem(`projectKey_${selectedProjectName}`);
          console.log("Project key loaded:", key ? "Found" : "Not found");
          setProjectKey(key);
        } catch (error) {
          console.error("Error loading project key:", error);
          setProjectKey(null);
        }
      } else {
        setProjectKey(null);
      }
    };
    
    loadProjectKey();
  }, [selectedProjectName]);

  const handleAddApiKey = () => {
    setShowAddApiKey(true);
  };

  const handleEditApiKey = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setShowEditApiKey(true);
  };

  const confirmDelete = (doc_id: string) => {
    setApiKeyToDelete(doc_id);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteApiKey = async () => {
    if (!apiKeyToDelete) return;

    setIsProcessingDelete(true);
    try {
      await handleDeleteApiKeyFromHook(apiKeyToDelete);
      setShowDeleteConfirmation(false);
      setApiKeyToDelete(null);
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const toggleKeyVisibility = useCallback(async (doc_id: string) => {
    if (viewKey === doc_id) {
      setViewKey(null);
      return;
    }
    
    const apiKey = apiKeysToDisplay.find(key => key.doc_id === doc_id);
    if (!apiKey) return;
    
    if (decryptedKeys[doc_id]) {
      setViewKey(doc_id);
      return;
    }
    
    let effectiveProjectKey = projectKey;
    if (!effectiveProjectKey && selectedProjectName) {
      try {
        const rawProjectKey = localStorage.getItem(`projectKey_${selectedProjectName}`);
        if (rawProjectKey) {
          effectiveProjectKey = await decryptFromLocalStorage(rawProjectKey);
        }
      } catch (error) {
        console.error("Failed to get project key directly:", error);
      }
    }
    
    if (apiKey.data && apiKey.data.includes('.') && effectiveProjectKey) {
      try {
        const decrypted = await decryptDataField(apiKey.data, effectiveProjectKey);
        try {
          const apiKeyObject = JSON.parse(decrypted);
          setDecryptedKeys(prev => ({ ...prev, [doc_id]: apiKeyObject.key }));
        } catch (e) {
          setDecryptedKeys(prev => ({ ...prev, [doc_id]: decrypted }));
        }
      } catch (error) {
        console.error("Failed to decrypt API key:", error);
        toast({
          title: translate("error", "actions"),
          description: translate("failed_to_decrypt", "api_keys", { default: "Failed to decrypt API key" }),
          variant: "destructive",
        });
        setDecryptedKeys(prev => ({ ...prev, [doc_id]: apiKey.data }));
      }
    } else {
      setDecryptedKeys(prev => ({ ...prev, [doc_id]: apiKey.data }));
    }
    
    setViewKey(doc_id);
  }, [apiKeysToDisplay, viewKey, projectKey, selectedProjectName, translate, decryptedKeys]);

  const copyToClipboard = useCallback(
    async (doc_id: string, field: string, value: string) => {
      let textToCopy = value;
      
      if (field === "key") {
        if (decryptedKeys[doc_id]) {
          textToCopy = decryptedKeys[doc_id];
        } else if (value.includes('.')) {
          let effectiveProjectKey = projectKey;
          if (!effectiveProjectKey && selectedProjectName) {
            try {
              const rawProjectKey = localStorage.getItem(`projectKey_${selectedProjectName}`);
              if (rawProjectKey) {
                effectiveProjectKey = await decryptFromLocalStorage(rawProjectKey);
              }
            } catch (error) {
              console.error("Failed to get project key directly:", error);
            }
          }
          
          if (effectiveProjectKey) {
            try {
              const decrypted = await decryptDataField(value, effectiveProjectKey);
              try {
                const apiKeyObject = JSON.parse(decrypted);
                textToCopy = apiKeyObject.key;
                setDecryptedKeys(prev => ({ ...prev, [doc_id]: apiKeyObject.key }));
              } catch (e) {
                textToCopy = decrypted;
                setDecryptedKeys(prev => ({ ...prev, [doc_id]: decrypted }));
              }
            } catch (error) {
              console.error("Failed to decrypt API key for copying:", error);
              textToCopy = value;
            }
          }
        }
      }
      
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedField({ doc_id, field });
        setTimeout(() => setCopiedField(null), 2000);
        toast({
          title: translate("copied", "api_keys", { default: "Copied" }),
          description: translate("api_key_copied", "api_keys", { default: "API key copied to clipboard" }),
        });
      } catch (err) {
        console.error("Failed to copy:", err);
        toast({
          title: translate("copy_failed", "api_keys", { default: "Copy failed" }),
          description: translate("failed_to_copy_api_key", "api_keys", {
            default: "Failed to copy API key to clipboard",
          }),
          variant: "destructive",
        });
      }
    },
    [translate, decryptedKeys, projectKey, selectedProjectName]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowAddApiKey(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{translate("api_keys", "api_keys", { default: "API Keys" })}</h1>
          <p className="text-muted-foreground">{translate("manage_your_api_keys", "api_keys", { default: "Manage your API keys" })}</p>
        </div>
      </div>

      {/* Search, Filter, Sort and Add */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={translate("search_across_all_fields", "api_keys", {
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
          
          <Select value={selectedEnv} onValueChange={setSelectedEnv}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={translate("filter_by_env", "api_keys", { default: "Filter by environment" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translate("all_envs", "api_keys", { default: "All Environments" })}</SelectItem>
              <SelectItem value="Development">{translate("development", "api_keys", { default: "Development" })}</SelectItem>
              <SelectItem value="Staging">{translate("staging", "api_keys", { default: "Staging" })}</SelectItem>
              <SelectItem value="Production">{translate("production", "api_keys", { default: "Production" })}</SelectItem>
              <SelectItem value="Testing">{translate("testing", "api_keys", { default: "Testing" })}</SelectItem>
              <SelectItem value="Local">{translate("local", "api_keys", { default: "Local" })}</SelectItem>
              <SelectItem value="UAT">{translate("uat", "api_keys", { default: "UAT" })}</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-40">
            <SortButton 
              sortConfig={sortConfig} 
              onSortChange={setSortConfig} 
              namespace="api_keys" 
              options={[
                { field: "title", label: translate("name", "api_keys", { default: "Name" }) },
                { field: "created_at", label: translate("date_created", "api_keys", { default: "Date Created" }) }
              ]}
            />
          </div>
          
          {(searchQuery || selectedEnv !== "all" || sortConfig) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              {translate("clear_filters", "api_keys", { default: "Clear Filters" })}
            </Button>
          )}
        </div>
        
        <Button onClick={handleAddApiKey} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_api_key", "api_keys", { default: "Add API Key" })}
        </Button>
      </div>

      {/* API Keys Table */}
      <div className="border border-border/30 rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{translate("loading_api_keys", "api_keys")}</p>
          </div>
        ) : (
          <div className="rounded-md border border-border/30">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">
                    {translate("name", "api_keys")}
                  </TableHead>
                  <TableHead>{translate("api_key", "api_keys")}</TableHead>
                  <TableHead>{translate("last_used", "api_keys")}</TableHead>
                  <TableHead>{translate("tags", "api_keys")}</TableHead>
                  <TableHead className="text-right">{translate("actions", "api_keys")}</TableHead>
                </TableRow>
              </TableHeader>
              {apiKeysToDisplay.length > 0 ? (
                <TableBody>
                  {apiKeysToDisplay.map((apiKey) => (
                    <TableRow key={apiKey.doc_id}>
                      <TableCell className="font-medium">{apiKey.title}</TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <span>
                            {viewKey === apiKey.doc_id ? (decryptedKeys[apiKey.doc_id] || "••••••••") : "••••••••"}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleKeyVisibility(apiKey.doc_id)}
                                >
                                  {viewKey === apiKey.doc_id ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {viewKey === apiKey.doc_id
                                  ? translate("hide_key", "api_keys", { default: "Hide key" })
                                  : translate("show_key", "api_keys", { default: "Show key" })}
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
                                  onClick={() => copyToClipboard(apiKey.doc_id, "key", apiKey.data)}
                                >
                                  {copiedField?.doc_id === apiKey.doc_id && copiedField?.field === "key" ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {translate("copy_key", "api_keys", { default: "Copy key" })}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {apiKey.env}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {apiKey.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {apiKey.updated_at
                          ? format.dateTime(new Date(apiKey.updated_at), {
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
                            <DropdownMenuItem onClick={() => handleEditApiKey(apiKey)}>
                              {translate("edit", "api_keys", { default: "Edit" })}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDelete(apiKey.doc_id)}
                              className="text-red-500"
                            >
                              {translate("delete", "api_keys", { default: "Delete" })}
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
                      <p className="text-muted-foreground">
                        {searchQuery || selectedEnv !== "all"
                          ? translate("try_adjusting_search_or_filter", "api_keys", { default: "Try adjusting your search or filter criteria" })
                          : translate("no_api_keys_found", "api_keys", { default: "No API keys found" })}
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleAddApiKey}
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {translate("add_api_key", "api_keys", { default: "Add API Key" })}
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
              {translate("showing_results", "api_keys", {
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
                {getPaginationRange().map((page, index) =>
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

      {/* Add API Key Dialog */}
      <AddApiKey
        onApiKeyAdded={fetchApiKeys}
        open={showAddApiKey}
        onOpenChange={setShowAddApiKey}
      />

      {/* Edit API Key Dialog */}
      {showEditApiKey && selectedApiKey && (
        <EditApiKey
          apiKey={selectedApiKey}
          onApiKeyUpdated={fetchApiKeys}
          open={showEditApiKey}
          onOpenChange={(open) => {
            setShowEditApiKey(open);
            if (!open) {
              setSelectedApiKey(null);
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {translate("confirm_deletion", "api_keys", { default: "Confirm Deletion" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translate("delete_api_key_confirmation", "api_keys", {
                default: "Are you sure you want to delete this API key? This action cannot be undone.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>
              {translate("cancel", "api_keys", { default: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApiKey}
              disabled={isProcessingDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessingDelete
                ? translate("deleting", "api_keys", { default: "Deleting..." })
                : translate("delete", "api_keys", { default: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}