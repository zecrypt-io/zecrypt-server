"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslator } from "@/hooks/use-translations";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { encryptDataField } from "@/libs/encryption";
import { secureGetItem } from "@/libs/local-storage-utils";

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardAdded: () => void;
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
}

export function AddCardDialog({
  open,
  onOpenChange,
  onCardAdded,
  selectedWorkspaceId,
  selectedProjectId,
}: AddCardDialogProps) {
  const { translate } = useTranslator();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("01");
  const [expiryYear, setExpiryYear] = useState(new Date().getFullYear().toString());
  const [cvv, setCvv] = useState("");
  const [brand, setBrand] = useState("visa");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = translate("title_required", "cards", { default: "Title is required" });
    }

    if (!cardHolderName.trim()) {
      errors.cardHolderName = translate("card_holder_name_required", "cards", { default: "Card holder name is required" });
    }

    if (!cardNumber.trim()) {
      errors.cardNumber = translate("card_number_required", "cards", { default: "Card number is required" });
    } else {
      // Simple card number validation - remove spaces and check if it's a number with valid length
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      if (!/^\d+$/.test(cleanCardNumber) || cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
        errors.cardNumber = translate("invalid_card_number", "cards", { default: "Invalid card number" });
      }
    }

    if (!cvv.trim()) {
      errors.cvv = translate("cvv_required", "cards", { default: "CVV is required" });
    } else if (!/^\d+$/.test(cvv) || cvv.length < 3 || cvv.length > 4) {
      errors.cvv = translate("invalid_cvv", "cards", { default: "Invalid CVV" });
    }

    if (!brand) {
      errors.brand = translate("brand_required", "cards", { default: "Brand is required" });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({
        title: translate("error", "actions"),
        description: translate("missing_workspace_project", "cards", { default: "Missing workspace or project" }),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the data field as a JSON string with fields to be encrypted
      const dataToEncrypt = {
        card_holder_name: cardHolderName,
        number: cardNumber,
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        cvv: cvv
      };

      // Find the current project to get its name
      const currentProject = workspaces
        .find(ws => ws.workspaceId === selectedWorkspaceId)
        ?.projects.find(p => p.project_id === selectedProjectId);
      
      if (!currentProject) {
        toast({
          title: translate("error", "actions"),
          description: translate("project_not_found", "cards", { default: "Project not found" }),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get the project's AES key from session storage
      const projectKeyName = `projectKey_${currentProject.name}`;
      const projectAesKey = await secureGetItem(projectKeyName);
      
      if (!projectAesKey) {
        toast({
          title: translate("error", "actions"),
          description: translate("encryption_key_not_found", "cards", { default: "Encryption key not found" }),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Encrypt the data
      let encryptedData;
      try {
        encryptedData = await encryptDataField(JSON.stringify(dataToEncrypt), projectAesKey);
      } catch (encryptError) {
        console.error("Failed to encrypt card data:", encryptError);
        toast({
          title: translate("error", "actions"),
          description: translate("encryption_failed", "cards", { default: "Failed to encrypt card data" }),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title,
        data: encryptedData,
        brand,
        notes: notes || null,
        tags: tags.length > 0 ? tags : undefined,
      };

      await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/cards`,
        payload
      );

      toast({
        title: translate("success", "actions"),
        description: translate("card_added_successfully", "cards", { default: "Card added successfully" }),
      });

      // Reset form
      setTitle("");
      setCardHolderName("");
      setCardNumber("");
      setExpiryMonth("01");
      setExpiryYear(new Date().getFullYear().toString());
      setCvv("");
      setBrand("visa");
      setNotes("");
      setTags([]);
      setCurrentTag("");
      setValidationErrors({});

      onCardAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding card:", error);
      let errorMessage = translate("error_adding_card", "cards", { default: "Error adding card" });
      if (error.response?.data?.message) {
        errorMessage = `${errorMessage}: ${error.response.data.message}`;
      }
      toast({
        title: translate("error", "actions"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{translate("add_new_card", "cards", { default: "Add New Card" })}</DialogTitle>
          <DialogDescription>
            {translate("add_new_card_description", "cards", { default: "Enter your credit card details below" })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">{translate("title", "cards", { default: "Title" })}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={translate("title_placeholder", "cards", { default: "Personal Visa Card" })}
              className={validationErrors.title ? "border-red-500" : ""}
            />
            {validationErrors.title && (
              <p className="text-red-500 text-sm">{validationErrors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="card_holder_name">{translate("card_holder_name", "cards", { default: "Card Holder Name" })}</Label>
            <Input
              id="card_holder_name"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
              placeholder={translate("card_holder_name_placeholder", "cards", { default: "John Doe" })}
              className={validationErrors.cardHolderName ? "border-red-500" : ""}
            />
            {validationErrors.cardHolderName && (
              <p className="text-red-500 text-sm">{validationErrors.cardHolderName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">{translate("brand", "cards", { default: "Brand" })}</Label>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className={validationErrors.brand ? "border-red-500" : ""}>
                <SelectValue placeholder={translate("select_brand", "cards", { default: "Select brand" })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="mastercard">Mastercard</SelectItem>
                <SelectItem value="american express">American Express</SelectItem>
                <SelectItem value="discover">Discover</SelectItem>
                <SelectItem value="other">{translate("other", "cards", { default: "Other" })}</SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.brand && (
              <p className="text-red-500 text-sm">{validationErrors.brand}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="card_number">{translate("card_number", "cards", { default: "Card Number" })}</Label>
            <Input
              id="card_number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder={translate("card_number_placeholder", "cards", { default: "4111 1111 1111 1111" })}
              className={validationErrors.cardNumber ? "border-red-500" : ""}
            />
            {validationErrors.cardNumber && (
              <p className="text-red-500 text-sm">{validationErrors.cardNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry_month">{translate("expiry_month", "cards", { default: "Expiry Month" })}</Label>
              <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, '0');
                    return <SelectItem key={month} value={month}>{month}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_year">{translate("expiry_year", "cards", { default: "Expiry Year" })}</Label>
              <Select value={expiryYear} onValueChange={setExpiryYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = (new Date().getFullYear() + i).toString();
                    return <SelectItem key={year} value={year}>{year}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">{translate("cvv", "cards", { default: "CVV" })}</Label>
              <Input
                id="cvv"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                className={validationErrors.cvv ? "border-red-500" : ""}
              />
              {validationErrors.cvv && (
                <p className="text-red-500 text-sm">{validationErrors.cvv}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{translate("notes", "cards", { default: "Notes" })}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={translate("notes_placeholder", "cards", { default: "Additional information about this card" })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{translate("tags", "cards", { default: "Tags" })}</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder={translate("tags_placeholder", "cards", { default: "Add tags" })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag}>
                {translate("add", "cards", { default: "Add" })}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {translate("cancel", "cards", { default: "Cancel" })}
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? translate("adding", "cards", { default: "Adding..." })
              : translate("add_card", "cards", { default: "Add Card" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 