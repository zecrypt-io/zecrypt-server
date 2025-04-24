"use client";

import { useState, useEffect, useCallback } from "react";
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
import axiosInstance from "../libs/Middleware/axiosInstace";

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
  const [sort, setSort] = useState<[string, number]>(["_id", 1]);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const currentLocale = useSelector((state: RootState) => state.user.userData?.locale || "en");

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

      // Construct payload matching GetAccountsList schema
      const payload = {
        page: currentPage,
        limit: itemsPerPage,
        name: searchQuery.trim() || null,
        tags: selectedCategory !== "all" ? [selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)] : [],
        sort: sort,
      };

      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/accounts/list`,
        payload
      );

      // Log the response for debugging
      console.log("Fetch accounts response:", response.data);

      // Parse response based on backend's response_helper structure
      const { data: fetchedAccounts, count } = response.data;

      setAllAccounts(fetchedAccounts || []);
      setTotalCount(count || fetchedAccounts?.length || 0);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        alert(`${translate("error_fetching_accounts", "accounts")}: ${error.response.data?.message || error.message}`);
      } else {
        alert(translate("error_fetching_accounts", "accounts"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, currentPage, itemsPerPage, searchQuery, selectedCategory, sort, ]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
    setViewPassword(prevState => (prevState === doc_id ? null : doc_id));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setCurrentPage(1);
    setSort(["_id", 1]);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSortChange = useCallback((field: string) => {
    setSort(prev => {
      if (prev[0] === field) {
        return [field, prev[1] === 1 ? -1 : 1];
      }
      return [field, 1];
    });
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

      try {
        await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/accounts/${doc_id}`);
        fetchAccounts(); // Refetch accounts after deletion
        alert(translate("account_deleted_successfully", "accounts"));
      } catch (error: any) {
        console.error("Error deleting account:", error);
        if (error.response) {
          alert(`${translate("error_deleting_account", "accounts")}: ${error.response.data?.message || error.message}`);
        } else {
          alert(translate("error_deleting_account", "accounts"));
        }
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sort]);

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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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

            {(searchQuery || selectedCategory !== "all" || sort[0] !== "_id") && (
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
                <th className="text-left p-3 font-medium text-sm">
                  <button className="flex items-center" onClick={() => handleSortChange("name")}>
                    {translate("account", "accounts")}
                    {sort[0] === "name" && <span className="ml-1">{sort[1] === 1 ? "↑" : "↓"}</span>}
                  </button>
                </th>
                <th className="text-left p-3 font-medium text-sm">{translate("username", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("password", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("tags", "accounts")}</th>
                <th className="text-left p-3 font-medium text-sm">
                  <button className="flex items-center" onClick={() => handleSortChange("updated_at")}>
                    {translate("last_modified", "accounts")}
                    {sort[0] === "updated_at" && <span className="ml-1">{sort[1] === 1 ? "↑" : "↓"}</span>}
                  </button>
                </th>
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
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-10 w-10 text-muted-foreground/50" />
                      <h3 className="font-medium">No accounts found</h3>
                      <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
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
              {translate("showing", "accounts")} {(currentPage - 1) * itemsPerPage + 1}-
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