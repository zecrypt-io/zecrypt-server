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

interface AddWifiProps {
  onClose: () => void;
  onWifiAdded: () => void;
}

export function AddWifi({ onClose, onWifiAdded }: AddWifiProps) {
  const { translate } = useTranslator();
  const [title, setTitle] = useState("");
  const [data, setData] = useState("");
  const [securityType, setSecurityType] = useState<string>("wpa2");
  const [notes, setNotes] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const predefinedTags = ["Personal", "Work", "Home", "Office", "Public", "Guest"];

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

  const handleSubmit = async () => {
    if (!title || !data) {
      setError(translate("please_fill_all_required_fields", "wifi"));
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for adding Wi-Fi network:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setError(translate("no_project_selected", "wifi"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload: any = {
        title,
        security_type: securityType || null,
        notes: notes || null,
        tags,
      };

      if (data) {
        const hashedData = await hashData(data);
        payload.data = hashedData;
      }

      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/wifi`,
        payload
      );

      if (response.status === 201 || (response.data && response.data.status_code === 201)) {
        onWifiAdded();
        onClose();
        toast({
          title: translate("wifi_added_successfully", "wifi"),
          description: translate("wifi_added_description", "wifi"),
        });
      } else {
        throw new Error(response.data?.message || translate("failed_to_add_wifi", "wifi"));
      }
    } catch (error: any) {
      console.error("Error adding Wi-Fi network:", error);
      if (error.response?.status === 400 && error.response.data?.message === "Wifi details with same title already exists") {
        setError(translate("wifi_already_exists", "wifi"));
      } else if (error.response?.status === 422) {
        setError(translate("invalid_input_data", "wifi"));
      } else {
        setError(error.response?.data?.message || translate("failed_to_add_wifi", "wifi"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg relative">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">{translate("add_new_wifi", "wifi")}</h2>
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
              {translate("ssid", "wifi")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                placeholder={translate("enter_ssid", "wifi")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="pr-8"
                required
              />
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {translate("password", "wifi")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={translate("enter_password", "wifi")}
                value={data}
                onChange={(e) => setData(e.target.value)}
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
            <label className="text-sm font-medium">{translate("security_type", "wifi")}</label>
            <Select value={securityType} onValueChange={setSecurityType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={translate("select_security_type", "wifi")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wpa2">WPA2</SelectItem>
                <SelectItem value="wpa3">WPA3</SelectItem>
                <SelectItem value="wep">WEP</SelectItem>
                <SelectItem value="none">{translate("none", "wifi")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("notes", "wifi")}</label>
            <Input
              placeholder={translate("enter_notes", "wifi")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("tags", "wifi")}</label>
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
                placeholder={translate("add_a_tag", "wifi")}
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
              {translate("cancel", "wifi")}
            </Button>
            <Button
              variant="default"
              className="w-full bg-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? `${translate("adding", "wifi")}...` : translate("add_wifi", "wifi")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}