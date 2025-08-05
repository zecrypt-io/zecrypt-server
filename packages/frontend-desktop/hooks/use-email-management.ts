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
import { secureGetItem, decryptFromLocalStorage } from "@/libs/local-storage-utils";

interface Email {
  doc_id: string;
  title: string;
  lower_title: string;
  data: string;
  email_address: string;
  imap_server: string;
  smtp_server: string;
  username: string;
  password: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

interface UseEmailManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseEmailManagementReturn {
  emailsToDisplay: Email[];
  allEmails: Email[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  getPaginationRange: () => (number | string)[];
  itemsPerPage: number;
  setItemsPerPage?: (items: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  uniqueTags: string[];
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  handleDeleteEmail: (doc_id: string) => Promise<void>;
  fetchEmails: () => Promise<void>;
  clearFilters: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  filterByTag: (tag: string | null) => void;
}

export function useEmailManagement({
  selectedWorkspaceId,
  selectedProjectId,
  initialItemsPerPage = 10,
}: UseEmailManagementProps): UseEmailManagementReturn {
  const { translate } = useTranslator();
  const [allEmails, setAllEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const [itemsPerPage] = useState(initialItemsPerPage);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(null);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  
  // Get pagination data
  const {
    paginatedData: emailsToDisplay,
    totalPages,
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    goToPage,
    getPaginationRange,
  } = useClientPagination<Email>({
    data: filteredEmails,
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
        console.log("Loading project key for emails:", selectedProjectName);
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

  const processEmails = useCallback(async (
    rawEmails: any[], 
    key: string | null
  ) => {
    const processed: Email[] = [];
    
    // Check if rawEmails exists and is an array
    if (!Array.isArray(rawEmails)) {
      console.error("Expected rawEmails to be an array but got:", typeof rawEmails);
      return processed; // Return empty array
    }
    
    for (const item of rawEmails) {
      let decryptedData = '';
      let emailData = {
        email_address: '',
        imap_server: '',
        smtp_server: '',
        username: '',
        password: ''
      };
      
      // Check if data exists
      if (item.data) {
        // Check if data is encrypted (has the format iv.encrypted)
        if (key && typeof item.data === 'string' && item.data.includes('.')) {
          try {
            const decrypted = await decryptDataField(item.data, key);
            try {
              // Try to parse as JSON
              emailData = JSON.parse(decrypted);
              decryptedData = decrypted;
              console.log("Successfully decrypted email data");
            } catch (parseError) {
              // If not valid JSON, use the decrypted string directly
              console.log("Decrypted but not valid JSON");
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
          try {
            emailData = JSON.parse(decryptedData);
          } catch (e) {
            // Unable to parse, keep defaults
          }
        }
      }
      
      processed.push({
        doc_id: item.doc_id || "",
        title: item.title || "",
        lower_title: item.lower_title || item.title?.toLowerCase() || "",
        data: item.data || "", 
        email_address: emailData.email_address || "",
        imap_server: emailData.imap_server || "",
        smtp_server: emailData.smtp_server || "",
        username: emailData.username || "",
        password: emailData.password || "",
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

  const fetchEmails = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Fetching emails for workspace", selectedWorkspaceId, "project", selectedProjectId);
      
      const response = await axiosInstance.get(
        `/${selectedWorkspaceId}/${selectedProjectId}/emails`
      );
      
      console.log("Email data fetched:", response.data ? "Success" : "Empty");
      
      // Extract the data array from the response (API returns { data: [...] } structure)
      const dataArray = response.data && response.data.data ? response.data.data : [];
      console.log("Emails data array:", dataArray.length > 0 ? `Found ${dataArray.length} emails` : "Empty");
      
      // Process the raw data
      const processedData = await processEmails(dataArray, projectKey);
      console.log("Processed emails:", processedData.length);
      
      setAllEmails(processedData);
      applyFiltersAndSort(processedData, searchQuery, selectedTag);
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast({
        title: translate("error", "emails", { default: "Error" }),
        description: translate("error_fetching_emails", "emails", {
          default: "Failed to fetch emails",
        }),
        variant: "destructive",
      });
      setAllEmails([]);
      setFilteredEmails([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedWorkspaceId,
    selectedProjectId,
    projectKey,
    processEmails,
    translate,
    selectedTag
  ]);
  
  // Apply filters and sorting to data
  const applyFiltersAndSort = useCallback(
    (data: Email[], query: string, tag: string | null = null) => {
      // Start with all data
      let filtered = data;
      
      // Apply tag filter
      if (tag) {
        filtered = filtered.filter(email => 
          email.tags && Array.isArray(email.tags) && email.tags.includes(tag)
        );
      }
      
      // Apply search filter
      if (query) {
        filtered = searchItemsMultiField(filtered, query, [
          "title",
          "email_address",
          "imap_server",
          "smtp_server",
          "username",
          "notes",
        ]);
      }
      
      // Apply sorting
      if (sortConfig) {
        filtered = sortItems(filtered, sortConfig);
      }
      
      setFilteredEmails(filtered);
    },
    [sortConfig]
  );
  
  // Handle search query changes
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    applyFiltersAndSort(allEmails, query, selectedTag);
  }, [allEmails, applyFiltersAndSort, selectedTag]);
  
  // Handle sorting changes
  const setSortConfig = useCallback((config: SortConfig | null) => {
    setSortConfigState(config);
    applyFiltersAndSort(allEmails, searchQuery, selectedTag);
  }, [allEmails, searchQuery, applyFiltersAndSort, selectedTag]);
  
  // Handle tag filter changes
  const filterByTag = useCallback((tag: string | null) => {
    setSelectedTag(tag);
    applyFiltersAndSort(allEmails, searchQuery, tag);
  }, [allEmails, searchQuery, applyFiltersAndSort]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSortConfigState(null);
    setSelectedTag(null);
    applyFiltersAndSort(allEmails, "", null);
  }, [allEmails, applyFiltersAndSort]);

  // Delete email
  const handleDeleteEmail = useCallback(
    async (doc_id: string) => {
      if (!selectedWorkspaceId || !selectedProjectId) {
        console.error("Missing required data for deleting email");
        return;
      }
      
      try {
        await axiosInstance.delete(
          `/${selectedWorkspaceId}/${selectedProjectId}/emails/${doc_id}`
        );
        
        toast({
          title: translate("deleted", "emails", { default: "Deleted" }),
          description: translate("email_deleted_successfully", "emails", {
            default: "Email credentials deleted successfully",
          }),
        });
        
        // Refresh the list
        fetchEmails();
      } catch (error) {
        console.error("Error deleting email:", error);
        toast({
          title: translate("error", "emails", { default: "Error" }),
          description: translate("failed_to_delete_email", "emails", {
            default: "Failed to delete email credentials",
          }),
          variant: "destructive",
        });
      }
    },
    [selectedWorkspaceId, selectedProjectId, fetchEmails, translate]
  );
  
  // Effect to fetch data when dependencies change
  useEffect(() => {
    if (selectedWorkspaceId && selectedProjectId) {
      console.log("Running fetchEmails effect", { fetchTrigger });
      fetchEmails();
    }
  }, [selectedWorkspaceId, selectedProjectId, fetchTrigger]);
  
  // Effect to update filtered data when all data changes
  useEffect(() => {
    applyFiltersAndSort(allEmails, searchQuery, selectedTag);
  }, [allEmails, applyFiltersAndSort, searchQuery, selectedTag]);
  
  // Extract unique tags from all emails
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    allEmails.forEach((email) => {
      if (email.tags && Array.isArray(email.tags)) {
        email.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [allEmails]);
  
  // Calculate total count
  const totalCount = useMemo(() => filteredEmails.length, [filteredEmails]);
  
  return {
    emailsToDisplay,
    allEmails,
    isLoading,
    totalCount,
    currentPage,
    setCurrentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage: () => {},
    searchQuery,
    setSearchQuery,
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteEmail,
    fetchEmails,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
    filterByTag,
  };
} 