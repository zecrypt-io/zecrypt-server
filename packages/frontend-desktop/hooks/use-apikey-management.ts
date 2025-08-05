"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { filterItemsByTag, sortItems, SortConfig, searchItemsMultiField } from "@/libs/utils";
import { decryptDataField } from "@/libs/encryption";
import { secureGetItem, decryptFromLocalStorage } from "@/libs/local-storage-utils";

interface ApiKeyFromAPI {
  doc_id: string;
  title: string;
  lower_title: string;
  data: string;
  raw_data?: string; // To store original encrypted data
  notes?: string | null;
  env: "Development" | "Staging" | "Production" | "Testing" | "Local" | "UAT";
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

interface UseApiKeyManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseApiKeyManagementReturn {
  apiKeysToDisplay: ApiKeyFromAPI[];
  allApiKeys: ApiKeyFromAPI[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  getPaginationRange: () => (number | string)[];
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedEnv: string;
  setSelectedEnv: (env: string) => void;
  uniqueTags: string[];
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  handleDeleteApiKey: (doc_id: string) => Promise<void>;
  fetchApiKeys: () => Promise<void>;
  clearFilters: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function useApiKeyManagement({
  selectedWorkspaceId,
  selectedProjectId,
  initialItemsPerPage = 5,
}: UseApiKeyManagementProps): UseApiKeyManagementReturn {
  const { translate } = useTranslator();
  const [allApiKeys, setAllApiKeys] = useState<ApiKeyFromAPI[]>([]);
  const [filteredApiKeys, setFilteredApiKeys] = useState<ApiKeyFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedEnv, setSelectedEnvState] = useState("all");
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(null);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  
  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  
  const selectedProjectName = useMemo(() => {
    if (!workspaces || !selectedWorkspaceId || !selectedProjectId) return null;
    const workspace = workspaces.find(w => w.workspaceId === selectedWorkspaceId);
    if (!workspace) return null;
    const project = workspace.projects.find(p => p.project_id === selectedProjectId);
    return project?.name || null;
  }, [workspaces, selectedWorkspaceId, selectedProjectId]);
  
  // Load the project key once when component mounts or project changes
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

  const fetchApiKeys = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setAllApiKeys([]);
      setFilteredApiKeys([]);
      setIsLoading(false);
      toast({
        title: translate("error", "actions"),
        description: translate("no_project_selected", "api_keys", { default: "No project selected" }),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/${selectedWorkspaceId}/${selectedProjectId}/api-keys`);

      if (response.status === 200 && response.data?.data) {
        const fetchedApiKeys: ApiKeyFromAPI[] = response.data.data;
        
        // Try to get or verify project key if not already available
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
        
        // Process API keys for metadata
        let processedApiKeys = fetchedApiKeys;
        
        if (effectiveProjectKey) {
          // We're just preserving metadata here - actual decryption happens in the UI components
          processedApiKeys = fetchedApiKeys.map(apiKey => {
            if (apiKey.data && apiKey.data.includes('.')) {
              return {
                ...apiKey,
                raw_data: apiKey.data, // Store original encrypted data
              };
            }
            return apiKey;
          });
        }
        
        setAllApiKeys(processedApiKeys);

        let processed = [...processedApiKeys];

        // Apply search if there's a query
        if (searchQuery.trim()) {
          processed = searchItemsMultiField(processed, searchQuery, ["title", "notes", "env", "tags"]);
        }

        // Apply environment filtering
        if (selectedEnv !== "all") {
          processed = processed.filter((apiKey) => apiKey.env.toLowerCase() === selectedEnv.toLowerCase());
        }

        // Apply sorting if a sort config is set
        const sortedApiKeys = sortItems(processed, sortConfig);
        setFilteredApiKeys(sortedApiKeys);
      } else {
        console.error("Error in API keys response (hook):", response);
        setAllApiKeys([]);
        setFilteredApiKeys([]);
        toast({
          title: translate("error", "actions"),
          description: translate("error_fetching_api_keys", "api_keys", { default: "Error fetching API keys" }),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching API keys (hook):", error);
      setAllApiKeys([]);
      setFilteredApiKeys([]);
      toast({
        title: translate("error", "actions"),
        description:
          error.response?.data?.message ||
          translate("error_fetching_api_keys", "api_keys", { default: "Error fetching API keys" }),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, searchQuery, selectedEnv, sortConfig, translate, projectKey, selectedProjectName]);

  // Only run fetchApiKeys when these dependencies change
  useEffect(() => {
    fetchApiKeys();
  }, [selectedWorkspaceId, selectedProjectId, searchQuery, selectedEnv, sortConfig]);

  const {
    paginatedData: apiKeysToDisplay,
    totalPages,
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    goToPage,
    getPaginationRange,
  } = useClientPagination<ApiKeyFromAPI>({
    data: filteredApiKeys,
    itemsPerPage,
  });

  const handleDeleteApiKey = useCallback(
    async (doc_id: string) => {
      if (!selectedWorkspaceId || !selectedProjectId) {
        toast({
          title: translate("error", "actions"),
          description: translate("no_project_selected", "api_keys", { default: "No project selected" }),
          variant: "destructive",
        });
        return;
      }

      try {
        await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/api-keys/${doc_id}`);
        toast({
          title: translate("success", "actions"),
          description: translate("api_key_deleted_successfully", "api_keys", {
            default: "API key deleted successfully",
          }),
        });
        fetchApiKeys();
      } catch (error: any) {
        console.error("Error deleting API key (hook):", error);
        let errorMessage = translate("error_deleting_api_key", "api_keys", { default: "Error deleting API key" });
        if (error.response?.data?.message) {
          errorMessage = `${errorMessage}: ${error.response.data.message}`;
        }
        toast({
          title: translate("error", "actions"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [selectedWorkspaceId, selectedProjectId, fetchApiKeys, translate]
  );

  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSelectedEnvState("all");
    setSortConfigState(null);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const setSearchQuery = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSearchQueryState(value);
        setCurrentPage(1);
      }, 300);
    };
  }, [setCurrentPage]);

  const setSelectedEnv = useCallback(
    (env: string) => {
      setSelectedEnvState(env);
      setCurrentPage(1);
    },
    [setCurrentPage]
  );

  const setItemsPerPage = useCallback(
    (items: number) => {
      setItemsPerPageState(items);
      setCurrentPage(1);
    },
    [setCurrentPage]
  );

  const setSortConfig = useCallback(
    (config: SortConfig | null) => {
      setSortConfigState(config);
      setCurrentPage(1);
    },
    [setCurrentPage]
  );

  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    filteredApiKeys.forEach((apiKey) => {
      if (apiKey.tags && Array.isArray(apiKey.tags)) {
        apiKey.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [filteredApiKeys]);

  return {
    apiKeysToDisplay,
    allApiKeys,
    isLoading,
    totalCount: filteredApiKeys.length,
    currentPage,
    setCurrentPage,
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
    handleDeleteApiKey,
    fetchApiKeys,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  };
}