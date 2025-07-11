"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, X, Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { encryptDataField } from "../libs/encryption";
import { secureGetItem } from "@/libs/local-storage-utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WifiNetwork {
  doc_id: string;
  title: string;
  lower_title: string;
  security_type: string;
  data: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

interface EditWifiProps {
  wifi: WifiNetwork;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWifiUpdated: () => void;
}

export function EditWifi({ wifi, open, onOpenChange, onWifiUpdated }: EditWifiProps) {
  const { translate } = useTranslator();
  const [title, setTitle] = useState(wifi?.title || "");
  const [data, setData] = useState(""); // Empty by default, only update if user enters a new password
  const [securityType, setSecurityType] = useState<string>(wifi?.security_type || "wpa2");
  const [notes, setNotes] = useState(wifi?.notes || "");
  const [showPassword, setShowPassword] = useState(false);
  const [tags, setTags] = useState<string[]>(wifi?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  const predefinedTags = ["Personal", "Work", "Home", "Office", "Public", "Guest"];

  useEffect(() => {
    if (wifi) {
      setTitle(wifi.title);
      setData(""); // Reset data field
      setSecurityType(wifi.security_type || "wpa2");
      setNotes(wifi.notes || "");
      setTags(wifi.tags || []);
      setError("");
    }
  }, [wifi]);

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
    if (!title) {
      setError(translate("please_fill_all_required_fields", "wifi"));
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for updating Wi-Fi network:", {
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

      // Only update the password if one was entered
      if (data) {
        // Get current project to retrieve its encryption key
        const currentProject = workspaces
          .find(ws => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find(p => p.project_id === selectedProjectId);
        
        if (!currentProject) {
          throw new Error(translate("project_not_found", "accounts"));
        }
        
        // Get the project's AES key from session storage
        const projectKeyName = `projectKey_${currentProject.name}`;
        const projectAesKey = await secureGetItem(projectKeyName);
        
        if (!projectAesKey) {
          throw new Error(translate("encryption_key_not_found", "accounts"));
        }

        // Create a JSON object with the wifi password and encrypt it
        const wifiData = JSON.stringify({ "wifi-password": data });
        const encryptedData = await encryptDataField(wifiData, projectAesKey);
        
        payload.data = encryptedData;
      }

      const response = await axiosInstance.put(
        `/${selectedWorkspaceId}/${selectedProjectId}/wifi/${wifi.doc_id}`,
        payload
      );

      if (response.status === 200 || (response.data && response.data.status_code === 200)) {
        onWifiUpdated();
        onOpenChange(false);
        toast({
          title: translate("wifi_updated_successfully", "wifi"),
          description: translate("wifi_updated_description", "wifi"),
        });
      } else {
        throw new Error(response.data?.message || translate("failed_to_update_wifi", "wifi"));
      }
    } catch (error: any) {
      console.error("Error updating Wi-Fi network:", error);
      if (error.response?.status === 400 && error.response.data?.message === "Wifi details with same title already exists") {
        setError(translate("wifi_already_exists", "wifi"));
      } else if (error.response?.status === 422) {
        setError(translate("invalid_input_data", "wifi"));
      } else if (error.response?.status === 404) {
        setError(translate("wifi_not_found", "wifi"));
      } else {
        setError(error.response?.data?.message || translate("failed_to_update_wifi", "wifi"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{translate("edit_wifi", "wifi")}</DialogTitle>
          <DialogDescription>
            {translate("edit_wifi_description", "wifi", { default: "Update your Wi-Fi network details" })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">
              {translate("ssid", "wifi")}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder={translate("enter_ssid", "wifi")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={error && !title ? "border-red-500" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">{translate("password", "wifi")}</Label>
            <div className="relative">
              <Input
                id="data"
                type={showPassword ? "text" : "password"}
                placeholder={translate("enter_new_password", "wifi")}
                value={data}
                onChange={(e) => setData(e.target.value)}
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
            <Label htmlFor="securityType">{translate("security_type", "wifi")}</Label>
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
            <Label htmlFor="notes">{translate("notes", "wifi")}</Label>
            <Input
              id="notes"
              placeholder={translate("enter_notes", "wifi")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{translate("tags", "wifi")}</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder={translate("add_a_tag", "wifi")}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newTag))}
              />
              <Button type="button" onClick={() => addTag(newTag)}>
                {translate("add", "wifi", { default: "Add" })}
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
            {translate("cancel", "wifi")}
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? translate("updating", "wifi") : translate("update_wifi", "wifi")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}