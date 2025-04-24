"use client";

import type React from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Eye, EyeOff, X, Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslator } from "@/hooks/use-translations";
import { hashData, encrypt, hexToCryptoKey, ENCRYPTION_KEY } from "../libs/crypto";
import axiosInstance from "../libs/Middleware/axiosInstace";

interface AddAccountDialogProps {
  onClose: () => void;
  onAccountAdded: () => void;
}

export function AddAccountDialog({ onClose, onAccountAdded }: AddAccountDialogProps) {
  const { translate } = useTranslator();
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const predefinedTags = ["Personal", "Work", "Finance", "Social", "Shopping", "Entertainment", "Favorite"];

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!name || !userName || !password) {
      setError(translate("please_fill_all_required_fields", "accounts"));
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for adding account:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setError(translate("no_project_selected", "accounts"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Create data object
      const data = { user_name: userName, password };

      // Hash the data object with fixed salt
      const { hash, salt } = await hashData(data);

      // Encrypt the hash
      const cryptoKey = await hexToCryptoKey(ENCRYPTION_KEY);
      const encryptedHash = await encrypt(hash, cryptoKey);

      // Prepare payload with encrypted hash as data
      const payload = {
        name,
        user_name: userName,
        password,
        website: website || null,
        tags,
        data: encryptedHash,
      };

      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/accounts`,
        payload
      );

      if (response.status === 201 || (response.data && response.data.status_code === 201)) {
        onAccountAdded();
        onClose();
      } else {
        throw new Error(response.data?.message || translate("failed_to_add_account", "accounts"));
      }
    } catch (error: any) {
      console.error("Error adding account:", error);
      
      if (error.response) {
        // Server responded with an error status
        if (error.response.status === 400 && error.response.data?.message === "Account already exists") {
          setError(translate("account_already_exists", "accounts"));
        } else if (error.response.status === 500) {
          setError(translate("error_adding_account", "accounts"));
        } else {
          setError(error.response.data?.message || translate("failed_to_add_account", "accounts"));
        }
      } else if (error.request) {
        // Request was made but no response received
        setError(translate("network_error", "accounts"));
      } else {
        // Something else happened
        setError(`${translate("error_adding_account", "accounts")}: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg relative">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">{translate("add_new_account", "accounts")}</h2>
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
              {translate("account_name", "accounts")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                placeholder={translate("enter_account_name", "accounts")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pr-8"
                required
              />
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {translate("username", "accounts")} <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={translate("enter_username", "accounts")}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {translate("password", "accounts")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={translate("enter_password", "accounts")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-8"
                required
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("website", "accounts")}</label>
            <Input
              placeholder={translate("enter_website_url", "accounts")}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("tags", "accounts")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder={translate("add_custom_tag", "accounts")}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTag) {
                      e.preventDefault();
                      addTag(newTag);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => addTag(newTag)}
                  disabled={!newTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {predefinedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {translate("cancel", "accounts")}
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? translate("saving", "accounts") : translate("save", "accounts")}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={onClose}
          disabled={isSubmitting}
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}