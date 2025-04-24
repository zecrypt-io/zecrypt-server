"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Key, Plus, Search, Copy, Check, Eye, EyeOff, ExternalLink, MoreHorizontal,
  ChevronLeft, ChevronRight, X, Star
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

// Define Account interface locally
interface Account {
  doc_id: string;
  name: string;
  lower_name: string;
  user_name: string;
  password: string;
  website?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
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
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const currentLocale = useSelector((state: RootState) => state.user.userData?.locale || "en");

  const fetchAccounts = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId || !accessToken) {
      console.error("Missing required data for fetching accounts:", {
        selectedWorkspaceId,
        selectedProjectId,
        accessToken,
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${selectedWorkspaceId}/${selectedProjectId}/accounts`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "access-token": accessToken,
          },
          credentials: "include",
        }
      );
      const result = await response.json();
      if (response.ok) {
        const fetchedAccounts = result.data || [];
        const count = result.count || fetchedAccounts.length;
        setAllAccounts(fetchedAccounts);
        setTotalCount(count);
      } else {
        console.error("Failed to fetch accounts:", result.message);
        alert(translate("failed_to_load_accounts", "accounts"));
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      alert(translate("error_fetching_accounts", "accounts"));
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, accessToken,]);

  useEffect(() => {
    // Clear accounts and fetch new data on mount
    setAllAccounts([]);
    setTotalCount(0);
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    // Redirect to login if user data is missing
    if (!accessToken) {
      console.warn("No access token found, redirecting to login");
      router.push(`/${currentLocale}/login`);
    }
  }, [accessToken, router, currentLocale]);

  useEffect(() => {
    const handleAddAccount = () => setShowAddAccount(true);
    document.addEventListener("toggle-add-account", handleAddAccount);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "+") {
        e.preventDefault();
        setShowAddAccount(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("toggle-add-account", handleAddAccount);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredAccounts = useMemo(() => {
    return allAccounts.filter((account) => {
      const matchesSearch = searchQuery === "" ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.user_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "personal" && account.tags?.includes("Personal")) ||
        (selectedCategory === "work" && account.tags?.includes("Work")) ||
        (selectedCategory === "finance" && account.tags?.includes("Finance"));
      return matchesSearch && matchesCategory;
    });
  }, [allAccounts, searchQuery, selectedCategory]);

  const totalFilteredCount = filteredAccounts.length;
  const totalPages = Math.ceil(totalFilteredCount / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem);

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
    setViewPassword(prevState => prevState === doc_id ? null : doc_id);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDeleteAccount = useCallback(async (doc_id: string) => {
    if (!selectedWorkspaceId || !selectedProjectId || !accessToken) {
      console.error("Missing required data for deleting account:", {
        selectedWorkspaceId,
        selectedProjectId,
        accessToken,
      });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${selectedWorkspaceId}/${selectedProjectId}/accounts/${doc_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "access-token": accessToken,
          },
          credentials: "include",
        }
      );
      const result = await response.json();
      if (response.ok) {
        setAllAccounts(prev => prev.filter(account => account.doc_id !== doc_id));
        setTotalCount(prev => prev - 1);
        alert(translate("account_deleted_successfully", "accounts"));
      } else {
        console.error("Failed to delete account:", result.message);
        alert(translate("failed_to_delete_account", "accounts"));
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(translate("error_deleting_account", "accounts"));
    }
  }, [selectedWorkspaceId, selectedProjectId, accessToken, translate]);

  const handleAccountUpdated = useCallback(() => {
    setShowEditAccount(false);
    setSelectedAccount(null);
    fetchAccounts();
    alert(translate("account_updated_successfully", "accounts"));
  }, [fetchAccounts, translate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
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
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 theme-button"
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
              {currentItems.length > 0 ? (
                currentItems.map((account) => (
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
                              href={account.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              {account.website.replace("https://", "")}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{account.user_name}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => copyToClipboard(account.doc_id, "user_name", account.user_name)}
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
                                {copiedField?.doc_id === account.doc_id && copiedField?.field === "user_name"
                                  ? "Copied!"
                                  : "Copy username"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">
                          {viewPassword === account.doc_id ? account.password : "••••••••"}
                        </span>
                        <div className="flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => togglePasswordVisibility(account.doc_id)}
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
                                  onClick={() => copyToClipboard(account.doc_id, "password", account.password)}
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
                                  {copiedField?.doc_id === account.doc_id && copiedField?.field === "password"
                                    ? "Copied!"
                                    : "Copy password"}
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
                        {account.tags?.includes("Favorite") && (
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
                      {new Date(account.updated_at).toLocaleDateString()}
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
                              setSelectedAccount(account);
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
                    {filteredAccounts.length === 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-10 w-10 text-muted-foreground/50" />
                        <h3 className="font-medium">No accounts found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                          Clear filters
                        </Button>
                      </div>
                    ) : (
                      "No accounts found. Create one to get started."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalFilteredCount > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              {translate("showing", "accounts")} {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, totalFilteredCount)} {translate("of", "accounts")} {totalFilteredCount}{" "}
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
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                    if (pageNum > totalPages) {
                      pageNum = totalPages - (4 - i);
                    }
                  }
                  return (
                    <Button
                      key={i}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={currentPage === pageNum}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
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