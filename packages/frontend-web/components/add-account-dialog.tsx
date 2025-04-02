"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Eye, X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AddAccountDialogProps {
  onClose: () => void
}

export function AddAccountDialog({ onClose }: AddAccountDialogProps) {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")

  const predefinedTags = ["Personal", "Work", "Finance", "Social", "Shopping", "Entertainment"]

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">Add new account</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Account Name</label>
            <div className="relative">
              <Input placeholder="start type to get account suggestion" className="pr-8" />
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input placeholder="type here" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input type="password" placeholder="type here" className="pr-8" />
              <Eye className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Add custom tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTag) {
                      e.preventDefault()
                      addTag(newTag)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => addTag(newTag)}
                  disabled={!newTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {predefinedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="favorite"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="favorite" className="text-sm font-medium flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400" />
                Add to Favourites
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button className="w-full">Save</Button>
        </div>

        <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => onClose()}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

