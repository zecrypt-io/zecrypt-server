"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslator } from "@/hooks/use-translations";
import { useNoteManagement } from "@/hooks/use-note-management";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onNoteAdded: () => void;
}

export function AddNoteDialog({ open, onOpenChange, onClose, onNoteAdded }: AddNoteDialogProps) {
  const { translate } = useTranslator();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const { handleAddNote } = useNoteManagement({ selectedWorkspaceId, selectedProjectId });

  // TipTap editor setup
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

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
    if (!title || !editor || editor.isEmpty) {
      setError(translate("please_fill_all_required_fields", "notes"));
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const noteContent = JSON.stringify(editor.getJSON());
      await handleAddNote({ title, data: noteContent, tags });
      onNoteAdded();
      onOpenChange(false);
    } catch (e) {
      setError(translate("error_adding_note", "notes"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Basic formatting toolbar
  const MenuBar = () => editor ? (
    <div className="flex gap-2 mb-2 border-b pb-2">
      <Button type="button" size="sm" aria-label="Bold" variant={editor.isActive('bold') ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></Button>
      <Button type="button" size="sm" aria-label="Italic" variant={editor.isActive('italic') ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></Button>
      <Button type="button" size="sm" aria-label="Heading 1" variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Button>
      <Button type="button" size="sm" aria-label="Heading 2" variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Button>
      <Button type="button" size="sm" aria-label="Bullet List" variant={editor.isActive('bulletList') ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</Button>
      <Button type="button" size="sm" aria-label="Ordered List" variant={editor.isActive('orderedList') ? 'default' : 'outline'} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</Button>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-6 transition-all duration-300">
      <div className="w-full max-w-lg rounded-2xl bg-card p-8 border border-border shadow-2xl relative my-auto animate-fade-in">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">{translate("add_new_note", "notes", { default: "Add New Note" })}</h2>
          {error && (
            <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <label className="text-base font-semibold">
              {translate("note_title", "notes", { default: "Title" })} <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={translate("enter_note_title", "notes", { default: "Enter note title" })}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="text-lg px-4 py-3 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-base font-semibold">
              {translate("note_content", "notes", { default: "Content" })} <span className="text-red-500">*</span>
            </label>
            <div className="sticky top-0 z-10 bg-card rounded-t-lg pb-2">
              <MenuBar />
            </div>
            <EditorContent editor={editor} className="min-h-[200px] border rounded-lg p-3 bg-background text-base focus:outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-base font-semibold">{translate("tags", "notes", { default: "Tags" })}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-3 py-1 rounded-full text-sm">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder={translate("add_a_tag", "notes", { default: "Add a tag" })}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(newTag);
                  }
                }}
                className="rounded-full px-4 py-2"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => addTag(newTag)} className="rounded-full">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 pt-6">
            <Button variant="outline" className="w-1/2 py-3 rounded-lg text-base" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {translate("cancel", "notes", { default: "Cancel" })}
            </Button>
            <Button
              variant="default"
              className="w-1/2 py-3 rounded-lg text-base bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? `${translate("adding", "notes", { default: "Adding..." })}` : translate("add_note", "notes", { default: "Add Note" })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 