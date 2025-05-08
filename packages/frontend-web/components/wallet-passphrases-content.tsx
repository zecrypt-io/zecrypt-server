"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { useTranslator } from "@/hooks/use-translations";
import { FIXED_SALT } from "@/libs/crypto";
import { AddPassphraseDialog } from "./add-passphrase-dialoge";
import { EditPassphraseDialog } from "./edit-passphrase-dialoge";
import axiosInstance from "@/libs/Middleware/axiosInstace";

// Types
interface WalletPassphrase {
  id: string;
  name: string;
  walletType: string;
  passphrase: string;
  walletAddress: string;
  tags: string[];
  notes: string;
  createdAt: Date;
  lastAccessed: Date;
  data?: string;
}

export function WalletPassphrasesContent() {
  const router = useRouter();
  const { translate } = useTranslator();
  const [walletPassphrases, setWalletPassphrases] = useState<WalletPassphrase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visiblePassphrases, setVisiblePassphrases] = useState<Record<string, boolean>>({});
  const [visibleAddresses, setVisibleAddresses] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPassphrase, setCurrentPassphrase] = useState<WalletPassphrase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Redux state
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  // Reset to page 1 when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Debug pagination state
  useEffect(() => {
    console.log("Pagination state:", {
      currentPage,
      totalCount,
      totalPages: Math.ceil(totalCount / itemsPerPage),
      walletPassphrasesLength: walletPassphrases.length,
      itemsPerPage,
      searchTerm,
    });
  }, [currentPage, totalCount, itemsPerPage, walletPassphrases.length, searchTerm]);

  // Check if a string appears to be a hash (e.g., SHA-256 or similar)
  const isLikelyHash = (str: string): boolean => {
    return /^[0-9a-fA-F]{64,128}$/.test(str);
  };

  // Process wallet passphrase data
  const processWalletData = useCallback(async (wallet: any): Promise<WalletPassphrase> => {
    try {
      if (wallet.data && typeof wallet.data === "string") {
        try {
          // Try to parse the data as JSON
          const parsedData = JSON.parse(wallet.data);
          if (parsedData.passphrase) {
            return {
              id: wallet.doc_id,
              name: wallet.name,
              walletType: wallet.wallet_type || "Other",
              passphrase: parsedData.passphrase,
              walletAddress: parsedData.walletAddress || wallet.wallet_address || "",
              tags: wallet.tags || [],
              notes: wallet.notes || "",
              createdAt: new Date(wallet.created_at),
              lastAccessed: new Date(wallet.last_accessed || wallet.created_at),
              data: wallet.data,
            };
          }
          console.warn("Data missing passphrase:", {
            doc_id: wallet.doc_id,
            parsedData,
          });
          return {
            id: wallet.doc_id,
            name: wallet.name,
            walletType: wallet.wallet_type || "Other",
            passphrase: "Data incomplete",
            walletAddress: wallet.wallet_address || "Data incomplete",
            tags: wallet.tags || [],
            notes: wallet.notes || "",
            createdAt: new Date(wallet.created_at),
            lastAccessed: new Date(wallet.last_accessed || wallet.created_at),
            data: wallet.data,
          };
        } catch (jsonError) {
          // If not JSON, use the data as the passphrase directly
          return {
            id: wallet.doc_id,
            name: wallet.name,
            walletType: wallet.wallet_type || "Other",
            passphrase: wallet.data,
            walletAddress: wallet.wallet_address || "",
            tags: wallet.tags || [],
            notes: wallet.notes || "",
            createdAt: new Date(wallet.created_at),
            lastAccessed: new Date(wallet.last_accessed || wallet.created_at),
            data: wallet.data,
          };
        }
      }
      
      // If no data or not a string, return with placeholders
      return {
        id: wallet.doc_id,
        name: wallet.name,
        walletType: wallet.wallet_type || "Other",
        passphrase: "Data unavailable",
        walletAddress: wallet.wallet_address || "Data unavailable",
        tags: wallet.tags || [],
        notes: wallet.notes || "",
        createdAt: new Date(wallet.created_at),
        lastAccessed: new Date(wallet.last_accessed || wallet.created_at),
        data: wallet.data,
      };
    } catch (error: unknown) {
      console.error("Failed to process wallet data:", {
        error: error instanceof Error ? error.message : String(error),
        doc_id: wallet.doc_id,
      });
      return {
        id: wallet.doc_id,
        name: wallet.name,
        walletType: wallet.wallet_type || "Other",
        passphrase: "Error processing data",
        walletAddress: wallet.wallet_address || "Error processing data",
        tags: wallet.tags || [],
        notes: wallet.notes || "",
        createdAt: new Date(wallet.created_at),
        lastAccessed: new Date(wallet.last_accessed || wallet.created_at),
        data: wallet.data,
      };
    }
  }, []);

  // Fetch wallet passphrases
  const fetchWalletPassphrases = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId || !accessToken) {
      console.error("Missing required parameters for fetching wallet passphrases", {
        selectedWorkspaceId,
        selectedProjectId,
        accessToken,
      });
      setIsLoading(false);
      setApiError(true);
      return;
    }

    try {
      setIsLoading(true);
      setApiError(false);

      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/wallet-passphrases/list`,
        {
          page: currentPage,
          limit: itemsPerPage,
          name: searchTerm.trim() || null,
        }
      );

      if (response.status === 200) {
        const { data: fetchedPassphrases = [], count = 0 } = response.data || {};
        
        // Process the passphrase data
        const processedPassphrases = await Promise.all(
          fetchedPassphrases.map(processWalletData)
        );

        setWalletPassphrases(processedPassphrases);
        
        // Improved totalCount logic: assume more pages exist unless count < itemsPerPage on a later page
        setTotalCount(
          count < itemsPerPage && currentPage > 1
            ? (currentPage - 1) * itemsPerPage + count
            : currentPage * itemsPerPage + (count === itemsPerPage ? 1 : 0)
        );
      }
    } catch (error) {
      console.error("Failed to fetch wallet passphrases:", error);
      toast({
        title: "Error",
        description: "Failed to load wallet passphrases. Please try again later.",
        variant: "destructive",
      });
      setWalletPassphrases([]);
      setTotalCount(0);
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId, accessToken, currentPage, itemsPerPage, searchTerm, processWalletData]);

  // Initial fetch on mount and when workspace/project/token/itemsPerPage change
  useEffect(() => {
    fetchWalletPassphrases();
  }, [selectedWorkspaceId, selectedProjectId, accessToken, itemsPerPage, fetchWalletPassphrases]);

  // Handle search input with debounce
  useEffect(() => {
    if (!searchTerm && currentPage === 1) {
      // Skip if searchTerm is empty and already on page 1
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (searchTerm !== "" || currentPage !== 1) {
        setCurrentPage(1);
        fetchWalletPassphrases();
      }
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTerm]); // Only trigger on searchTerm change

  // Toggle passphrase visibility
  const toggleVisibility = (id: string) => {
    setVisiblePassphrases((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle wallet address visibility
  const toggleAddressVisibility = (id: string) => {
    setVisibleAddresses((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Copy passphrase to clipboard
  const copyToClipboard = async (id: string, passphrase: string) => {
    try {
      await navigator.clipboard.writeText(passphrase);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);

      setWalletPassphrases((prev) =>
        prev.map((item) => (item.id === id ? { ...item, lastAccessed: new Date() } : item))
      );

      if (selectedWorkspaceId && selectedProjectId && accessToken) {
        try {
          await axiosInstance.put(
            `/${selectedWorkspaceId}/${selectedProjectId}/wallet-passphrases/${id}`,
            { last_accessed: new Date().toISOString() },
            { headers: { "access-token": accessToken } }
          );
        } catch (error) {
          console.error("Failed to update last accessed timestamp:", error);
        }
      }

      toast({
        title: "Passphrase copied",
        description: "The passphrase has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Copy wallet address to clipboard
  const copyAddressToClipboard = async (id: string, address: string) => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddressId(id);
      setTimeout(() => setCopiedAddressId(null), 2000);

      toast({
        title: "Wallet address copied",
        description: "The wallet address has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Failed to copy address to clipboard:", error);
      toast({
        title: "Copy failed",
        description: "Unable to copy wallet address to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete passphrase
  const deletePassphrase = async () => {
    if (!currentPassphrase) return;
    if (!selectedWorkspaceId || !selectedProjectId || !accessToken) {
      toast({
        title: "Error",
        description: "No workspace or project selected",
        variant: "destructive",
      });
      return;
    }

    try {
      await axiosInstance.delete(
        `/${selectedWorkspaceId}/${selectedProjectId}/wallet-passphrases/${currentPassphrase.id}`,
        { headers: { "access-token": accessToken } }
      );

      fetchWalletPassphrases();
      setIsDeleteDialogOpen(false);
      setCurrentPassphrase(null);

      toast({
        title: "Passphrase deleted",
        description: "Your wallet passphrase has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting passphrase:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete wallet passphrase",
        variant: "destructive",
      });
    }
  };

  // Handle page change with boundary check
  const handlePageChange = useCallback((page: number) => {
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
    const validPage = Math.max(1, Math.min(page, totalPages));
    console.log("Changing page to:", validPage, { totalPages, totalCount, itemsPerPage });
    setCurrentPage(validPage);
    fetchWalletPassphrases();
  }, [totalCount, itemsPerPage, fetchWalletPassphrases]);

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    // Rely on useEffect to reset currentPage and fetch
  };

  // Format date
  const formatDate = (date: Date) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (error) {
      console.error("Invalid date format:", error);
      return "Invalid date";
    }
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  // Pagination range with dots for large page counts
  const getPaginationRange = useCallback(() => {
    const maxPagesToShow = 5;
    const pageNumbers: (number | string)[] = [];

    console.log("getPaginationRange:", { totalPages, currentPage, maxPagesToShow });

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

    console.log("Pagination range:", pageNumbers);
    return pageNumbers;
  }, [currentPage, totalPages]);

  // Handle add passphrase
  const handleAddPassphrase = (newPassphrase: WalletPassphrase) => {
    setCurrentPage(1); // Reset to page 1 after adding a passphrase
    fetchWalletPassphrases();
    toast({
      title: "Passphrase added",
      description: "Your wallet passphrase has been added successfully.",
    });
  };

  // Handle edit passphrase
  const handleEditPassphrase = (updatedPassphrase: WalletPassphrase) => {
    fetchWalletPassphrases();
    toast({
      title: "Passphrase updated",
      description: "Your wallet passphrase has been updated successfully.",
    });
  };

  return (
    <div className="space-y-4 p-3 md:p-8">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{translate("wallet_passphrases", "wallet_passphrases")}</h1>
        <p className="text-muted-foreground">
          {translate("securely_store_and_manage_your_wallet_recovery_phrases", "wallet_passphrases")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={translate("search_passphrases", "wallet_passphrases")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          onClick={() => {
            console.log("Add Passphrase button clicked");
            setIsAddDialogOpen(true);
          }}
          className="w-full sm:w-auto h-10"
        >
          <Plus className="mr-2 h-4 w-4" /> {translate("add_passphrase", "wallet_passphrases")}
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="h-12 w-12 rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground animate-spin mb-4"></div>
            <h3 className="text-lg font-medium">{translate("loading_passphrases", "wallet_passphrases")}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {translate("please_wait_while_we_fetch_your_secure_passphrases", "wallet_passphrases")}
            </p>
          </CardContent>
        </Card>
      ) : apiError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium">{translate("error_loading_passphrases", "wallet_passphrases")}</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              {translate("failed_to_load_passphrases", "wallet_passphrases")}
            </p>
            <Button onClick={fetchWalletPassphrases}>
              {translate("try_again", "common")}
            </Button>
          </CardContent>
        </Card>
      ) : !isLoading && walletPassphrases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{translate("no_passphrases_found", "wallet_passphrases")}</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              {searchTerm
                ? translate("no_passphrases_found_search", "wallet_passphrases")
                : translate("no_passphrases_found_message", "wallet_passphrases")}
            </p>
            <Button
              onClick={() => {
                console.log("Add First Passphrase button clicked");
                setIsAddDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> {translate("add_your_first_passphrase", "wallet_passphrases")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="p-3 font-medium text-sm">Name</TableHead>
                  <TableHead className="p-3 font-medium text-sm">Wallet Type</TableHead>
                  <TableHead className="p-3 font-medium text-sm">Passphrase</TableHead>
                  <TableHead className="p-3 font-medium text-sm">Wallet Address</TableHead>
                  <TableHead className="p-3 font-medium text-sm">Tags</TableHead>
                  <TableHead className="p-3 font-medium text-sm">Created</TableHead>
                  <TableHead className="p-3 font-medium text-sm">Last Accessed</TableHead>
                  <TableHead className="p-3 font-medium text-sm text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletPassphrases.map((passphrase) => (
                  <TableRow key={passphrase.id} className="border-t border-border">
                    <TableCell className="p-3 font-medium">{passphrase.name}</TableCell>
                    <TableCell className="p-3">{passphrase.walletType}</TableCell>
                    <TableCell className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="max-w-[200px] truncate font-mono text-sm">
                          {visiblePassphrases[passphrase.id]
                            ? passphrase.passphrase
                            : "••••••••••••••••••••••••"}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleVisibility(passphrase.id)}
                          title={visiblePassphrases[passphrase.id] ? "Hide passphrase" : "Show passphrase"}
                        >
                          {visiblePassphrases[passphrase.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(passphrase.id, passphrase.passphrase)}
                          title="Copy to clipboard"
                        >
                          {copiedId === passphrase.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="p-3">
                      {passphrase.walletAddress && (
                        <div className="flex items-center space-x-2">
                          <div className="max-w-[160px] truncate font-mono text-xs">
                            {visibleAddresses[passphrase.id]
                              ? passphrase.walletAddress
                              : "••••••••••••••••••••••••"}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleAddressVisibility(passphrase.id)}
                            title={visibleAddresses[passphrase.id] ? "Hide address" : "Show address"}
                          >
                            {visibleAddresses[passphrase.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyAddressToClipboard(passphrase.id, passphrase.walletAddress)}
                            title="Copy address to clipboard"
                          >
                            {copiedAddressId === passphrase.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(passphrase.tags || []).map((tag, index) => (
                          <Badge key={`${tag}-${index}`} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="p-3">{formatDate(passphrase.createdAt)}</TableCell>
                    <TableCell className="p-3">{formatDate(passphrase.lastAccessed)}</TableCell>
                    <TableCell className="p-3 text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentPassphrase(passphrase);
                            setIsEditDialogOpen(true);
                          }}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentPassphrase(passphrase);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                {translate("showing", "wallet_passphrases")}{" "}
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-
                {Math.min(currentPage * itemsPerPage, totalCount)}{" "}
                {translate("of", "wallet_passphrases")} {totalCount}{" "}
                {translate("passphrases", "wallet_passphrases")}
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 mr-4">
                  <span className="text-sm text-muted-foreground">
                    {translate("rows_per_page", "wallet_passphrases")}
                  </span>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
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
      )}

      {/* Add Passphrase Dialog */}
      <AddPassphraseDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddPassphrase}
        existingPassphrases={walletPassphrases}
        workspaceId={selectedWorkspaceId}
        projectId={selectedProjectId}
        accessToken={accessToken ?? null}
      />

      {/* Edit Passphrase Dialog */}
      <EditPassphraseDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        passphrase={currentPassphrase}
        onEdit={handleEditPassphrase}
        existingPassphrases={walletPassphrases}
        workspaceId={selectedWorkspaceId}
        projectId={selectedProjectId}
        accessToken={accessToken ?? null}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{translate("delete_passphrase", "wallet_passphrases")}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this passphrase? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="font-medium">{currentPassphrase?.name}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deletePassphrase}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
