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

/**
 * Search items across multiple fields
 * @param items Array of items to search
 * @param searchQuery Search query string
 * @param searchFields Array of fields to search in
 * @returns Filtered array of items that match the search query
 */
export function searchItemsMultiField<T extends Record<string, any>>(
  items: T[],
  searchQuery: string,
  searchFields: string[]
): T[] {
  if (!searchQuery || searchQuery.trim() === '') {
    return items;
  }

  const query = searchQuery.trim().toLowerCase();
  
  return items.filter(item => {
    return searchFields.some(field => {
      // Handle nested fields with dot notation (e.g., 'user.name')
      const fieldValue = field.includes('.')
        ? getNestedValue(item, field)
        : item[field];
        
      // Handle arrays (like tags)
      if (Array.isArray(fieldValue)) {
        return fieldValue.some(value => 
          String(value).toLowerCase().includes(query)
        );
      }
      
      // Handle strings and numbers
      return fieldValue !== undefined && fieldValue !== null &&
        String(fieldValue).toLowerCase().includes(query);
    });
  });
}

/**
 * Helper function to get nested object values using dot notation
 * @param obj Object to extract value from
 * @param path Path to the value using dot notation (e.g., 'user.address.city')
 * @returns The value at the specified path or undefined if not found
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => 
    current && current[key] !== undefined ? current[key] : undefined, obj
  );
}

/**
 * Centralized logout function to be used across the application
 * Handles all logout-related tasks: clearing cookies, Redux state, storage, and auth
 * 
 * @param options Configuration options for logout
 * @param options.user Stack user object for signOut
 * @param options.dispatch Redux dispatch function
 * @param options.router Next.js router for redirection
 * @param options.clearUserData Redux action to clear user data
 * @param options.resetWorkspaceState Redux action to reset workspace state
 * @param options.locale Current locale for redirecting to login page
 * @param options.onComplete Optional callback to run after logout is completed
 * @returns Promise that resolves when logout is complete
 */
export async function logout({
  user,
  dispatch,
  router,
  clearUserData,
  resetWorkspaceState,
  locale = 'en',
  onComplete,
}: {
  user: any;
  dispatch: Function;
  router: any;
  clearUserData: Function;
  resetWorkspaceState?: Function;
  locale?: string;
  onComplete?: () => void;
}): Promise<void> {
  try {
    // 1. Clear access token cookie
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
    
    // 2. Clear Redux state
    dispatch(clearUserData());
    if (resetWorkspaceState) {
      dispatch(resetWorkspaceState());
    }
    
    // 3. Completely clear session storage
    sessionStorage.clear();
    
    // 4. Completely clear local storage
    localStorage.clear();
    
    // 5. Sign out from Stack auth
    if (user && typeof user.signOut === 'function') {
      await user.signOut();
    }
    
    // 6. Redirect to login page
    router.replace(`/${locale}/login`);
    
    // 7. Execute completion callback if provided
    if (onComplete && typeof onComplete === 'function') {
      onComplete();
    }
    
  } catch (error) {
    console.error("Logout error:", error);
    // Still try to redirect even if there's an error
    router.replace(`/${locale}/login`);
  }
}
