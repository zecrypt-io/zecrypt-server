"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit2, Move, Trash2 } from "lucide-react";
import { getFileIcon, getFileIconColor } from "@/libs/file-icon-mappings";
import { formatBytes } from "@/libs/utils";
import { formatDate } from "@/libs/utils";
import { useTranslator } from "@/hooks/use-translations";

interface DriveFile {
  file_id: string;
  name: string;
  size: number;
  original_size: number;
  type: string;
  created_at: string;
  updated_at: string | null;
}

interface FileCardProps {
  file: DriveFile;
  onRename: (file: DriveFile) => void;
  onMove: (file: DriveFile) => void;
  onDelete: (file: DriveFile) => void;
}

export function FileCard({ file, onRename, onMove, onDelete }: FileCardProps) {
  const { translate } = useTranslator();
  const [showMenu, setShowMenu] = useState(false);

  const FileIcon = getFileIcon(file.type);
  const iconColor = getFileIconColor(file.type);

  return (
    <div className="group relative p-4 border rounded-lg hover:shadow-md transition-all bg-card hover:bg-accent/50">
      <div className="flex flex-col items-center gap-3">
        {/* File icon */}
        <div className={`${iconColor}`}>
          <FileIcon className="h-12 w-12" />
        </div>

        {/* File name */}
        <div className="w-full text-center">
          <p className="text-sm font-medium truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.original_size)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(file.created_at)}
          </p>
        </div>

        {/* Actions menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  onRename(file);
                  setShowMenu(false);
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {translate("rename", "actions", { default: "Rename" })}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onMove(file);
                  setShowMenu(false);
                }}
              >
                <Move className="h-4 w-4 mr-2" />
                {translate("move", "actions", { default: "Move" })}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onDelete(file);
                  setShowMenu(false);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {translate("delete", "actions", { default: "Delete" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

