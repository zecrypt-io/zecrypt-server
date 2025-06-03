"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { decryptDataField } from "../libs/encryption";
import { secureGetItem } from "../libs/session-storage-utils";
import { filterItemsByTag, sortItems, SortConfig, searchItemsMultiField } from "@/libs/utils";
import React from "react";

interface WifiNetwork {
  doc_id: string;
  title: string;
  lower_title: string;
  security_type: string;
  data: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

interface UseWifiProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseWifiReturn {
  allWifiNetworks: WifiNetwork[];
  filteredWifiNetworks: WifiNetwork[];
  paginatedWifiNetworks: WifiNetwork[];
  isLoading: boolean;
  searchQuery: string;
  selectedSecurityType: string;
  currentPage: number;
  itemsPerPage: number;
  totalCount: number;
  totalPages: number;
  copiedField: { doc_id: string; field: string } | null;
  viewPassword: string | null;
  uniqueTags: string[];
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedSecurityType: (type: string) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  copyToClipboard: (doc_id: string, field: string, value: string) => Promise<void>;
  togglePasswordVisibility: (doc_id: string) => void;
  clearFilters: () => void;
  refreshWifiNetworks: () => void;
  handleDeleteWifi: (doc_id: string) => Promise<void>;
  getPaginationRange: () => (number | string)[];
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function useWifi({
  selectedWorkspaceId,
  selectedProjectId,
  initialItemsPerPage = 10,
}: UseWifiProps): UseWifiReturn {
  const { translate } = useTranslator();
  const [allWifiNetworks, setAllWifiNetworks] = useState<WifiNetwork[]>([]);
  const [filteredWifiNetworks, setFilteredWifiNetworks] = useState<WifiNetwork[]>([]);
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedSecurityType, setSelectedSecurityTypeState] = useState("all");
  const [currentPage, setCurrentPageState] = useState(1);
  const [itemsPerPage] = useState(initialItemsPerPage);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [viewPassword, setViewPassword] = useState<string | null>(null);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(null);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  
  // Add a dummy setItemsPerPage function
  const setItemsPerPage = useCallback((items: number) => {
    // This is a placeholder since we're using a fixed itemsPerPage
  }, []);

  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  // Get all unique tags from networks
  const uniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allWifiNetworks.forEach(wifi => {
      if (wifi.tags && Array.isArray(wifi.tags)) {
        wifi.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [allWifiNetworks]);

  // Process Wi-Fi network data - decrypt passwords where needed
  const processWifiData = useCallback(async (network: WifiNetwork): Promise<WifiNetwork> => {
    try {
      // If the data field doesn't exist or isn't a string, return the network as is
      if (!network.data || typeof network.data !== 'string') {
        return network;
      }

      // Try to determine if this is an encrypted password (has the format iv.encryptedData)
      const isEncrypted = network.data.includes('.') && network.data.split('.').length === 2;

      if (isEncrypted) {
        try {
          // Find the current project
          const currentProject = workspaces
            .find(ws => ws.workspaceId === selectedWorkspaceId)
            ?.projects.find(p => p.project_id === selectedProjectId);
          
          if (!currentProject) {
            throw new Error("Project not found");
          }
          
          // Get the project's AES key from session storage
          const projectKeyName = `projectKey_${currentProject.name}`;
          const projectAesKey = await secureGetItem(projectKeyName);
          
          if (!projectAesKey) {
            throw new Error("Project encryption key not found");
          }
          
          // Decrypt the data field
          const decryptedData = await decryptDataField(network.data, projectAesKey);
          
          // Parse the JSON to get the WiFi password
          try {
            const parsedData = JSON.parse(decryptedData);
            if (parsedData && typeof parsedData === 'object' && parsedData["wifi-password"]) {
              return {
                ...network,
                data: parsedData["wifi-password"]
              };
            }
          } catch (parseError) {
            console.error("Error parsing decrypted Wi-Fi data:", parseError);
          }
        } catch (decryptError) {
          console.error("Error decrypting Wi-Fi data:", decryptError);
          // If decryption fails, return the network as is - the data might be in the old format
        }
      }
      
      // If we reached here, either it wasn't encrypted or decryption failed
      // In both cases, return the original network
      return network;
    } catch (error) {
      console.error("Error processing Wi-Fi data:", error);
      return network;
    }
  }, [selectedWorkspaceId, selectedProjectId, workspaces]);

  // Using a ref to track if the initial fetch was performed
  const initialFetchPerformed = React.useRef(false);

  const fetchWifiNetworks = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for fetching Wi-Fi networks:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setIsLoading(false);
      toast({
        title: translate("error_fetching_wifi_networks", "wifi"),
        description: translate("no_project_selected", "wifi"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/${selectedWorkspaceId}/${selectedProjectId}/wifi`);

      if (response.status === 200 && response.data?.data) {
        // Process each network to decrypt passwords
        const processedNetworks = await Promise.all(
          response.data.data.map(processWifiData)
        );
        setAllWifiNetworks(processedNetworks);
      } else {
        console.error("Unexpected response format:", response);
        toast({
          title: translate("error_fetching_wifi_networks", "wifi"),
          description: translate("failed_to_fetch_wifi_networks", "wifi"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching Wi-Fi networks:", error);
      toast({
        title: translate("error_fetching_wifi_networks", "wifi"),
        description: error.response?.data?.message || translate("failed_to_fetch_wifi_networks", "wifi"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, translate, processWifiData]);

  useEffect(() => {
    // Make sure we don't trigger multiple fetches when our dependencies change
    if (selectedWorkspaceId && selectedProjectId && !initialFetchPerformed.current) {
      initialFetchPerformed.current = true;
      fetchWifiNetworks();
    }
  }, [fetchWifiNetworks, selectedWorkspaceId, selectedProjectId]);

  // Handle manual refresh - separate from the initial fetch
  const refreshWifiNetworks = useCallback(() => {
    if (selectedWorkspaceId && selectedProjectId) {
      fetchWifiNetworks();
    }
  }, [fetchWifiNetworks, selectedWorkspaceId, selectedProjectId]);

  // Apply filters and sorting
  useEffect(() => {
    if (!allWifiNetworks) return;

    let result = [...allWifiNetworks];

    // Filter by security type
    if (selectedSecurityType !== "all") {
      result = result.filter(network => 
        network.security_type?.toLowerCase() === selectedSecurityType.toLowerCase()
      );
    }

    // Apply search
    if (searchQuery) {
      result = searchItemsMultiField(result, searchQuery, ['title', 'security_type', 'notes']);
    }

    // Apply sorting
    if (sortConfig) {
      result = sortItems(result, sortConfig);
    }

    setFilteredWifiNetworks(result);
  }, [allWifiNetworks, selectedSecurityType, searchQuery, sortConfig]);

  // Calculate pagination
  const {
    start,
    end,
    paginatedData: paginatedWifiNetworks,
    totalPages,
    nextPage: goToNextPage,
    prevPage: goToPrevPage,
    goToPage: goToSpecificPage,
    getPaginationRange
  } = useMemo(() => {
    // Calculate values for the current page
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = filteredWifiNetworks.slice(start, end);
    const totalPagesCount = Math.ceil(filteredWifiNetworks.length / itemsPerPage);

    // Define pagination functions
    const goToNextPage = () => {
      if (currentPage < totalPagesCount) {
        setCurrentPageState(currentPage + 1);
      }
    };

    const goToPrevPage = () => {
      if (currentPage > 1) {
        setCurrentPageState(currentPage - 1);
      }
    };

    const goToSpecificPage = (page: number) => {
      if (page >= 1 && page <= totalPagesCount) {
        setCurrentPageState(page);
      }
    };

    // Generate pagination range with ellipsis for large page counts
    const getPaginationRange = () => {
      const maxPagesToShow = 5; // Show up to 5 page numbers
      const range: (number | string)[] = [];
      
      if (totalPagesCount <= maxPagesToShow) {
        // If we have fewer pages than the max, show all pages
        for (let i = 1; i <= totalPagesCount; i++) {
          range.push(i);
        }
      } else {
        // Always show first page
        range.push(1);
        
        // Calculate start and end of the middle section
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPagesCount - 1, currentPage + 1);
        
        // Adjust if we're at the start or end
        if (currentPage <= 2) {
          endPage = 3;
        } else if (currentPage >= totalPagesCount - 1) {
          startPage = totalPagesCount - 2;
        }
        
        // Add ellipsis if needed before middle section
        if (startPage > 2) {
          range.push("...");
        }
        
        // Add the middle section
        for (let i = startPage; i <= endPage; i++) {
          range.push(i);
        }
        
        // Add ellipsis if needed after middle section
        if (endPage < totalPagesCount - 1) {
          range.push("...");
        }
        
        // Always show last page
        range.push(totalPagesCount);
      }
      
      return range;
    };

    return {
      start,
      end,
      paginatedData,
      totalPages: totalPagesCount,
      nextPage: goToNextPage,
      prevPage: goToPrevPage,
      goToPage: goToSpecificPage,
      getPaginationRange
    };
  }, [filteredWifiNetworks, currentPage, itemsPerPage]);

  const handleDeleteWifi = useCallback(async (doc_id: string) => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({
        title: translate("error", "wifi"),
        description: translate("missing_workspace_or_project", "wifi"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/wifi/${doc_id}`);
      
      if (response.status === 200) {
        setAllWifiNetworks(prev => prev.filter(wifi => wifi.doc_id !== doc_id));
        toast({
          title: translate("success", "wifi"),
          description: translate("wifi_deleted_successfully", "wifi"),
        });
      } else {
        toast({
          title: translate("error", "wifi"),
          description: translate("failed_to_delete_wifi", "wifi"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting WiFi network:", error);
      toast({
        title: translate("error", "wifi"),
        description: translate("failed_to_delete_wifi", "wifi"),
        variant: "destructive",
      });
    }
  }, [selectedWorkspaceId, selectedProjectId, translate]);

  const copyToClipboard = useCallback(async (doc_id: string, field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField({ doc_id, field });
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: translate("copied", "wifi", { default: "Copied" }),
        description: translate("password_copied", "wifi", { default: "Password copied to clipboard" }),
      });
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast({
        title: translate("error", "wifi"),
        description: translate("failed_to_copy", "wifi"),
        variant: "destructive",
      });
    }
  }, [translate]);

  const togglePasswordVisibility = useCallback((doc_id: string) => {
    setViewPassword(prev => prev === doc_id ? null : doc_id);
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    setCurrentPageState(1); // Reset to first page on search change
  }, []);

  const setSelectedSecurityType = useCallback((type: string) => {
    setSelectedSecurityTypeState(type);
    setCurrentPageState(1); // Reset to first page on type change
  }, []);

  const setSortConfig = useCallback((config: SortConfig | null) => {
    setSortConfigState(config);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSelectedSecurityTypeState("all");
    setSortConfigState(null);
    setCurrentPageState(1);
  }, []);

  return {
    allWifiNetworks,
    filteredWifiNetworks,
    paginatedWifiNetworks,
    isLoading,
    searchQuery,
    selectedSecurityType,
    currentPage,
    itemsPerPage,
    totalCount: filteredWifiNetworks.length,
    totalPages,
    copiedField,
    viewPassword,
    uniqueTags,
    sortConfig,
    setSortConfig,
    setSearchQuery,
    setSelectedSecurityType,
    setCurrentPage: goToSpecificPage,
    setItemsPerPage,
    copyToClipboard,
    togglePasswordVisibility,
    clearFilters,
    refreshWifiNetworks,
    handleDeleteWifi,
    getPaginationRange,
    nextPage: goToNextPage,
    prevPage: goToPrevPage,
    goToPage: goToSpecificPage,
  };
}