"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { hashData } from "@/libs/crypto";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface AddPassphraseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPassphraseAdded: () => void;
  existingPassphrases: WalletPassphrase[];
}

const walletTypes = [
  "Bitcoin",
  "Ethereum",
  "Solana",
  "Cardano",
  "Polkadot",
  "Avalanche",
  "Binance Smart Chain",
  "Polygon",
  "Other",
];

export function AddPassphraseDialog({
  open,
  onOpenChange,
  onPassphraseAdded,
  existingPassphrases,
}: AddPassphraseDialogProps) {
  const { translate } = useTranslator();
  const [title, setTitle] = useState("");
  const [data, setData] = useState("");
  const [notes, setNotes] = useState("");
  const [walletType, setWalletType] = useState<string>("Bitcoin");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [passphraseError, setPassphraseError] = useState<string | null>(null);
  const [passphraseExistsError, setPassphraseExistsError] = useState<string | null>(null);
  const [nameExistsError, setNameExistsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const predefinedTags = ["main", "trading", "defi", "staking"];

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags([...tags, normalizedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const validatePassphrase = (passphrase: string) => {
    const words = passphrase.trim().split(/\s+/);
    if (passphrase.trim() === "") {
      setPassphraseError(translate("passphrase_required", "wallet_passphrases", { default: "Passphrase is required" }));
      return false;
    } else if (words.length !== 12) {
      setPassphraseError(
        translate("passphrase_must_be_exactly_12_words", "wallet_passphrases", {
          default: "Passphrase must be exactly 12 words, you entered {count} words",
        }).replace("{count}", words.length.toString())
      );
      return false;
    } else {
      setPassphraseError(null);
      return true;
    }
  };

  const checkIfNameExists = (name: string) => {
    if (!name.trim()) {
      setNameExistsError(translate("please_fill_all_required_fields", "wallet_passphrases", {
        default: "Please fill all required fields",
      }));
      return false;
    }

    const exists = existingPassphrases.some(
      (wp) => wp.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (exists) {
      setNameExistsError(translate("wallet_phrase_already_exists", "wallet_passphrases", {
        default: "Wallet phrase name already exists",
      }));
      return true;
    } else {
      setNameExistsError(null);
      return false;
    }
  };

  const checkIfPassphraseExists = (passphrase: string) => {
    if (!passphrase.trim()) {
      setPassphraseExistsError(null);
      return false;
    }

    const exists = existingPassphrases.some(
      (wp) => wp.passphrase.toLowerCase().trim() === passphrase.toLowerCase().trim()
    );

    if (exists) {
      setPassphraseExistsError(translate("wallet_phrase_already_exists", "wallet_passphrases", {
        default: "Wallet phrase already exists",
      }));
      return true;
    } else {
      setPassphraseExistsError(null);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!title || !data) {
      setError(translate("please_fill_all_required_fields", "wallet_passphrases", {
        default: "Please fill all required fields",
      }));
      return;
    }

    if (!validatePassphrase(data) || checkIfNameExists(title) || checkIfPassphraseExists(data)) {
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for adding passphrase:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setError(translate("no_project_selected", "wallet_passphrases", { default: "No project selected" }));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const hashedData = await hashData(data);

      const payload = {
        title,
        wallet_type: walletType,
        data,
        notes: notes || null,
        tags,
      };

      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/wallet-phrases`,
        payload
      );

      if (response.status === 201 || (response.data && response.data.status_code === 201)) {
        onPassphraseAdded();
        onOpenChange(false);
        toast({
          title: translate("passphrase_added_successfully", "wallet_passphrases", {
            default: "Passphrase added successfully",
          }),
          description: translate("passphrase_added_description", "wallet_passphrases", {
            default: "The wallet passphrase has been added.",
          }),
        });

        // Reset form
        setTitle("");
        setData("");
        setNotes("");
        setWalletType("Bitcoin");
        setTags([]);
        setNewTag("");
        setError("");
        setPassphraseError(null);
        setPassphraseExistsError(null);
        setNameExistsError(null);
      } else {
        throw new Error(
          response.data?.message ||
            translate("failed_to_add_passphrase", "wallet_passphrases", { default: "Failed to add passphrase" })
        );
      }
    } catch (error: any) {
      console.error("Error adding passphrase:", error);
      if (error.response?.status === 400 && error.response.data?.message === "Wallet phrase already exists") {
        setError(translate("wallet_phrase_already_exists", "wallet_passphrases", {
          default: "Wallet phrase already exists",
        }));
      } else if (error.response?.status === 422) {
        setError(translate("invalid_input_data", "wallet_passphrases", { default: "Invalid input data" }));
      } else {
        setError(
          error.response?.data?.message ||
            translate("failed_to_add_passphrase", "wallet_passphrases", { default: "Failed to add passphrase" })
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{translate("add_passphrase", "wallet_passphrases", { default: "Add New Passphrase" })}</DialogTitle>
          <DialogDescription>
            {translate("add_new_passphrase_description", "wallet_passphrases", {
              default: "Enter your wallet passphrase details below",
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {(error || nameExistsError || passphraseError || passphraseExistsError) && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                {error || nameExistsError || passphraseError || passphraseExistsError}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">
              {translate("name", "wallet_passphrases", { default: "Passphrase Name" })}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder={translate("enter_passphrase_name", "wallet_passphrases", {
                default: "Enter passphrase name",
              })}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                checkIfNameExists(e.target.value);
              }}
              className={nameExistsError || (error && !title) ? "border-red-500" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">
              {translate("passphrase", "wallet_passphrases", { default: "Passphrase" })}
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="data"
              placeholder={translate("enter_wallet_recovery_phrase", "wallet_passphrases", {
                default: "Enter wallet recovery phrase",
              })}
              value={data}
              onChange={(e) => {
                setData(e.target.value);
                validatePassphrase(e.target.value);
                checkIfPassphraseExists(e.target.value);
              }}
              className={`font-mono ${passphraseError || passphraseExistsError || (error && !data) ? "border-red-500" : ""}`}
              rows={3}
            />
            {!passphraseError && !passphraseExistsError && (
              <p className="text-xs text-muted-foreground">
                {translate("passphrase_encryption_note", "wallet_passphrases", {
                  default: "The passphrase will be encrypted and securely stored.",
                })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{translate("notes", "wallet_passphrases", { default: "Notes" })}</Label>
            <Input
              id="notes"
              placeholder={translate("enter_notes", "wallet_passphrases", { default: "Enter notes" })}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="walletType">
              {translate("wallet_type", "wallet_passphrases", { default: "Wallet Type" })}
              <span className="text-red-500">*</span>
            </Label>
            <Select value={walletType} onValueChange={setWalletType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={translate("select_wallet_type", "wallet_passphrases", {
                  default: "Select wallet type",
                })} />
              </SelectTrigger>
              <SelectContent>
                {walletTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{translate("tags", "wallet_passphrases", { default: "Tags" })}</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder={translate("add_a_tag", "wallet_passphrases", { default: "Add a tag" })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newTag))}
              />
              <Button type="button" onClick={() => addTag(newTag)}>
                {translate("add", "wallet_passphrases", { default: "Add" })}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {predefinedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {translate("cancel", "wallet_passphrases", { default: "Cancel" })}
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? translate("adding", "wallet_passphrases", { default: "Adding..." })
              : translate("save_passphrase", "wallet_passphrases", { default: "Add Passphrase" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}