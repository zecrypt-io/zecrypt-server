import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/Redux/store';
import axiosInstance from '@/libs/Middleware/axiosInstace';
import { toast } from '@/components/ui/use-toast';
import { useTranslator } from '@/hooks/use-translations';
import { useClientPagination } from '@/hooks/use-client-pagination';
import { decryptAccountData, encryptAccountData } from '@/libs/encryption';
import { secureGetItem } from '@/libs/local-storage-utils';
import { filterItemsByTag, sortItems, SortConfig, searchItemsMultiField } from '@/libs/utils';

export interface Note {
  doc_id: string;
  title: string;
  data: string; // Encrypted content
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
}

interface UseNoteManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseNoteManagementReturn {
  notesToDisplay: Note[];
  filteredNotes: Note[];
  allRawNotes: Note[];
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
  handleDeleteNote: (doc_id: string) => Promise<void>;
  fetchNotes: () => Promise<void>;
  clearFilters: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  handleAddNote: (note: { title: string; data: string; tags?: string[] }) => Promise<void>;
  handleEditNote: (doc_id: string, note: { title: string; data: string; tags?: string[] }) => Promise<void>;
}

export function useNoteManagement({
  selectedWorkspaceId,
  selectedProjectId,
  initialItemsPerPage = 5,
}: UseNoteManagementProps): UseNoteManagementReturn {
  const { translate } = useTranslator();
  const [allRawNotes, setAllRawNotes] = useState<Note[]>([]);
  const [processedNotes, setProcessedNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedTag, setSelectedTagState] = useState("all");
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(null);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  const processNoteData = useCallback(async (note: Note): Promise<Note> => {
    let decryptedContent = "";
    try {
      if (note.data) {
        const currentProject = workspaces
          .find(ws => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find(p => p.project_id === selectedProjectId);
        if (!currentProject) throw new Error("Project not found");
        const projectKeyName = `projectKey_${currentProject.name}`;
        const projectAesKey = await secureGetItem(projectKeyName);
        if (!projectAesKey) throw new Error("Project encryption key not found");
        try {
          decryptedContent = await decryptAccountData(note.data, projectAesKey);
        } catch (decryptError) {
          try {
            decryptedContent = JSON.parse(note.data);
          } catch (parseError) {
            decryptedContent = note.data;
          }
        }
      }
    } catch (error) {
      decryptedContent = note.data;
    }
    return {
      ...note,
      data: decryptedContent,
    };
  }, [selectedWorkspaceId, selectedProjectId, workspaces]);

  const uniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    processedNotes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [processedNotes]);

  useEffect(() => {
    let result = [...processedNotes];
    if (selectedTag !== "all") {
      result = result.filter(note => note.tags?.includes(selectedTag));
    }
    if (searchQuery) {
      result = searchItemsMultiField(result, searchQuery, ['title', 'data', 'tags']);
    }
    if (sortConfig) {
      result = sortItems(result, sortConfig);
    }
    setFilteredNotes(result);
  }, [processedNotes, selectedTag, searchQuery, sortConfig]);

  const fetchNotes = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setAllRawNotes([]);
      setProcessedNotes([]);
      setFilteredNotes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/${selectedWorkspaceId}/${selectedProjectId}/notes`
      );
      if (response.status === 200) {
        const { data: fetchedNotes = [] } = response.data || {};
        setAllRawNotes(fetchedNotes);
        const processed = await Promise.all(fetchedNotes.map(processNoteData));
        setProcessedNotes(processed);
      } else {
        setAllRawNotes([]);
        setProcessedNotes([]);
        toast({ title: translate("error", "actions"), description: translate("error_fetching_notes", "notes"), variant: "destructive" });
      }
    } catch (error) {
      setAllRawNotes([]);
      setProcessedNotes([]);
      toast({ title: translate("error", "actions"), description: translate("error_fetching_notes", "notes"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, processNoteData]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const { 
    paginatedData: notesToDisplay,
    totalPages,
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    goToPage,
    getPaginationRange 
  } = useClientPagination<Note>({
    data: filteredNotes,
    itemsPerPage,
  });

  const handleDeleteNote = useCallback(async (doc_id: string) => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({ title: translate("error", "actions"), description: translate("missing_auth_or_selection", "notes"), variant: "destructive" });
      return;
    }
    try {
      const response = await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/notes/${doc_id}`);
      if (response.status === 200) {
        setAllRawNotes(prev => prev.filter(note => note.doc_id !== doc_id));
        setProcessedNotes(prev => prev.filter(note => note.doc_id !== doc_id));
        toast({ title: translate("success", "actions"), description: translate("note_deleted", "notes") });
      } else {
        toast({ title: translate("error", "actions"), description: translate("error_deleting_note", "notes"), variant: "destructive" });
      }
    } catch (error) {
      toast({ title: translate("error", "actions"), description: translate("error_deleting_note", "notes"), variant: "destructive" });
    }
  }, [selectedWorkspaceId, selectedProjectId, translate]);

  const handleAddNote = useCallback(async (note: { title: string; data: string; tags?: string[] }) => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({ title: translate("error", "actions"), description: translate("missing_auth_or_selection", "notes"), variant: "destructive" });
      return;
    }
    try {
      const currentProject = workspaces
        .find(ws => ws.workspaceId === selectedWorkspaceId)
        ?.projects.find(p => p.project_id === selectedProjectId);
      if (!currentProject) throw new Error("Project not found");
      const projectKeyName = `projectKey_${currentProject.name}`;
      const projectAesKey = await secureGetItem(projectKeyName);
      if (!projectAesKey) throw new Error("Project encryption key not found");
      const encryptedData = await encryptAccountData(note.data, projectAesKey);
      const payload = { title: note.title, data: encryptedData, tags: note.tags || [] };
      const response = await axiosInstance.post(`/${selectedWorkspaceId}/${selectedProjectId}/notes`, payload);
      if (response.status === 200 || response.status === 201) {
        fetchNotes();
        toast({ title: translate("success", "actions"), description: translate("note_added", "notes") });
      } else {
        toast({ title: translate("error", "actions"), description: translate("error_adding_note", "notes"), variant: "destructive" });
      }
    } catch (error) {
      toast({ title: translate("error", "actions"), description: translate("error_adding_note", "notes"), variant: "destructive" });
    }
  }, [selectedWorkspaceId, selectedProjectId, workspaces, fetchNotes]);

  const handleEditNote = useCallback(async (doc_id: string, note: { title: string; data: string; tags?: string[] }) => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({ title: translate("error", "actions"), description: translate("missing_auth_or_selection", "notes"), variant: "destructive" });
      return;
    }
    try {
      const currentProject = workspaces
        .find(ws => ws.workspaceId === selectedWorkspaceId)
        ?.projects.find(p => p.project_id === selectedProjectId);
      if (!currentProject) throw new Error("Project not found");
      const projectKeyName = `projectKey_${currentProject.name}`;
      const projectAesKey = await secureGetItem(projectKeyName);
      if (!projectAesKey) throw new Error("Project encryption key not found");
      const encryptedData = await encryptAccountData(note.data, projectAesKey);
      const payload = { title: note.title, data: encryptedData, tags: note.tags || [] };
      const response = await axiosInstance.put(`/${selectedWorkspaceId}/${selectedProjectId}/notes/${doc_id}`, payload);
      if (response.status === 200) {
        fetchNotes();
        toast({ title: translate("success", "actions"), description: translate("note_updated", "notes") });
      } else {
        toast({ title: translate("error", "actions"), description: translate("error_updating_note", "notes"), variant: "destructive" });
      }
    } catch (error) {
      toast({ title: translate("error", "actions"), description: translate("error_updating_note", "notes"), variant: "destructive" });
    }
  }, [selectedWorkspaceId, selectedProjectId, workspaces, translate, fetchNotes]);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const setSelectedTag = useCallback((tag: string) => {
    setSelectedTagState(tag);
  }, []);

  const setItemsPerPage = useCallback((items: number) => {
    setItemsPerPageState(items);
  }, []);

  const setSortConfig = useCallback((config: SortConfig | null) => {
    setSortConfigState(config);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSelectedTagState("all");
    setSortConfigState(null);
  }, []);

  return {
    notesToDisplay,
    filteredNotes,
    allRawNotes,
    isLoading,
    totalCount: filteredNotes.length,
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
    handleDeleteNote,
    fetchNotes,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
    handleAddNote,
    handleEditNote,
  };
} 