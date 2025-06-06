"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { resetWorkspaceState } from "@/libs/Redux/workspaceSlice";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
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
} from "lucide-react";
import { cn } from "@/libs/utils";
import { GeneratePasswordDialog } from "@/components/generate-password-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfileDialog } from "@/components/user-profile-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProjectDialog } from "@/components/project-dialog";
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help";
import { useRouter } from "next/navigation";
import { locales } from "@/middleware";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/libs/Redux/store";
import { clearUserData } from "@/libs/Redux/userSlice";
import { useUser } from "@stackframe/stack";
import { useTranslator } from "@/hooks/use-translations";
import { secureSetItem } from '@/libs/session-storage-utils';
import { SearchModal } from "@/components/search-modal";
import { logout } from "@/libs/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  locale?: string;
}

interface SearchModule {
  key: string;
  labelKey: string;
  path: string;
  icon: React.ReactElement;
}

interface NavigationItem {
  key: string;
  labelKey: string;
  path: string;
  icon: React.ReactElement;
  always_visible?: boolean;
  feature_key?: string;
}

interface NavigationCategory {
  id: string;
  labelKey: string;
  items: NavigationItem[];
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

const defaultFeatures = {
  login: { enabled: false, is_client_side_encryption: false },
  api_key: { enabled: false, is_client_side_encryption: false },
  wallet_address: { enabled: false, is_client_side_encryption: false },
  wifi: { enabled: false, is_client_side_encryption: false },
  identity: { enabled: false, is_client_side_encryption: false },
  card: { enabled: false, is_client_side_encryption: false },
  software_license: { enabled: false, is_client_side_encryption: false },
  email: { enabled: false, is_client_side_encryption: false },
  ssh_key: { enabled: false, is_client_side_encryption: false }
};

const navigationCategories: NavigationCategory[] = [
  {
    id: "general",
    labelKey: "general",
    items: [
      {
        key: "login",
        labelKey: "accounts",
        path: "/dashboard/accounts",
        icon: <User className="h-4 w-4" />,
        feature_key: "login"
      },
      {
        key: "identity",
        labelKey: "identity",
        path: "/dashboard/identity",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
        feature_key: "identity"
      },
      {
        key: "email",
        labelKey: "email",
        path: "/dashboard/emails",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        ),
        feature_key: "email"
      },
      {
        key: "wifi",
        labelKey: "wifi",
        path: "/dashboard/wifi",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        ),
        feature_key: "wifi"
      }
    ]
  },
  {
    id: "security",
    labelKey: "security_access",
    items: [
      {
        key: "api_key",
        labelKey: "api_keys",
        path: "/dashboard/api-keys",
        icon: (
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
        ),
        feature_key: "api_key"
      },
      {
        key: "ssh_key",
        labelKey: "ssh_keys",
        path: "/dashboard/ssh-keys",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="8" cy="8" r="4" />
            <path d="M10.5 8h9.5" />
            <path d="M15 12V8" />
            <path d="M17 12V8" />
          </svg>
        ),
        feature_key: "ssh_key"
      }
    ]
  },
  {
    id: "business",
    labelKey: "business_finance",
    items: [
      {
        key: "card",
        labelKey: "cards",
        path: "/dashboard/cards",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M7 15h0M2 9.5h20" />
          </svg>
        ),
        feature_key: "card"
      },
      {
        key: "wallet_address",
        labelKey: "wallet_passphrases",
        path: "/dashboard/wallet-passphrases",
        icon: (
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
        ),
        feature_key: "wallet_address"
      }
    ]
  },
  {
    id: "licenses",
    labelKey: "licenses_services",
    items: [
      {
        key: "software_license",
        labelKey: "software_licenses",
        path: "/dashboard/software-licenses",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        ),
        feature_key: "software_license"
      }
    ]
  }
];

