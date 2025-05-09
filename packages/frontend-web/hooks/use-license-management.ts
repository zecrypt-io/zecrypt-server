import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/Redux/store';
import axiosInstance from '@/libs/Middleware/axiosInstace';
import { toast } from '@/components/ui/use-toast';
import { useTranslator } from '@/hooks/use-translations';
import { useClientPagination } from '@/hooks/use-client-pagination';

interface License {
  doc_id: string;
  title?: string;
  name?: string;
  lower_name: string;
  license_key: string;
  expiry_date: string;
  software?: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
}

interface UseLicenseManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseLicenseManagementReturn {
  licensesToDisplay: License[];
  allRawLicenses: License[];
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
  selectedTag: string;
  setSelectedTag: (category: string) => void;
  handleDeleteLicense: (doc_id: string) => Promise<void>;
  fetchLicenses: () => Promise<void>;
  clearFilters: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function useLicenseManagement({
  selectedWorkspaceId,
  selectedProjectId,
  initialItemsPerPage = 5,
}: UseLicenseManagementProps): UseLicenseManagementReturn {
  const { translate } = useTranslator();
  const [allRawLicenses, setAllRawLicenses] = useState<License[]>([]);
  const [processedLicenses, setProcessedLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedTag, setSelectedTagState] = useState("all");
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

  const processLicenseData = useCallback(async (license: License): Promise<License> => {
    // Process license data if needed
    try {
      // Ensure title is set
      if (!license.title && license.name) {
        license.title = license.name;
      }

      return {
        ...license,
      };
    } catch (error: unknown) {
      console.error("Failed to process license data in hook:", {
        error: error instanceof Error ? error.message : String(error),
        license_id: license.doc_id,
      });
      return license;
    }
  }, []);

  const fetchLicenses = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setAllRawLicenses([]);
      setProcessedLicenses([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      let tagsArray: string[] = [];
      if (selectedTag !== "all") {
        tagsArray = [selectedTag];
      }
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) {
        queryParams.append('name', searchQuery.trim());
      }
      if (tagsArray.length > 0) {
        tagsArray.forEach(tag => queryParams.append('tags', tag));
      }

      const response = await axiosInstance.get(
        `/${selectedWorkspaceId}/${selectedProjectId}/licenses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );

      if (response.status === 200) {
        const { data: fetchedLicenses = [] } = response.data || {};
        setAllRawLicenses(fetchedLicenses);
        const processed = await Promise.all(fetchedLicenses.map(processLicenseData));
        setProcessedLicenses(processed);
      } else {
        console.error("Error in licenses response (hook):", response);
        setAllRawLicenses([]);
        setProcessedLicenses([]);
        toast({ title: translate("error", "actions"), description: translate("error_fetching_licenses", "licenses", { default: "Error fetching licenses" }), variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching licenses (hook):", error);
      setAllRawLicenses([]);
      setProcessedLicenses([]);
      toast({ title: translate("error", "actions"), description: translate("error_fetching_licenses", "licenses", { default: "Error fetching licenses" }), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId, selectedProjectId, searchQuery, selectedTag, processLicenseData]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const { 
    paginatedData: licensesToDisplay,
    totalPages,
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    goToPage,
    getPaginationRange 
  } = useClientPagination<License>({
    data: processedLicenses,
    itemsPerPage,
  });

  const handleDeleteLicense = useCallback(async (doc_id: string) => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({ title: translate("error", "actions"), description: translate("missing_auth_or_selection", "licenses", { default: "Missing authentication or selection" }), variant: "destructive" });
      return;
    }
    try {
      await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/licenses/${doc_id}`);
      toast({ title: translate("success", "actions"), description: translate("license_deleted_successfully", "licenses", { default: "License deleted successfully" }) });
      fetchLicenses();
    } catch (error: any) {
      let errorMessage = translate("error_deleting_license", "licenses", { default: "Error deleting license" });
      if (error.response?.data?.message) {
        errorMessage = `${errorMessage}: ${error.response.data.message}`;
      }
      toast({ title: translate("error", "actions"), description: errorMessage, variant: "destructive" });
    }
  }, [selectedWorkspaceId, selectedProjectId, fetchLicenses, translate]);

  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSelectedTagState("all");
    setCurrentPage(1);
  }, [setCurrentPage]);

  // Debounced search query setter
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

  const setSelectedTag = useCallback((tag: string) => {
    setSelectedTagState(tag);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const setItemsPerPage = useCallback((items: number) => {
    setItemsPerPageState(items);
    setCurrentPage(1);
  }, [setCurrentPage]);

  return {
    licensesToDisplay,
    allRawLicenses,
    isLoading,
    totalCount: processedLicenses.length,
    currentPage,
    setCurrentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    handleDeleteLicense,
    fetchLicenses,
    clearFilters,
    nextPage,
    prevPage,
    goToPage
  };
} 