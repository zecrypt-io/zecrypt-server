"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
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
  Code,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { useEnvManagement } from "@/hooks/use-env-management";
import { AddEnvDialog } from "./add-env-dialog";
import { EditEnvDialog } from "./edit-env-dialog";
import { SortButton } from "@/components/ui/sort-button";
import { secureGetItem, decryptFromLocalStorage } from "@/libs/local-storage-utils";
import { decryptDataField } from "@/libs/encryption";
import { EnvCodeEditor } from "@/components/ui/env-code-editor";
import { formatDate } from "@/libs/utils";

interface Env {
  doc_id: string;
  title: string;
  lower_title: string;
  data: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

export function EnvContent() {
  const { translate } = useTranslator();
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

  const [showAddEnv, setShowAddEnv] = useState(false);
  const [showEditEnv, setShowEditEnv] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<Env | null>(null);
  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [decryptedEnvs, setDecryptedEnvs] = useState<Record<string, string>>({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [envToDelete, setEnvToDelete] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [viewingEnv, setViewingEnv] = useState<{ title: string; data: string } | null>(null);

  const {
    envsToDisplay,
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
    handleDeleteEnv: handleDeleteEnvFromHook,
    fetchEnvs,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  } = useEnvManagement({
    selectedWorkspaceId,
    selectedProjectId,
    initialItemsPerPage: 5,
  });

  // Load the project key once when selectedProjectName changes
  useEffect(() => {
    const loadProjectKey = async () => {
      if (selectedProjectName) {
        try {
          // Use project name to get encryption key
          const key = await secureGetItem(`projectKey_${selectedProjectName}`);
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

  const handleAddEnv = () => {
    setShowAddEnv(true);
  };

  const handleEditEnv = (env: Env) => {
    setSelectedEnv(env);
    setShowEditEnv(true);
  };

  const confirmDelete = (doc_id: string) => {
    setEnvToDelete(doc_id);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteEnv = async () => {
    if (!envToDelete) return;

    setIsProcessingDelete(true);
    try {
      await handleDeleteEnvFromHook(envToDelete);
      setShowDeleteConfirmation(false);
      setEnvToDelete(null);
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const openCodeEditor = async (env: Env) => {
    // Get the latest env data from the current list
    const latestEnv = envsToDisplay.find(e => e.doc_id === env.doc_id) || env;
    
    // First try to get decrypted data if we have it already and the data hasn't changed
    if (decryptedEnvs[latestEnv.doc_id] && latestEnv.data === env.data) {
      setViewingEnv({
        title: latestEnv.title,
        data: decryptedEnvs[latestEnv.doc_id]
      });
      setCodeEditorOpen(true);
      return;
    }
    
    // Otherwise decrypt it
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
    
    if (latestEnv.data && latestEnv.data.includes('.') && effectiveProjectKey) {
      try {
        const decrypted = await decryptDataField(latestEnv.data, effectiveProjectKey);
        setDecryptedEnvs(prev => ({ ...prev, [latestEnv.doc_id]: decrypted }));
        setViewingEnv({
          title: latestEnv.title,
          data: decrypted
        });
      } catch (error) {
        console.error("Failed to decrypt environment variables:", error);
        toast({
          title: translate("error", "actions"),
          description: translate("failed_to_decrypt", "env", { default: "Failed to decrypt environment variables" }),
          variant: "destructive",
        });
        setViewingEnv({
          title: latestEnv.title,
          data: latestEnv.data
        });
      }
    } else {
      setViewingEnv({
        title: latestEnv.title,
        data: latestEnv.data
      });
    }
    
    setCodeEditorOpen(true);
  };

  const copyToClipboard = useCallback(
    async (doc_id: string, field: string, value: string) => {
      let textToCopy = value;
      
      if (field === "data") {
        if (decryptedEnvs[doc_id]) {
          textToCopy = decryptedEnvs[doc_id];
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
              textToCopy = decrypted;
              setDecryptedEnvs(prev => ({ ...prev, [doc_id]: decrypted }));
            } catch (error) {
              console.error("Failed to decrypt environment variables for copying:", error);
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
          title: translate("copied", "env", { default: "Copied" }),
          description: translate("env_copied", "env", { default: "Environment variables copied to clipboard" }),
        });
      } catch (err) {
        console.error("Failed to copy:", err);
        toast({
          title: translate("copy_failed", "env", { default: "Copy failed" }),
          description: translate("failed_to_copy_env", "env", {
            default: "Failed to copy environment variables to clipboard",
          }),
          variant: "destructive",
        });
      }
    },
    [translate, decryptedEnvs, projectKey, selectedProjectName]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowAddEnv(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{translate("env_variables", "env", { default: "Environment Variables" })}</h1>
          <p className="text-muted-foreground">{translate("manage_your_env", "env", { default: "Manage your environment variables" })}</p>
        </div>
      </div>

      {/* Search, Filter, Sort and Add */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={translate("search_across_all_fields", "env", {
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
          
          <div className="w-40">
            <SortButton 
              sortConfig={sortConfig} 
              onSortChange={setSortConfig} 
              namespace="env" 
              options={[
                { field: "title", label: translate("name", "env", { default: "Name" }) },
                { field: "created_at", label: translate("date_created", "env", { default: "Date Created" }) }
              ]}
            />
          </div>
          
          {(searchQuery || sortConfig) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              {translate("clear_filters", "env", { default: "Clear Filters" })}
            </Button>
          )}
        </div>
        
        <Button onClick={handleAddEnv} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_env", "env", { default: "Add Environment Variables" })}
        </Button>
      </div>

      {/* Environment Variables Table */}
      <div className="border border-border/30 rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{translate("loading_env", "env", { default: "Loading environment variables..." })}</p>
          </div>
        ) : (
          <div className="rounded-md border border-border/30">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    {translate("name", "env", { default: "Name" })}
                  </TableHead>
                  <TableHead>{translate("env_variables", "env", { default: "Environment Variables" })}</TableHead>
                  <TableHead>{translate("tags", "env", { default: "Tags" })}</TableHead>
                  <TableHead>{translate("created_at", "env", { default: "Created At" })}</TableHead>
                  <TableHead className="text-right">{translate("actions", "env", { default: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              {envsToDisplay.length > 0 ? (
                <TableBody>
                  {envsToDisplay.map((env) => (
                    <TableRow key={env.doc_id}>
                      <TableCell className="font-medium">{env.title}</TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[300px] text-muted-foreground">
                            {translate("env_hidden", "env", { default: "••••••••" })}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => openCodeEditor(env)}
                                >
                                  <Code className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {translate("view_env_code", "env", { default: "View in code editor" })}
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
                                  onClick={() => copyToClipboard(env.doc_id, "data", env.data)}
                                >
                                  {copiedField?.doc_id === env.doc_id && copiedField?.field === "data" ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {translate("copy_env", "env", { default: "Copy environment variables" })}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {env.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {env.created_at ? formatDate(env.created_at) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openCodeEditor(env)}>
                              {translate("view", "actions", { default: "View" })}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditEnv(env)}>
                              {translate("edit", "actions", { default: "Edit" })}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDelete(env.doc_id)}
                              className="text-red-500 hover:text-red-500 focus:text-red-500"
                            >
                              {translate("delete", "actions", { default: "Delete" })}
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
                    <TableCell colSpan={5} className="text-center py-6">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchQuery ? (
                            translate("no_matching_env", "env", { default: "No matching environment variables found" })
                          ) : (
                            translate("no_env_yet", "env", { default: "No environment variables added yet" })
                          )}
                        </p>
                        <Button size="sm" variant="outline" onClick={handleAddEnv}>
                          <Plus className="h-4 w-4 mr-2" />
                          {translate("add_env", "env", { default: "Add Environment Variables" })}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {translate("showing_x_of_y", "pagination", {
              default: "Showing {start} - {end} of {total} items",
              start: (currentPage - 1) * itemsPerPage + 1,
              end: Math.min(currentPage * itemsPerPage, totalCount),
              total: totalCount,
            })}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => prevPage()}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {getPaginationRange().map((page, index) =>
                page === "..." ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={`page-${page}`}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => goToPage(Number(page))}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => nextPage()}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translate("confirm_delete", "actions", { default: "Confirm Delete" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {translate("delete_env_confirmation", "env", {
                default: "Are you sure you want to delete this environment variables? This action cannot be undone.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>
              {translate("cancel", "actions", { default: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteEnv();
              }}
              disabled={isProcessingDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {isProcessingDelete
                ? translate("deleting", "actions", { default: "Deleting..." })
                : translate("delete", "actions", { default: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add and Edit Dialogs */}
      {showAddEnv && (
        <AddEnvDialog
          open={showAddEnv}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              // When dialog closes, clear the cached decrypted values to force re-decryption
              setDecryptedEnvs({});
            }
            setShowAddEnv(isOpen);
          }}
          onEnvAdded={() => {
            // Clear cached decrypted values when env is added
            setDecryptedEnvs({});
            fetchEnvs();
          }}
        />
      )}
      {showEditEnv && selectedEnv && (
        <EditEnvDialog
          open={showEditEnv}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              // When dialog closes, clear the cached decrypted values to force re-decryption
              setDecryptedEnvs({});
            }
            setShowEditEnv(isOpen);
          }}
          onEnvUpdated={() => {
            // Clear cached decrypted values when env is updated
            setDecryptedEnvs({});
            fetchEnvs();
          }}
          env={{
            id: selectedEnv.doc_id,
            title: selectedEnv.title,
            data: selectedEnv.data,
            notes: selectedEnv.notes || null,
            tags: selectedEnv.tags || [],
            created_at: selectedEnv.created_at,
            updated_at: selectedEnv.updated_at || ""
          }}
        />
      )}

      {/* Code Editor Dialog */}
      {viewingEnv && (
        <EnvCodeEditor
          value={viewingEnv.data}
          open={codeEditorOpen}
          onOpenChange={setCodeEditorOpen}
          title={viewingEnv.title}
          readOnly={true}
        />
      )}
    </div>
  );
}
