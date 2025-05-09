import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/Redux/store';
import axiosInstance from '@/libs/Middleware/axiosInstace';
import { toast } from '@/components/ui/use-toast';
import { useTranslator } from '@/hooks/use-translations';
import { useClientPagination } from '@/hooks/use-client-pagination';

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
  const [selectedCategory, setSelectedCategoryState] = useState("all");
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

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
          const parsedData = JSON.parse(account.data);
          if (parsedData && typeof parsedData === 'object') {
            finalUsername = parsedData.username || finalUsername;
            finalPassword = parsedData.password || finalPassword;
          }
        } catch (e) {
            // If not JSON, it might be an old format (just password) or a new hash (masked)
            // For simplicity, if JSON parsing fails and no password field exists, mask it.
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
  }, []);

  const getCategoryTag = useCallback((category: string): string => {
    switch (category.toLowerCase()) {
      case 'personal': return 'personal';
      case 'work': return 'work';
      case 'finance': return 'finance';
      case 'favorite': return 'favorite';
      default: return category.toLowerCase();
    }
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
    setSelectedCategoryState("all");
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

  const setSelectedCategory = useCallback((category: string) => {
    setSelectedCategoryState(category);
    setCurrentPage(1); // Reset to first page on category change
  }, [setCurrentPage]);

  const setItemsPerPage = useCallback((items: number) => {
      setItemsPerPageState(items);
      setCurrentPage(1);
  }, [setCurrentPage]);

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
    selectedCategory,
    setSelectedCategory,
    handleDeleteAccount,
    fetchAccounts, // Expose fetchAccounts if manual refresh is needed
    clearFilters,
    nextPage,
    prevPage,
    goToPage
  };
} 