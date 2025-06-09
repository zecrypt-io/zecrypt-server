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
import { secureGetItem, decryptFromSessionStorage } from "@/libs/session-storage-utils";

interface WalletPassphrase {
  doc_id: string;
  title: string;
  name: string;
  lower_title: string;
  wallet_type: string;
  data: string;
  passphrase: string;
  wallet_address: string;
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
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  
  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  
  // Get pagination data FIRST before referencing in other functions
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
        console.log("Loading project key for wallet passphrases:", selectedProjectName);
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

  const processWalletPassphrases = useCallback(async (
    rawPassphrases: any[], 
    key: string | null
  ) => {
    const processed: WalletPassphrase[] = [];
    
    for (const item of rawPassphrases) {
      let decryptedData = '';
      let walletAddress = '';
      
      // Check if data exists
      if (item.data) {
        // Check if data is encrypted (has the format iv.encrypted)
        if (key && typeof item.data === 'string' && item.data.includes('.')) {
          try {
            console.log("Attempting to decrypt data:", item.data.substring(0, 20) + "...");
            const decrypted = await decryptDataField(item.data, key);
            try {
              // Try to parse as JSON
              const passphraseObj = JSON.parse(decrypted);
              // Use the passphrase and wallet_address fields from the JSON object
              if (passphraseObj) {
                decryptedData = passphraseObj.passphrase || '';
                walletAddress = passphraseObj.wallet_address || '';
                console.log("Successfully decrypted JSON passphrase and wallet address");
              } else {
                // If for some reason the JSON doesn't have required fields
                decryptedData = decrypted;
                console.log("Decrypted but found no passphrase/wallet_address fields in JSON");
              }
            } catch (parseError) {
              // If not valid JSON, use the decrypted string directly
              console.log("Decrypted but not valid JSON, using as plain text");
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
        }
      }
      
      processed.push({
        doc_id: item.doc_id || "",
        title: item.title || "",
        name: item.title || "",
        lower_title: item.lower_title || item.title?.toLowerCase() || "",
        wallet_type: item.wallet_type || "Other",
        data: item.data || "", 
        passphrase: decryptedData,
        wallet_address: walletAddress,
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
  
  // Apply filters to the wallet passphrases
  const filterWalletPassphrases = useCallback((passphrases: WalletPassphrase[]) => {
    let filtered = [...passphrases];
    
    if (searchQuery.trim()) {
      filtered = searchItemsMultiField(filtered, searchQuery, [
        "title", "notes", "wallet_type", "tags"
      ]);
    }
    
    if (selectedWalletType !== "all") {
      filtered = filtered.filter(
        (item) => item.wallet_type.toLowerCase() === selectedWalletType.toLowerCase()
      );
    }
    
    return sortItems(filtered, sortConfig);
  }, [searchQuery, selectedWalletType, sortConfig]);
  
  // Handle fetch wallet passphrases
  const fetchWalletPassphrases = useCallback(async () => {
    console.log("Fetching wallet passphrases");
    
    if (!selectedWorkspaceId || !selectedProjectId) {
      setAllWalletPassphrases([]);
      setFilteredWalletPassphrases([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axiosInstance.get(
        `/${selectedWorkspaceId}/${selectedProjectId}/wallet-phrases`
      );
      
      if (response.status === 200 && response.data?.data) {
        // Capture current value of projectKey to use in this execution
        const currentKey = projectKey;
        console.log("Processing data with project key:", currentKey ? "Available" : "Not available");
        
        const processed = await processWalletPassphrases(response.data.data, currentKey);
        setAllWalletPassphrases(processed);
        
        const filtered = filterWalletPassphrases(processed);
        setFilteredWalletPassphrases(filtered);
      } else {
        console.error("Error in response:", response);
        setAllWalletPassphrases([]);
        setFilteredWalletPassphrases([]);
      }
    } catch (error) {
      console.error("Error fetching wallet passphrases:", error);
      setAllWalletPassphrases([]);
      setFilteredWalletPassphrases([]);
      toast({
        title: translate("error", "actions"),
        description: translate("error_fetching_passphrases", "wallet_passphrases", {
          default: "Error fetching wallet passphrases"
        }),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, projectKey, processWalletPassphrases, filterWalletPassphrases, translate]);

  // Re-filter when filter-related data changes
  useEffect(() => {
    if (allWalletPassphrases.length > 0) {
      const filtered = filterWalletPassphrases(allWalletPassphrases);
      setFilteredWalletPassphrases(filtered);
    }
  }, [searchQuery, selectedWalletType, sortConfig, allWalletPassphrases, filterWalletPassphrases]);
  
  // Fetch data initially and when key dependencies change
  useEffect(() => {
    fetchWalletPassphrases();
  // We use fetchTrigger as a proxy for "refetch when needed"
  // instead of watching all dependencies directly
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTrigger, selectedWorkspaceId, selectedProjectId]);
  
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
        // Trigger a refetch by incrementing the counter
        setFetchTrigger(prev => prev + 1);
      } catch (error: any) {
        console.error("Error deleting wallet passphrase:", error);
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
    [selectedWorkspaceId, selectedProjectId, translate]
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

  // Wrapper function to allow external components to trigger fetch
  const manualFetchWalletPassphrases = useCallback(async () => {
    setFetchTrigger(prev => prev + 1);
  }, []);

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
    fetchWalletPassphrases: manualFetchWalletPassphrases,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  };
}