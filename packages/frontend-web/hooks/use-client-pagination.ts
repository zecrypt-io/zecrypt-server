import { useState, useMemo, useCallback } from 'react';

interface UseClientPaginationProps<T> {
  data: T[];
  itemsPerPage: number;
  initialPage?: number;
}

interface UseClientPaginationReturn<T> {
  paginatedData: T[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  getPaginationRange: () => (number | string)[];
}

export function useClientPagination<T>({
  data,
  itemsPerPage,
  initialPage = 1,
}: UseClientPaginationProps<T>): UseClientPaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const nextPage = useCallback(() => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  }, []);

  const goToPage = useCallback((page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  const getPaginationRange = useCallback(() => {
    const maxPagesToShow = 5;
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let end = Math.min(totalPages, start + maxPagesToShow - 1);

      if (end - start + 1 < maxPagesToShow) {
        if (currentPage < totalPages / 2) {
          end = Math.min(totalPages, start + maxPagesToShow -1);
        } else {
          start = Math.max(1, end - maxPagesToShow + 1);
        }
      }
      
      if (start > 1) {
        pageNumbers.push(1);
        if (start > 2) pageNumbers.push("...");
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  }, [currentPage, totalPages]);

  return {
    paginatedData,
    totalPages,
    currentPage,
    setCurrentPage: goToPage, // Alias goToPage as setCurrentPage for external use
    nextPage,
    prevPage,
    goToPage,
    getPaginationRange,
  };
} 