"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { filterItemsByTag, sortItems, SortConfig, searchItemsMultiField } from "@/libs/utils";
import { secureGetItem, decryptFromLocalStorage } from "@/libs/local-storage-utils";

interface EnvFromAPI {
  doc_id: string;
  title: string;
  lower_title: string;
  data: string;
  raw_data?: string; // To store original encrypted data
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

interface UseEnvManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseEnvManagementReturn {
  envsToDisplay: EnvFromAPI[];
  allEnvs: EnvFromAPI[];
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
  uniqueTags: string[];
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  handleDeleteEnv: (doc_id: string) => Promise<void>;
  fetchEnvs: () => Promise<void>;
  clearFilters: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function useEnvManagement({
  selectedWorkspaceId,
  selectedProjectId,
  initialItemsPerPage = 5,
}: UseEnvManagementProps): UseEnvManagementReturn {
  const { translate } = useTranslator();
  const [allEnvs, setAllEnvs] = useState<EnvFromAPI[]>([]);
  const [filteredEnvs, setFilteredEnvs] = useState<EnvFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
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
  
  // Desktop mode: don't load encryption key
  useEffect(() => { setProjectKey(null); }, [selectedProjectName]);

  const fetchEnvs = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setAllEnvs([]);
      setFilteredEnvs([]);
      setIsLoading(false);
      toast({
        title: translate("error", "actions"),
        description: translate("no_project_selected", "env", { default: "No project selected" }),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/${selectedWorkspaceId}/${selectedProjectId}/env`);

      if (response.status === 200 && response.data?.data) {
        const fetchedEnvs: EnvFromAPI[] = response.data.data;
        
        // Desktop mode: passthrough
        setAllEnvs(fetchedEnvs);

        let processed = [...fetchedEnvs];

        // Apply search if there's a query
        if (searchQuery.trim()) {
          processed = searchItemsMultiField(processed, searchQuery, ["title", "notes", "tags"]);
        }

        // Apply sorting if a sort config is set
        const sortedEnvs = sortItems(processed, sortConfig);
        setFilteredEnvs(sortedEnvs);
      } else {
        console.error("Error in environment variables response (hook):", response);
        setAllEnvs([]);
        setFilteredEnvs([]);
        toast({
          title: translate("error", "actions"),
          description: translate("error_fetching_env", "env", { default: "Error fetching environment variables" }),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching environment variables (hook):", error);
      setAllEnvs([]);
      setFilteredEnvs([]);
      toast({
        title: translate("error", "actions"),
        description:
          error.response?.data?.message ||
          translate("error_fetching_env", "env", { default: "Error fetching environment variables" }),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, searchQuery, sortConfig, translate, projectKey, selectedProjectName]);

  // Only run fetchEnvs when these dependencies change
  useEffect(() => {
    fetchEnvs();
  }, [selectedWorkspaceId, selectedProjectId, searchQuery, sortConfig]);

  const {
    paginatedData: envsToDisplay,
    totalPages,
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    goToPage,
    getPaginationRange,
  } = useClientPagination<EnvFromAPI>({
    data: filteredEnvs,
    itemsPerPage,
  });

  const handleDeleteEnv = useCallback(
    async (doc_id: string) => {
      if (!selectedWorkspaceId || !selectedProjectId) {
        toast({
          title: translate("error", "actions"),
          description: translate("no_project_selected", "env", { default: "No project selected" }),
          variant: "destructive",
        });
        return;
      }

      try {
        await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/env/${doc_id}`);
        toast({
          title: translate("success", "actions"),
          description: translate("env_deleted_successfully", "env", {
            default: "Environment variables deleted successfully",
          }),
        });
        fetchEnvs();
      } catch (error: any) {
        console.error("Error deleting environment variables (hook):", error);
        let errorMessage = translate("error_deleting_env", "env", { default: "Error deleting environment variables" });
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
    [selectedWorkspaceId, selectedProjectId, translate, fetchEnvs]
  );

  const clearFilters = useCallback(() => {
    setSearchQueryState("");
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    setCurrentPage(1); // Reset to first page when search changes
  }, [setCurrentPage]);

  const setItemsPerPage = useCallback((items: number) => {
    setItemsPerPageState(items);
    setCurrentPage(1); // Reset to first page when items per page changes
  }, [setCurrentPage]);

  const setSortConfig = useCallback((config: SortConfig | null) => {
    setSortConfigState(config);
  }, []);

  // Extract unique tags from all items
  const uniqueTags = useMemo(() => {
    const allTags = allEnvs.flatMap(env => env.tags || []);
    return [...new Set(allTags)];
  }, [allEnvs]);

  // Calculate total count
  const totalCount = useMemo(() => filteredEnvs.length, [filteredEnvs]);

  return {
    envsToDisplay,
    allEnvs,
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
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteEnv,
    fetchEnvs,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  };
} 