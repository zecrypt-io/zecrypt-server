import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/Redux/store';
import axiosInstance from '@/libs/Middleware/axiosInstace';
import { toast } from '@/components/ui/use-toast';
import { useTranslator } from '@/hooks/use-translations';
import { useClientPagination } from '@/hooks/use-client-pagination';
import { decryptAccountData } from '@/libs/encryption';
import { secureGetItem } from '@/libs/session-storage-utils';
import { sortItems, SortConfig } from '@/libs/utils';

interface Account {
  doc_id: string;
  name?: string;
  title?: string;
  lower_name: string;
  user_name?: string;
  username?: string;
  password?: string;
  data?: string | { username: string; password: string };
  website?: string | null;
  url?: string | null;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
}

interface UseAccountManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseAccountManagementReturn {
  accountsToDisplay: Account[]; // Paginated accounts
  allRawAccounts: Account[]; // All accounts fetched from backend before processing
  isLoading: boolean;
  totalCount: number; // This will be allAccounts.length due to client-side pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  getPaginationRange: () => (number | string)[];
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  uniqueTags: string[];
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  handleDeleteAccount: (doc_id: string) => Promise<void>;
  fetchAccounts: () => Promise<void>;
  clearFilters: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function useAccountManagement({
  selectedWorkspaceId,
  selectedProjectId,
  initialItemsPerPage = 5,
}: UseAccountManagementProps): UseAccountManagementReturn {
  const { translate } = useTranslator();
  const [allRawAccounts, setAllRawAccounts] = useState<Account[]>([]); // Stores raw fetched data
  const [processedAccounts, setProcessedAccounts] = useState<Account[]>([]); // Stores data after processing username/password
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedTag, setSelectedTagState] = useState("all");
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(null);
  
  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  const processAccountData = useCallback(async (account: Account): Promise<Account> => {
    // This logic is similar to what was in AccountsContent
    try {
      if (account.password && account.username) { // Already has distinct username/password fields
        return account;
      }
      let finalUsername = account.username || account.user_name || '';
      let finalPassword = account.password || '';

      if (!account.title && account.name) {
        account.title = account.name;
      }

      if (account.data && typeof account.data === 'string') {
        try {
          // Find the current project using workspaces from the component scope
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

          // Try to decrypt the data field using the project's AES key
          try {
            const decryptedData = await decryptAccountData(account.data, projectAesKey);
            // If decryption succeeds, parse the JSON
            const parsedData = JSON.parse(decryptedData);
            if (parsedData && typeof parsedData === 'object') {
              finalUsername = parsedData.username || finalUsername;
              finalPassword = parsedData.password || finalPassword;
            }
          } catch (decryptError) {
            console.error("Decryption failed, trying legacy JSON parse:", decryptError);
            
            // Legacy fallback: Try to parse as unencrypted JSON
            try {
              const parsedData = JSON.parse(account.data);
              if (parsedData && typeof parsedData === 'object') {
                finalUsername = parsedData.username || finalUsername;
                finalPassword = parsedData.password || finalPassword;
              }
            } catch (parseError) {
              // If not JSON, it might be an old format (just password) or a new hash (masked)
              // For simplicity, if JSON parsing fails and no password field exists, mask it.
              if (!finalPassword) finalPassword = "••••••••";
              console.log("Error parsing data:", parseError);
            }
          }
        } catch (e) {
          // If any error occurs in the project key retrieval or overall process
          console.error("Error processing account data:", e);
          if (!finalPassword) finalPassword = "••••••••";
        }
      } else if (account.data && typeof account.data === 'object') {
        finalUsername = account.data.username || finalUsername;
        finalPassword = account.data.password || finalPassword;
      }
      
      // If after all processing, password is still empty and there was some data, show masked
      if (!finalPassword && account.data) {
        finalPassword = "••••••••";
      } 
      // If no data at all and no specific password field, it might be truly empty or an error indicator
      else if (!finalPassword && !account.data && !account.password) {
        finalPassword = "-"; // Or some other placeholder like "No data"
      }

      return {
        ...account,
        username: finalUsername,
        password: finalPassword,
      };
    } catch (error: unknown) {
      console.error("Failed to process account data in hook:", {
        error: error instanceof Error ? error.message : String(error),
        account_id: account.doc_id,
      });
      return {
        ...account,
        username: account.username || account.user_name || '-',
        password: "Error processing data",
      };
    }
  }, [selectedWorkspaceId, selectedProjectId, workspaces]);

