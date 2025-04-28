"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Key, Plus, Search, Copy, Check, Eye, EyeOff, ExternalLink, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Star, AlertTriangle
} from "lucide-react";
import { AddAccountDialog } from "@/components/add-account-dialog";
import { GeneratePasswordDialog } from "@/components/generate-password-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { EditAccountDialog } from "@/components/edit-account-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslator } from "@/hooks/use-translations";
import { useRouter } from "next/navigation";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { decrypt, hexToCryptoKey, ENCRYPTION_KEY } from "../libs/crypto";

interface Account {
  doc_id: string;
  name: string;
  lower_name: string;
  user_name?: string;
  password?: string;
  data?: string | { user_name: string; password: string };
  website?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
  decrypted?: boolean;
  decryptionError?: boolean;
}

export function AccountsContent() {
  const { translate } = useTranslator();
  const router = useRouter();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showGeneratePassword, setShowGeneratePassword] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [viewPassword, setViewPassword] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const currentLocale = useSelector((state: RootState) => state.user.userData?.locale || "en");

  // Check if a string appears to be a hash (e.g., SHA-512)
  const isLikelyHash = (str: string): boolean => {
    return /^[0-9a-fA-F]{128}$/.test(str);
  };

  const decryptAccountData = useCallback(async (account: Account): Promise<Account> => {
    try {
      if (account.data && typeof account.data === "string") {
        try {
          const cryptoKey = await hexToCryptoKey(ENCRYPTION_KEY);
          const decryptedData = await decrypt(account.data, cryptoKey);

          // Check for legacy hash
          if (isLikelyHash(decryptedData)) {
            console.warn("Legacy hash detected:", {
              account_id: account.doc_id,
              hash_preview: decryptedData.slice(0, 20) + "...",
            });
            return {
              ...account,
              user_name: "Legacy data format",
              password: "Legacy data format",
              decrypted: false,
              decryptionError: true,
            };
          }

          // Parse as JSON
          try {
            const parsedData = JSON.parse(decryptedData);
            if (parsedData.user_name && parsedData.password) {
              return {
                ...account,
                user_name: parsedData.user_name,
                password: parsedData.password,
                decrypted: true,
              };
            }
            console.warn("Decrypted data missing user_name or password:", {
              account_id: account.doc_id,
              parsedData,
            });
            return {
              ...account,
              user_name: "Data incomplete",
              password: "Data incomplete",
              decrypted: false,
              decryptionError: true,
            };
          } catch (jsonError) {
            console.warn("Failed to parse decrypted data as JSON:", {
              error: jsonError instanceof Error ? jsonError.message : String(jsonError),
              account_id: account.doc_id,
              decrypted_preview: decryptedData.slice(0, 20) + "...",
            });
            return {
              ...account,
              user_name: "Invalid data format",
              password: "Invalid data format",
              decrypted: false,
              decryptionError: true,
            };
          }
        } catch (decryptError) {
          console.error("Failed to decrypt data:", {
            error: decryptError instanceof Error ? decryptError.message : String(decryptError),
            account_id: account.doc_id,
          });
          return {
            ...account,
            user_name: "Decryption failed",
            password: "Decryption failed",
            decrypted: false,
            decryptionError: true,
          };
        }
      }

      // Handle data as object (unlikely based on backend)
      if (account.data && typeof account.data === "object") {
        return {
          ...account,
          user_name: account.data.user_name || "Data unavailable",
          password: account.data.password || "Data unavailable",
          decrypted: true,
        };
      }

      // Default case
      return {
        ...account,
        user_name: "Data unavailable",
        password: "Data unavailable",
        decrypted: false,
        decryptionError: true,
      };
    } catch (error: unknown) {
      console.error("Failed to process account data:", {
        error: error instanceof Error ? error.message : String(error),
        account_id: account.doc_id,
      });
      return {
        ...account,
        user_name: "Error processing data",
        password: "Error processing data",
        decrypted: false,
        decryptionError: true,
      };
    }
  }, []);

  // Convert category to tag format for API - Fix for tag filtering
  const getCategoryTag = useCallback((category: string): string => {
    switch (category.toLowerCase()) {
      case 'personal':
        return 'personal';
      case 'work':
        return 'work';
      case 'finance':
        return 'finance';
      case 'favorite':
        return 'favorite';
      default:
        return category.toLowerCase();
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for fetching accounts:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Prepare tags array with proper case handling
      let tagsArray: string[] = [];
      if (selectedCategory !== "all") {
        // Try both lowercase and original case to handle potential case sensitivity in the backend
        const categoryTag = getCategoryTag(selectedCategory);
        tagsArray = [categoryTag];
      }

      const payload = {
        page: currentPage,
        limit: itemsPerPage,
        name: searchQuery.trim() || null,
        tags: tagsArray,
      };

      console.log("Fetching accounts with payload:", payload);

      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/accounts/list`,
        payload
      );

      const { data: fetchedAccounts = [], count = 0, total_count = 0 } = response.data || {};

      console.log(`Fetched ${fetchedAccounts?.length || 0} accounts, count: ${count}, total_count: ${total_count}`);

      // Decrypt accounts
      const decryptedAccounts = await Promise.all(
        (fetchedAccounts || []).map(decryptAccountData)
      );

      setAllAccounts(decryptedAccounts || []);
      // Use total_count if available, otherwise estimate
      setTotalCount(total_count || (count < itemsPerPage ? (currentPage - 1) * itemsPerPage + count : (currentPage * itemsPerPage) + 1));

      // If filtering by tag returned no results, try fetching all and filtering client-side
      if (selectedCategory !== "all" && count === 0 && currentPage === 1) {
        console.warn(`No accounts found for tag: ${selectedCategory}. Attempting client-side filtering...`);
        
        // Fetch all accounts without tag filter
        const fallbackPayload = {
          page: 1,
          limit: 50, // Fetch more to increase chances of finding matches
          name: searchQuery.trim() || null,
          tags: [],
        };
        
        const fallbackResponse = await axiosInstance.post(
          `/${selectedWorkspaceId}/${selectedProjectId}/accounts/list`,
          fallbackPayload
        );
        
        const { data: allFetchedAccounts = [] } = fallbackResponse.data || {};
        
        if (allFetchedAccounts.length > 0) {
          // Filter client-side for the selected category
          const categoryTag = getCategoryTag(selectedCategory);
          const matchingAccounts = allFetchedAccounts.filter((acc: Account) => 
            acc.tags?.some((tag: string) => 
              tag.toLowerCase() === categoryTag.toLowerCase()
            )
          );
          
          if (matchingAccounts.length > 0) {
            console.log(`Found ${matchingAccounts.length} accounts with tag "${selectedCategory}" via client-side filtering`);
            const clientDecryptedAccounts = await Promise.all(
              matchingAccounts.map(decryptAccountData)
            );
            setAllAccounts(clientDecryptedAccounts);
            setTotalCount(clientDecryptedAccounts.length);
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      let errorMessage = translate("error_fetching_accounts", "accounts");
      if (error.response?.data?.message) {
        errorMessage = `${errorMessage}: ${error.response.data.message}`;
      }
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, currentPage, itemsPerPage, searchQuery, selectedCategory, decryptAccountData, getCategoryTag, ]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Shortcuts for adding accounts
  useEffect(() => {
    const handleAddAccount = () => setShowAddAccount(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "+") {
        e.preventDefault();
        setShowAddAccount(true);
      }
    };
    document.addEventListener("toggle-add-account", handleAddAccount);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("toggle-add-account", handleAddAccount);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const copyToClipboard = useCallback(async (doc_id: string, field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField({ doc_id, field });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const togglePasswordVisibility = useCallback((doc_id: string) => {
    setViewPassword(prev => (prev === doc_id ? null : doc_id));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDeleteAccount = useCallback(
    async (doc_id: string) => {
      if (!selectedWorkspaceId || !selectedProjectId) {
        console.error("Missing required data for deleting account:", {
          selectedWorkspaceId,
          selectedProjectId,
        });
        return;
      }

      if (!confirm(translate("confirm_delete_account", "accounts"))) {
        return;
      }

      try {
        await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/accounts/${doc_id}`);
        fetchAccounts();
        alert(translate("account_deleted_successfully", "accounts"));
      } catch (error: any) {
        console.error("Error deleting account:", error);
        let errorMessage = translate("error_deleting_account", "accounts");
        if (error.response?.data?.message) {
          errorMessage = `${errorMessage}: ${error.response.data.message}`;
        }
        alert(errorMessage);
      }
    },
    [selectedWorkspaceId, selectedProjectId, translate, fetchAccounts]
  );

  const handleAccountUpdated = useCallback(() => {
    setShowEditAccount(false);
    setSelectedAccount(null);
    fetchAccounts();
    alert(translate("account_updated_successfully", "accounts"));
  }, [fetchAccounts, translate]);

  // Debounced search input
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSearchQuery(value);
        setCurrentPage(1);
      }, 300);
    };
  }, []);

  // Pagination range with dots for large page counts
  const getPaginationRange = useCallback(() => {
    const maxPagesToShow = 5;
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const half = Math.floor(maxPagesToShow / 2);
      let start = Math.max(1, currentPage - half);
      let end = Math.min(totalPages, start + maxPagesToShow - 1);

      if (end - start < maxPagesToShow - 1) {
        start = end - maxPagesToShow + 1;
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

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">{translate("loading_accounts", "accounts")}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{translate("accounts", "accounts")}</h1>
        <p className="text-muted-foreground">{translate("manage_your_saved_accounts_and_passwords", "accounts")}</p>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-1 gap-4 w-full md:w-auto">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={translate("search", "accounts")}
              className="pl-8 w-full"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="favorite">Favorites</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || selectedCategory !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setShowGeneratePassword(true)}
          >
            <Key className="h-4 w-4" />
            {translate("generate_password", "accounts")}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowAddAccount(true)}>
            <Plus className="h-4 w-4" />
            {translate("add_account", "accounts")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-sm">{translate("account", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("username", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("password", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("tags", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("last_modified", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("actions", "accounts")}</th>
              </tr>
            </thead>
            <tbody>
              {allAccounts.length > 0 ? (
                allAccounts.map((account) => (
                  <tr key={account.doc_id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium">
                          {account.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{account.name}</p>
                          {account.website && (
                            <a
                              href={account.website.startsWith("http") ? account.website : `https://${account.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              {account.website.replace(/^https?:\/\//, "")}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {account.decryptionError && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Decryption error - please edit to update format</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <span className="text-sm">{account.user_name}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => account.user_name && account.user_name !== "Data unavailable" && account.user_name !== "Legacy data format" && copyToClipboard(account.doc_id, "user_name", account.user_name)}
                                disabled={!account.user_name || account.user_name === "Data unavailable" || account.user_name === "Legacy data format"}
                              >
                                {copiedField?.doc_id === account.doc_id && copiedField?.field === "user_name" ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {copiedField?.doc_id === account.doc_id && copiedField?.field === "user_name" ? "Copied!" : "Copy username"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">
                          {account.password && account.password !== "Data unavailable" && account.password !== "Legacy data format" && viewPassword === account.doc_id
                            ? account.password
                            : account.password && account.password !== "Data unavailable" && account.password !== "Legacy data format"
                            ? "••••••••"
                            : account.password}
                        </span>
                        <div className="flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => account.password && account.password !== "Data unavailable" && account.password !== "Legacy data format" && togglePasswordVisibility(account.doc_id)}
                                  disabled={!account.password || account.password === "Data unavailable" || account.password === "Legacy data format"}
                                >
                                  {viewPassword === account.doc_id ? (
                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{viewPassword === account.doc_id ? "Hide password" : "Show password"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => account.password && account.password !== "Data unavailable" && account.password !== "Legacy data format" && copyToClipboard(account.doc_id, "password", account.password)}
                                  disabled={!account.password || account.password === "Data unavailable" || account.password === "Legacy data format"}
                                >
                                  {copiedField?.doc_id === account.doc_id && copiedField?.field === "password" ? (
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {copiedField?.doc_id === account.doc_id && copiedField?.field === "password" ? "Copied!" : "Copy password"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {account.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {account.tags?.some(tag => tag.toLowerCase() === 'favorite') && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-amber-100 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
                          >
                            <Star className="h-3 w-3 text-amber-500 mr-1" />
                            Favorite
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(account.updated_at).toLocaleDateString(currentLocale)}
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAccount({ ...account });
                              setShowEditAccount(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => handleDeleteAccount(account.doc_id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-10 w-10 text-muted-foreground/50" />
                      <h3 className="font-medium">No accounts found</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedCategory !== "all"
                          ? `No accounts found with tag "${selectedCategory}". Try a different tag or clear filters.`
                          : searchQuery
                          ? `No accounts match the search "${searchQuery}". Try adjusting your search.`
                          : "Try adjusting your search or filter criteria."}
                      </p>
                      <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                        Clear filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              {translate("showing", "accounts")} {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-
              {Math.min(currentPage * itemsPerPage, totalCount)} {translate("of", "accounts")} {totalCount}{" "}
              {translate("accounts", "accounts")}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 mr-4">
                <span className="text-sm text-muted-foreground">{translate("rows_per_page", "accounts")}</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={itemsPerPage.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {getPaginationRange().map((pageNum, index) => (
                  <Button
                    key={`${pageNum}-${index}`}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => typeof pageNum === "number" && handlePageChange(pageNum)}
                    disabled={pageNum === "..." || currentPage === pageNum}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || allAccounts.length < itemsPerPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages || allAccounts.length < itemsPerPage}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {showAddAccount && <AddAccountDialog onClose={() => setShowAddAccount(false)} onAccountAdded={fetchAccounts} />}
      {showGeneratePassword && <GeneratePasswordDialog onClose={() => setShowGeneratePassword(false)} />}
      {showEditAccount && selectedAccount && (
        <EditAccountDialog
          account={selectedAccount}
          onClose={() => {
            setShowEditAccount(false);
            setSelectedAccount(null);
          }}
          onAccountUpdated={handleAccountUpdated}
        />
      )}
    </div>
  );
}