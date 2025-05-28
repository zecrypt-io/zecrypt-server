import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/libs/utils";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: { key: string; labelKey: string; path: string; icon: React.ReactNode }[];
  locale: string;
  onSelectModule: (path: string) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  modules,
  locale,
  onSelectModule,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the input when the modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // Small delay to ensure modal is rendered
    } else {
      // Reset state when modal closes
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredModules = modules.filter((module) =>
    module.labelKey.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    // Adjust selected index if filtered list changes
    if (selectedIndex >= filteredModules.length) {
      setSelectedIndex(Math.max(0, filteredModules.length - 1));
    }
  }, [filteredModules, selectedIndex]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      setSelectedIndex((prevIndex) =>
        Math.min(prevIndex + 1, filteredModules.length - 1)
      );
    } else if (event.key === "ArrowUp") {
      setSelectedIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    } else if (event.key === "Enter") {
      if (filteredModules.length > 0) {
        onSelectModule(filteredModules[selectedIndex].path);
        onClose();
      }
    }
  };

  const handleSelect = (path: string) => {
    onSelectModule(path);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0">
        <div className="flex flex-col">
          <div className="relative p-4 border-b border-border">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search modules..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border-none focus:ring-0 focus-visible:ring-0"
              onKeyDown={handleKeyDown} // Add keydown handler to input
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {filteredModules.map((module, index) => (
              <div
                key={module.key}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer",
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
                onClick={() => handleSelect(module.path)}
              >
                {module.icon}
                <span>{module.labelKey}</span> {/* Using labelKey directly for now */}
              </div>
            ))}
            {filteredModules.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No modules found.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 