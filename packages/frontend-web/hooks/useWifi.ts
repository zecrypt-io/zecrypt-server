"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "../libs/Middleware/axiosInstace";

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
  setSearchQuery: (query: string) => void;
  setSelectedSecurityType: (type: string) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  copyToClipboard: (doc_id: string, field: string, value: string) => Promise<void>;
  togglePasswordVisibility: (doc_id: string) => void;
  clearFilters: () => void;
  fetchWifiNetworks: () => Promise<void>;
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
        setAllWifiNetworks(response.data.data);
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
  }, [selectedWorkspaceId, selectedProjectId]);

  useEffect(() => {
    fetchWifiNetworks();
  }, [fetchWifiNetworks]);

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

    return result;
  }, [allWifiNetworks, searchQuery, selectedSecurityType]);

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
    setCurrentPageState(1);
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
        fetchWifiNetworks();
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
    [selectedWorkspaceId, selectedProjectId, fetchWifiNetworks, translate]
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
    setSearchQuery,
    setSelectedSecurityType,
    setCurrentPage,
    setItemsPerPage,
    copyToClipboard,
    togglePasswordVisibility,
    clearFilters,
    fetchWifiNetworks,
    handleDeleteWifi,
    getPaginationRange,
    nextPage,
    prevPage,
    goToPage,
  };
}