export function DashboardLayout({ children, locale = "en" }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useUser();
  const { translate } = useTranslator();
  const [showGeneratePassword, setShowGeneratePassword] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const [showFavoritesDialog, setShowFavoritesDialog] = useState(false);
  const [favoriteTags, setFavoriteTags] = useState(["Personal", "Work", "Banking"]);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    overview: false,
    general: false,
    security: false,
    business: false,
    licenses: false
  });

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
    "pt-BR": "Brazilian Portuguese (Português Brasileiro)",
    ro: "Romanian (Română)",
    ru: "Russian (Pусский)",
    sr: "Serbian (Српски)",
    sv: "Swedish (Svenska)",
    tr: "Turkish (Türkçe)",
    uk: "Ukrainian (Українська)",
    vi: "Vietnamese (Tiếng Việt)",
    "zh-CN": "Chinese Simplified (简体中文)",
    "zh-Hant": "Chinese Traditional (繁體中文)",
  };

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

  const normalizedFeatures = displayProject
    ? { ...defaultFeatures, ...(displayProject.features || {}) }
    : defaultFeatures;

  const selectedWorkspace = useSelector((state: RootState) =>
    Array.isArray(state.workspace.workspaces)
      ? state.workspace.workspaces.find((ws) => ws.workspaceId === selectedWorkspaceId)
      : null
  );
  const workspaceName = selectedWorkspace?.name || "Personal Workspace";

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const removeTag = (tagToRemove: string) => {
    setFavoriteTags(favoriteTags.filter((tag) => tag !== tagToRemove));
  };

  const handleLogout = async () => {
    await logout({
      user,
      dispatch,
      router,
      clearUserData,
      resetWorkspaceState,
      locale
    });
  };

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) return;

    const segments = pathname?.split("/") || [];
    segments[1] = newLocale;
    const newPath = segments.join("/");

    router.push(newPath);
    setCurrentLocale(newLocale);
  };

  const [currentLocale, setCurrentLocale] = useState(locale);

  useEffect(() => {
    if (locale) {
      setCurrentLocale(locale);
    }
  }, [locale]);

  useEffect(() => {
    const handleGeneratePassword = () => setShowGeneratePassword(true);
    const handleProjectDialog = () => setShowProjectDialog(true);
    const handleSearchFocus = () => searchInputRef.current?.focus();
    const handleThemeToggle = () => document.dispatchEvent(new CustomEvent("toggle-theme-event"));
    const handleOpenSearchModal = () => setShowSearchModal(true);
    const handleOpenKeyboardShortcuts = () => document.dispatchEvent(new CustomEvent("open-keyboard-shortcuts"));

    document.addEventListener("toggle-generate-password", handleGeneratePassword);
    document.addEventListener("toggle-project-dialog", handleProjectDialog);
    document.addEventListener("toggle-search-focus", handleSearchFocus);
    document.addEventListener("toggle-theme", handleThemeToggle);
    document.addEventListener("open-search-modal", handleOpenSearchModal);
    document.addEventListener("open-keyboard-shortcuts", handleOpenKeyboardShortcuts);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("open-keyboard-shortcuts"));
        return;
      }

      if (!(e.metaKey || e.ctrlKey)) return;

      if (["k", "g", "p", "d", "a", "x", "f", "n", "s", "t", "l", "h", "r", "v", "c", "e", "u", "j", "i", "q"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case "k":
          if (e.shiftKey) {
            router.push(`/${currentLocale}/dashboard/api-keys`);
          } else {
            setShowSearchModal(true);
          }
          break;
        case "s":
          if (e.shiftKey) {
            router.push(`/${currentLocale}/dashboard/security`);
          } else {
            router.push(`/${currentLocale}/dashboard/ssh-keys`);
          }
          break;
        case "r":
          if (e.shiftKey) {
            window.location.reload();
          }
          break;
        case "d":
          router.push(`/${currentLocale}/dashboard`);
          break;
        case "a":
          router.push(`/${currentLocale}/dashboard/accounts`);
          break;
        case "x":
          router.push(`/${currentLocale}/dashboard/api-keys`);
          break;
        case "y":
          router.push(`/${currentLocale}/dashboard/wallet-passphrases`);
          break;
        case "i":
          router.push(`/${currentLocale}/dashboard/wifi`);
          break;
        case "z":
          router.push(`/${currentLocale}/dashboard/identity`);
          break;
        case "c":
          router.push(`/${currentLocale}/dashboard/cards`);
          break;
        case "l":
          if (e.shiftKey) {
            document.dispatchEvent(new CustomEvent("lock-workspace"));
          } else {
            router.push(`/${currentLocale}/dashboard/software-licenses`);
          }
          break;
        case "e":
          router.push(`/${currentLocale}/dashboard/emails`);
          break;
        case "g":
          setShowGeneratePassword(true);
          break;
        case "p":
          setShowProjectDialog(true);
          break;
        case "+":
          document.dispatchEvent(new CustomEvent("toggle-add-account"));
          break;
        case "n":
          if (e.shiftKey) {
            router.push(`/${currentLocale}/dashboard/notifications`);
          }
          break;
        case "h":
          if (e.shiftKey) {
            document.dispatchEvent(new CustomEvent("open-keyboard-shortcuts"));
          } else {
            router.push(`/${currentLocale}/dashboard/shared`);
          }
          break;
        case "v":
          router.push(`/${currentLocale}/dashboard/storage`);
          break;
        case "t":
          if (e.shiftKey) {
            router.push(`/${currentLocale}/dashboard/team`);
          } else {
            document.dispatchEvent(new CustomEvent("toggle-theme-event"));
          }
          break;
        case "u":
          document.dispatchEvent(new CustomEvent("upload-file"));
          break;
        case "j":
          document.dispatchEvent(new CustomEvent("download-file"));
          break;
        case "a":
          if (e.shiftKey) {
            router.push(`/${currentLocale}/dashboard/security/alerts`);
          }
          break;
        case "q":
          handleLogout();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("toggle-generate-password", handleGeneratePassword);
      document.removeEventListener("toggle-project-dialog", handleProjectDialog);
      document.removeEventListener("toggle-search-focus", handleSearchFocus);
      document.removeEventListener("toggle-theme", handleThemeToggle);
      document.removeEventListener("open-search-modal", handleOpenSearchModal);
      document.removeEventListener("open-keyboard-shortcuts", handleOpenKeyboardShortcuts);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentLocale, router]);

  const sortedLocales = [...locales].sort((a, b) => {
    const nameA = languageLabels[a] || a;
    const nameB = languageLabels[b] || b;
    return nameA.localeCompare(nameB);
  });

  const enabledMenuItems: SearchModule[] = displayProject
    ? navigationCategories.flatMap(category =>
        category.items.filter(item =>
          'always_visible' in item ? item.always_visible :
          'feature_key' in item && item.feature_key && normalizedFeatures[item.feature_key as keyof typeof defaultFeatures]?.enabled
        ).map(item => ({
          key: 'feature_key' in item && item.feature_key ? item.feature_key : item.key,
          labelKey: item.labelKey,
          path: item.path,
          icon: item.icon
        }))
      )
    : [];

  const getVisibleCategories = () => {
    return navigationCategories.map(category => ({
      ...category,
      items: category.items.filter(item =>
        'always_visible' in item ? item.always_visible :
        'feature_key' in item && item.feature_key && normalizedFeatures[item.feature_key as keyof typeof defaultFeatures]?.enabled
      )
    })).filter(category => category.items.length > 0);
  };

  const visibleCategories = getVisibleCategories();

  return (
    <div className="flex min-h-screen bg-background">
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        modules={enabledMenuItems}
        locale={currentLocale}
        onSelectModule={(path) => router.push(`/${currentLocale}${path}`)}
      />

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

        <div className="flex-1 overflow-auto py-2 flex flex-col">
          <div className="px-3 py-2">
            <div className="mb-4">
              <label className="px-2 text-xs font-semibold text-muted-foreground mb-2 block">{translate("project", "dashboard")}</label>
              <Button
                variant="outline"
                className="w-full justify-between hover:bg-accent/50 transition-colors"
                onClick={() => setShowProjectDialog(true)}
                disabled={!selectedWorkspaceId}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: displayProject?.color || "#4f46e5" }}
                  ></div>
                  <span className="truncate">{displayProject?.name || translate("no_project_selected", "dashboard")}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </div>

            <div className="space-y-6">
              <Link
                href={`/${currentLocale}/dashboard`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  pathname === `/${currentLocale}/dashboard`
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Home className="h-4 w-4" />
                {translate("overview", "dashboard")}
              </Link>

              {visibleCategories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {translate(category.labelKey, "dashboard")}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-accent/50 transition-colors"
                      onClick={() => toggleCategory(category.id)}
                    >
                      {collapsedCategories[category.id] ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className={cn(
                    "space-y-1 transition-all duration-200 ease-in-out overflow-hidden",
                    !collapsedCategories[category.id]
                      ? "opacity-100 max-h-96"
                      : "opacity-0 max-h-0"
                  )}>
                    {category.items.map((item) => (
                      <Link
                        key={item.key}
                        href={`/${currentLocale}${item.path}`}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                          pathname === `/${currentLocale}${item.path}`
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {item.icon}
                        {translate(item.labelKey, "dashboard")}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 border-t border-border mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || "/placeholder.svg?height=32&width=32"} alt={user?.displayName || "User"} />
                    <AvatarFallback>
                      {user?.displayName
                        ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
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
                  onClick={() => setShowSearchModal(true)}
                  readOnly
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

          {/* <div className="flex items-center gap-2 px-3 py-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{workspaceName}</span>
          </div> */}

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
      {/* <KeyboardShortcutsHelp /> */}
    </div>
  );
}