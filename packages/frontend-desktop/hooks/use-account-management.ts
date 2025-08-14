import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/Redux/store';
import axiosInstance from '@/libs/Middleware/axiosInstace';
import { toast } from '@/components/ui/use-toast';
import { useTranslator } from '@/hooks/use-translations';
import { useClientPagination } from '@/hooks/use-client-pagination';
import { decryptAccountData } from '@/libs/encryption';
import { secureGetItem } from '@/libs/local-storage-utils';
import { filterItemsByTag, sortItems, SortConfig, searchItemsMultiField } from '@/libs/utils';

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
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
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
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]); // Stores filtered accounts based on search/category
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedCategory, setSelectedCategoryState] = useState("all");
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
        // Desktop/offline mode: data may be plain JSON. Try decryption only if a project key exists.
        try {
          const currentProject = workspaces
            .find(ws => ws.workspaceId === selectedWorkspaceId)
            ?.projects.find(p => p.project_id === selectedProjectId);

          const projectKeyName = currentProject ? `projectKey_${currentProject.name}` : null;
          const projectAesKey = projectKeyName ? await secureGetItem(projectKeyName) : null;

          let parsedData: any | null = null;

          if (projectAesKey) {
            try {
              const decryptedData = await decryptAccountData(account.data, projectAesKey);
              parsedData = JSON.parse(decryptedData);
            } catch (decryptError) {
              console.warn("Account data decryption failed, falling back to plain JSON parse:", decryptError);
            }
          }

          if (!parsedData) {
            try { parsedData = JSON.parse(account.data); } catch (parseError) { parsedData = null; }
          }

          if (parsedData && typeof parsedData === 'object') {
            finalUsername = parsedData.username || finalUsername;
            finalPassword = parsedData.password || finalPassword;
          }
        } catch (e) {
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

  // Get all unique tags from accounts
  const uniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    processedAccounts.forEach(account => {
      if (account.tags && Array.isArray(account.tags)) {
        account.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [processedAccounts]);

  const getCategoryTag = useCallback((category: string): string => {
    switch (category.toLowerCase()) {
      case 'personal': return 'personal';
      case 'work': return 'work';
      case 'finance': return 'finance';
      case 'favorite': return 'favorite';
      default: return category.toLowerCase();
    }
  }, []);

  // Apply filters and sorting to accounts
  useEffect(() => {
    let result = [...processedAccounts];
    
    // Apply category filter
    if (selectedCategory !== "all") {
      const categoryTag = getCategoryTag(selectedCategory);
      result = result.filter(account => 
        account.tags?.includes(categoryTag)
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      result = searchItemsMultiField(result, searchQuery, ['title', 'name', 'username', 'website', 'url']);
    }
    
    // Apply sorting
    if (sortConfig) {
      result = sortItems(result, sortConfig);
    }
    
    setFilteredAccounts(result);
  }, [processedAccounts, selectedCategory, searchQuery, getCategoryTag, sortConfig]);

  const fetchAccounts = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setAllRawAccounts([]);
      setProcessedAccounts([]);
      setFilteredAccounts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      let tagsArray: string[] = [];
      if (selectedCategory !== "all") {
        tagsArray = [getCategoryTag(selectedCategory)];
      }
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) {
        queryParams.append('name', searchQuery.trim());
      }
      if (tagsArray.length > 0) {
        tagsArray.forEach(tag => queryParams.append('tags', tag));
      }

      const response = await axiosInstance.get(
        `/${selectedWorkspaceId}/${selectedProjectId}/accounts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );

      if (response.status === 200) {
        const { data: fetchedAccounts = [] } = response.data || {};
        setAllRawAccounts(fetchedAccounts);
        const processed = await Promise.all(fetchedAccounts.map(processAccountData));
        setProcessedAccounts(processed);
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
  }, [selectedWorkspaceId, selectedProjectId, searchQuery, selectedCategory, getCategoryTag, processAccountData]);

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
    data: filteredAccounts, // Use filtered accounts for pagination
    itemsPerPage,
  });

  const handleDeleteAccount = useCallback(async (doc_id: string) => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({ title: translate("error", "actions"), description: translate("missing_auth_or_selection", "accounts"), variant: "destructive" });
      return;
    }
    try {
      const response = await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/accounts/${doc_id}`);
      if (response.status === 200) {
        // Update the state by removing the deleted account
        setAllRawAccounts(prev => prev.filter(acc => acc.doc_id !== doc_id));
        setProcessedAccounts(prev => prev.filter(acc => acc.doc_id !== doc_id));
        toast({ title: translate("success", "actions"), description: translate("account_deleted", "accounts") });
      } else {
        console.error("Error deleting account:", response);
        toast({ title: translate("error", "actions"), description: translate("error_deleting_account", "accounts"), variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({ title: translate("error", "actions"), description: translate("error_deleting_account", "accounts"), variant: "destructive" });
    }
  }, [selectedWorkspaceId, selectedProjectId, translate]);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const setSelectedCategory = useCallback((category: string) => {
    setSelectedCategoryState(category);
  }, []);

  const setItemsPerPage = useCallback((items: number) => {
    setItemsPerPageState(items);
  }, []);

  const setSortConfig = useCallback((config: SortConfig | null) => {
    setSortConfigState(config);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSelectedCategoryState("all");
    setSortConfigState(null);
  }, []);

  return {
    accountsToDisplay,
    allRawAccounts,
    isLoading,
    totalCount: filteredAccounts.length,
    currentPage,
    setCurrentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteAccount,
    fetchAccounts,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  };
} 