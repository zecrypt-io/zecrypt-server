"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, Upload, Trash, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUser } from "@stackframe/stack"; // Only useUser is needed
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../libs/Redux/store";
import { clearUserData } from "../libs/Redux/userSlice";
// import { clearWorkspaceData } from "../libs/Redux/workspaceSlice";

interface UserProfileDialogProps {
  onClose: () => void;
}

export function UserProfileDialog({ onClose }: UserProfileDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { userData } = useSelector((state: RootState) => state.user);
  const user = useUser(); // Stack's user object for sign-out

  // Initialize state with Redux data or defaults
  const [name, setName] = useState(userData?.name || "Sadik Ali");
  const [email, setEmail] = useState(userData?.email || "sadik@example.com");
  const [avatarSrc, setAvatarSrc] = useState(
    userData?.profile_url || "/placeholder.svg?height=128&width=128"
  );
  const [showImageOptions, setShowImageOptions] = useState(false);

  // Sync state with Redux data when userData changes
  useEffect(() => {
    if (userData) {
      setName(userData.name);
      setEmail(userData.email || "sadik@example.com"); // Email might not be in userSlice
      setAvatarSrc(userData.profile_url || "/placeholder.svg?height=128&width=128");
    }
  }, [userData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarSrc(event.target.result as string);
          setShowImageOptions(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setAvatarSrc("/placeholder.svg?height=128&width=128");
    setShowImageOptions(false);
  };

  const handleLogout = async () => {
    try {
      if (user) {
        // Sign out from Stack using the user object's signOut method
        await user.signOut();
      }

      // Clear Redux state
      dispatch(clearUserData());
      // dispatch(clearWorkspaceData());

      // Remove any local storage items (if applicable)
      localStorage.removeItem("authToken"); // Optional, remove if not used

      // Redirect to login page
      router.push("/");
      onClose(); // Close the dialog
    } catch (error) {
      console.error("Error during logout:", error);
      // Optionally show an error message to the user
    }
  };

  // If no user is logged in, don't render the dialog
  if (!userData) {
    router.push("/login");
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">User Profile</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Avatar
                className="h-24 w-24 cursor-pointer"
                onClick={() => setShowImageOptions(!showImageOptions)}
              >
                <AvatarImage src={avatarSrc} alt={name} />
                <AvatarFallback className="text-lg">
                  {name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute bottom-0 right-0 rounded-full bg-primary p-1 cursor-pointer"
                onClick={() => setShowImageOptions(!showImageOptions)}
              >
                <Camera className="h-4 w-4 text-white" />
              </div>

              {showImageOptions && (
                <div className="absolute top-full mt-2 w-48 bg-card rounded-md shadow-md border border-border z-10">
                  <div className="p-2 space-y-1">
                    <label className="flex items-center gap-2 p-2 text-sm rounded-md cursor-pointer hover:bg-accent">
                      <Upload className="h-4 w-4" />
                      <span>Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <button
                      className="flex items-center gap-2 p-2 text-sm w-full text-left rounded-md cursor-pointer hover:bg-accent"
                      onClick={removeImage}
                    >
                      <Trash className="h-4 w-4" />
                      <span>Remove Image</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Click the image to change your profile picture</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled // Email typically shouldn't be editable
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button>Save Changes</Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}