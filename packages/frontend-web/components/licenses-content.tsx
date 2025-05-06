"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Key, Plus, Search, Copy, Check, Eye, EyeOff, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, AlertTriangle, Calendar
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

interface License {
  id: string;
  name: string;
  license_key: string;
  expiry_date: string;
  software: string;
  tags: string[];
  created_at: string;
}

export function LicensesContent() {
  const { translate } = useTranslator();
  const [showAddLicense, setShowAddLicense] = useState(false);
  const [showEditLicense, setShowEditLicense] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null);
  const [viewLicenseKey, setViewLicenseKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const mockLicenses: License[] = [
    {
      id: "license-1",
      name: "Adobe Photoshop",
      license_key: "ADOBE-PS-1234-5678-90AB-CDEF",
      expiry_date: "2024-12-31",
      software: "Adobe Photoshop 2023",
      tags: ["Design", "Creative"],
      created_at: new Date().toISOString()
    },
    {
      id: "license-2",
      name: "Microsoft Office",
      license_key: "MSFT-OFF-9876-5432-10ZY-XWVU",
      expiry_date: "2025-06-30",
      software: "Microsoft Office 365",
      tags: ["Productivity", "Office"],
      created_at: new Date().toISOString()
    },
    {
      id: "license-3",
      name: "Unity Pro",
      license_key: "UNITY-PRO-ABCD-EFGH-IJKL-MNOP",
      expiry_date: "2024-09-15",
      software: "Unity Game Engine Pro",
      tags: ["Development", "Game"],
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // Simulate data loading
    setIsLoading(true);
    setTimeout(() => {
      setLicenses(mockLicenses);
      setTotalCount(mockLicenses.length);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleAddLicense = () => {
    setShowAddLicense(true);
  };

  const handleEditLicense = (license: License) => {
    setSelectedLicense(license);
    setShowEditLicense(true);
  };

  const handleDeleteLicense = (id: string) => {
    // Simulate deletion
    setLicenses(prevLicenses => prevLicenses.filter(license => license.id !== id));
    toast({
      title: translate("license_deleted", "licenses", { default: "License deleted" }),
      description: translate("license_deleted_description", "licenses", { default: "The license has been deleted successfully" }),
    });
  };

  const copyToClipboard = async (id: string, field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField({ id, field });
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: translate("copied", "licenses", { default: "Copied" }),
        description: translate("field_copied", "licenses", { default: "Field copied to clipboard" }),
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: translate("copy_failed", "licenses", { default: "Copy failed" }),
        description: translate("failed_to_copy_field", "licenses", { default: "Failed to copy field to clipboard" }),
        variant: "destructive",
      });
    }
  };

  const toggleLicenseKeyVisibility = (id: string) => {
    setViewLicenseKey(prev => (prev === id ? null : id));
  };

  const filterLicenses = useCallback(() => {
    let filtered = [...mockLicenses];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(license => 
        license.name.toLowerCase().includes(query) ||
        license.software.toLowerCase().includes(query) ||
        license.license_key.toLowerCase().includes(query)
      );
    }
    
    if (selectedTag !== "all") {
      filtered = filtered.filter(license => 
        license.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
      );
    }
    
    return filtered;
  }, [searchQuery, selectedTag, mockLicenses]);

  const handleSearch = () => {
    const filtered = filterLicenses();
    setLicenses(filtered);
    setTotalCount(filtered.length);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag("all");
    setLicenses(mockLicenses);
    setTotalCount(mockLicenses.length);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const displayedLicenses = licenses.slice(startIdx, endIdx);
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const isExpired = (dateString: string) => {
    try {
      const expiryDate = new Date(dateString);
      const now = new Date();
      return expiryDate < now;
    } catch (e) {
      return false;
    }
  };

  const daysUntilExpiry = (dateString: string) => {
    try {
      const expiryDate = new Date(dateString);
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return 0;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{translate("software_licenses", "licenses", { default: "Software Licenses" })}</h1>
        <Button onClick={handleAddLicense} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_license", "licenses", { default: "Add License" })}
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={translate("search_licenses", "licenses", { default: "Search licenses..." })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={translate("filter_by_tag", "licenses", { default: "Filter by tag" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("all_tags", "licenses", { default: "All Tags" })}</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="creative">Creative</SelectItem>
            <SelectItem value="productivity">Productivity</SelectItem>
            <SelectItem value="office">Office</SelectItem>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="game">Game</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" className="w-full" onClick={handleSearch}>
            {translate("search", "licenses", { default: "Search" })}
          </Button>
          {(searchQuery || selectedTag !== "all") && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Licenses Table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-10 text-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">{translate("loading_licenses", "licenses", { default: "Loading licenses..." })}</p>
          </div>
        ) : displayedLicenses.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{translate("no_licenses_found", "licenses", { default: "No licenses found" })}</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              {translate("clear_filters", "licenses", { default: "Clear filters" })}
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{translate("name", "licenses", { default: "Name" })}</TableHead>
                  <TableHead>{translate("software", "licenses", { default: "Software" })}</TableHead>
                  <TableHead>{translate("license_key", "licenses", { default: "License Key" })}</TableHead>
                  <TableHead>{translate("expiry_date", "licenses", { default: "Expiry Date" })}</TableHead>
                  <TableHead>{translate("tags", "licenses", { default: "Tags" })}</TableHead>
                  <TableHead className="text-right">{translate("actions", "licenses", { default: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <span>{license.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{license.software}</TableCell>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span>
                          {viewLicenseKey === license.id ? license.license_key : "••••-••••-••••-••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleLicenseKeyVisibility(license.id)}
                        >
                          {viewLicenseKey === license.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(license.id, "license_key", license.license_key)}
                        >
                          {copiedField?.id === license.id && copiedField?.field === "license_key" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`${isExpired(license.expiry_date) ? 'text-red-500' : (daysUntilExpiry(license.expiry_date) < 30 ? 'text-amber-500' : 'text-green-500')}`}>
                          {formatDate(license.expiry_date)}
                        </span>
                        {isExpired(license.expiry_date) ? (
                          <Badge variant="destructive" className="text-xs">
                            {translate("expired", "licenses", { default: "Expired" })}
                          </Badge>
                        ) : daysUntilExpiry(license.expiry_date) < 30 ? (
                          <Badge variant="outline" className="text-xs text-amber-500 border-amber-500">
                            {translate("expiring_soon", "licenses", { default: "Expiring soon" })}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {license.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditLicense(license)}>
                            {translate("edit", "licenses", { default: "Edit" })}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteLicense(license.id)} className="text-red-500">
                            {translate("delete", "licenses", { default: "Delete" })}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            {translate("showing_results", "licenses", {
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
              {translate("page_of", "licenses", {
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

      {/* Add License Dialog */}
      <Dialog open={showAddLicense} onOpenChange={setShowAddLicense}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("add_new_license", "licenses", { default: "Add New License" })}</DialogTitle>
            <DialogDescription>
              {translate("add_new_license_description", "licenses", { default: "Enter your software license details below" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{translate("name", "licenses", { default: "Name" })}</Label>
              <Input id="name" placeholder="Adobe Photoshop" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="software">{translate("software", "licenses", { default: "Software" })}</Label>
              <Input id="software" placeholder="Adobe Photoshop 2023" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_key">{translate("license_key", "licenses", { default: "License Key" })}</Label>
              <Input id="license_key" placeholder="XXXX-XXXX-XXXX-XXXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_date">{translate("expiry_date", "licenses", { default: "Expiry Date" })}</Label>
              <Input id="expiry_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label>{translate("tags", "licenses", { default: "Tags" })}</Label>
              <div className="flex flex-wrap gap-2">
                {["Design", "Creative", "Productivity", "Office", "Development", "Game"].map((tag) => (
                  <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowAddLicense(false)}>
              {translate("cancel", "licenses", { default: "Cancel" })}
            </Button>
            <Button type="submit" onClick={() => setShowAddLicense(false)}>
              {translate("save", "licenses", { default: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit License Dialog */}
      <Dialog open={showEditLicense} onOpenChange={setShowEditLicense}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("edit_license", "licenses", { default: "Edit License" })}</DialogTitle>
            <DialogDescription>
              {translate("edit_license_description", "licenses", { default: "Update your software license details" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">{translate("name", "licenses", { default: "Name" })}</Label>
              <Input 
                id="edit_name" 
                defaultValue={selectedLicense?.name} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_software">{translate("software", "licenses", { default: "Software" })}</Label>
              <Input 
                id="edit_software" 
                defaultValue={selectedLicense?.software} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_license_key">{translate("license_key", "licenses", { default: "License Key" })}</Label>
              <Input 
                id="edit_license_key" 
                defaultValue={selectedLicense?.license_key} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_expiry_date">{translate("expiry_date", "licenses", { default: "Expiry Date" })}</Label>
              <Input 
                id="edit_expiry_date" 
                type="date"
                defaultValue={selectedLicense?.expiry_date} 
              />
            </div>
            <div className="space-y-2">
              <Label>{translate("tags", "licenses", { default: "Tags" })}</Label>
              <div className="flex flex-wrap gap-2">
                {["Design", "Creative", "Productivity", "Office", "Development", "Game"].map((tag) => (
                  <Badge 
                    key={tag} 
                    variant={selectedLicense?.tags.includes(tag) ? "default" : "outline"} 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowEditLicense(false)}>
              {translate("cancel", "licenses", { default: "Cancel" })}
            </Button>
            <Button type="submit" onClick={() => setShowEditLicense(false)}>
              {translate("update", "licenses", { default: "Update" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 