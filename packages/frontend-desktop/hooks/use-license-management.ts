import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/Redux/store';
import axiosInstance from '@/libs/Middleware/axiosInstace';
import { toast } from '@/components/ui/use-toast';
import { useTranslator } from '@/hooks/use-translations';
import { useClientPagination } from '@/hooks/use-client-pagination';
import { filterItemsByTag, sortItems, SortConfig, searchItemsMultiField } from '@/libs/utils';
// import { decryptDataField } from '@/libs/encryption';
// import { secureGetItem } from '@/libs/local-storage-utils';

// Raw data structure from API GET /licenses
interface LicenseFromAPI {
  doc_id: string;
  title?: string;
  name?: string; // API might send this or title, or both
  lower_name: string; // Typically for server-side search optimization
  data: string; // JSON string: e.g., {"license_key": "some_encrypted_or_plain_key"}
  software?: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
  expires_at?: string | null; // Correct field for expiry
}

// Processed license structure for the component
interface License {
  doc_id: string;
  title: string; // This is the Software Name
  lower_name: string; // Keep if API uses it for search/sorting related to title
  license_key: string; // Extracted from data
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
  expires_at?: string | null;
}

interface UseLicenseManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseLicenseManagementReturn {
  licensesToDisplay: License[];
  allRawLicenses: LicenseFromAPI[]; // Store raw response
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
  uniqueTags: string[];
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
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
  const [allRawLicenses, setAllRawLicenses] = useState<LicenseFromAPI[]>([]);
  const [processedLicenses, setProcessedLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedTag, setSelectedTagState] = useState("all");
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(null);
  
  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  const processLicenseData = useCallback(async (licenseRaw: LicenseFromAPI): Promise<License> => {
    let extractedLicenseKey = '';
    try {
      if (licenseRaw.data) {
        // Desktop mode: data is plain JSON, not encrypted. Parse it directly.
        const parsedData = JSON.parse(licenseRaw.data);
        if (parsedData && typeof parsedData.license_key === 'string') {
          extractedLicenseKey = parsedData.license_key;
        }
      }
    } catch (error) {
      console.error("Failed to process license data field in hook:", {
        error: error instanceof Error ? error.message : String(error),
        license_id: licenseRaw.doc_id,
        rawData: licenseRaw.data,
      });
    }

    // Use title as the primary software name, fallback to name if title is not present
    const softwareName = licenseRaw.title || licenseRaw.name || 'Untitled Software';

    return {
      // Spread minimal necessary fields from licenseRaw, then override/set specific ones
      doc_id: licenseRaw.doc_id,
      lower_name: licenseRaw.lower_name, // Assuming this is tied to how API searches on title/name
      created_at: licenseRaw.created_at,
      updated_at: licenseRaw.updated_at,
      created_by: licenseRaw.created_by,
      project_id: licenseRaw.project_id,
      notes: licenseRaw.notes,
      tags: licenseRaw.tags,
      // Processed fields
      title: softwareName, // This is now the Software Name
      license_key: extractedLicenseKey,
      expires_at: licenseRaw.expires_at,
    };
  }, [selectedWorkspaceId, selectedProjectId, workspaces]);

  const fetchLicenses = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setAllRawLicenses([]);
      setProcessedLicenses([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Fetch all licenses without filtering on server for multi-field search
      const response = await axiosInstance.get(
        `/${selectedWorkspaceId}/${selectedProjectId}/licenses`
      );

      if (response.status === 200) {
        const { data: fetchedLicenses = [] }: { data: LicenseFromAPI[] } = response.data || {};
        setAllRawLicenses(fetchedLicenses);
        let processed = await Promise.all(fetchedLicenses.map(processLicenseData));
        
        // Apply multi-field search if there's a search query
        if (searchQuery.trim()) {
          processed = searchItemsMultiField(processed, searchQuery, [
            'title',        // Software name
            'license_key',  // License key
            'tags'          // Tags
          ]);
        }
        
        // Apply tag filtering
        const filteredLicenses = filterItemsByTag(processed, selectedTag);
        
        // Apply sorting if a sort config is set
        const sortedLicenses = sortItems(filteredLicenses, sortConfig);
        
        setProcessedLicenses(sortedLicenses);
      } else {
        console.error("Error in licenses response (hook):", response);
        setAllRawLicenses([]);
        setProcessedLicenses([]);
        toast({ 
          title: translate("common.error"), 
          description: translate("licenses.error_fetching_licenses"), 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error fetching licenses (hook):", error);
      setAllRawLicenses([]);
      setProcessedLicenses([]);
      toast({ 
        title: translate("common.error"), 
        description: translate("licenses.error_fetching_licenses"), 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId, selectedProjectId, searchQuery, selectedTag, sortConfig, processLicenseData]);

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
    data: processedLicenses, // Use processed licenses for pagination
    itemsPerPage,
  });

  const handleDeleteLicense = useCallback(async (doc_id: string) => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({ title: translate("error", "actions"), description: translate("missing_auth_or_selection", "licenses", { default: "Missing authentication or selection" }), variant: "destructive" });
      return;
    }
    try {
      await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/licenses/${doc_id}`);
      toast({ 
        title: translate("common.success"), 
        description: translate("licenses.license_deleted_successfully") 
      });
      fetchLicenses(); // Re-fetch to update the list
    } catch (error: any) {
      let errorMessage = translate("error_deleting_license", "licenses", { default: "Error deleting license" });
      if (error.response?.data?.message) {
        errorMessage = `${errorMessage}: ${error.response.data.message}`;
      }
      toast({ 
        title: translate("common.error"), 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId, selectedProjectId, fetchLicenses]);

  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSelectedTagState("all");
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

  const setSelectedTag = useCallback((tag: string) => {
    setSelectedTagState(tag);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const setSortConfig = useCallback((config: SortConfig | null) => {
    setSortConfigState(config);
    setCurrentPage(1);
  }, [setCurrentPage]);

  // Add useMemo to get unique tags from all licenses for the dropdown
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    processedLicenses.forEach(license => {
      if (license.tags && Array.isArray(license.tags)) {
        license.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [processedLicenses]);

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
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteLicense,
    fetchLicenses,
    clearFilters,
    nextPage,
    prevPage,
    goToPage
  };
} 