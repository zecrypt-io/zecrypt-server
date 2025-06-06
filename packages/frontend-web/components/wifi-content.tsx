"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wifi,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  AlertTriangle,
  QrCode,
  Plus,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { useFormatter } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useWifi } from "@/hooks/useWifi"; // Import the new hook
import { AddWifi } from "./add-wifi";
import { EditWifi } from "./edit-wifi";
import { SortButton } from "@/components/ui/sort-button";

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
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const [showAddWifi, setShowAddWifi] = useState(false);
  const [showEditWifi, setShowEditWifi] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [selectedWifi, setSelectedWifi] = useState<WifiNetwork | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [wifiToDelete, setWifiToDelete] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const {
    allWifiNetworks,
    filteredWifiNetworks,
    paginatedWifiNetworks,
    isLoading,
    searchQuery,
    selectedTag,
    uniqueTags,
    currentPage,
    itemsPerPage,
    totalCount,
    totalPages,
    copiedField,
    viewPassword,
    sortConfig,
    setSortConfig,
    setSearchQuery,
    setSelectedTag,
    setCurrentPage,
    setItemsPerPage,
    copyToClipboard,
    togglePasswordVisibility,
    clearFilters,
    refreshWifiNetworks,
    handleDeleteWifi: handleDeleteWifiFromHook,
    getPaginationRange,
    nextPage,
    prevPage,
    goToPage,
  } = useWifi({
    selectedWorkspaceId,
    selectedProjectId,
    initialItemsPerPage: 5,
  });

  const handleShowQrCode = (wifi: WifiNetwork) => {
    setSelectedWifi(wifi);
    setShowQrCode(true);
  };

  const handleEditWifi = (wifi: WifiNetwork) => {
    setSelectedWifi(wifi);
    setShowEditWifi(true);
  };

  const confirmDelete = (doc_id: string) => {
    setWifiToDelete(doc_id);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteWifi = async () => {
    if (!wifiToDelete) return;

    setIsProcessingDelete(true);
    try {
      await handleDeleteWifiFromHook(wifiToDelete);
      setShowDeleteConfirmation(false);
      setWifiToDelete(null);
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const generateWifiQrContent = (wifi: WifiNetwork) => {
    return `WIFI:S:${wifi.title};T:${wifi.security_type};P:${wifi.data};;`;
  };

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{translate("wifi_networks", "wifi")}</h1>
          <p className="text-muted-foreground">{translate("manage_your_wifi_networks", "wifi", { default: "Manage your WiFi network credentials and connection details" })}</p>
        </div>
      </div>

      {/* Search, Filter, Sort and Add */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={translate("search_wifi", "wifi")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={translate("filter_by_tag", "wifi", { default: "Filter by tag" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translate("all_tags", "wifi", { default: "All Tags" })}</SelectItem>
              {uniqueTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="w-40">
            <SortButton
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              namespace="wifi"
              options={[
                { field: "title", label: translate("ssid", "wifi", { default: "SSID" }) },
                { field: "created_at", label: translate("date_created", "wifi", { default: "Date Created" }) }
              ]}
            />
          </div>
          
          {(searchQuery || selectedTag !== "all" || sortConfig) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              {translate("clear_filters", "wifi")}
            </Button>
          )}
        </div>
        
        <Button onClick={() => setShowAddWifi(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_wifi", "wifi")}
        </Button>
      </div>

      {/* Wi-Fi Networks Table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{translate("loading_wifi_networks", "wifi")}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    {translate("name", "wifi")}
                  </TableHead>
                  <TableHead>{translate("ssid", "wifi")}</TableHead>
                  <TableHead>{translate("password", "wifi")}</TableHead>
                  <TableHead>{translate("security_type", "wifi")}</TableHead>
                  <TableHead>{translate("tags", "wifi")}</TableHead>
                  <TableHead>{translate("last_modified", "wifi")}</TableHead>
                  <TableHead className="text-right">{translate("actions", "wifi")}</TableHead>
                </TableRow>
              </TableHeader>
              {paginatedWifiNetworks.length > 0 ? (
                <TableBody>
                  {paginatedWifiNetworks.map((network) => (
                    <TableRow key={network.doc_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium">
                            <Wifi className="h-4 w-4" />
                          </div>
                          {network.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {network.security_type || "None"}
                        </Badge>
                      </TableCell>
                      <TableCell>{network.notes || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {viewPassword === network.doc_id ? network.data : "••••••••"}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => togglePasswordVisibility(network.doc_id)}
                                >
                                  {viewPassword === network.doc_id ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {viewPassword === network.doc_id
                                  ? translate("hide_password", "wifi")
                                  : translate("show_password", "wifi")}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(network.doc_id, "password", network.data)}
                                >
                                  {copiedField?.doc_id === network.doc_id && copiedField?.field === "password" ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {copiedField?.doc_id === network.doc_id && copiedField?.field === "password"
                                  ? translate("copied", "wifi")
                                  : translate("copy_password", "wifi")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {network.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {network.updated_at
                          ? format.dateTime(new Date(network.updated_at), {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
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
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditWifi(network)}>
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
                                onClick={() => confirmDelete(network.doc_id)}
                              >
                                {translate("delete", "wifi")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              ) : (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <p className="text-muted-foreground">
                        {searchQuery || selectedTag !== 'all'
                          ? translate("no_matching_wifi_networks", "wifi")
                          : translate("no_wifi_networks_found", "wifi")}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddWifi(true)}
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {translate("add_wifi_network", "wifi")}
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {translate("showing", "wifi")} {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, totalCount)} {translate("of", "wifi")} {totalCount}{" "}
              {translate("wifi_networks", "wifi")}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={currentPage === 1 ? () => {} : prevPage}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {getPaginationRange().map((page, index) =>
                  typeof page === "number" ? (
                    <PaginationItem key={index}>
                      <PaginationLink onClick={() => goToPage(page)} isActive={page === currentPage}>
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={index}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={currentPage === totalPages ? () => {} : nextPage}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      {/* Add Wi-Fi Dialog */}
      <AddWifi
        onWifiAdded={refreshWifiNetworks}
        open={showAddWifi}
        onOpenChange={setShowAddWifi}
      />

      {/* Edit Wi-Fi Dialog */}
      {showEditWifi && selectedWifi && (
        <EditWifi
          wifi={selectedWifi}
          onWifiUpdated={refreshWifiNetworks}
          open={showEditWifi}
          onOpenChange={(open) => {
            setShowEditWifi(open);
            if (!open) {
              setSelectedWifi(null);
            }
          }}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translate("confirm_delete_wifi", "wifi")}</AlertDialogTitle>
            <AlertDialogDescription>
              {translate("delete_wifi_confirmation", "wifi", {
                default: "Are you sure you want to delete this Wi-Fi network? This action cannot be undone.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>
              {translate("cancel", "wifi")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWifi}
              disabled={isProcessingDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessingDelete
                ? translate("deleting", "wifi")
                : translate("delete", "wifi")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}