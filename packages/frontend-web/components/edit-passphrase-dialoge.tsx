"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, X, Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { hashData } from "../libs/crypto";

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

interface EditPassphraseDialogProps {
  passphrase: WalletPassphrase;
  onClose: () => void;
  onPassphraseUpdated: () => void;
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

export function EditPassphraseDialog({ passphrase, onClose, onPassphraseUpdated, existingPassphrases }: EditPassphraseDialogProps) {
  const { translate } = useTranslator();
  const [title, setTitle] = useState(passphrase.title);
  const [data, setData] = useState(passphrase.data);
  const [notes, setNotes] = useState(passphrase.notes || "");
  const [walletType, setWalletType] = useState<string>(passphrase.wallet_type || "Bitcoin");
  const [tags, setTags] = useState<string[]>(passphrase.tags || []);
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
    if (!passphrase.trim()) {
      setPassphraseError(null);
      return true; // Passphrase is optional
    }
    const words = passphrase.trim().split(/\s+/);
    if (words.length !== 12) {
      setPassphraseError(
        translate("passphrase_must_be_exactly_12_words", "wallet_passphrases").replace("{count}", words.length.toString())
      );
      return false;
    } else {
      setPassphraseError(null);
      return true;
    }
  };

  const checkIfNameExists = (name: string) => {
    if (!name.trim()) {
      setNameExistsError(translate("please_fill_all_required_fields", "wallet_passphrases"));
      return true;
    }

    const exists = existingPassphrases.some(
      (wp: WalletPassphrase) =>
        wp.doc_id !== passphrase.doc_id &&
        wp.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (exists) {
      setNameExistsError(translate("wallet_phrase_already_exists", "wallet_passphrases"));
      return true;
    } else {
      setNameExistsError(null);
      return false;
    }
  };

  const checkIfPassphraseExists = (passphrase_text: string) => {
    if (!passphrase_text.trim()) {
      setPassphraseExistsError(null);
      return false;
    }

    const exists = existingPassphrases.some(
      (wp: WalletPassphrase) =>
        wp.doc_id !== passphrase.doc_id &&
        wp.passphrase.toLowerCase().trim() === passphrase_text.toLowerCase().trim()
    );

    if (exists) {
      setPassphraseExistsError(translate("wallet_phrase_already_exists", "wallet_passphrases"));
      return true;
    } else {
      setPassphraseExistsError(null);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!title) {
      setError(translate("please_fill_all_required_fields", "wallet_passphrases"));
      return;
    }

    if (data && (!validatePassphrase(data) || checkIfPassphraseExists(data))) {
      return;
    }

    if (checkIfNameExists(title)) {
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for updating passphrase:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setError(translate("no_project_selected", "wallet_passphrases"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload: any = {
        title,
        wallet_type: walletType,
        notes: notes || null,
        tags,
      };

      if (data) {
        const hashedData = await hashData(data);
        payload.data = data;
      }

      const response = await axiosInstance.put(
        `/${selectedWorkspaceId}/${selectedProjectId}/wallet-phrases/${passphrase.doc_id}`,
        payload
      );

      if (response.status === 200 || (response.data && response.data.status_code === 200)) {
        onPassphraseUpdated();
        onClose();
        toast({
          title: translate("passphrase_updated_successfully", "wallet_passphrases"),
          description: translate("passphrase_updated_description", "wallet_passphrases"),
        });
      } else {
        throw new Error(response.data?.message || translate("failed_to_update_passphrase", "wallet_passphrases"));
      }
    } catch (error: any) {
      console.error("Error updating passphrase:", error);
      if (error.response?.status === 400 && error.response.data?.message === "Wallet phrase already exists") {
        setError(translate("wallet_phrase_already_exists", "wallet_passphrases"));
      } else if (error.response?.status === 422) {
        setError(translate("invalid_input_data", "wallet_passphrases"));
      } else if (error.response?.status === 404) {
        setError(translate("passphrase_not_found", "wallet_passphrases"));
      } else {
        setError(error.response?.data?.message || translate("failed_to_update_passphrase", "wallet_passphrases"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">{translate("edit_passphrase", "wallet_passphrases")}</h2>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {translate("name", "wallet_passphrases")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                placeholder={translate("enter_passphrase_name", "wallet_passphrases")}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  checkIfNameExists(e.target.value);
                }}
                className={`pr-8 ${nameExistsError ? "border-destructive" : ""}`}
                required
              />
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              {nameExistsError && (
                <div className="flex items-center mt-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {nameExistsError}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("passphrase", "wallet_passphrases")}</label>
            <Textarea
              placeholder={translate("enter_wallet_recovery_phrase", "wallet_passphrases")}
              value={data}
              onChange={(e) => {
                setData(e.target.value);
                validatePassphrase(e.target.value);
                checkIfPassphraseExists(e.target.value);
              }}
              className={`font-mono ${passphraseError || passphraseExistsError ? "border-destructive" : ""}`}
              rows={3}
            />
            {passphraseError ? (
              <div className="flex items-center mt-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                {passphraseError}
              </div>
            ) : passphraseExistsError ? (
              <div className="flex items-center mt-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                {passphraseExistsError}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {translate("passphrase_encryption_note", "wallet_passphrases")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("notes", "wallet_passphrases")}</label>
            <Input
              placeholder={translate("enter_notes", "wallet_passphrases")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {translate("wallet_type", "wallet_passphrases")} <span className="text-red-500">*</span>
            </label>
            <Select value={walletType} onValueChange={setWalletType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={translate("select_wallet_type", "wallet_passphrases")} />
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
            <label className="text-sm font-medium">{translate("tags", "wallet_passphrases")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder={translate("add_a_tag", "wallet_passphrases")}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(newTag);
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => addTag(newTag)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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

          <div className="flex items-center justify-between gap-2 pt-4">
            <Button variant="outline" className="w-full" onClick={onClose} disabled={isSubmitting}>
              {translate("cancel", "wallet_passphrases")}
            </Button>
            <Button
              variant="default"
              className="w-full bg-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={
                !title ||
                passphraseError !== null ||
                passphraseExistsError !== null ||
                nameExistsError !== null ||
                isSubmitting
              }
            >
              {isSubmitting ? `${translate("updating", "wallet_passphrases")}...` : translate("update_passphrase", "wallet_passphrases")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}