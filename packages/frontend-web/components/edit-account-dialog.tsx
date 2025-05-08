"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Eye, EyeOff, X, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { hashData } from "../libs/crypto";
import axiosInstance from "../libs/Middleware/axiosInstace";

interface Account {
  doc_id: string;
  name?: string;
  title?: string;
  lower_name: string;
  user_name?: string;
  username?: string;
  password?: string;
  data?: string | { username: string; password: string };
  website?: string | null;
  url?: string | null;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
}

interface EditAccountDialogProps {
  account: Account;
  onClose: () => void;
  onAccountUpdated: () => void;
}

export function EditAccountDialog({ account, onClose, onAccountUpdated }: EditAccountDialogProps) {
  const { translate } = useTranslator();
  
  // Parse the username and password from account.data if it's a JSON string
  const parseAccountData = () => {
    try {
      if (account.data && typeof account.data === 'string') {
        try {
          const parsedData = JSON.parse(account.data);
          if (parsedData && typeof parsedData === 'object' && 'username' in parsedData && 'password' in parsedData) {
            return parsedData;
          }
        } catch (e) {
          // If not parseable as JSON, just use as-is
        }
      } else if (account.data && typeof account.data === 'object' && 'username' in account.data && 'password' in account.data) {
        return account.data;
      }
      return { username: account.username || account.user_name || '', password: account.password || '' };
    } catch (e) {
      return { username: account.username || account.user_name || '', password: account.password || '' };
    }
  };

  const accountData = parseAccountData();
  
  const [name, setName] = useState(account.title || account.name || "");
  const [username, setUsername] = useState(accountData.username || "");
  const [password, setPassword] = useState(accountData.password || "");
  const [website, setWebsite] = useState(account.url || account.website || "");
  const [notes, setNotes] = useState(account.notes || "");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !password) {
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
      // Create credentials object with username and password
      const credentials = {
        username: username || "",
        password: password
      };

      // Hash the credentials object for security
      const hashedData = await hashData(credentials);

      // Create payload according to API specification
      const payload = {
        title: name,
        data: hashedData.hash, // Send only the hash value, not the JSON string
        url: website || null,
        tags: tags,
        notes: notes || null
      };

      const response = await axiosInstance.put(
        `/${selectedWorkspaceId}/${selectedProjectId}/accounts/${account.doc_id}`, 
        payload
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: translate("account_updated_successfully", "accounts"),
        });

        onAccountUpdated();
        onClose();
      } else {
        throw new Error(response.data?.message || translate("failed_to_update_account", "accounts"));
      }
    } catch (error: any) {
      console.error("Error updating account:", error);
      console.error("Error details:", error.response?.data);
      
      if (error.response) {
        if (error.response.status === 400) {
          setError(error.response.data?.message || translate("invalid_input", "accounts"));
        } else if (error.response.status === 422) {
          const errorMessages = error.response.data?.detail?.map((err: any) => err.msg).join(", ");
          setError(errorMessages || translate("validation_error", "accounts"));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-6">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg relative my-auto">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">{translate("edit_account", "accounts")}</h2>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
              {translate("username", "accounts")}
            </label>
            <Input
              placeholder={translate("enter_username", "accounts")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            <label className="text-sm font-medium">{translate("notes", "accounts")}</label>
            <Input
              placeholder={translate("enter_notes", "accounts")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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