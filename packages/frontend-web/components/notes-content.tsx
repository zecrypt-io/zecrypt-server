"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, Pencil } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { useNoteManagement, Note } from "@/hooks/use-note-management";
import { AddNoteDialog } from "@/components/add-note-dialog";
import { EditNoteDialog } from "@/components/edit-note-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

export function NotesContent() {
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const {
    filteredNotes,
    isLoading,
    searchQuery,
    setSearchQuery,
    fetchNotes,
    handleDeleteNote,
    currentPage,
    totalPages,
    totalCount,
    prevPage,
    nextPage,
    goToPage,
    notesToDisplay,
  } = useNoteManagement({ selectedWorkspaceId, selectedProjectId });

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewNote, setViewNote] = useState<Note | null>(null);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Secure Notes</h1>
          <p className="text-muted-foreground text-base mt-1">Store your private notes securely with rich formatting.</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="h-11 px-6 text-base font-semibold shadow-md rounded-lg">
          <Plus className="h-5 w-5 mr-2" /> Add Note
        </Button>
      </div>
      <div className="max-w-md mt-2">
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>
      <div className="mt-6">
        {isLoading ? (
          <div className="text-muted-foreground text-center py-16 text-lg animate-pulse">Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
            <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4 opacity-30"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><line x1="9" y1="9" x2="15" y2="9" strokeWidth="2"/><line x1="9" y1="13" x2="15" y2="13" strokeWidth="2"/><line x1="9" y1="17" x2="13" y2="17" strokeWidth="2"/></svg>
            <div className="text-xl font-semibold mb-2">No notes found</div>
            <div className="text-base">Start by adding your first secure note.</div>
          </div>
        ) : (
          <div className="flex flex-col min-h-[400px]">
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {notesToDisplay.map((note) => (
                  <div
                    key={note.doc_id}
                    className="group p-5 border rounded-2xl bg-card cursor-pointer hover:shadow-xl hover:bg-accent/40 transition-all duration-200 relative flex flex-col min-h-[180px]"
                    onClick={() => setViewNote(note)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-bold truncate max-w-[60%]">{note.title}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{new Date(note.updated_at || note.created_at).toLocaleDateString()}</span>
                        <button
                          className="p-1 rounded-full hover:bg-primary/10 text-primary opacity-70 hover:opacity-100 transition"
                          onClick={e => { e.stopPropagation(); setEditNote(note); }}
                          title="Edit Note"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 rounded-full hover:bg-destructive/10 text-destructive opacity-70 hover:opacity-100 transition"
                          onClick={e => { e.stopPropagation(); setDeleteNote(note); }}
                          title="Delete Note"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mb-2 text-sm text-muted-foreground line-clamp-4 prose prose-sm prose-neutral max-w-full overflow-hidden" style={{ minHeight: 60 }}
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          try {
                            return generateHTML(JSON.parse(note.data), [StarterKit]);
                          } catch {
                            return '';
                          }
                        })(),
                      }}
                    />
                    <div className="flex gap-2 flex-wrap mt-auto pt-2">
                      {note.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button onClick={prevPage} disabled={currentPage === 1} variant="outline">Previous</Button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <Button onClick={nextPage} disabled={currentPage === totalPages} variant="outline">Next</Button>
              </div>
            )}
          </div>
        )}
      </div>
      {showAddDialog && (
        <AddNoteDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onClose={() => setShowAddDialog(false)}
          onNoteAdded={fetchNotes}
        />
      )}
      {editNote && (
        <EditNoteDialog
          note={editNote}
          onClose={() => setEditNote(null)}
          onNoteUpdated={fetchNotes}
        />
      )}
      {viewNote !== null && (
        <Dialog open={viewNote !== null} onOpenChange={open => { if (!open) setViewNote(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{viewNote?.title}</DialogTitle>
            </DialogHeader>
            <div className="prose prose-lg max-w-full mb-4 overflow-y-auto max-h-[60vh]" dangerouslySetInnerHTML={{
              __html: (() => {
                try {
                  return generateHTML(JSON.parse(viewNote.data), [StarterKit]);
                } catch {
                  return '';
                }
              })(),
            }} />
            <div className="flex gap-2 flex-wrap mb-4">
              {viewNote?.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Last updated: {new Date(viewNote?.updated_at || viewNote?.created_at).toLocaleString()}</span>
              <Button size="sm" variant="outline" onClick={() => { setEditNote(viewNote); setViewNote(null); }}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {deleteNote && (
        <Dialog open={!!deleteNote} onOpenChange={open => { if (!open) setDeleteNote(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Note</DialogTitle>
            </DialogHeader>
            <div>Are you sure you want to delete the note "{deleteNote.title}"? This action cannot be undone.</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteNote(null)} disabled={isDeleting}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setIsDeleting(true);
                  await handleDeleteNote(deleteNote.doc_id);
                  setIsDeleting(false);
                  setDeleteNote(null);
                  fetchNotes();
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default NotesContent;