  // Filter items by tag
  const filterItemsByTag = useCallback((items: Account[], tag: string): Account[] => {
    if (!tag || tag === 'all') return items;
    return items.filter(item => 
      item.tags && Array.isArray(item.tags) && item.tags.includes(tag)
    );
  }, []);

  // Search across multiple fields
  const searchItemsMultiField = useCallback((items: Account[], query: string, fields: string[]): Account[] => {
    if (!query) return items;
    
    const searchTerm = query.toLowerCase();
    return items.filter(item => {
      return fields.some(field => {
        const value = item[field as keyof Account];
        if (Array.isArray(value)) {
          return value.some(v => v.toString().toLowerCase().includes(searchTerm));
        }
        if (value) {
          return value.toString().toLowerCase().includes(searchTerm);
        }
        return false;
      });
    });
  }, []);

  const fetchAccounts = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setAllRawAccounts([]);
      setProcessedAccounts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Fetch all accounts - we'll handle filtering client-side for better search
      const response = await axiosInstance.get(
        `/${selectedWorkspaceId}/${selectedProjectId}/accounts`
      );

      if (response.status === 200) {
        const { data: fetchedAccounts = [] } = response.data || {};
        setAllRawAccounts(fetchedAccounts);
        let processed = await Promise.all(fetchedAccounts.map(processAccountData));
        
        // Apply multi-field search if there's a search query
        if (searchQuery.trim()) {
          processed = searchItemsMultiField(processed, searchQuery, [
            'title',
            'name',
            'username',
            'user_name',
            'website',
            'url',
            'tags'
          ]);
        }
        
        // Apply tag filtering
        const filteredAccounts = filterItemsByTag(processed, selectedTag);
        
        // Apply sorting if a sort config is set
        const sortedAccounts = sortItems(filteredAccounts, sortConfig);
        
        setProcessedAccounts(sortedAccounts);
      } else {
        console.error("Error in accounts response (hook):", response);
        setAllRawAccounts([]);
        setProcessedAccounts([]);
        toast({ title: translate("error", "actions"), description: translate("error_fetching_accounts", "accounts"), variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching accounts (hook):", error);
      setAllRawAccounts([]);
      setProcessedAccounts([]);
      toast({ title: translate("error", "actions"), description: translate("error_fetching_accounts", "accounts"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId, selectedProjectId, searchQuery, selectedTag, sortConfig, processAccountData, filterItemsByTag, searchItemsMultiField]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const { 
    paginatedData: accountsToDisplay,
    totalPages,
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    goToPage,
    getPaginationRange 
  } = useClientPagination<Account>({
    data: processedAccounts, // Use processed accounts for pagination
    itemsPerPage,
  });

  const handleDeleteAccount = useCallback(async (doc_id: string) => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({ title: translate("error", "actions"), description: translate("missing_auth_or_selection", "accounts"), variant: "destructive" });
      return;
    }
    try {
      await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/accounts/${doc_id}`);
      toast({ title: translate("success", "actions"), description: translate("account_deleted_successfully", "accounts") });
      fetchAccounts();
    } catch (error: any) {
      let errorMessage = translate("error_deleting_account", "accounts");
      if (error.response?.data?.message) {
        errorMessage = `${errorMessage}: ${error.response.data.message}`;
      }
      toast({ title: translate("error", "actions"), description: errorMessage, variant: "destructive" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId, selectedProjectId, fetchAccounts]);

  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSelectedTagState("all");
    setSortConfigState(null);
    setCurrentPage(1); // Reset pagination to the first page
  }, [setCurrentPage]);

  // Debounced search query setter
  const setSearchQuery = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSearchQueryState(value);
        setCurrentPage(1); // Reset to first page on search
      }, 300);
    };
  }, [setCurrentPage]);

  const setSelectedTag = useCallback((tag: string) => {
    setSelectedTagState(tag);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const setItemsPerPage = useCallback((items: number) => {
    setItemsPerPageState(items);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const setSortConfig = useCallback((config: SortConfig | null) => {
    setSortConfigState(config);
    setCurrentPage(1);
  }, [setCurrentPage]);

  // Add useMemo to get unique tags from all accounts for the dropdown
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    processedAccounts.forEach(account => {
      if (account.tags && Array.isArray(account.tags)) {
        account.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [processedAccounts]);

  return {
    accountsToDisplay,
    allRawAccounts,
    isLoading,
    totalCount: processedAccounts.length, // Total count is based on all processed accounts
    currentPage,
    setCurrentPage, // This is goToPage from useClientPagination
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteAccount,
    fetchAccounts, // Expose fetchAccounts if manual refresh is needed
    clearFilters,
    nextPage,
    prevPage,
    goToPage
  };
} 