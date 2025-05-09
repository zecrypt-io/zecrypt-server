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
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { FIXED_SALT } from "../libs/crypto";
import { AddApiKey } from "./add-apikey";
import { EditApiKey } from "./edit-apikey";

interface ApiKey {
  doc_id: string;
  name: string;
  data: string | { api_key: string };
  created_at: string;
  updated_at: string | null;
  env: "Development" | "Staging" | "Production";
  tags: string[];
  displayKey?: string;
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

  const processApiKeyData = useCallback(async (apiKey: ApiKey): Promise<ApiKey> => {
    try {
      if (apiKey.data && typeof apiKey.data === "string") {
        try {
          // Try to parse as JSON first
          const parsedData = JSON.parse(apiKey.data);
          if (parsedData.api_key) {
            return { ...apiKey, displayKey: parsedData.api_key };
          }
          return {
            ...apiKey,
            displayKey: "Data incomplete",
          };
        } catch (jsonError) {
          // If not JSON, use the string directly
          return {
            ...apiKey,
            displayKey: apiKey.data,
          };
        }
      }
      if (apiKey.data && typeof apiKey.data === "object" && "api_key" in apiKey.data) {
        return { ...apiKey, displayKey: apiKey.data.api_key };
      }
      return {
        ...apiKey,
        displayKey: "Data unavailable",
      };
    } catch (error: unknown) {
      console.error("Failed to process API key data:", {
        error: error instanceof Error ? error.message : String(error),
        api_key_id: apiKey.doc_id,
      });
      return {
        ...apiKey,
        displayKey: "Error processing data",
      };
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
      toast({
        title: translate("error_fetching_api_keys", "api_keys"),
        description: translate("no_project_selected", "api_keys"),
        variant: "destructive",
      });
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

      const { data: fetchedApiKeys = [], count = 0 } = response.data || {};

      const processedApiKeys = await Promise.all(
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
          return processApiKeyData(apiKey);
        })
      );

      setAllApiKeys(processedApiKeys);

      let estimatedTotal;
      if (currentPage === 1 && count < itemsPerPage) {
        estimatedTotal = count;
      } else if (count === itemsPerPage) {
        estimatedTotal = currentPage * itemsPerPage + 1;
      } else {
        estimatedTotal = (currentPage - 1) * itemsPerPage + count;
      }
      setTotalCount(estimatedTotal);
    } catch (error: any) {
      console.error("Error fetching API keys:", error);
      toast({
        title: translate("error_fetching_api_keys", "api_keys"),
        description: error.response?.data?.message || translate("failed_to_fetch_api_keys", "api_keys"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, currentPage, itemsPerPage, searchQuery, selectedEnv, processApiKeyData, getEnvTag, translate]);

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
      toast({
        title: translate("copied", "api_keys"),
        description: translate("api_key_copied", "api_keys"),
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: translate("copy_failed", "api_keys"),
        description: translate("failed_to_copy_api_key", "api_keys"),
        variant: "destructive",
      });
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
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const handleDeleteApiKey = useCallback(
    async (doc_id: string) => {
      if (!selectedWorkspaceId || !selectedProjectId) {
        console.error("Missing required data for deleting API key:", {
          selectedWorkspaceId,
          selectedProjectId,
        });
        toast({
          title: translate("error_deleting_api_key", "api_keys"),
          description: translate("no_project_selected", "api_keys"),
          variant: "destructive",
        });
        return;
      }

      if (!confirm(translate("confirm_delete_api_key", "api_keys"))) {
        return;
      }

      try {
        await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/api-keys/${doc_id}`);
        fetchApiKeys();
        toast({
          title: translate("api_key_deleted_successfully", "api_keys"),
          description: translate("api_key_deleted_description", "api_keys"),
        });
      } catch (error: any) {
        console.error("Error deleting API key:", error);
        toast({
          title: translate("error_deleting_api_key", "api_keys"),
          description: error.response?.data?.message || translate("failed_to_delete_api_key", "api_keys"),
          variant: "destructive",
        });
      }
    },
    [selectedWorkspaceId, selectedProjectId, translate, fetchApiKeys]
  );

  const handleApiKeyUpdated = useCallback(() => {
    setShowEditApiKey(false);
    setSelectedApiKey(null);
    fetchApiKeys();
    toast({
      title: translate("api_key_updated_successfully", "api_keys"),
      description: translate("api_key_updated_description", "api_keys"),
    });
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
                        <span className="text-sm font-mono">
                          {apiKey.displayKey}
                        </span>
                        <div className="flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => apiKey.displayKey && copyToClipboard(apiKey.doc_id, "key", apiKey.displayKey)}
                                  disabled={!apiKey.displayKey}
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
                                  {copiedField?.doc_id === apiKey.doc_id && copiedField?.field === "key" ? translate("copied", "api_keys") : translate("copy_key", "api_keys")}
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
                            {translate("edit", "api_keys")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => handleDeleteApiKey(apiKey.doc_id)}
                          >
                            {translate("delete", "api_keys")}
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
                          ? translate("no_api_keys_for_env", "api_keys").replace("{env}", selectedEnv)
                          : searchQuery
                          ? translate("no_api_keys_match_search", "api_keys").replace("{search}", searchQuery)
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
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} API keys
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 mr-4">
                <span className="text-sm text-muted-foreground">Rows per page</span>
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