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

interface UseSSHKeyManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseSSHKeyManagementReturn {
  sshKeysToDisplay: SSHKey[];
  allSSHKeys: SSHKey[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  getPaginationRange: () => (number | string)[];
  itemsPerPage: number;
  setItemsPerPage?: (items: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  uniqueTags: string[];
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  handleDeleteSSHKey: (doc_id: string) => Promise<void>;
  fetchSSHKeys: () => Promise<void>;
  clearFilters: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function useSSHKeyManagement({
  selectedWorkspaceId,
  selectedProjectId,
  initialItemsPerPage = 10,
}: UseSSHKeyManagementProps): UseSSHKeyManagementReturn {
  const { translate } = useTranslator();
  const [allSSHKeys, setAllSSHKeys] = useState<SSHKey[]>([]);
  const [filteredSSHKeys, setFilteredSSHKeys] = useState<SSHKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const [itemsPerPage] = useState(initialItemsPerPage);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(null);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  
  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  
  // Get pagination data
  const {
    paginatedData: sshKeysToDisplay,
    totalPages,
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    goToPage,
    getPaginationRange,
  } = useClientPagination<SSHKey>({
    data: filteredSSHKeys,
    itemsPerPage,
  });
  
  const selectedProjectName = useMemo(() => {
    if (!workspaces || !selectedWorkspaceId || !selectedProjectId) return null;
    const workspace = workspaces.find(w => w.workspaceId === selectedWorkspaceId);
    if (!workspace) return null;
    const project = workspace.projects.find(p => p.project_id === selectedProjectId);
    return project?.name || null;
  }, [workspaces, selectedWorkspaceId, selectedProjectId]);
  
  // Load the project key once when project changes
  useEffect(() => {
    let isMounted = true;
    
    const loadProjectKey = async () => {
      if (!selectedProjectName) {
        if (isMounted) setProjectKey(null);
        return;
      }
      
      try {
        console.log("Loading project key for SSH keys:", selectedProjectName);
        const key = await secureGetItem(`projectKey_${selectedProjectName}`);
        console.log("Project key loaded:", key ? "Found" : "Not found");
        
        if (isMounted) {
          setProjectKey(key);
          // Trigger a refetch by incrementing the counter
          setFetchTrigger(prev => prev + 1);
        }
      } catch (error) {
        console.error("Error loading project key:", error);
        if (isMounted) setProjectKey(null);
      }
    };
    
    loadProjectKey();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [selectedProjectName]);

  const processSSHKeys = useCallback(async (
    rawSSHKeys: any[], 
    key: string | null
  ) => {
    const processed: SSHKey[] = [];
    
    // Check if rawSSHKeys exists and is an array
    if (!Array.isArray(rawSSHKeys)) {
      console.error("Expected rawSSHKeys to be an array but got:", typeof rawSSHKeys);
      return processed; // Return empty array
    }
    
    for (const item of rawSSHKeys) {
      let decryptedData = '';
      let sshKeyData = {
        ssh_key: ''
      };
      
      // Check if data exists
      if (item.data) {
        // Check if data is encrypted (has the format iv.encrypted)
        if (key && typeof item.data === 'string' && item.data.includes('.')) {
          try {
            const decrypted = await decryptDataField(item.data, key);
            try {
              // Try to parse as JSON
              sshKeyData = JSON.parse(decrypted);
              decryptedData = decrypted;
              console.log("Successfully decrypted SSH key data");
            } catch (parseError) {
              // If not valid JSON, use the decrypted string directly
              console.log("Decrypted but not valid JSON");
              decryptedData = decrypted;
            }
          } catch (decryptError) {
            console.error("Failed to decrypt:", decryptError);
            // If decryption fails, fall back to using raw data
            decryptedData = item.data;
          }
        } else {
          // Not encrypted or no key available, use as is
          console.log("Using unencrypted data");
          decryptedData = item.data;
          try {
            sshKeyData = JSON.parse(decryptedData);
          } catch (e) {
            // Unable to parse, keep defaults
          }
        }
      }
      
      processed.push({
        doc_id: item.doc_id || "",
        title: item.title || "",
        name: item.title || "",
        lower_title: item.lower_title || item.title?.toLowerCase() || "",
        data: item.data || "", 
        ssh_key: sshKeyData.ssh_key || "",
        notes: item.notes || null,
        tags: item.tags || [],
        created_at: item.created_at || "",
        updated_at: item.updated_at || null,
        created_by: item.created_by || "",
        project_id: item.project_id || "",
      });
    }
    
    return processed;
  }, []);

  const fetchSSHKeys = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Fetching SSH keys for workspace", selectedWorkspaceId, "project", selectedProjectId);
      
      const response = await axiosInstance.get(
        `/${selectedWorkspaceId}/${selectedProjectId}/ssh-keys`
      );
      
      console.log("SSH key data fetched:", response.data ? "Success" : "Empty");
      
      // Extract the data array from the response (API returns { data: [...] } structure)
      const dataArray = response.data && response.data.data ? response.data.data : [];
      console.log("SSH keys data array:", dataArray.length > 0 ? `Found ${dataArray.length} SSH keys` : "Empty");
      
      // Process the raw data
      const processedData = await processSSHKeys(dataArray, projectKey);
      console.log("Processed SSH keys:", processedData.length);
      
      setAllSSHKeys(processedData);
      applyFiltersAndSort(processedData, searchQuery);
    } catch (error) {
      console.error("Error fetching SSH keys:", error);
      toast({
        title: translate("error", "ssh_keys", { default: "Error" }),
        description: translate("error_fetching_ssh_keys", "ssh_keys", {
          default: "Failed to fetch SSH keys",
        }),
        variant: "destructive",
      });
      setAllSSHKeys([]);
      setFilteredSSHKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedWorkspaceId,
    selectedProjectId,
    projectKey,
    processSSHKeys,
    translate
    // Removed searchQuery from dependencies as it's not needed for fetching
  ]);
  
  // Apply filters and sorting to data
  const applyFiltersAndSort = useCallback(
    (data: SSHKey[], query: string) => {
      // Search by query
      let filtered = data;
      
      if (query) {
        filtered = searchItemsMultiField(filtered, query, [
          "title",
          "name",
          "notes",
        ]);
      }
      
      // Apply sorting
      if (sortConfig) {
        filtered = sortItems(filtered, sortConfig);
      }
      
      setFilteredSSHKeys(filtered);
    },
    [sortConfig]
  );
  
  // Handle search query changes
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    applyFiltersAndSort(allSSHKeys, query);
  }, [allSSHKeys, applyFiltersAndSort]);
  
