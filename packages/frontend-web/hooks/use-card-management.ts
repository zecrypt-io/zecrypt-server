import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/Redux/store';
import axiosInstance from '@/libs/Middleware/axiosInstace';
import { toast } from '@/components/ui/use-toast';
import { useTranslator } from '@/hooks/use-translations';
import { useClientPagination } from '@/hooks/use-client-pagination';
import { filterItemsByTag, sortItems, SortConfig, searchItemsMultiField } from '@/libs/utils';

// Raw data structure from API GET /cards
interface CardFromAPI {
  doc_id: string;
  title: string;
  lower_name: string; // Typically for server-side search optimization
  data: string; // JSON string: e.g., {"card_holder_name": "encrypted", "number": "encrypted", ...}
  brand: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
}

// Processed card structure for the component
interface Card {
  doc_id: string;
  title: string;
  lower_name: string;
  card_holder_name: string; // Extracted from data
  number: string; // Extracted from data
  expiry_month: string; // Extracted from data
  expiry_year: string; // Extracted from data
  cvv: string; // Extracted from data
  brand: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
}

interface UseCardManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  initialItemsPerPage?: number;
}

interface UseCardManagementReturn {
  cardsToDisplay: Card[];
  allRawCards: CardFromAPI[]; // Store raw response
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
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  uniqueTags: string[];
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  handleDeleteCard: (doc_id: string) => Promise<void>;
  fetchCards: () => Promise<void>;
  clearFilters: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function useCardManagement({
  selectedWorkspaceId,
  selectedProjectId,
  initialItemsPerPage = 5,
}: UseCardManagementProps): UseCardManagementReturn {
  const { translate } = useTranslator();
  const [allRawCards, setAllRawCards] = useState<CardFromAPI[]>([]);
  const [processedCards, setProcessedCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedBrand, setSelectedBrandState] = useState("all");
  const [selectedTag, setSelectedTagState] = useState("all");
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(null);

  const processCardData = useCallback(async (cardRaw: CardFromAPI): Promise<Card> => {
    let cardHolderName = '';
    let cardNumber = '';
    let expiryMonth = '';
    let expiryYear = '';
    let cvv = '';
    
    try {
      if (cardRaw.data) {
        const parsedData = JSON.parse(cardRaw.data);
        if (parsedData) {
          cardHolderName = parsedData.card_holder_name || '';
          cardNumber = parsedData.number || '';
          expiryMonth = parsedData.expiry_month || '';
          expiryYear = parsedData.expiry_year || '';
          cvv = parsedData.cvv || '';
        }
      }
    } catch (error) {
      console.error("Failed to parse card data field in hook:", {
        error: error instanceof Error ? error.message : String(error),
        card_id: cardRaw.doc_id,
        rawData: cardRaw.data,
      });
    }

    return {
      // Spread minimal necessary fields from cardRaw, then override/set specific ones
      doc_id: cardRaw.doc_id,
      title: cardRaw.title,
      lower_name: cardRaw.lower_name,
      created_at: cardRaw.created_at,
      updated_at: cardRaw.updated_at,
      created_by: cardRaw.created_by,
      project_id: cardRaw.project_id,
      brand: cardRaw.brand,
      notes: cardRaw.notes,
      tags: cardRaw.tags,
      // Processed fields
      card_holder_name: cardHolderName,
      number: cardNumber,
      expiry_month: expiryMonth,
      expiry_year: expiryYear,
      cvv: cvv,
    };
  }, []);

  const fetchCards = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setAllRawCards([]);
      setProcessedCards([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Fetch all cards without filtering on server for multi-field search
      const response = await axiosInstance.get(
        `/${selectedWorkspaceId}/${selectedProjectId}/cards`
      );

      if (response.status === 200) {
        const { data: fetchedCards = [] }: { data: CardFromAPI[] } = response.data || {};
        setAllRawCards(fetchedCards);
        let processed = await Promise.all(fetchedCards.map(processCardData));
        
        // Apply multi-field search if there's a search query
        if (searchQuery.trim()) {
          processed = searchItemsMultiField(processed, searchQuery, [
            'title',         // card name
            'card_holder_name',
            'number',
            'brand',
            'tags'
          ]);
        }
        
        // Apply tag filtering using our utility function
        let filteredCards = filterItemsByTag(processed, selectedTag);
        
        // Then apply brand filtering if needed
        if (selectedBrand !== "all") {
          filteredCards = filteredCards.filter(card => 
            card.brand.toLowerCase() === selectedBrand.toLowerCase()
          );
        }
        
        // Apply sorting if a sort config is set
        const sortedCards = sortItems(filteredCards, sortConfig);
          
        setProcessedCards(sortedCards);
      } else {
        console.error("Error in cards response (hook):", response);
        setAllRawCards([]);
        setProcessedCards([]);
        toast({ title: translate("error", "actions"), description: translate("error_fetching_cards", "cards", { default: "Error fetching cards" }), variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching cards (hook):", error);
      setAllRawCards([]);
      setProcessedCards([]);
      toast({ title: translate("error", "actions"), description: translate("error_fetching_cards", "cards", { default: "Error fetching cards" }), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId, selectedProjectId, searchQuery, selectedBrand, selectedTag, sortConfig, processCardData]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const { 
    paginatedData: cardsToDisplay,
    totalPages,
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    goToPage,
    getPaginationRange 
  } = useClientPagination<Card>({
    data: processedCards, // Use processed cards for pagination
    itemsPerPage,
  });

  const handleDeleteCard = useCallback(async (doc_id: string) => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({ title: translate("error", "actions"), description: translate("missing_auth_or_selection", "cards", { default: "Missing authentication or selection" }), variant: "destructive" });
      return;
    }
    try {
      await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/cards/${doc_id}`);
      toast({ title: translate("success", "actions"), description: translate("card_deleted_successfully", "cards", { default: "Card deleted successfully" }) });
      fetchCards(); // Re-fetch to update the list
    } catch (error: any) {
      let errorMessage = translate("error_deleting_card", "cards", { default: "Error deleting card" });
      if (error.response?.data?.message) {
        errorMessage = `${errorMessage}: ${error.response.data.message}`;
      }
      toast({ title: translate("error", "actions"), description: errorMessage, variant: "destructive" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId, selectedProjectId, fetchCards]);

  const clearFilters = useCallback(() => {
    setSearchQueryState("");
    setSelectedBrandState("all");
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

  const setSelectedBrand = useCallback((brand: string) => {
    setSelectedBrandState(brand);
    setCurrentPage(1);
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

  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    processedCards.forEach(card => {
      if (card.tags && Array.isArray(card.tags)) {
        card.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [processedCards]);

  return {
    cardsToDisplay,
    allRawCards,
    isLoading,
    totalCount: processedCards.length,
    currentPage,
    setCurrentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    selectedBrand,
    setSelectedBrand,
    selectedTag,
    setSelectedTag,
    uniqueTags,
    sortConfig,
    setSortConfig,
    handleDeleteCard,
    fetchCards,
    clearFilters,
    nextPage,
    prevPage,
    goToPage
  };
} 