"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { filterItemsByTag, sortItems, SortConfig, searchItemsMultiField } from "@/libs/utils";

interface WalletPassphrase {
  doc_id: string;
  title: string;
  name: string;
  lower_title: string;
  wallet_type: string;
  data: string;
  passphrase: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

interface UseWalletPassphraseManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseWalletPassphraseManagementReturn {
  walletPassphrasesToDisplay: WalletPassphrase[];
  allWalletPassphrases: WalletPassphrase[];
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
  selectedWalletType: string;
  setSelectedWalletType: (walletType: string) => void;
  uniqueTags: string[];
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  handleDeleteWalletPassphrase: (doc_id: string) => Promise<void>;
  fetchWalletPassphrases: () => Promise<void>;
  clearFilters: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function useWalletPassphraseManagement({
  selectedWorkspaceId,
  selectedProjectId,
  initialItemsPerPage = 5,
}: UseWalletPassphraseManagementProps): UseWalletPassphraseManagementReturn {
  const { translate } = useTranslator();
  const [allWalletPassphrases, setAllWalletPassphrases] = useState<WalletPassphrase[]>([]);
  const [filteredWalletPassphrases, setFilteredWalletPassphrases] = useState<WalletPassphrase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedWalletType, setSelectedWalletTypeState] = useState("all");
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(null);

  const fetchWalletPassphrases = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setAllWalletPassphrases([]);
      setFilteredWalletPassphrases([]);
      setIsLoading(false);
      toast({
        title: translate("error", "actions"),
        description: translate("no_project_selected", "wallet_passphrases", { default: "No project selected" }),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/${selectedWorkspaceId}/${selectedProjectId}/wallet-phrases`);

      if (response.status === 200 && response.data?.data) {
        const fetchedWalletPassphrases: WalletPassphrase[] = response.data.data.map((item: any) => ({
          doc_id: item.doc_id || "",
          title: item.title || "",
          name: item.title || "",
          lower_title: item.lower_title || item.title?.toLowerCase() || "",
          wallet_type: item.wallet_type || "Other",
          data: item.data || "",
          passphrase: item.data || "",
          notes: item.notes || null,
          tags: item.tags || [],
          created_at: item.created_at || "",
          updated_at: item.updated_at || null,
          created_by: item.created_by || "",
          project_id: item.project_id || "",
        }));
        setAllWalletPassphrases(fetchedWalletPassphrases);

        let processed = [...fetchedWalletPassphrases];

        // Apply search if there's a query
        if (searchQuery.trim()) {
          processed = searchItemsMultiField(processed, searchQuery, ["title", "notes", "wallet_type", "tags"]);
        }

        // Apply wallet type filtering
        if (selectedWalletType !== "all") {
          processed = processed.filter(
            (passphrase) => passphrase.wallet_type.toLowerCase() === selectedWalletType.toLowerCase()
          );
        }

        // Apply sorting if a sort config is set
        const sortedWalletPassphrases = sortItems(processed, sortConfig);
        setFilteredWalletPassphrases(sortedWalletPassphrases);
      } else {
        console.error("Error in wallet passphrases response (hook):", response);
        setAllWalletPassphrases([]);
        setFilteredWalletPassphrases([]);
        toast({
          title: translate("error", "actions"),
          description: translate("error_fetching_passphrases", "wallet_passphrases", {
            default: "Error fetching wallet passphrases",
          }),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching wallet passphrases (hook):", error);
      setAllWalletPassphrases([]);
      setFilteredWalletPassphrases([]);
      toast({
        title: translate("error", "actions"),
        description:
          error.response?.data?.message ||
          translate("error_fetching_passphrases", "wallet_passphrases", {
            default: "Error fetching wallet passphrases",
          }),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, searchQuery, selectedWalletType, sortConfig]);

  useEffect(() => {
    fetchWalletPassphrases();
  }, [fetchWalletPassphrases]);

  const {
    paginatedData: walletPassphrasesToDisplay,
    totalPages,
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    goToPage,
    getPaginationRange,
  } = useClientPagination<WalletPassphrase>({
    data: filteredWalletPassphrases,
    itemsPerPage,
  });

  const handleDeleteWalletPassphrase = useCallback(
    async (doc_id: string) => {
      if (!selectedWorkspaceId || !selectedProjectId) {
        toast({
          title: translate("error", "actions"),
          description: translate("no_project_selected", "wallet_passphrases", { default: "No project selected" }),
          variant: "destructive",
        });
        return;
      }

      try {
        await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/wallet-phrases/${doc_id}`);
        toast({
          title: translate("success", "actions"),
          description: translate("passphrase_deleted_successfully", "wallet_passphrases", {
            default: "Wallet passphrase deleted successfully",
          }),
        });
        fetchWalletPassphrases();
      } catch (error: any) {
        console.error("Error deleting wallet passphrase (hook):", error);
        let errorMessage = translate("error_deleting_passphrase", "wallet_passphrases", {
          default: "Error deleting wallet passphrase",
        });
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
    [selectedWorkspaceId, selectedProjectId, fetchWalletPassphrases, translate]
  );

  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSelectedWalletTypeState("all");
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

  const setSelectedWalletType = useCallback(
    (walletType: string) => {
      setSelectedWalletTypeState(walletType);
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
    filteredWalletPassphrases.forEach((passphrase) => {
      if (passphrase.tags && Array.isArray(passphrase.tags)) {
        passphrase.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [filteredWalletPassphrases]);

  return {
    walletPassphrasesToDisplay,
    allWalletPassphrases,
    isLoading,
    totalCount: filteredWalletPassphrases.length,
    currentPage,
    setCurrentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    selectedWalletType,
    setSelectedWalletType,
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteWalletPassphrase,
    fetchWalletPassphrases,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  };
}