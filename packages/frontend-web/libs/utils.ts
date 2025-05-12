import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generic tag filtering utility for all components that have tags
 * @param items Array of items to filter
 * @param selectedTag Tag to filter by (use 'all' to not filter by tag)
 * @returns Filtered array of items
 */
export function filterItemsByTag<T extends { tags?: string[] }>(
  items: T[],
  selectedTag: string
): T[] {
  if (!selectedTag || selectedTag === 'all') {
    return items;
  }

  return items.filter(item => 
    item.tags?.some(tag => 
      tag.toLowerCase() === selectedTag.toLowerCase()
    )
  );
}

/**
 * Type for sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Type for sort config
 */
export interface SortConfig {
  field: string;
  direction: SortDirection;
}

/**
 * Generic sorting utility for components
 * @param items Array of items to sort
 * @param sortConfig Configuration for sorting (field and direction)
 * @returns Sorted array of items
 */
export function sortItems<T extends Record<string, any>>(
  items: T[],
  sortConfig: SortConfig | null
): T[] {
  if (!sortConfig || !sortConfig.field) {
    return items;
  }

  return [...items].sort((a, b) => {
    // Handle if the field doesn't exist on either item
    if (!a[sortConfig.field] && !b[sortConfig.field]) return 0;
    if (!a[sortConfig.field]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (!b[sortConfig.field]) return sortConfig.direction === 'asc' ? 1 : -1;

    // Get values to compare
    const aValue = a[sortConfig.field];
    const bValue = b[sortConfig.field];

    // Check if values are dates
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortConfig.direction === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    // Try to parse as dates if they're strings in ISO format
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      // Check if they look like dates (e.g., 2023-01-01)
      if (/\d{4}-\d{2}-\d{2}/.test(aValue) && /\d{4}-\d{2}-\d{2}/.test(bValue)) {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        
        // Ensure both are valid dates
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return sortConfig.direction === 'asc'
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }
      }
    }

    // Default string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Default numerical comparison
    return sortConfig.direction === 'asc'
      ? (aValue > bValue ? 1 : -1)
      : (bValue > aValue ? 1 : -1);
  });
}
