"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface FavoritesTagDialogProps {
  onClose: () => void
  onAddTag: (tag: string) => void
  existingTags: string[]
}

export function FavoritesTagDialog({ onClose, onAddTag, existingTags }: FavoritesTagDialogProps) {
  const [newTag, setNewTag] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate input
    if (!newTag.trim()) {
      setError("Please enter a tag name")
      return
    }

    // Check for duplicates
    if (existingTags.includes(newTag.trim())) {
      setError("This tag already exists")
      return
    }

    // Add the tag
    onAddTag(newTag.trim())
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Favorite Tag</DialogTitle>
          <DialogDescription>Create a new tag to organize your favorite items.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                placeholder="Enter tag name"
                value={newTag}
                onChange={(e) => {
                  setNewTag(e.target.value)
                  setError("")
                }}
                className={error ? "border-red-500" : ""}
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            {existingTags.length > 0 && (
              <div className="grid gap-2">
                <Label>Existing Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {existingTags.map((tag) => (
                    <div key={tag} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Tag</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

