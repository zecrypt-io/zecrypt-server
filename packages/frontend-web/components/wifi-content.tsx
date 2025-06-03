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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    paginatedWifiNetworks,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    getPaginationRange,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    selectedSecurityType,
    setSelectedSecurityType,
    uniqueTags,
    sortConfig,
    setSortConfig,
    copiedField,
    viewPassword,
    copyToClipboard,
    togglePasswordVisibility,
    clearFilters,
    refreshWifiNetworks,
    handleDeleteWifi: handleDeleteWifiFromHook,
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
        <h1 className="text-2xl font-bold">{translate("wifi_networks", "wifi")}</h1>
        <Button onClick={() => setShowAddWifi(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_wifi", "wifi")}
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative col-span-1 md:col-span-2">
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
        <div className="col-span-1">
          <Select value={selectedSecurityType} onValueChange={setSelectedSecurityType}>
            <SelectTrigger className="w-full">
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
        </div>
        <div className="col-span-1">
          <SortButton
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
            namespace="wifi"
            options={[
              { field: "title", label: translate("ssid", "wifi") },
              { field: "security_type", label: translate("security", "wifi") },
              { field: "updated_at", label: translate("last_modified", "wifi") }
            ]}
          />
        </div>
        {(searchQuery || selectedSecurityType !== "all" || sortConfig) && (
          <Button 
            variant="outline" 
            onClick={clearFilters} 
            className="w-full md:w-auto md:col-span-4 flex items-center justify-center gap-2"
          >
            <X className="h-3 w-3 mr-1" />
            {translate("clear_filters", "wifi")}
          </Button>
        )}
      </div>

      {/* Wi-Fi Networks Table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">{translate("loading_wifi", "wifi")}</p>
          </div>
        ) : paginatedWifiNetworks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {selectedSecurityType !== "all"
                ? translate("no_wifi_for_security_type", "wifi", { security_type: selectedSecurityType })
                : searchQuery
                ? translate("no_wifi_match_search", "wifi", { search: searchQuery })
                : translate("no_wifi_found", "wifi")}
            </p>
            <Button
              variant="outline"
              onClick={() => setShowAddWifi(true)}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              {translate("add_wifi", "wifi")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <div className="flex items-center">
                    {translate("ssid", "wifi")}
                    <SortButton
                      field="title"
                      sortConfig={sortConfig}
                      setSortConfig={setSortConfig}
                      label={translate("ssid", "wifi")}
                    />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    {translate("security", "wifi")}
                    <SortButton
                      field="security_type"
                      sortConfig={sortConfig}
                      setSortConfig={setSortConfig}
                      label={translate("security", "wifi")}
                    />
                  </div>
                </TableHead>
                <TableHead>{translate("notes", "wifi")}</TableHead>
                <TableHead>{translate("password", "wifi")}</TableHead>
                <TableHead>{translate("tags", "wifi")}</TableHead>
                <TableHead>
                  <div className="flex items-center">
                    {translate("last_modified", "wifi")}
                    <SortButton
                      field="updated_at"
                      sortConfig={sortConfig}
                      setSortConfig={setSortConfig}
                      label={translate("last_modified", "wifi")}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-right">{translate("actions", "wifi")}</TableHead>
              </TableRow>
            </TableHeader>
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
                    <Badge variant="outline" className="capitalize">
                      {network.security_type || "None"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {network.notes || <span className="text-muted-foreground">-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="relative max-w-[120px] truncate font-mono">
                        {viewPassword === network.doc_id ? network.data : "••••••••"}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => togglePasswordVisibility(network.doc_id)}
                            >
                              {viewPassword === network.doc_id ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {viewPassword === network.doc_id
                              ? translate("hide_password", "wifi")
                              : translate("show_password", "wifi")}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(network.doc_id, "password", network.data)}
                            >
                              {copiedField?.doc_id === network.doc_id && copiedField?.field === "password" ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
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
                          <TooltipContent>{translate("show_qr_code", "wifi")}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {network.tags && network.tags.length > 0 ? (
                        network.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="capitalize">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {network.updated_at
                      ? format.dateTime(new Date(network.updated_at), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditWifi(network)}>
                          {translate("edit", "wifi")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => confirmDelete(network.doc_id)}>
                          {translate("delete", "wifi")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {translate("showing", "wifi")} {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalCount)} {translate("of", "wifi")} {totalCount}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    prevPage();
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {getPaginationRange().map((page, i) => (
                <PaginationItem key={i}>
                  {page === "..." ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(page as number);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    nextPage();
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add/Edit WiFi Dialogs */}
      <AddWifi 
        open={showAddWifi}
        onOpenChange={setShowAddWifi}
        onWifiAdded={refreshWifiNetworks}
      />

      <EditWifi
        open={showEditWifi}
        onOpenChange={setShowEditWifi}
        wifi={selectedWifi}
        onWifiUpdated={refreshWifiNetworks}
      />
      
      {/* QR Code Dialog */}
      <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {translate("wifi_qr_code", "wifi", { ssid: selectedWifi?.title, default: `WiFi QR Code for ${selectedWifi?.title}` })}
            </DialogTitle>
            <DialogDescription>
              {translate("scan_with_phone", "wifi", { default: "Scan this QR code with your phone to connect to the network" })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {selectedWifi && (
              <div className="bg-white p-4 rounded-md">
                {/* QR code would be generated here */}
                <div className="text-center">
                  <p className="font-mono text-xs mt-2 text-black">
                    {generateWifiQrContent(selectedWifi)}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-center">
            <Button variant="secondary" onClick={() => setShowQrCode(false)}>
              {translate("close", "wifi", { default: "Close" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translate("confirm_delete", "wifi", { default: "Confirm Delete" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {translate("delete_wifi_confirmation", "wifi", { default: "Are you sure you want to delete this WiFi network? This action cannot be undone." })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>
              {translate("cancel", "wifi", { default: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWifi}
              disabled={isProcessingDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessingDelete ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {translate("deleting", "wifi", { default: "Deleting..." })}
                </div>
              ) : (
                translate("delete", "wifi", { default: "Delete" })
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}