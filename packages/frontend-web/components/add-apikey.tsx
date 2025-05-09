"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Eye, EyeOff, X, Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { hashData } from "../libs/crypto";

interface ApiKey {
  doc_id: string;
  name: string;
  data: string;
  created_at: string;
  updated_at: string | null;
  env: "Development" | "Staging" | "Production";
  tags: string[];
}

interface AddApiKeyProps {
  onClose: () => void;
  onApiKeyAdded: () => void;
}

export function AddApiKey({ onClose, onApiKeyAdded }: AddApiKeyProps) {
  const { translate } = useTranslator();
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [description, setDescription] = useState(""); // Added description field
  const [showApiKey, setShowApiKey] = useState(false);
  const [env, setEnv] = useState<"Development" | "Staging" | "Production">("Development");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const predefinedTags = ["admin", "public", "read", "write", "delete"];

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
    if (!name || !apiKey) {
      setError(translate("please_fill_all_required_fields", "api_keys"));
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for adding API key:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setError(translate("no_project_selected", "api_keys"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Create data object with the API key
      const dataToSend = JSON.stringify({ api_key: apiKey });

      // Hash the data for security verification
      const hashedData = await hashData(dataToSend);

      // Include description field in the payload, even if it's empty
      const payload = {
        name,
        env,
        tags,
        data: dataToSend,
        hash: hashedData.hash,
        description: description || null, // Ensure description is included
      };

      console.log("Sending payload:", JSON.stringify(payload));

      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/api-keys`,
        payload
      );

      if (response.status === 201 || (response.data && response.data.status_code === 201)) {
        onApiKeyAdded();
        onClose();
        toast({
          title: translate("api_key_added_successfully", "api_keys"),
          description: translate("api_key_added_description", "api_keys"),
        });
      } else {
        throw new Error(response.data?.message || translate("failed_to_add_api_key", "api_keys"));
      }
    } catch (error: any) {
      console.error("Error adding API key:", error);
      console.error("Error response:", error.response?.data);
      
      if (error.response) {
        if (error.response.status === 400 && error.response.data?.message === "API key already exists") {
          setError(translate("api_key_already_exists", "api_keys"));
        } else if (error.response.status === 422) {
          setError(`${translate("invalid_input_data", "api_keys")}: ${JSON.stringify(error.response.data?.detail || {})}`);
        } else if (error.response.status === 500) {
          setError(translate("error_adding_api_key", "api_keys"));
        } else {
          setError(error.response.data?.message || translate("failed_to_add_api_key", "api_keys"));
        }
      } else if (error.request) {
        setError(translate("network_error", "api_keys"));
      } else {
        setError(`${translate("error_adding_api_key", "api_keys")}: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg relative">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">{translate("add_new_api_key", "api_keys")}</h2>
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
              {translate("api_key_description", "api_keys")}
            </label>
            <div className="relative">
              <Input
                placeholder={translate("enter_description", "api_keys")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="pr-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {translate("api_key", "api_keys")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                placeholder={translate("enter_api_key", "api_keys")}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-8"
                required
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                onClick={() => setShowApiKey(!showApiKey)}
                type="button"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
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
              {isSubmitting ? `${translate("adding", "api_keys")}...` : translate("add_api_key", "api_keys")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}