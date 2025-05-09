"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wifi, Plus, Search, Copy, Check, Eye, EyeOff, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, AlertTriangle, QrCode
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WifiNetwork {
  id: string;
  ssid: string;
  password: string;
  security_type: string;
  location: string;
  tags: string[];
  created_at: string;
}

export function WifiContent() {
  const { translate } = useTranslator();
  const [showAddWifi, setShowAddWifi] = useState(false);
  const [showEditWifi, setShowEditWifi] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [selectedWifi, setSelectedWifi] = useState<WifiNetwork | null>(null);
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null);
  const [viewPassword, setViewPassword] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSecurityType, setSelectedSecurityType] = useState("all");
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const mockWifiNetworks: WifiNetwork[] = [
    {
      id: "wifi-1",
      ssid: "Home_Network",
      password: "SecurePassword123!",
      security_type: "WPA2",
      location: "Home",
      tags: ["Personal", "Home"],
      created_at: new Date().toISOString()
    },
    {
      id: "wifi-2",
      ssid: "Office_Guest",
      password: "Welcome2023",
      security_type: "WPA2",
      location: "Office",
      tags: ["Work", "Guest"],
      created_at: new Date().toISOString()
    },
    {
      id: "wifi-3",
      ssid: "Coffee_Shop",
      password: "FreeWifi2023",
      security_type: "WPA3",
      location: "Coffee Shop",
      tags: ["Public", "Cafe"],
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // Simulate data loading
    setIsLoading(true);
    setTimeout(() => {
      setWifiNetworks(mockWifiNetworks);
      setTotalCount(mockWifiNetworks.length);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleAddWifi = () => {
    setShowAddWifi(true);
  };

  const handleEditWifi = (wifi: WifiNetwork) => {
    setSelectedWifi(wifi);
    setShowEditWifi(true);
  };
  
  const handleShowQrCode = (wifi: WifiNetwork) => {
    setSelectedWifi(wifi);
    setShowQrCode(true);
  };

  const handleDeleteWifi = (id: string) => {
    // Simulate deletion
    setWifiNetworks(prevNetworks => prevNetworks.filter(network => network.id !== id));
    toast({
      title: translate("wifi_deleted", "wifi", { default: "Wi-Fi network deleted" }),
      description: translate("wifi_deleted_description", "wifi", { default: "The Wi-Fi network has been deleted successfully" }),
    });
  };

  const copyToClipboard = async (id: string, field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField({ id, field });
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: translate("copied", "wifi", { default: "Copied" }),
        description: translate("field_copied", "wifi", { default: "Field copied to clipboard" }),
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: translate("copy_failed", "wifi", { default: "Copy failed" }),
        description: translate("failed_to_copy_field", "wifi", { default: "Failed to copy field to clipboard" }),
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setViewPassword(prev => (prev === id ? null : id));
  };

  const filterWifiNetworks = useCallback(() => {
    let filtered = [...mockWifiNetworks];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(network => 
        network.ssid.toLowerCase().includes(query) ||
        network.location.toLowerCase().includes(query)
      );
    }
    
    if (selectedSecurityType !== "all") {
      filtered = filtered.filter(network => 
        network.security_type.toLowerCase() === selectedSecurityType.toLowerCase()
      );
    }
    
    return filtered;
  }, [searchQuery, selectedSecurityType, mockWifiNetworks]);

  const handleSearch = () => {
    const filtered = filterWifiNetworks();
    setWifiNetworks(filtered);
    setTotalCount(filtered.length);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSecurityType("all");
    setWifiNetworks(mockWifiNetworks);
    setTotalCount(mockWifiNetworks.length);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const displayedWifiNetworks = wifiNetworks.slice(startIdx, endIdx);
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  // Generate Wi-Fi QR code content
  const generateWifiQrContent = (wifi: WifiNetwork) => {
    return `WIFI:S:${wifi.ssid};T:${wifi.security_type};P:${wifi.password};;`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{translate("wifi_networks", "wifi", { default: "Wi-Fi Networks" })}</h1>
        <Button onClick={handleAddWifi} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_wifi", "wifi", { default: "Add Wi-Fi" })}
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={translate("search_wifi", "wifi", { default: "Search Wi-Fi networks..." })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Select value={selectedSecurityType} onValueChange={setSelectedSecurityType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={translate("filter_by_security", "wifi", { default: "Filter by security type" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("all_security_types", "wifi", { default: "All Security Types" })}</SelectItem>
            <SelectItem value="wpa2">WPA2</SelectItem>
            <SelectItem value="wpa3">WPA3</SelectItem>
            <SelectItem value="wep">WEP</SelectItem>
            <SelectItem value="none">{translate("none", "wifi", { default: "None" })}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" className="w-full" onClick={handleSearch}>
            {translate("search", "wifi", { default: "Search" })}
          </Button>
          {(searchQuery || selectedSecurityType !== "all") && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* WiFi Networks Table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-10 text-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">{translate("loading_wifi", "wifi", { default: "Loading Wi-Fi networks..." })}</p>
          </div>
        ) : displayedWifiNetworks.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{translate("no_wifi_found", "wifi", { default: "No Wi-Fi networks found" })}</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              {translate("clear_filters", "wifi", { default: "Clear filters" })}
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{translate("ssid", "wifi", { default: "SSID" })}</TableHead>
                  <TableHead>{translate("security", "wifi", { default: "Security" })}</TableHead>
                  <TableHead>{translate("location", "wifi", { default: "Location" })}</TableHead>
                  <TableHead>{translate("password", "wifi", { default: "Password" })}</TableHead>
                  <TableHead>{translate("tags", "wifi", { default: "Tags" })}</TableHead>
                  <TableHead className="text-right">{translate("actions", "wifi", { default: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedWifiNetworks.map((network) => (
                  <TableRow key={network.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-muted-foreground" />
                        <span>{network.ssid}</span>
                      </div>
                    </TableCell>
                    <TableCell>{network.security_type}</TableCell>
                    <TableCell>{network.location}</TableCell>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span>
                          {viewPassword === network.id ? network.password : "••••••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => togglePasswordVisibility(network.id)}
                        >
                          {viewPassword === network.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(network.id, "password", network.password)}
                        >
                          {copiedField?.id === network.id && copiedField?.field === "password" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {network.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShowQrCode(network)}
                          title={translate("show_qr_code", "wifi", { default: "Show QR code" })}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditWifi(network)}>
                              {translate("edit", "wifi", { default: "Edit" })}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(network.id, "ssid", network.ssid)}>
                              {copiedField?.id === network.id && copiedField?.field === "ssid" ? (
                                <Check className="h-4 w-4 mr-2" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              {translate("copy_ssid", "wifi", { default: "Copy SSID" })}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteWifi(network.id)} className="text-red-500">
                              {translate("delete", "wifi", { default: "Delete" })}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {translate("showing_results", "wifi", {
              default: `Showing ${startIdx + 1}-${Math.min(endIdx, totalCount)} of ${totalCount} results`,
              startIdx: startIdx + 1,
              endIdx: Math.min(endIdx, totalCount),
              totalCount
            })}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="mx-2 text-sm">
              {translate("page_of", "wifi", {
                default: `Page ${currentPage} of ${totalPages}`,
                currentPage,
                totalPages
              })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add WiFi Dialog */}
      <Dialog open={showAddWifi} onOpenChange={setShowAddWifi}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("add_new_wifi", "wifi", { default: "Add New Wi-Fi Network" })}</DialogTitle>
            <DialogDescription>
              {translate("add_new_wifi_description", "wifi", { default: "Enter your Wi-Fi network details below" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ssid">{translate("ssid", "wifi", { default: "SSID (Network Name)" })}</Label>
              <Input id="ssid" placeholder="Home_Network" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{translate("password", "wifi", { default: "Password" })}</Label>
              <Input id="password" type="password" placeholder="••••••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="security_type">{translate("security_type", "wifi", { default: "Security Type" })}</Label>
              <Select defaultValue="wpa2">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wpa2">WPA2</SelectItem>
                  <SelectItem value="wpa3">WPA3</SelectItem>
                  <SelectItem value="wep">WEP</SelectItem>
                  <SelectItem value="none">{translate("none", "wifi", { default: "None" })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{translate("location", "wifi", { default: "Location" })}</Label>
              <Input id="location" placeholder="Home, Office, etc." />
            </div>
            <div className="space-y-2">
              <Label>{translate("tags", "wifi", { default: "Tags" })}</Label>
              <div className="flex flex-wrap gap-2">
                {["Personal", "Work", "Home", "Office", "Public", "Guest"].map((tag) => (
                  <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowAddWifi(false)}>
              {translate("cancel", "wifi", { default: "Cancel" })}
            </Button>
            <Button type="submit" onClick={() => setShowAddWifi(false)}>
              {translate("save", "wifi", { default: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit WiFi Dialog */}
      <Dialog open={showEditWifi} onOpenChange={setShowEditWifi}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("edit_wifi", "wifi", { default: "Edit Wi-Fi Network" })}</DialogTitle>
            <DialogDescription>
              {translate("edit_wifi_description", "wifi", { default: "Update your Wi-Fi network details" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_ssid">{translate("ssid", "wifi", { default: "SSID (Network Name)" })}</Label>
              <Input 
                id="edit_ssid" 
                defaultValue={selectedWifi?.ssid} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_password">{translate("password", "wifi", { default: "Password" })}</Label>
              <Input 
                id="edit_password" 
                type="password"
                defaultValue={selectedWifi?.password} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_security_type">{translate("security_type", "wifi", { default: "Security Type" })}</Label>
              <Select defaultValue={selectedWifi?.security_type.toLowerCase()}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wpa2">WPA2</SelectItem>
                  <SelectItem value="wpa3">WPA3</SelectItem>
                  <SelectItem value="wep">WEP</SelectItem>
                  <SelectItem value="none">{translate("none", "wifi", { default: "None" })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_location">{translate("location", "wifi", { default: "Location" })}</Label>
              <Input 
                id="edit_location" 
                defaultValue={selectedWifi?.location} 
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("tags", "wifi", { default: "Tags" })}</Label>
              <div className="flex flex-wrap gap-2">
                {["Personal", "Work", "Home", "Office", "Public", "Guest"].map((tag) => (
                  <Badge 
                    key={tag} 
                    variant={selectedWifi?.tags.includes(tag) ? "default" : "outline"} 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowEditWifi(false)}>
              {translate("cancel", "wifi", { default: "Cancel" })}
            </Button>
            <Button type="submit" onClick={() => setShowEditWifi(false)}>
              {translate("update", "wifi", { default: "Update" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{translate("wifi_qr_code", "wifi", { default: "Wi-Fi QR Code" })}</DialogTitle>
            <DialogDescription>
              {translate("wifi_qr_code_description", "wifi", { default: "Scan this QR code to connect to the Wi-Fi network" })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 border border-border flex items-center justify-center">
                {/* Here you would integrate an actual QR Code library */}
                <div className="text-center">
                  <div className="text-sm">{translate("qr_code_placeholder", "wifi", { default: "QR Code for:" })}</div>
                  <div className="font-bold mt-2">{selectedWifi?.ssid}</div>
                  <QrCode className="h-32 w-32 mx-auto mt-4 text-primary" />
                </div>
              </div>
              <div className="mt-4 text-sm text-center">
                <p>{translate("wifi_credentials", "wifi", { default: "Wi-Fi Credentials:" })}</p>
                <p className="font-medium mt-1">
                  SSID: {selectedWifi?.ssid}<br />
                  {translate("password", "wifi", { default: "Password" })}: {selectedWifi?.password}<br />
                  {translate("security_type", "wifi", { default: "Security Type" })}: {selectedWifi?.security_type}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowQrCode(false)}>
              {translate("close", "wifi", { default: "Close" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}