  // Handle sorting changes
  const setSortConfig = useCallback((config: SortConfig | null) => {
    setSortConfigState(config);
    applyFiltersAndSort(allSSHKeys, searchQuery);
  }, [allSSHKeys, searchQuery, applyFiltersAndSort]);
  
  // Handle items per page changes
  const setItemsPerPage = useCallback((items: number) => {
    // This function is now a placeholder as itemsPerPage is managed by the useState
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSortConfigState(null);
    applyFiltersAndSort(allSSHKeys, "");
  }, [allSSHKeys, applyFiltersAndSort]);

  // Delete SSH key
  const handleDeleteSSHKey = useCallback(
    async (doc_id: string) => {
      if (!selectedWorkspaceId || !selectedProjectId) {
        console.error("Missing required data for deleting SSH key");
        return;
      }
      
      try {
        await axiosInstance.delete(
          `/${selectedWorkspaceId}/${selectedProjectId}/ssh-keys/${doc_id}`
        );
        
        toast({
          title: translate("deleted", "ssh_keys", { default: "Deleted" }),
          description: translate("ssh_key_deleted_successfully", "ssh_keys", {
            default: "SSH key deleted successfully",
          }),
        });
        
        // Refresh the list
        fetchSSHKeys();
      } catch (error) {
        console.error("Error deleting SSH key:", error);
        toast({
          title: translate("error", "ssh_keys", { default: "Error" }),
          description: translate("failed_to_delete_ssh_key", "ssh_keys", {
            default: "Failed to delete SSH key",
          }),
          variant: "destructive",
        });
      }
    },
    [selectedWorkspaceId, selectedProjectId, fetchSSHKeys, translate]
  );
  
  // Effect to fetch data when dependencies change
  useEffect(() => {
    if (selectedWorkspaceId && selectedProjectId) {
      console.log("Running fetchSSHKeys effect", { fetchTrigger });
      fetchSSHKeys();
    }
  }, [selectedWorkspaceId, selectedProjectId, fetchTrigger]);
  
  // Effect to update filtered data when all data changes
  useEffect(() => {
    applyFiltersAndSort(allSSHKeys, searchQuery);
  }, [allSSHKeys, applyFiltersAndSort, searchQuery]);
  
  // Extract unique tags from all SSH keys
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    allSSHKeys.forEach((sshKey) => {
      if (sshKey.tags && Array.isArray(sshKey.tags)) {
        sshKey.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [allSSHKeys]);
  
  // Calculate total count
  const totalCount = useMemo(() => filteredSSHKeys.length, [filteredSSHKeys]);
  
  return {
    sshKeysToDisplay,
    allSSHKeys,
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
    handleDeleteSSHKey,
    fetchSSHKeys,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  };
} 