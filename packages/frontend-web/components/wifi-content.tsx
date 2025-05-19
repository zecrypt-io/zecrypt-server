"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wifi, Search, Copy, Check, Eye, EyeOff, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, AlertTriangle, QrCode, Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { useFormatter } from "next-intl";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { AddWifi } from "./add-wifi";
import { EditWifi } from "./edit-wifi";

interface WifiNetwork {
  doc_id: string;
  title: string;
  lower_title: string;
  security_type: string;
  data: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

export function WifiContent() {
  const { translate } = useTranslator();
  const format = useFormatter();
  const [showAddWifi, setShowAddWifi] = useState(false);
  const [showEditWifi, setShowEditWifi] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [selectedWifi, setSelectedWifi] = useState<WifiNetwork | null>(null);
  const [copiedField, setCopiedField] = useState<{ doc_id: string; field: string } | null>(null);
  const [viewPassword, setViewPassword] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSecurityType, setSelectedSecurityType] = useState("all");
  const [allWifiNetworks, setAllWifiNetworks] = useState<WifiNetwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const fetchWifiNetworks = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for fetching Wi-Fi networks:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setIsLoading(false);
      toast({
        title: translate("error_fetching_wifi_networks", "wifi"),
        description: translate("no_project_selected", "wifi"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/${selectedWorkspaceId}/${selectedProjectId}/wifi`);

      if (response.status === 200 && response.data?.data) {
        setAllWifiNetworks(response.data.data);
      } else {
        console.error("Unexpected response format:", response);
        toast({
          title: translate("error_fetching_wifi_networks", "wifi"),
          description: translate("failed_to_fetch_wifi_networks", "wifi"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching Wi-Fi networks:", error);
      toast({
        title: translate("error_fetching_wifi_networks", "wifi"),
        description: error.response?.data?.message || translate("failed_to_fetch_wifi_networks", "wifi"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId, selectedProjectId]);

  useEffect(() => {
    fetchWifiNetworks();
  }, [fetchWifiNetworks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowAddWifi(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredWifiNetworks = useMemo(() => {
    let result = allWifiNetworks;

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(network =>
        network.title.toLowerCase().includes(query) ||
        network.notes?.toLowerCase().includes(query)
      );
    }

    if (selectedSecurityType !== "all") {
      result = result.filter(network => network.security_type.toLowerCase() === selectedSecurityType.toLowerCase());
    }

    return result;
  }, [allWifiNetworks, searchQuery, selectedSecurityType]);

  const totalCount = filteredWifiNetworks.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const paginatedWifiNetworks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredWifiNetworks.slice(start, end);
  }, [filteredWifiNetworks, currentPage, itemsPerPage]);

  const copyToClipboard = useCallback(async (doc_id: string, field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField({ doc_id, field });
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: translate("copied", "wifi"),
        description: translate("field_copied", "wifi"),
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: translate("copy_failed", "wifi"),
        description: translate("failed_to_copy_field", "wifi"),
        variant: "destructive",
      });
    }
  }, [translate]);

  const togglePasswordVisibility = useCallback((doc_id: string) => {
    setViewPassword(prev => (prev === doc_id ? null : doc_id));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedSecurityType("all");
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDeleteWifi = useCallback(
    async (doc_id: string) => {
      if (!selectedWorkspaceId || !selectedProjectId) {
        console.error("Missing required data for deleting Wi-Fi network:", {
          selectedWorkspaceId,
          selectedProjectId,
        });
        toast({
          title: translate("error_deleting_wifi", "wifi"),
          description: translate("no_project_selected", "wifi"),
          variant: "destructive",
        });
        return;
      }

      if (!confirm(translate("confirm_delete_wifi", "wifi"))) {
        return;
      }

      try {
        await axiosInstance.delete(`/${selectedWorkspaceId}/${selectedProjectId}/wifi/${doc_id}`);
        fetchWifiNetworks();
        toast({
          title: translate("wifi_deleted", "wifi"),
          description: translate("wifi_deleted_description", "wifi"),
        });
      } catch (error: any) {
        console.error("Error deleting Wi-Fi network:", error);
        toast({
          title: translate("error_deleting_wifi", "wifi"),
          description: error.response?.data?.message || translate("failed_to_delete_wifi", "wifi"),
          variant: "destructive",
        });
      }
    },
    [selectedWorkspaceId, selectedProjectId, translate, fetchWifiNetworks]
  );

  const handleWifiUpdated = useCallback(() => {
    setShowEditWifi(false);
    setSelectedWifi(null);
    fetchWifiNetworks();
    toast({
      title: translate("wifi_updated_successfully", "wifi"),
      description: translate("wifi_updated_description", "wifi"),
    });
  }, [fetchWifiNetworks, translate]);

  const handleShowQrCode = useCallback((wifi: WifiNetwork) => {
    setSelectedWifi(wifi);
    setShowQrCode(true);
  }, []);

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

  // Generate Wi-Fi QR code content
  const generateWifiQrContent = (wifi: WifiNetwork) => {
    return `WIFI:S:${wifi.title};T:${wifi.security_type};P:${wifi.data};;`;
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">{translate("loading_wifi", "wifi")}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{translate("wifi_networks", "wifi")}</h1>
        <p className="text-muted-foreground">{translate("manage_your_wifi_networks", "wifi")}</p>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-1 gap-4 w-full md:w-auto">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={translate("search_wifi", "wifi")}
              className="pl-8 w-full"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={selectedSecurityType}
              onValueChange={(value) => {
                setSelectedSecurityType(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={translate("filter_by_security", "wifi")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate("all_security_types", "wifi")}</SelectItem>
                <SelectItem value="wpa2">WPA2</SelectItem>
                <SelectItem value="wpa3">WPA3</SelectItem>
                <SelectItem value="wep">WEP</SelectItem>
                <SelectItem value="none">{translate("none", "wifi")}</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || selectedSecurityType !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                <X className="h-4 w-4 mr-2" />
                {translate("clear", "wifi")}
              </Button>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowAddWifi(true)}
        >
          <Plus className="h-4 w-4" />
          {translate("add_wifi", "wifi")}
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-sm">{translate("ssid", "wifi")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("security", "wifi")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("notes", "wifi")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("password", "wifi")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("tags", "wifi")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("last_modified", "wifi")}</th>
                <th className="text-left p-3 font-medium text-sm">{translate("actions", "wifi")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedWifiNetworks.length > 0 ? (
                paginatedWifiNetworks.map((network) => (
                  <tr key={network.doc_id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium">
                          <Wifi className="h-5 w-5" />
                        </div>
                        <p className="font-medium">{network.title}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-xs">
                        {network.security_type || "None"}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{network.notes || "-"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">
                          {viewPassword === network.doc_id ? network.data : "••••••••"}
                        </span>
                        <div className="flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => togglePasswordVisibility(network.doc_id)}
                                >
                                  {viewPassword === network.doc_id ? (
                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{viewPassword === network.doc_id ? translate("hide_password", "wifi") : translate("show_password", "wifi")}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => copyToClipboard(network.doc_id, "password", network.data)}
                                >
                                  {copiedField?.doc_id === network.doc_id && copiedField?.field === "password" ? (
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {copiedField?.doc_id === network.doc_id && copiedField?.field === "password" ? translate("copied", "wifi") : translate("copy_password", "wifi")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {network.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {network.updated_at
                        ? format.dateTime(new Date(network.updated_at), {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleShowQrCode(network)}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{translate("show_qr_code", "wifi")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedWifi({ ...network });
                                setShowEditWifi(true);
                              }}
                            >
                              {translate("edit", "wifi")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(network.doc_id, "ssid", network.title)}
                            >
                              {copiedField?.doc_id === network.doc_id && copiedField?.field === "ssid" ? (
                                <Check className="h-4 w-4 mr-2" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              {translate("copy_ssid", "wifi")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => handleDeleteWifi(network.doc_id)}
                            >
                              {translate("delete", "wifi")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-10 w-10 text-muted-foreground/50" />
                      <h3 className="font-medium">{translate("no_wifi_found", "wifi")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedSecurityType !== "all"
                          ? translate("no_wifi_for_security_type", "wifi").replace("{security_type}", selectedSecurityType)
                          : searchQuery
                          ? translate("no_wifi_match_search", "wifi").replace("{search}", searchQuery)
                          : translate("adjust_search_filter", "wifi")}
                      </p>
                      <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                        {translate("clear_filters", "wifi")}
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
              {translate("showing", "wifi")} {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-
              {Math.min(currentPage * itemsPerPage, totalCount)} {translate("of", "wifi")} {totalCount} {translate("wifi_networks", "wifi")}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 mr-4">
                <span className="text-sm text-muted-foreground">{translate("rows_per_page", "wifi")}</span>
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

      {showAddWifi && <AddWifi onClose={() => setShowAddWifi(false)} onWifiAdded={fetchWifiNetworks} />}
      {showEditWifi && selectedWifi && (
        <EditWifi
          wifi={selectedWifi}
          onClose={() => {
            setShowEditWifi(false);
            setSelectedWifi(null);
          }}
          onWifiUpdated={handleWifiUpdated}
        />
      )}

      {/* QR Code Dialog */}
      {showQrCode && selectedWifi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-[400px] rounded-lg bg-card p-6 border border-border shadow-lg relative">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold">{translate("wifi_qr_code", "wifi")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{translate("wifi_qr_code_description", "wifi")}</p>
            </div>
            <div className="py-4">
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-64 h-64 border border-border flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm">{translate("qr_code_placeholder", "wifi")}</div>
                    <div className="font-bold mt-2">{selectedWifi.title}</div>
                    <QrCode className="h-32 w-32 mx-auto mt-4 text-primary" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-center">
                  <p>{translate("wifi_credentials", "wifi")}</p>
                  <p className="font-medium mt-1">
                    SSID: {selectedWifi.title}<br />
                    {translate("password", "wifi")}: {selectedWifi.data}<br />
                    {translate("security_type", "wifi")}: {selectedWifi.security_type || "None"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button onClick={() => setShowQrCode(false)}>
                {translate("close", "wifi")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}