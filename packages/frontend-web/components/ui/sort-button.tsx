import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ArrowDownAZ, ArrowDownZA, ArrowDownUp, Clock, CalendarClock, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from "lucide-react";
import { useTranslator } from "@/hooks/use-translations";
import { SortConfig } from '@/libs/utils';

export interface SortOption {
  label: string;
  field: string;
  icon?: React.ReactNode;
}

interface SortButtonProps {
  sortConfig: SortConfig | null;
  onSortChange: (config: SortConfig | null) => void;
  options?: SortOption[];
  namespace?: string;
}

// Simpler inline sort button for table headers
interface InlineSortButtonProps {
  field: string;
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  label?: string;
}

export function SortButton({ 
  sortConfig, 
  onSortChange, 
  options = [], 
  namespace = 'common' 
}: SortButtonProps) {
  const { translate } = useTranslator();

  // Default sort options if none provided
  const defaultOptions: SortOption[] = [
    { 
      label: translate("sort_by_name", namespace, { default: "Sort by Name" }), 
      field: "title", 
      icon: <ArrowDownAZ className="mr-2 h-4 w-4" /> 
    },
    { 
      label: translate("sort_by_created", namespace, { default: "Sort by Created Date" }), 
      field: "created_at", 
      icon: <Clock className="mr-2 h-4 w-4" /> 
    },
    { 
      label: translate("sort_by_updated", namespace, { default: "Sort by Updated Date" }), 
      field: "updated_at", 
      icon: <CalendarClock className="mr-2 h-4 w-4" /> 
    }
  ];

  const sortOptions = options.length > 0 ? options : defaultOptions;

  const getButtonIcon = () => {
    if (!sortConfig) return <ArrowDownUp className="h-4 w-4 mr-2" />;
    
    if (sortConfig.direction === 'asc') {
      return <ArrowDownAZ className="h-4 w-4 mr-2" />;
    } else {
      return <ArrowDownZA className="h-4 w-4 mr-2" />;
    }
  };

  const toggleSort = (field: string) => {
    if (!sortConfig || sortConfig.field !== field) {
      // If no current sort or different field, set to ascending
      onSortChange({ field, direction: 'asc' });
    } else if (sortConfig.field === field && sortConfig.direction === 'asc') {
      // If same field and ascending, switch to descending
      onSortChange({ field, direction: 'desc' });
    } else {
      // If same field and descending, clear sort
      onSortChange(null);
    }
  };

  const getSortLabel = () => {
    if (!sortConfig) return translate("sort", namespace, { default: "Sort" });
    
    const option = sortOptions.find(opt => opt.field === sortConfig.field);
    if (!option) return translate("sort", namespace, { default: "Sort" });
    
    const directionText = sortConfig.direction === 'asc' 
      ? translate("ascending", namespace, { default: "Ascending" })
      : translate("descending", namespace, { default: "Descending" });
    
    // Return shorter label for more compact display
    return translate("sort", namespace, { default: "Sort" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center h-9 px-3">
          {getButtonIcon()}
          <span>{getSortLabel()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {translate("sort_options", namespace, { default: "Sort Options" })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {sortOptions.map((option) => (
            <DropdownMenuItem 
              key={option.field}
              onClick={() => toggleSort(option.field)}
              className="flex items-center cursor-pointer"
            >
              {option.icon}
              <span>{option.label}</span>
              {sortConfig && sortConfig.field === option.field && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {sortConfig.direction === 'asc' 
                    ? translate("ascending", namespace, { default: "Ascending" })
                    : translate("descending", namespace, { default: "Descending" })}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {sortConfig && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onSortChange(null)}
              className="flex items-center cursor-pointer text-red-500"
            >
              {translate("clear_sort", namespace, { default: "Clear Sort" })}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Inline sort button for table headers
export function SortButton2({ field, sortConfig, setSortConfig, label }: InlineSortButtonProps) {
  const toggleSort = () => {
    if (!sortConfig || sortConfig.field !== field) {
      setSortConfig({ field, direction: 'asc' });
    } else if (sortConfig.field === field && sortConfig.direction === 'asc') {
      setSortConfig({ field, direction: 'desc' });
    } else {
      setSortConfig(null);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 px-1 ml-1" 
      onClick={toggleSort}
      title={label}
    >
      {sortConfig?.field === field ? (
        sortConfig.direction === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      ) : (
        <ArrowDownUp className="h-4 w-4 opacity-50" />
      )}
    </Button>
  );
} 