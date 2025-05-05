"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, X, Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "../libs/Middleware/axiosInstace";

interface ApiKey {
  doc_id: string;
  name: string;
  data: { hash: string; encryptedKey: string };
  created_at: string;
  updated_at: string | null;
  env: "Development" | "Staging" | "Production";
  tags: string[];
}

interface EditApiKeyProps {
  apiKey: ApiKey;
  onClose: () => void;
  onApiKeyUpdated: () => void;
}

export function EditApiKey({ apiKey, onClose, onApiKeyUpdated }: EditApiKeyProps) {
  const { translate } = useTranslator();
  const [name, setName] = useState(apiKey.name);
  const [env, setEnv] = useState<"Development" | "Staging" | "Production">(apiKey.env);
  const [tags, setTags] = useState<string[]>(apiKey.tags.filter(tag => !["read", "write", "delete"].includes(tag)));
  const [newTag, setNewTag] = useState("");
  const [readPermission, setReadPermission] = useState(apiKey.tags.includes("read"));
  const [writePermission, setWritePermission] = useState(apiKey.tags.includes("write"));
  const [deletePermission, setDeletePermission] = useState(apiKey.tags.includes("delete"));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const predefinedTags = ["admin", "public"];

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
    if (!name) {
      setError(translate("please_fill_all_required_fields", "api_keys"));
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for updating API key:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setError(translate("no_project_selected", "api_keys"));
      return;
    }

    const permissions: string[] = [];
    if (readPermission) permissions.push("read");
    if (writePermission) permissions.push("write");
    if (deletePermission) permissions.push("delete");

    if (permissions.length === 0) {
      setError(translate("select_at_least_one_permission", "api_keys"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        name,
        env,
        tags: [...tags, ...permissions],
      };

      const response = await axiosInstance.put(
        `/${selectedWorkspaceId}/${selectedProjectId}/api-keys/${apiKey.doc_id}`,
        payload
      );

      if (response.status === 200 || (response.data && response.data.status_code === 200)) {
        onApiKeyUpdated();
        onClose();
      } else {
        throw new Error(response.data?.message || translate("failed_to_update_api_key", "api_keys"));
      }
    } catch (error: any) {
      console.error("Error updating API key:", error);
      if (error.response) {
        if (error.response.status === 400 && error.response.data?.message === "API key already exists") {
          setError(translate("api_key_already_exists", "api_keys"));
        } else if (error.response.status === 500) {
          setError(translate("error_updating_api_key", "api_keys"));
        } else {
          setError(error.response.data?.message || translate("failed_to_update_api_key", "api_keys"));
        }
      } else if (error.request) {
        setError(translate("network_error", "api_keys"));
      } else {
        setError(`${translate("error_updating_api_key", "api_keys")}: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg relative">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">{translate("edit_api_key", "api_keys")}</h2>
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
              {translate("api_key_name", "api_keys")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                placeholder={translate("enter_api_key_name", "api_keys")}
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
              {translate("environment", "api_keys")} <span className="text-red-500">*</span>
            </label>
            <Select value={env} onValueChange={(value) => setEnv(value as "Development" | "Staging" | "Production")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={translate("select_environment", "api_keys")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Development">{translate("development", "api_keys")}</SelectItem>
                <SelectItem value="Staging">{translate("staging", "api_keys")}</SelectItem>
                <SelectItem value="Production">{translate("production", "api_keys")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("permissions", "api_keys")}</label>
            <div className="space-y-3 rounded-md border p-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="read"
                  checked={readPermission}
                  onChange={(e) => setReadPermission(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="read" className="text-sm font-normal cursor-pointer">
                  {translate("read", "api_keys")}
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="write"
                  checked={writePermission}
                  onChange={(e) => setWritePermission(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="write" className="text-sm font-normal cursor-pointer">
                  {translate("write", "api_keys")}
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="delete"
                  checked={deletePermission}
                  onChange={(e) => setDeletePermission(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="delete" className="text-sm font-normal cursor-pointer">
                  {translate("delete", "api_keys")}
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("tags", "api_keys")}</label>
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
                placeholder={translate("add_a_tag", "api_keys")}
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
              {translate("cancel", "api_keys")}
            </Button>
            <Button
              variant="default"
              className="w-full bg-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? `${translate("updating", "api_keys")}...` : translate("update_api_key", "api_keys")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}