"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User, Plus, Search, Copy, Check, Eye, EyeOff, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Identity {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  passport_number: string;
  national_id: string;
  tags: string[];
  created_at: string;
}

export function IdentityContent() {
  const { translate } = useTranslator();
  const [showAddIdentity, setShowAddIdentity] = useState(false);
  const [showEditIdentity, setShowEditIdentity] = useState(false);
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null);
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null);
  const [viewSensitiveData, setViewSensitiveData] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const mockIdentities: Identity[] = [
    {
      id: "id-1",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      address: "123 Main St, Anytown, CA 94001",
      date_of_birth: "1985-07-15",
      passport_number: "A12345678",
      national_id: "123-45-6789",
      tags: ["Personal"],
      created_at: new Date().toISOString()
    },
    {
      id: "id-2",
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@example.com",
      phone: "+1 (555) 987-6543",
      address: "456 Oak Ave, Somewhere, NY 10001",
      date_of_birth: "1990-03-20",
      passport_number: "B87654321",
      national_id: "987-65-4321",
      tags: ["Work"],
      created_at: new Date().toISOString()
    },
    {
      id: "id-3",
      first_name: "Robert",
      last_name: "Johnson",
      email: "robert.johnson@example.com",
      phone: "+1 (555) 555-5555",
      address: "789 Pine Blvd, Elsewhere, TX 75001",
      date_of_birth: "1978-11-30",
      passport_number: "C56789012",
      national_id: "456-78-9012",
      tags: ["Personal", "Travel"],
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // Simulate data loading
    setIsLoading(true);
    setTimeout(() => {
      setIdentities(mockIdentities);
      setTotalCount(mockIdentities.length);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleAddIdentity = () => {
    setShowAddIdentity(true);
  };

  const handleEditIdentity = (identity: Identity) => {
    setSelectedIdentity(identity);
    setShowEditIdentity(true);
  };

  const handleDeleteIdentity = (id: string) => {
    // Simulate deletion
    setIdentities(prevIdentities => prevIdentities.filter(identity => identity.id !== id));
    toast({
      title: translate("identity_deleted", "identity", { default: "Identity deleted" }),
      description: translate("identity_deleted_description", "identity", { default: "The identity has been deleted successfully" }),
    });
  };

  const copyToClipboard = async (id: string, field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField({ id, field });
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: translate("copied", "identity", { default: "Copied" }),
        description: translate("field_copied", "identity", { default: "Field copied to clipboard" }),
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: translate("copy_failed", "identity", { default: "Copy failed" }),
        description: translate("failed_to_copy_field", "identity", { default: "Failed to copy field to clipboard" }),
        variant: "destructive",
      });
    }
  };

  const toggleDataVisibility = (id: string) => {
    setViewSensitiveData(prev => (prev === id ? null : id));
  };

  const filterIdentities = useCallback(() => {
    let filtered = [...mockIdentities];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(identity => 
        `${identity.first_name} ${identity.last_name}`.toLowerCase().includes(query) ||
        identity.email.toLowerCase().includes(query) ||
        identity.passport_number.toLowerCase().includes(query) ||
        identity.national_id.toLowerCase().includes(query)
      );
    }
    
    if (selectedTag !== "all") {
      filtered = filtered.filter(identity => 
        identity.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
      );
    }
    
    return filtered;
  }, [searchQuery, selectedTag, mockIdentities]);

  const handleSearch = () => {
    const filtered = filterIdentities();
    setIdentities(filtered);
    setTotalCount(filtered.length);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag("all");
    setIdentities(mockIdentities);
    setTotalCount(mockIdentities.length);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const displayedIdentities = identities.slice(startIdx, endIdx);
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

  const maskSensitiveData = (data: string, type: string) => {
    if (viewSensitiveData === type) return data;
    
    if (type === 'passport' || type === 'national_id') {
      return data.replace(/[a-zA-Z0-9]/g, '•');
    } else if (type === 'dob') {
      return '••/••/••••';
    }
    return data;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{translate("identities", "identity", { default: "Identities" })}</h1>
        <Button onClick={handleAddIdentity} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {translate("add_identity", "identity", { default: "Add Identity" })}
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={translate("search_identities", "identity", { default: "Search identities..." })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={translate("filter_by_tag", "identity", { default: "Filter by tag" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("all_tags", "identity", { default: "All Tags" })}</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="travel">Travel</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" className="w-full" onClick={handleSearch}>
            {translate("search", "identity", { default: "Search" })}
          </Button>
          {(searchQuery || selectedTag !== "all") && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Identities Table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-10 text-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">{translate("loading_identities", "identity", { default: "Loading identities..." })}</p>
          </div>
        ) : displayedIdentities.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{translate("no_identities_found", "identity", { default: "No identities found" })}</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              {translate("clear_filters", "identity", { default: "Clear filters" })}
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{translate("name", "identity", { default: "Name" })}</TableHead>
                  <TableHead>{translate("contact", "identity", { default: "Contact" })}</TableHead>
                  <TableHead>{translate("address", "identity", { default: "Address" })}</TableHead>
                  <TableHead>{translate("passport", "identity", { default: "Passport" })}</TableHead>
                  <TableHead>{translate("national_id", "identity", { default: "National ID" })}</TableHead>
                  <TableHead>{translate("date_of_birth", "identity", { default: "Date of Birth" })}</TableHead>
                  <TableHead>{translate("tags", "identity", { default: "Tags" })}</TableHead>
                  <TableHead className="text-right">{translate("actions", "identity", { default: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedIdentities.map((identity) => (
                  <TableRow key={identity.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{`${identity.first_name} ${identity.last_name}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>{identity.email}</div>
                        <div>{identity.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={identity.address}>
                      {identity.address}
                    </TableCell>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span>
                          {viewSensitiveData === identity.id
                            ? identity.passport_number
                            : identity.passport_number.replace(/[a-zA-Z0-9]/g, '•')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(identity.id, "passport", identity.passport_number)}
                        >
                          {copiedField?.id === identity.id && copiedField?.field === "passport" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span>
                          {viewSensitiveData === identity.id
                            ? identity.national_id
                            : identity.national_id.replace(/[a-zA-Z0-9]/g, '•')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(identity.id, "national_id", identity.national_id)}
                        >
                          {copiedField?.id === identity.id && copiedField?.field === "national_id" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {viewSensitiveData === identity.id ? formatDate(identity.date_of_birth) : '••/••/••••'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {identity.tags.map((tag) => (
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
                          onClick={() => toggleDataVisibility(identity.id)}
                          title={translate(viewSensitiveData === identity.id ? "hide_sensitive_data" : "show_sensitive_data", "identity", { default: viewSensitiveData === identity.id ? "Hide sensitive data" : "Show sensitive data" })}
                        >
                          {viewSensitiveData === identity.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditIdentity(identity)}>
                              {translate("edit", "identity", { default: "Edit" })}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteIdentity(identity.id)} className="text-red-500">
                              {translate("delete", "identity", { default: "Delete" })}
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
            {translate("showing_results", "identity", {
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
              {translate("page_of", "identity", {
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

      {/* Add Identity Dialog */}
      <Dialog open={showAddIdentity} onOpenChange={setShowAddIdentity}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("add_new_identity", "identity", { default: "Add New Identity" })}</DialogTitle>
            <DialogDescription>
              {translate("add_new_identity_description", "identity", { default: "Enter your identity details below" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{translate("first_name", "identity", { default: "First Name" })}</Label>
                <Input id="first_name" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">{translate("last_name", "identity", { default: "Last Name" })}</Label>
                <Input id="last_name" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{translate("email", "identity", { default: "Email" })}</Label>
              <Input id="email" type="email" placeholder="john.doe@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{translate("phone", "identity", { default: "Phone" })}</Label>
              <Input id="phone" placeholder="+1 (555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{translate("address", "identity", { default: "Address" })}</Label>
              <Textarea id="address" placeholder="123 Main St, Anytown, CA 94001" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">{translate("date_of_birth", "identity", { default: "Date of Birth" })}</Label>
              <Input id="date_of_birth" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passport_number">{translate("passport_number", "identity", { default: "Passport Number" })}</Label>
              <Input id="passport_number" placeholder="A12345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="national_id">{translate("national_id", "identity", { default: "National ID" })}</Label>
              <Input id="national_id" placeholder="123-45-6789" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowAddIdentity(false)}>
              {translate("cancel", "identity", { default: "Cancel" })}
            </Button>
            <Button type="submit" onClick={() => setShowAddIdentity(false)}>
              {translate("save", "identity", { default: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Identity Dialog */}
      <Dialog open={showEditIdentity} onOpenChange={setShowEditIdentity}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("edit_identity", "identity", { default: "Edit Identity" })}</DialogTitle>
            <DialogDescription>
              {translate("edit_identity_description", "identity", { default: "Update your identity details" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">{translate("first_name", "identity", { default: "First Name" })}</Label>
                <Input 
                  id="edit_first_name" 
                  defaultValue={selectedIdentity?.first_name} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">{translate("last_name", "identity", { default: "Last Name" })}</Label>
                <Input 
                  id="edit_last_name" 
                  defaultValue={selectedIdentity?.last_name} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">{translate("email", "identity", { default: "Email" })}</Label>
              <Input 
                id="edit_email" 
                type="email"
                defaultValue={selectedIdentity?.email} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">{translate("phone", "identity", { default: "Phone" })}</Label>
              <Input 
                id="edit_phone" 
                defaultValue={selectedIdentity?.phone} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_address">{translate("address", "identity", { default: "Address" })}</Label>
              <Textarea 
                id="edit_address" 
                defaultValue={selectedIdentity?.address} 
                rows={3} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_date_of_birth">{translate("date_of_birth", "identity", { default: "Date of Birth" })}</Label>
              <Input 
                id="edit_date_of_birth" 
                type="date"
                defaultValue={selectedIdentity?.date_of_birth} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_passport_number">{translate("passport_number", "identity", { default: "Passport Number" })}</Label>
              <Input 
                id="edit_passport_number" 
                defaultValue={selectedIdentity?.passport_number} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_national_id">{translate("national_id", "identity", { default: "National ID" })}</Label>
              <Input 
                id="edit_national_id" 
                defaultValue={selectedIdentity?.national_id} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowEditIdentity(false)}>
              {translate("cancel", "identity", { default: "Cancel" })}
            </Button>
            <Button type="submit" onClick={() => setShowEditIdentity(false)}>
              {translate("update", "identity", { default: "Update" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 