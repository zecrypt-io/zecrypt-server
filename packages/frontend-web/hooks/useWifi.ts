"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { decryptDataField } from "../libs/encryption";
import { secureGetItem } from "../libs/session-storage-utils";
import React from "react";
import { sortItems, SortConfig } from "@/libs/utils";

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
  initialItemsPerPage = 5,
}: UseWifiProps): UseWifiReturn {
  const { translate } = useTranslator();
  const [allWifiNetworks, setAllWifiNetworks] = useState<WifiNetwork[]>([]);
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedSecurityType, setSelectedSecurityTypeState] = useState("all");
  const [currentPage, setCurrentPageState] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [viewPassword, setViewPassword] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  
  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

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
  }, [selectedWorkspaceId, selectedProjectId, translate]);

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

  const filteredWifiNetworks = useMemo(() => {
    let result = allWifiNetworks;

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (network) =>
          network.title.toLowerCase().includes(query) ||
          network.notes?.toLowerCase().includes(query)
      );
    }

    if (selectedSecurityType !== "all") {
      result = result.filter(
        (network) => network.security_type.toLowerCase() === selectedSecurityType.toLowerCase()
      );
    }
    
    // Apply sorting if sortConfig is set
    if (sortConfig && sortConfig.key) {
      result = sortItems(result, sortConfig);
    }

    return result;
  }, [allWifiNetworks, searchQuery, selectedSecurityType, sortConfig]);

  const totalCount = filteredWifiNetworks.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const paginatedWifiNetworks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredWifiNetworks.slice(start, end);
  }, [filteredWifiNetworks, currentPage, itemsPerPage]);

  const copyToClipboard = useCallback(
    async (doc_id: string, field: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedField({ doc_id, field });
        setTimeout(() => setCopiedField(null), 2000);
        toast({
          title: translate("copied", "wifi"),
          description: translate("field_copied", "wifi"),
        });
      } catch (err) {
        console.error("Failed to copy:", err);
        toast({
          title: translate("copy_failed", "wifi"),
          description: translate("failed_to_copy_field", "wifi"),
          variant: "destructive",
        });
      }
    },
    [translate]
  );

  const togglePasswordVisibility = useCallback((doc_id: string) => {
    setViewPassword((prev) => (prev === doc_id ? null : doc_id));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSelectedSecurityTypeState("all");
    setSortConfig(null);
  }, []);

  const handleDeleteWifi = useCallback(
    async (doc_id: string) => {
      if (!selectedWorkspaceId || !selectedProjectId) {
        console.error("Missing required data for deleting Wi-Fi network:", {
          selectedWorkspaceId,
          selectedProjectId,
        });
        toast({
          title: translate("error_deleting_wifi", "wifi"),
          description: translate("no_project_selected", "wifi"),
          variant: "destructive",
        });
        return;
      }

      try {
        await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/wifi/${doc_id}`);
        refreshWifiNetworks();
        toast({
          title: translate("wifi_deleted", "wifi"),
          description: translate("wifi_deleted_description", "wifi"),
        });
      } catch (error: any) {
        console.error("Error deleting Wi-Fi network:", error);
        toast({
          title: translate("error_deleting_wifi", "wifi"),
          description: error.response?.data?.message || translate("failed_to_delete_wifi", "wifi"),
          variant: "destructive",
        });
      }
    },
    [selectedWorkspaceId, selectedProjectId, refreshWifiNetworks, translate]
  );

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

  const setSearchQuery = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSearchQueryState(value);
        setCurrentPageState(1);
      }, 300);
    };
  }, []);

  const setSelectedSecurityType = useCallback(
    (type: string) => {
      setSelectedSecurityTypeState(type);
      setCurrentPageState(1);
    },
    []
  );

  const setItemsPerPage = useCallback(
    (items: number) => {
      setItemsPerPageState(items);
      setCurrentPageState(1);
    },
    []
  );

  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageState(page);
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPageState(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPageState(currentPage - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPageState(page);
    }
  }, [totalPages]);

  return {
    allWifiNetworks,
    filteredWifiNetworks,
    paginatedWifiNetworks,
    isLoading,
    searchQuery,
    selectedSecurityType,
    currentPage,
    itemsPerPage,
    totalCount,
    totalPages,
    copiedField,
    viewPassword,
    sortConfig,
    setSortConfig,
    setSearchQuery,
    setSelectedSecurityType,
    setCurrentPage,
    setItemsPerPage,
    copyToClipboard,
    togglePasswordVisibility,
    clearFilters,
    refreshWifiNetworks,
    handleDeleteWifi,
    getPaginationRange,
    nextPage,
    prevPage,
    goToPage,
  };
}