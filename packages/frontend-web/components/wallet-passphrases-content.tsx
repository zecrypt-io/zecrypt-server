"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet, Plus, Search, Copy, Check, Eye, EyeOff, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { useFormatter } from "next-intl";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { AddPassphraseDialog } from "./add-passphrase-dialoge";
import { EditPassphraseDialog } from "./edit-passphrase-dialoge";

interface WalletPassphrase {
  doc_id: string;
  title: string;
  name: string;
  lower_title: string;
  wallet_type: string;
  data: string;
  passphrase: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

export function WalletPassphrasesContent() {
  const { translate } = useTranslator();
  const format = useFormatter();
  const [walletPassphrases, setWalletPassphrases] = useState<WalletPassphrase[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPassphrase, setSelectedPassphrase] = useState<WalletPassphrase | null>(null);
  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [viewPassphrase, setViewPassphrase] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const fetchWalletPassphrases = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for fetching wallet passphrases:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setIsLoading(false);
      toast({
        title: translate("error_fetching_passphrases", "wallet_passphrases"),
        description: translate("no_project_selected", "wallet_passphrases"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/${selectedWorkspaceId}/${selectedProjectId}/wallet-phrases`);

      if (response.status === 200 && response.data?.data) {
        // Explicitly map the response to WalletPassphrase to avoid type issues
        const mappedPassphrases: WalletPassphrase[] = response.data.data.map((item: any) => ({
          doc_id: item.doc_id || "",
          title: item.title || "",
          name: item.title || "", // Map title to name for validation
          lower_title: item.lower_title || item.title?.toLowerCase() || "",
          wallet_type: item.wallet_type || "Other",
          data: item.data || "",
          passphrase: item.data || "", // Map data to passphrase for validation
          notes: item.notes || null,
          tags: item.tags || [],
          created_at: item.created_at || "",
          updated_at: item.updated_at || null,
          created_by: item.created_by || "",
          project_id: item.project_id || "",
        }));
        setWalletPassphrases(mappedPassphrases);
      } else {
        console.error("Unexpected response format:", response);
        toast({
          title: translate("error_fetching_passphrases", "wallet_passphrases"),
          description: translate("failed_to_fetch_passphrases", "wallet_passphrases"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching wallet passphrases:", error);
      toast({
        title: translate("error_fetching_passphrases", "wallet_passphrases"),
        description: error.response?.data?.message || translate("failed_to_fetch_passphrases", "wallet_passphrases"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId,]);

  useEffect(() => {
    fetchWalletPassphrases();
  }, [fetchWalletPassphrases]);

  // Filter and paginate wallet passphrases locally
  const filteredPassphrases = useMemo(() => {
    let result = walletPassphrases;

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(passphrase =>
        passphrase.title.toLowerCase().includes(query) ||
        passphrase.notes?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [walletPassphrases, searchQuery]);

  const totalCount = filteredPassphrases.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const paginatedPassphrases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPassphrases.slice(start, end);
  }, [filteredPassphrases, currentPage, itemsPerPage]);

  const copyToClipboard = useCallback(async (doc_id: string, field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField({ doc_id, field });
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: translate("copied", "wallet_passphrases"),
        description: translate("passphrase_copied", "wallet_passphrases"),
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: translate("copy_failed", "wallet_passphrases"),
        description: translate("failed_to_copy_passphrase", "wallet_passphrases"),
        variant: "destructive",
      });
    }
  }, [translate]);

  const togglePassphraseVisibility = useCallback((doc_id: string) => {
    setViewPassphrase(prev => (prev === doc_id ? null : doc_id));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDeletePassphrase = useCallback(
    async (doc_id: string) => {
      if (!selectedWorkspaceId || !selectedProjectId) {
        console.error("Missing required data for deleting passphrase:", {
          selectedWorkspaceId,
          selectedProjectId,
        });
        toast({
          title: translate("error_deleting_passphrase", "wallet_passphrases"),
          description: translate("no_project_selected", "wallet_passphrases"),
          variant: "destructive",
        });
        return;
      }

      if (!confirm(translate("confirm_delete_passphrase", "wallet_passphrases"))) {
        return;
      }

      try {
        await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/wallet-phrases/${doc_id}`);
        fetchWalletPassphrases();
        toast({
          title: translate("passphrase_deleted_successfully", "wallet_passphrases"),
          description: translate("passphrase_deleted_description", "wallet_passphrases"),
        });
      } catch (error: any) {
        console.error("Error deleting passphrase:", error);
        toast({
          title: translate("error_deleting_passphrase", "wallet_passphrases"),
          description: error.response?.data?.message || translate("failed_to_delete_passphrase", "wallet_passphrases"),
          variant: "destructive",
        });
      }
    },
    [selectedWorkspaceId, selectedProjectId, translate, fetchWalletPassphrases]
  );

