"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { resetWorkspaceState } from "@/libs/Redux/workspaceSlice";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Command,
  Home,
  Key,
  Lock,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  Bell,
  Plus,
  X,
  Globe,
  Users,
} from "lucide-react"
import { cn } from "@/libs/utils"
import { GeneratePasswordDialog } from "@/components/generate-password-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ProjectDialog } from "@/components/project-dialog"
import { CommandPalette } from "@/components/command-palette"
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"
import { EncryptionKeyModal } from "@/components/encryption-key-modal"
import { useRouter } from "next/navigation"
import { locales } from "@/middleware"
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/libs/Redux/store";
import { clearUserData } from "@/libs/Redux/userSlice";
import { useUser } from "@stackframe/stack";
import { useTranslator } from "@/hooks/use-translations"

interface DashboardLayoutProps {
  children: React.ReactNode;
  locale?: string;
}

function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function DashboardLayout({ children, locale = 'en' }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [showGeneratePassword, setShowGeneratePassword] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();
  const [showFavoritesDialog, setShowFavoritesDialog] = useState(false);
  const [favoriteTags, setFavoriteTags] = useState(["Personal", "Work", "Banking"]);

  const [currentLocale, setCurrentLocale] = useState(locale);
  
  // Language labels
  const languageLabels: Record<string, string> = {
    af: "Afrikaans",
    ar: "Arabic (عربى)",
    ca: "Catalan (Català)",
    cs: "Czech (Čeština)",
    da: "Danish (Dansk)",
    de: "German (Deutsch)",
    el: "Greek (Ελληνικά)",
    en: "English",
    es: "Spanish (Español)",
    fi: "Finnish (Suomalainen)",
    fr: "French (Français)",
    he: "Hebrew (עִברִית)",
    hu: "Hungarian (Magyar)",
    id: "Indonesian",
    it: "Italian (Italiano)",
    ja: "Japanese (日本語)",
    ko: "Korean (한국어)",
    nl: "Dutch (Nederlands)",
    no: "Norwegian (Norsk)",
    pl: "Polish (Polskie)",
    pt: "Portuguese (Português)",
    'pt-BR': "Brazilian Portuguese (Português Brasileiro)",
    ro: "Romanian (Română)",
    ru: "Russian (Pусский)",
    sr: "Serbian (Српски)",
    sv: "Swedish (Svenska)",
    tr: "Turkish (Türkçe)",
    uk: "Ukrainian (Українська)",
    vi: "Vietnamese (Tiếng Việt)",
    'zh-CN': "Chinese Simplified (简体中文)",
    'zh-Hant': "Chinese Traditional (繁體中文)",
  };

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useUser();
  const [showEncryptionKeyModal, setShowEncryptionKeyModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Get selected and default project from Redux
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const selectedProject = useSelector((state: RootState) =>
    Array.isArray(state.workspace.workspaces) && selectedWorkspaceId && selectedProjectId
      ? state.workspace.workspaces
          .find((ws) => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find((p) => p.project_id === selectedProjectId)
      : null
  );
  const defaultProject = useSelector((state: RootState) =>
    Array.isArray(state.workspace.workspaces) && selectedWorkspaceId
      ? state.workspace.workspaces
          .find((ws) => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find((p) => p.is_default)
      : null
  );
  const displayProject = selectedProject || defaultProject;

  // Get selected workspace name from Redux
  const selectedWorkspace = useSelector((state: RootState) => 
    Array.isArray(state.workspace.workspaces) 
      ? state.workspace.workspaces.find((ws) => ws.workspaceId === selectedWorkspaceId) 
      : null
  );
  const workspaceName = selectedWorkspace?.name || "Personal Workspace";

  const removeTag = (tagToRemove: string) => {
    setFavoriteTags(favoriteTags.filter((tag) => tag !== tagToRemove));
  };

  // Define handleLogout using useCallback to avoid recreating it on every render
  const handleLogout = useCallback(async () => {
    try {
      if (user) {
        await user.signOut();
      }
      dispatch(resetWorkspaceState());
      dispatch(clearUserData());
      localStorage.clear();
      router.push(`/${currentLocale}`);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, [user, dispatch, router, currentLocale]);
 
  // Switch language function
  const switchLanguage = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    
    // Create a new path with the updated locale
    const segments = pathname?.split('/') || [];
    segments[1] = newLocale; // Replace the locale segment
    const newPath = segments.join('/');
    
    // Navigate to the new path
    router.push(newPath);
    setCurrentLocale(newLocale);
  };

  useEffect(() => {
    // Set the current locale when component mounts
    if (locale) {
      setCurrentLocale(locale);
    }
  }, [locale]);

  useEffect(() => {
    const handleGeneratePassword = () => setShowGeneratePassword(true);
    const handleProjectDialog = () => setShowProjectDialog(true);
    const handleSearchFocus = () => searchInputRef.current?.focus();
    const handleThemeToggle = () => document.dispatchEvent(new CustomEvent("toggle-theme-event"));

    document.addEventListener("toggle-generate-password", handleGeneratePassword);
    document.addEventListener("toggle-project-dialog", handleProjectDialog);
    document.addEventListener("toggle-search-focus", handleSearchFocus);
    document.addEventListener("toggle-theme", handleThemeToggle);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (!(e.metaKey || e.ctrlKey)) return;

      if (["k", "g", "p", "d", "a", "f", "n", "s", "t", "l"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case "k": // Command palette is handled separately
          break
        case "g": // Generate password
          setShowGeneratePassword(true)
          break
        case "p": // Project switcher
          setShowProjectDialog(true)
          break
        case "d": // Dashboard
          router.push(`/${currentLocale}/dashboard`)
          break
        case "a": // Accounts
          router.push(`/${currentLocale}/dashboard/accounts`)
          break
        case "f": // Files
          router.push(`/${currentLocale}/dashboard/files`)
          break
        case "n": // Notifications
          router.push(`/${currentLocale}/dashboard/notifications`)
          break
        case "s": // Settings
          router.push(`/${currentLocale}/dashboard/user-settings`)
          break
        case "t": // Toggle theme
          document.dispatchEvent(new CustomEvent("toggle-theme-event"))
          break
        case "l": // Logout
          handleLogout();
          break
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("toggle-generate-password", handleGeneratePassword);
      document.removeEventListener("toggle-project-dialog", handleProjectDialog);
      document.removeEventListener("toggle-search-focus", handleSearchFocus);
      document.removeEventListener("toggle-theme", handleThemeToggle);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [router, currentLocale, handleLogout]);

  useEffect(() => {
    const shouldShowModal = sessionStorage.getItem("showEncryptionKeyModal") === "true";
    const newUserFlag = sessionStorage.getItem("isNewUser") === "true";

    if (shouldShowModal) {
      setShowEncryptionKeyModal(true);
      setIsNewUser(newUserFlag);
      sessionStorage.removeItem("showEncryptionKeyModal");
    }
  }, []);

  const handleEncryptionKeySubmit = (key: string) => {
    sessionStorage.setItem("encryptionKey", key);
    setShowEncryptionKeyModal(false);
    console.log("Encryption key received and stored for this session");
  };

  const handleEncryptionKeyCancel = () => {
    // If user cancels, redirect back to login with the current locale
    setShowEncryptionKeyModal(false)
    router.push(`/${currentLocale}/login`)
  }

  // Sort locales by display name
  const sortedLocales = [...locales].sort((a, b) => {
    const nameA = languageLabels[a] || a;
    const nameB = languageLabels[b] || b;
    return nameA.localeCompare(nameB);
  });

  const { translate } = useTranslator();

  return (
    <div className="flex min-h-screen bg-background">
      <CommandPalette />

      <div className="hidden md:flex w-64 flex-col border-r border-border">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href={`/${currentLocale}/dashboard`} className="flex items-center gap-2 font-semibold">
            <Lock className="h-5 w-5" />
            <span>Zecrypt</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            >
              <Command className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto py-2">
          <div className="px-3 py-2">
            <div className="mb-4">
              <label className="px-2 text-xs font-semibold text-muted-foreground mb-2 block">{translate("project", "dashboard")}</label>
              <Button variant="outline" className="w-full justify-between" onClick={() => setShowProjectDialog(true)}>
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: displayProject?.color || "#4f46e5" }}
                  ></div>
                  <span className="truncate">{displayProject?.name || "No project selected"}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </div>
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">{translate("dashboard", "dashboard")}</h3>
            <div className="space-y-1 mb-6">
              <Link
                href={`/${currentLocale}/dashboard`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  pathname === `/${currentLocale}/dashboard`
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Home className="h-4 w-4" />
                {translate("overview", "dashboard")}
              </Link>
              <Link
                href={`/${currentLocale}/dashboard/accounts`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  pathname === `/${currentLocale}/dashboard/accounts`
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <User className="h-4 w-4" />
                Accounts
              </Link>
              <Link
                href={`/${currentLocale}/dashboard/api-keys`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  pathname === `/${currentLocale}/dashboard/api-keys`
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                API Keys
              </Link>
              <Link
                href={`/${currentLocale}/dashboard/wallet-passphrases`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  pathname === `/${currentLocale}/dashboard/wallet-passphrases`
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-wallet-icon lucide-wallet"
                >
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                </svg>
                Wallet Passphrases
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 mt-6 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3" />
              {translate("favourites", "dashboard")}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setShowFavoritesDialog(true)}
            >
              <Plus className="h-3 w-3" />
              <span className="sr-only">Add Favorite Tag</span>
            </Button>
          </div>
          <div className="space-y-1">
            {favoriteTags.map((tag) => (
              <div key={tag} className="flex items-center justify-between px-2 py-1 group">
                <Link
                  href={`/${currentLocale}/dashboard/favourites?tag=${encodeURIComponent(tag)}`}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1 text-sm flex-1",
                    pathname === `/${currentLocale}/dashboard/favourites` && searchParams?.get("tag") === tag
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Star className="h-3 w-3 text-current" />
                  {tag}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {tag}</span>
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-border">
          <div className="px-3 py-2">
            <Link
              href={`/${currentLocale}/dashboard/notifications`}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                pathname === `/${currentLocale}/dashboard/notifications`
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Bell className="h-4 w-4" />
              {translate("notifications", "dashboard")}
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                4
              </span>
            </Link>
          </div>

          <div className="p-3 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || "/placeholder.svg?height=32&width=32"} alt={user?.displayName || "User"} />
                    <AvatarFallback>
                      {user?.displayName 
                        ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.primaryEmail || "user@example.com"}</p>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${currentLocale}/dashboard/user-settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{translate("settings", "dashboard")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{translate("logout", "dashboard")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-border px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder={translate("search", "dashboard")}
                  className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <kbd className="pointer-events-none absolute right-2.5 top-2.5 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                  ⌘K
                </kbd>
              </div>
            </form>
          </div>

          
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="default"
        onClick={() => setShowGeneratePassword(true)}
        className="theme-button flex items-center gap-2 px-4 py-2"
      >
        <Key className="h-5 w-5" />
        <span>{translate("generate_password", "dashboard")}</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{translate("generate_password", "dashboard")}</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

          {/* Replace WorkspaceSwitcherNav with static workspace display */}
          <div className="flex items-center gap-2 px-3 py-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{workspaceName}</span>
          </div>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortedLocales.map((loc) => (
                <DropdownMenuItem 
                  key={loc} 
                  onClick={() => switchLanguage(loc)}
                  className={loc === currentLocale ? "font-bold bg-accent/50" : ""}
                >
                  {languageLabels[loc] || loc}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ThemeToggle />
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </header>

        <main className="flex flex-1">
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>

      {showGeneratePassword && <GeneratePasswordDialog onClose={() => setShowGeneratePassword(false)} />}
      {showProjectDialog && <ProjectDialog onClose={() => setShowProjectDialog(false)} />}
      <KeyboardShortcutsHelp />
      {showEncryptionKeyModal && (
        <EncryptionKeyModal
          isNewUser={isNewUser}
          onClose={handleEncryptionKeySubmit}
          onCancel={handleEncryptionKeyCancel}
        />
      )}
    </div>
  );
}