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