  const handlePassphraseUpdated = useCallback(() => {
    setShowEditDialog(false);
    setSelectedPassphrase(null);
    fetchWalletPassphrases();
    toast({
      title: translate("passphrase_updated_successfully", "wallet_passphrases"),
      description: translate("passphrase_updated_description", "wallet_passphrases"),
    });
  }, [fetchWalletPassphrases, translate]);

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
        <p className="text-muted-foreground">{translate("loading_passphrases", "wallet_passphrases")}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{translate("wallet_passphrases", "wallet_passphrases")}</h1>
        <p className="text-muted-foreground">{translate("securely_store_and_manage_your_wallet_recovery_phrases", "wallet_passphrases")}</p>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={translate("search_passphrases", "wallet_passphrases")}
            className="pl-8 w-full"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-4 w-4" />
          {translate("add_passphrase", "wallet_passphrases")}
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-sm">{translate("name", "wallet_passphrases")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("wallet_type", "wallet_passphrases")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("passphrase", "wallet_passphrases")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("tags", "wallet_passphrases")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("last_modified", "wallet_passphrases")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("actions", "wallet_passphrases")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPassphrases.length > 0 ? (
                paginatedPassphrases.map((passphrase) => (
                  <tr key={passphrase.doc_id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium">
                          {passphrase.title.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium">{passphrase.title}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-xs">
                        {passphrase.wallet_type || "Other"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono max-w-[200px] truncate">
                          {viewPassphrase === passphrase.doc_id ? passphrase.data : "••••••••"}
                        </span>
                        <div className="flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => togglePassphraseVisibility(passphrase.doc_id)}
                                >
                                  {viewPassphrase === passphrase.doc_id ? (
                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{viewPassphrase === passphrase.doc_id ? translate("hide_passphrase", "wallet_passphrases") : translate("show_passphrase", "wallet_passphrases")}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => copyToClipboard(passphrase.doc_id, "data", passphrase.data)}
                                >
                                  {copiedField?.doc_id === passphrase.doc_id && copiedField?.field === "data" ? (
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {copiedField?.doc_id === passphrase.doc_id && copiedField?.field === "data" ? translate("copied", "wallet_passphrases") : translate("copy_passphrase", "wallet_passphrases")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {passphrase.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {passphrase.updated_at
                        ? format.dateTime(new Date(passphrase.updated_at), {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
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
                              setSelectedPassphrase({ ...passphrase });
                              setShowEditDialog(true);
                            }}
                          >
                            {translate("edit", "wallet_passphrases")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => handleDeletePassphrase(passphrase.doc_id)}
                          >
                            {translate("delete", "wallet_passphrases")}
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
                      <h3 className="font-medium">{translate("no_passphrases_found", "wallet_passphrases")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery
                          ? translate("no_passphrases_match_search", "wallet_passphrases").replace("{search}", searchQuery)
                          : translate("no_passphrases_found_message", "wallet_passphrases")}
                      </p>
                      <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                        {translate("clear_filters", "wallet_passphrases")}
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
              {translate("showing", "wallet_passphrases")} {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-
              {Math.min(currentPage * itemsPerPage, totalCount)} {translate("of", "wallet_passphrases")} {totalCount} {translate("passphrases", "wallet_passphrases")}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 mr-4">
                <span className="text-sm text-muted-foreground">{translate("rows_per_page", "wallet_passphrases")}</span>
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
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {showAddDialog && (
        <AddPassphraseDialog
          onClose={() => setShowAddDialog(false)}
          onPassphraseAdded={fetchWalletPassphrases}
          existingPassphrases={walletPassphrases}
        />
      )}
      {showEditDialog && selectedPassphrase && (
        <EditPassphraseDialog
          passphrase={selectedPassphrase}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedPassphrase(null);
          }}
          onPassphraseUpdated={handlePassphraseUpdated}
          existingPassphrases={walletPassphrases}
        />
      )}
    </div>
  );
}