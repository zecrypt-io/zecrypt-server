
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Key, Plus, Search, Copy, Check, Eye, EyeOff, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { decrypt, hexToCryptoKey, ENCRYPTION_KEY } from "../libs/crypto";
import { AddApiKey } from "./add-apikey";
import { EditApiKey } from "./edit-apikey";

interface ApiKey {
  doc_id: string;
  name: string;
  data: { hash: string; encryptedKey: string };
  created_at: string;
  updated_at: string | null;
  env: "Development" | "Staging" | "Production";
  tags: string[];
  decryptedKey?: string;
  decrypted?: boolean;
  decryptionError?: boolean;
}

export function ApiKeysContent() {
  const { translate } = useTranslator();
  const [showAddApiKey, setShowAddApiKey] = useState(false);
  const [showEditApiKey, setShowEditApiKey] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEnv, setSelectedEnv] = useState("all");
  const [allApiKeys, setAllApiKeys] = useState<ApiKey[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const currentLocale = useSelector((state: RootState) => state.user.userData?.locale || "en");

  const decryptApiKeyData = useCallback(async (apiKey: ApiKey): Promise<ApiKey> => {
    try {
      if (apiKey.data?.encryptedKey) {
        try {
          const cryptoKey = await hexToCryptoKey(ENCRYPTION_KEY);
          const decryptedKey = await decrypt(apiKey.data.encryptedKey, cryptoKey);
          return { ...apiKey, decryptedKey, decrypted: true };
        } catch (decryptError) {
          console.error("Failed to decrypt API key:", {
            error: decryptError instanceof Error ? decryptError.message : String(decryptError),
            api_key_id: apiKey.doc_id,
          });
          return { ...apiKey, decryptedKey: "Decryption failed", decrypted: false, decryptionError: true };
        }
      }
      return { ...apiKey, decryptedKey: "Data unavailable", decrypted: false, decryptionError: true };
    } catch (error: unknown) {
      console.error("Failed to process API key data:", {
        error: error instanceof Error ? error.message : String(error),
        api_key_id: apiKey.doc_id,
      });
      return { ...apiKey, decryptedKey: "Error processing data", decrypted: false, decryptionError: true };
    }
  }, []);

  const getEnvTag = useCallback((env: string): string => {
    return env.toLowerCase();
  }, []);

  const fetchApiKeys = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for fetching API keys:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setIsLoading(false);
      alert(`${translate("error_fetching_api_keys", "api_keys")}: ${translate("no_project_selected", "api_keys")}`);
      return;
    }

    try {
      setIsLoading(true);
      let tagsArray: string[] = [];
      if (selectedEnv !== "all") {
        tagsArray = [getEnvTag(selectedEnv)];
      }

      const payload = {
        page: currentPage,
        limit: itemsPerPage,
        name: searchQuery.trim() || null,
        env: selectedEnv !== "all" ? selectedEnv : null,
        tags: tagsArray,
      };

      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/api-keys/list`,
        payload
      );

      const { data: fetchedApiKeys = [], count = 0, total_count = 0 } = response.data || {};

      const decryptedApiKeys = await Promise.all(
        fetchedApiKeys.map(async (key: any) => {
          const apiKey: ApiKey = {
            doc_id: key.doc_id,
            name: key.name,
            data: key.data,
            created_at: key.created_at,
            updated_at: key.updated_at,
            env: key.env,
            tags: key.tags || [],
          };
          return decryptApiKeyData(apiKey);
        })
      );

      setAllApiKeys(decryptedApiKeys);
      setTotalCount(total_count || count);
    } catch (error: any) {
      console.error("Error fetching API keys:", error);
      alert(`${translate("error_fetching_api_keys", "api_keys")}: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, currentPage, itemsPerPage, searchQuery, selectedEnv, decryptApiKeyData, getEnvTag, ]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

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

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const copyToClipboard = useCallback(async (doc_id: string, field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField({ doc_id, field });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert(`${translate("copy_failed", "api_keys")}: ${translate("failed_to_copy_api_key", "api_keys")}`);
    }
  }, [translate]);

  const toggleKeyVisibility = useCallback((doc_id: string) => {
    setViewKey(prev => (prev === doc_id ? null : doc_id));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedEnv("all");
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDeleteApiKey = useCallback(
    async (doc_id: string) => {
      if (!selectedWorkspaceId || !selectedProjectId) {
        console.error("Missing required data for deleting API key:", {
          selectedWorkspaceId,
          selectedProjectId,
        });
        alert(`${translate("error_deleting_api_key", "api_keys")}: ${translate("no_project_selected", "api_keys")}`);
        return;
      }

      if (!confirm(translate("confirm_delete_api_key", "api_keys"))) {
        return;
      }

      try {
        await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/api-keys/${doc_id}`);
        fetchApiKeys();
        alert(translate("api_key_deleted_successfully", "api_keys"));
      } catch (error: any) {
        console.error("Error deleting API key:", error);
        alert(`${translate("error_deleting_api_key", "api_keys")}: ${error.response?.data?.message || error.message}`);
      }
    },
    [selectedWorkspaceId, selectedProjectId, translate, fetchApiKeys]
  );

  const handleApiKeyUpdated = useCallback(() => {
    setShowEditApiKey(false);
    setSelectedApiKey(null);
    fetchApiKeys();
    alert(translate("api_key_updated_successfully", "api_keys"));
  }, [fetchApiKeys, translate]);

  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSearchQuery(value);
        setCurrentPage(1);
      }, 300);
    };
  }, []);

  const getPaginationRange = useCallback(() => {
    const maxPagesToShow = 5;
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const half = Math.floor(maxPagesToShow / 2);
      let start = Math.max(1, currentPage - half);
      let end = Math.min(totalPages, start + maxPagesToShow - 1);

      if (end - start < maxPagesToShow - 1) {
        start = end - maxPagesToShow + 1;
      }

      if (start > 1) {
        pageNumbers.push(1);
        if (start > 2) pageNumbers.push("...");
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  }, [currentPage, totalPages]);

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">{translate("loading_api_keys", "api_keys")}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{translate("api_keys", "api_keys")}</h1>
        <p className="text-muted-foreground">{translate("manage_your_api_keys", "api_keys")}</p>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-1 gap-4 w-full md:w-auto">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={translate("search", "api_keys")}
              className="pl-8 w-full"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={selectedEnv}
              onValueChange={(value) => {
                setSelectedEnv(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Environments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
                <SelectItem value="Staging">Staging</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || selectedEnv !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                <X className="h-4 w-4 mr-2" />
                {translate("clear", "api_keys")}
              </Button>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowAddApiKey(true)}
        >
          <Plus className="h-4 w-4" />
          {translate("add_api_key", "api_keys")}
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-sm">{translate("name", "api_keys")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("key", "api_keys")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("env", "api_keys")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("tags", "api_keys")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("last_modified", "api_keys")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("actions", "api_keys")}</th>
              </tr>
            </thead>
            <tbody>
              {allApiKeys.length > 0 ? (
                allApiKeys.map((apiKey) => (
                  <tr key={apiKey.doc_id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium">
                          {apiKey.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium">{apiKey.name}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {apiKey.decryptionError && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Decryption error - please edit to update format</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <span className="text-sm font-mono">
                          {apiKey.decryptedKey && apiKey.decryptedKey !== "Data unavailable" && viewKey === apiKey.doc_id
                            ? apiKey.decryptedKey
                            : apiKey.decryptedKey && apiKey.decryptedKey !== "Data unavailable"
                            ? "••••••••"
                            : apiKey.decryptedKey}
                        </span>
                        <div className="flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => apiKey.decryptedKey && apiKey.decryptedKey !== "Data unavailable" && toggleKeyVisibility(apiKey.doc_id)}
                                  disabled={!apiKey.decryptedKey || apiKey.decryptedKey === "Data unavailable"}
                                >
                                  {viewKey === apiKey.doc_id ? (
                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{viewKey === apiKey.doc_id ? "Hide key" : "Show key"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => apiKey.decryptedKey && apiKey.decryptedKey !== "Data unavailable" && copyToClipboard(apiKey.doc_id, "key", apiKey.decryptedKey)}
                                  disabled={!apiKey.decryptedKey || apiKey.decryptedKey === "Data unavailable"}
                                >
                                  {copiedField?.doc_id === apiKey.doc_id && copiedField?.field === "key" ? (
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {copiedField?.doc_id === apiKey.doc_id && copiedField?.field === "key" ? "Copied!" : "Copy key"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-xs">
                        {apiKey.env}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {apiKey.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {apiKey.updated_at ? new Date(apiKey.updated_at).toLocaleDateString(currentLocale) : "-"}
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedApiKey({ ...apiKey });
                              setShowEditApiKey(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => handleDeleteApiKey(apiKey.doc_id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-10 w-10 text-muted-foreground/50" />
                      <h3 className="font-medium">{translate("no_api_keys_found", "api_keys")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedEnv !== "all"
                          ? `No API keys found for environment "${selectedEnv}". Try a different environment or clear filters.`
                          : searchQuery
                          ? `No API keys match the search "${searchQuery}". Try adjusting your search.`
                          : translate("adjust_search_filter", "api_keys")}
                      </p>
                      <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                        {translate("clear_filters", "api_keys")}
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              {translate("showing", "api_keys")} {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-
              {Math.min(currentPage * itemsPerPage, totalCount)} {translate("of", "api_keys")} {totalCount}{" "}
              {translate("api_keys", "api_keys")}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 mr-4">
                <span className="text-sm text-muted-foreground">{translate("rows_per_page", "api_keys")}</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
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
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {getPaginationRange().map((pageNum, index) => (
                  <Button
                    key={`${pageNum}-${index}`}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => typeof pageNum === "number" && handlePageChange(pageNum)}
                    disabled={pageNum === "..." || currentPage === pageNum}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {showAddApiKey && <AddApiKey onClose={() => setShowAddApiKey(false)} onApiKeyAdded={fetchApiKeys} />}
      {showEditApiKey && selectedApiKey && (
        <EditApiKey
          apiKey={selectedApiKey}
          onClose={() => {
            setShowEditApiKey(false);
            setSelectedApiKey(null);
          }}
          onApiKeyUpdated={handleApiKeyUpdated}
        />
      )}
    </div>
  );
}
