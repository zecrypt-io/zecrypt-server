import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/Redux/store';
import axiosInstance from '@/libs/Middleware/axiosInstace';
import { toast } from '@/components/ui/use-toast';
import { useTranslator } from '@/hooks/use-translations';
import { useClientPagination } from '@/hooks/use-client-pagination';
import { filterItemsByTag, sortItems, SortConfig, searchItemsMultiField } from '@/libs/utils';
import { decryptDataField } from '@/libs/encryption';
import { secureGetItem } from '@/libs/local-storage-utils';

// Raw data structure from API GET /identity
interface IdentityFromAPI {
  doc_id: string;
  title: string;
  lower_name: string; // Typically for server-side search optimization
  data: string; // JSON string with encrypted fields
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
}

// Processed identity structure for the component
export interface Identity {
  doc_id: string;
  title: string;
  lower_name: string;
  first_name: string; // Extracted from data
  last_name: string; // Extracted from data
  email: string; // Extracted from data
  phone: string; // Extracted from data
  address: string; // Extracted from data
  date_of_birth: string; // Extracted from data
  national_id: string; // Extracted from data
  country?: string; // Add missing country property
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
}

interface UseIdentityManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseIdentityManagementReturn {
  identitiesToDisplay: Identity[];
  allRawIdentities: IdentityFromAPI[]; // Store raw response
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
  setSelectedTag: (tag: string) => void;
  uniqueTags: string[];
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  handleDeleteIdentity: (doc_id: string) => Promise<void>;
  fetchIdentities: () => Promise<void>;
  clearFilters: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function useIdentityManagement({
  selectedWorkspaceId,
  selectedProjectId,
  initialItemsPerPage = 5,
}: UseIdentityManagementProps): UseIdentityManagementReturn {
  const { translate } = useTranslator();
  const [allRawIdentities, setAllRawIdentities] = useState<IdentityFromAPI[]>([]);
  const [processedIdentities, setProcessedIdentities] = useState<Identity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedTag, setSelectedTagState] = useState("all");
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(null);
  
  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  const processIdentityData = useCallback(async (identityRaw: IdentityFromAPI): Promise<Identity> => {
    let firstName = '';
    let lastName = '';
    let email = '';
    let phone = '';
    let address = '';
    let dateOfBirth = '';
    let nationalId = '';
    let country: string | undefined = '';
    
    try {
      if (identityRaw.data) {
        // Attempt to decrypt if we have a project key; otherwise, fall back to plain JSON parse
        const currentProject = workspaces
          .find(ws => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find(p => p.project_id === selectedProjectId);

        const projectKeyName = currentProject ? `projectKey_${currentProject.name}` : null;
        const projectAesKey = projectKeyName ? await secureGetItem(projectKeyName) : null;

        let parsedData: any | null = null;

        if (projectAesKey) {
          try {
            const decryptedData = await decryptDataField(identityRaw.data, projectAesKey);
            parsedData = JSON.parse(decryptedData);
          } catch (decryptError) {
            console.warn("Failed to decrypt identity data, will try plain JSON parse:", decryptError);
          }
        }

        if (!parsedData) {
          try {
            parsedData = JSON.parse(identityRaw.data);
          } catch (parseError) {
            console.error("Error parsing identity data as JSON:", parseError);
          }
        }

        if (parsedData) {
          firstName = parsedData.first_name || '';
          lastName = parsedData.last_name || '';
          email = parsedData.email || '';
          phone = parsedData.phone || '';
          address = parsedData.address || '';
          dateOfBirth = parsedData.date_of_birth || '';
          nationalId = parsedData.national_id || '';
          country = parsedData.country || '';
        }
      }
    } catch (error) {
      console.error("Failed to process identity data field in hook:", {
        error: error instanceof Error ? error.message : String(error),
        identity_id: identityRaw.doc_id,
        rawData: identityRaw.data,
      });
    }

    return {
      doc_id: identityRaw.doc_id,
      title: identityRaw.title,
      lower_name: identityRaw.lower_name,
      created_at: identityRaw.created_at,
      updated_at: identityRaw.updated_at,
      created_by: identityRaw.created_by,
      project_id: identityRaw.project_id,
      notes: identityRaw.notes,
      tags: identityRaw.tags,
      // Processed fields
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      address: address,
      date_of_birth: dateOfBirth,
      national_id: nationalId,
      country
    };
  }, [selectedWorkspaceId, selectedProjectId, workspaces]);

  const fetchIdentities = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setAllRawIdentities([]);
      setProcessedIdentities([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Fetch all identities - don't filter on server for multi-field search
      const response = await axiosInstance.get(
        `/${selectedWorkspaceId}/${selectedProjectId}/identity`
      );

      if (response.status === 200) {
        const { data: fetchedIdentities = [] }: { data: IdentityFromAPI[] } = response.data || {};
        setAllRawIdentities(fetchedIdentities);
        let processed = await Promise.all(fetchedIdentities.map(processIdentityData));
        
        // Apply multi-field search if there's a search query
        if (searchQuery.trim()) {
          processed = searchItemsMultiField(processed, searchQuery, [
            'title',  // identity type
            'first_name', 
            'last_name',
            'email',
            'phone',
            'address',
            'national_id',
            'tags'
          ]);
        }
        
        // Apply tag filtering 
        const filteredIdentities = filterItemsByTag(processed, selectedTag);
          
        // Apply sorting if a sort config is set
        const sortedIdentities = sortItems(filteredIdentities, sortConfig);
        
        setProcessedIdentities(sortedIdentities);
      } else {
        console.error("Error in identities response (hook):", response);
        setAllRawIdentities([]);
        setProcessedIdentities([]);
        toast({ title: translate("error", "actions"), description: translate("error_fetching_identities", "identity", { default: "Error fetching identities" }), variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching identities (hook):", error);
      setAllRawIdentities([]);
      setProcessedIdentities([]);
      toast({ title: translate("error", "actions"), description: translate("error_fetching_identities", "identity", { default: "Error fetching identities" }), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId, selectedProjectId, searchQuery, selectedTag, sortConfig, processIdentityData]);

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  const { 
    paginatedData: identitiesToDisplay,
    totalPages,
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    goToPage,
    getPaginationRange 
  } = useClientPagination<Identity>({
    data: processedIdentities, // Use processed identities for pagination
    itemsPerPage,
  });

  const handleDeleteIdentity = useCallback(async (doc_id: string) => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({ title: translate("error", "actions"), description: translate("missing_auth_or_selection", "identity", { default: "Missing authentication or selection" }), variant: "destructive" });
      return;
    }
    try {
      await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/identity/${doc_id}`);
      toast({ title: translate("success", "actions"), description: translate("identity_deleted_successfully", "identity", { default: "Identity deleted successfully" }) });
      fetchIdentities(); // Re-fetch to update the list
    } catch (error: any) {
      let errorMessage = translate("error_deleting_identity", "identity", { default: "Error deleting identity" });
      if (error.response?.data?.message) {
        errorMessage = `${errorMessage}: ${error.response.data.message}`;
      }
      toast({ title: translate("error", "actions"), description: errorMessage, variant: "destructive" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId, selectedProjectId, fetchIdentities]);

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
      }, 300); // 300ms debounce for search as user types
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

  // Add useMemo to get unique tags from all identities for the dropdown
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    processedIdentities.forEach(identity => {
      if (identity.tags && Array.isArray(identity.tags)) {
        identity.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [processedIdentities]);

  return {
    identitiesToDisplay,
    allRawIdentities,
    isLoading,
    totalCount: processedIdentities.length,
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
    handleDeleteIdentity,
    fetchIdentities,
    clearFilters,
    nextPage,
    prevPage,
    goToPage
  };
} 