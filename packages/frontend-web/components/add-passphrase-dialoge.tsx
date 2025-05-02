"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { encrypt, hexToCryptoKey, ENCRYPTION_KEY } from "@/libs/crypto";
import axiosInstance from "../libs/Middleware/axiosInstace";

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
  decrypted?: boolean;
}

interface AddPassphraseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (newPassphrase: WalletPassphrase) => void;
  existingPassphrases: WalletPassphrase[];
  workspaceId: string | null;
  projectId: string | null;
  accessToken: string | null;
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
  isOpen,
  onOpenChange,
  onAdd,
  existingPassphrases,
  workspaceId,
  projectId,
  accessToken,
}: AddPassphraseDialogProps) {
  console.log("AddPassphraseDialog rendered, isOpen:", isOpen); // Debugging
  const { translate } = useTranslator();
  const [formData, setFormData] = useState({
    name: "",
    walletType: "Bitcoin",
    passphrase: "",
    walletAddress: "",
    tags: "",
    notes: "",
  });
  const [passphraseError, setPassphraseError] = useState<string | null>(null);
  const [passphraseExistsError, setPassphraseExistsError] = useState<string | null>(null);
  const [nameExistsError, setNameExistsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "passphrase") {
      validatePassphrase(value);
      checkIfPassphraseExists(value);
    } else if (name === "name") {
      checkIfNameExists(value);
    }
  };

  const handleWalletTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      walletType: value,
    }));
  };

  const validatePassphrase = (passphrase: string) => {
    const words = passphrase.trim().split(/\s+/);
    if (passphrase.trim() === "") {
      setPassphraseError(null);
      return false;
    } else if (words.length !== 12) {
      setPassphraseError(`Passphrase must contain exactly 12 words (currently ${words.length})`);
      return false;
    } else {
      setPassphraseError(null);
      return true;
    }
  };

  const checkIfNameExists = (name: string) => {
    if (!name.trim()) {
      setNameExistsError(null);
      return;
    }

    const exists = existingPassphrases.some(
      (wp) => wp.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (exists) {
      setNameExistsError("A wallet with this name already exists");
    } else {
      setNameExistsError(null);
    }
  };

  const checkIfPassphraseExists = (passphrase: string) => {
    if (!passphrase.trim()) {
      setPassphraseExistsError(null);
      return;
    }

    const exists = existingPassphrases.some(
      (wp) => wp.passphrase.toLowerCase().trim() === passphrase.toLowerCase().trim()
    );

    if (exists) {
      setPassphraseExistsError("This passphrase already exists in your wallet");
    } else {
      setPassphraseExistsError(null);
    }
  };

  const addPassphrase = async () => {
    if (!formData.name || !formData.passphrase) {
      toast({
        title: "Error",
        description: "Name and passphrase are required",
        variant: "destructive",
      });
      return;
    }

    if (!validatePassphrase(formData.passphrase)) {
      return;
    }

    if (!workspaceId || !projectId || !accessToken) {
      toast({
        title: "Error",
        description: "No workspace or project selected",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create data object for encryption
      const dataToEncrypt = JSON.stringify({
        passphrase: formData.passphrase,
        walletAddress: formData.walletAddress || null,
      });

      // Encrypt the JSON string
      const cryptoKey = await hexToCryptoKey(ENCRYPTION_KEY);
      const encryptedData = await encrypt(dataToEncrypt, cryptoKey);

      // Prepare payload matching updated backend WalletPhrase schema
      const formattedTags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name,
        wallet_type: formData.walletType,
        tags: formattedTags,
        data: encryptedData,
        phrase: "", // Placeholder to satisfy current schema
      };

      const response = await axiosInstance.post(
        `/${workspaceId}/${projectId}/wallet-phrases`,
        payload,
        { headers: { "access-token": accessToken } }
      );

      if (response.status === 201 || (response.data && response.data.status_code === 201)) {
        const newPassphrase: WalletPassphrase = {
          id: response.data?.doc_id || Date.now().toString(),
          name: formData.name,
          walletType: formData.walletType,
          passphrase: formData.passphrase,
          walletAddress: formData.walletAddress,
          tags: formattedTags,
          notes: formData.notes,
          createdAt: new Date(),
          lastAccessed: new Date(),
          data: encryptedData,
          decrypted: true,
        };

        onAdd(newPassphrase);
        onOpenChange(false);
        resetFormData();

        toast({
          title: "Passphrase added",
          description: "Your wallet passphrase has been securely stored.",
        });
      } else {
        throw new Error(response.data?.message || translate("failed_to_add_passphrase", "wallet_passphrases"));
      }
    } catch (error: any) {
      console.error("Error adding passphrase:", error);

      if (error.response) {
        if (error.response.status === 400 && error.response.data?.message === "Wallet phrase already exists") {
          setNameExistsError(translate("wallet_phrase_already_exists", "wallet_passphrases"));
        } else if (error.response.status === 422) {
          const details = error.response.data?.detail || [];
          const errorMessages = details.map((err: any) => err.msg).join(", ");
          toast({
            title: "Error",
            description: errorMessages || translate("invalid_input", "wallet_passphrases"),
            variant: "destructive",
          });
        } else if (error.response.status === 500) {
          toast({
            title: "Error",
            description: translate("error_adding_passphrase", "wallet_passphrases"),
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.response.data?.message || translate("failed_to_add_passphrase", "wallet_passphrases"),
            variant: "destructive",
          });
        }
      } else if (error.request) {
        toast({
          title: "Error",
          description: translate("network_error", "wallet_passphrases"),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `${translate("error_adding_passphrase", "wallet_passphrases")}: ${error.message}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      walletType: "Bitcoin",
      passphrase: "",
      walletAddress: "",
      tags: "",
      notes: "",
    });
    setPassphraseError(null);
    setPassphraseExistsError(null);
    setNameExistsError(null);
  };

  // Handle closing the dialog properly
  const handleDialogChange = (open: boolean) => {
    console.log("AddPassphraseDialog onOpenChange, open:", open); // Debugging
    onOpenChange(open);
    if (!open) resetFormData();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        style={{
          maxHeight: "90vh",
          overflowY: "auto",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <DialogHeader>
          <DialogTitle>{translate("add_passphrase", "wallet_passphrases")}</DialogTitle>
          <DialogDescription>
            {translate("add_passphrase_description", "wallet_passphrases")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <div className="col-span-3">
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`${nameExistsError ? "border-destructive" : ""}`}
                placeholder="My Bitcoin Wallet"
                required
              />
              {nameExistsError && (
                <div className="flex items-center mt-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {nameExistsError}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="walletType" className="text-right">
              Wallet Type
            </Label>
            <Select value={formData.walletType} onValueChange={handleWalletTypeChange}>
              <SelectTrigger id="walletType" className="col-span-3">
                <SelectValue placeholder="Select wallet type" />
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="passphrase" className="text-right">
              Passphrase
            </Label>
            <div className="col-span-3">
              <Textarea
                id="passphrase"
                name="passphrase"
                value={formData.passphrase}
                onChange={handleInputChange}
                placeholder="Enter your wallet recovery phrase or seed words"
                className={`font-mono ${passphraseError || passphraseExistsError ? "border-destructive" : ""}`}
                rows={3}
                required
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
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="walletAddress" className="text-right">
              Wallet Address
            </Label>
            <Input
              id="walletAddress"
              name="walletAddress"
              value={formData.walletAddress}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="Enter your wallet address"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">
              Tags
            </Label>
            <Input
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="main, trading, defi (comma separated)"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="Additional notes about this wallet"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 bg-background pt-2 pb-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={addPassphrase}
            disabled={
              !formData.name ||
              !formData.passphrase ||
              passphraseError !== null ||
              passphraseExistsError !== null ||
              nameExistsError !== null ||
              isSubmitting
            }
          >
            {isSubmitting ? `${translate("adding", "wallet_passphrases")}...` : translate("save_passphrase", "wallet_passphrases")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}