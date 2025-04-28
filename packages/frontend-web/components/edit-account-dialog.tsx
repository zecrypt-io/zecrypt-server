"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Eye, EyeOff, X, Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslator } from "@/hooks/use-translations";
import { hashData, encrypt, hexToCryptoKey, ENCRYPTION_KEY } from "../libs/crypto";
import axiosInstance from "../libs/Middleware/axiosInstace";

interface Account {
  doc_id: string;
  name: string;
  lower_name: string;
  user_name?: string;
  password?: string;
  data?: string | { user_name: string; password: string };
  website?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
  decrypted?: boolean;
}

interface EditAccountDialogProps {
  account: Account;
  onClose: () => void;
  onAccountUpdated: () => void;
}

export function EditAccountDialog({ account, onClose, onAccountUpdated }: EditAccountDialogProps) {
  const { translate } = useTranslator();
  const [name, setName] = useState(account.name);
  const [userName, setUserName] = useState(account.user_name || "");
  const [password, setPassword] = useState(account.password || "");
  const [website, setWebsite] = useState(account.website || "");
  const [tags, setTags] = useState<string[]>(account.tags || []);
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
      console.error("Missing required data for updating account:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setError(translate("no_project_selected", "accounts"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Create data object for encryption
      const dataToEncrypt = { user_name: userName, password };
      const cryptoKey = await hexToCryptoKey(ENCRYPTION_KEY);
      
      let encryptedData;
      
      if (password !== account.password) {
        // Only encrypt if password was changed
        encryptedData = await encrypt(JSON.stringify(dataToEncrypt), cryptoKey);
      } else {
        // Use existing data if password wasn't changed
        encryptedData = typeof account.data === 'string' ? account.data : 
                        await encrypt(JSON.stringify(dataToEncrypt), cryptoKey);
      }

      // Prepare payload according to backend schema
      const payload = {
        name,
        website: website || null,
        tags,
        data: encryptedData,
      };

      const response = await axiosInstance.put(
        `/${selectedWorkspaceId}/${selectedProjectId}/accounts/${account.doc_id}`,
        payload
      );

      if (response.status === 200 || (response.data && response.data.status_code === 200)) {
        onAccountUpdated();
        onClose();
      } else {
        throw new Error(response.data?.message || translate("failed_to_update_account", "accounts"));
      }
    } catch (error: any) {
      console.error("Error updating account:", error);
      
      if (error.response) {
        if (error.response.status === 400) {
          setError(error.response.data?.message || translate("invalid_input", "accounts"));
        } else if (error.response.status === 404) {
          setError(translate("account_not_found", "accounts"));
        } else if (error.response.status === 500) {
          setError(translate("error_updating_account", "accounts"));
        } else {
          setError(error.response.data?.message || translate("failed_to_update_account", "accounts"));
        }
      } else if (error.request) {
        setError(translate("network_error", "accounts"));
      } else {
        setError(`${translate("error_updating_account", "accounts")}: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg relative">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">{translate("edit_account", "accounts")}</h2>
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
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
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
            <div className="flex items-center gap-2">
              <Input
                placeholder={translate("add_a_tag", "accounts")}
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
              {translate("cancel", "accounts")}
            </Button>
            <Button
              variant="default"
              className="w-full bg-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? `${translate("updating", "accounts")}...` : translate("update_account", "accounts")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}