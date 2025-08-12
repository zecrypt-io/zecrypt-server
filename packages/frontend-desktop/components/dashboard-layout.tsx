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
  Mail,
  Wifi,
  CreditCard,
  Wallet,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
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
import { locales } from "@/libs/locales";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/libs/Redux/store";
import { clearUserData } from "@/libs/Redux/userSlice";
import { useUser } from "@/libs/offline-auth-context";
import { useTranslator } from "@/hooks/use-translations";
import { secureSetItem } from '@/libs/local-storage-utils';
import { SearchModal } from "@/components/search-modal";
import { logout } from "@/libs/utils";
import { SidebarNav } from "@/components/sidebar-nav";
import { ChatWidget } from "@/components/chat-widget";

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
        icon: <User className="h-4 w-4" />,
        feature_key: "identity"
      },
      {
        key: "emails",
        labelKey: "email",
        path: "/dashboard/emails",
        icon: <Mail className="h-4 w-4" />,
        feature_key: "email"
      },
      {
        key: "wifi",
        labelKey: "wifi",
        path: "/dashboard/wifi",
        icon: <Wifi className="h-4 w-4" />,
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
        icon: <Key className="h-4 w-4" />,
        feature_key: "api_key"
      },
      {
        key: "ssh_key",
        labelKey: "ssh_keys",
        path: "/dashboard/ssh-keys",
        icon: <Key className="h-4 w-4" />,
        feature_key: "ssh_key"
      }
    ]
  },
  {
    id: "business",
    labelKey: "business_finance",
    items: [
      {
        key: "cards",
        labelKey: "cards",
        path: "/dashboard/cards",
        icon: <CreditCard className="h-4 w-4" />,
        feature_key: "card"
      },
      {
        key: "wallet_passphrases",
        labelKey: "wallet_passphrases",
        path: "/dashboard/wallet-passphrases",
        icon: <Wallet className="h-4 w-4" />,
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
        icon: <FileText className="h-4 w-4" />,
        feature_key: "software_license"
      }
    ]
  }
];

// Replace with your actual extension ID from chrome://extensions
const EXTENSION_ID = "bbfbjmmofbhcnegicongikfhceadhdek";

function ExtensionMessenger() {
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  useEffect(() => {
    if (accessToken && selectedWorkspaceId && selectedProjectId) {
      if ((window as any).chrome && (window as any).chrome.runtime && (window as any).chrome.runtime.sendMessage) {
        (window as any).chrome.runtime.sendMessage(
          EXTENSION_ID,
          {
            type: "LOGIN",
            token: accessToken,
            workspaceId: selectedWorkspaceId,
            projectId: selectedProjectId,
          },
          (response: { success?: boolean }) => {
            if (response && response.success) {
              console.log("Zecrypt extension: Login data sent successfully!");
            } else {
              console.warn("Zecrypt extension: Failed to send login data.");
            }
          }
        );
      }
    }
  }, [accessToken, selectedWorkspaceId, selectedProjectId]);

  return null;
}

export function DashboardLayout({ children, locale = "en" }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useUser();
  const { translate } = useTranslator();
  const [showGeneratePassword, setShowGeneratePassword] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const [showFavoritesDialog, setShowFavoritesDialog] = useState(false);
  const [favoriteTags, setFavoriteTags] = useState(["Personal", "Work", "Banking"]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(locale);

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

  const sortedLocales = [...locales].sort((a, b) => {
    const nameA = languageLabels[a] || a;
    const nameB = languageLabels[b] || b;
    return nameA.localeCompare(nameB);
  });

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

  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsSidebarCollapsed(prev => !prev);
    };

    document.addEventListener("toggle-sidebar", handleToggleSidebar);
    return () => {
      document.removeEventListener("toggle-sidebar", handleToggleSidebar);
    };
  }, []);

  const selectedProject = useSelector((state: RootState) => 
    state.workspace.workspaces
      .find(w => w.workspaceId === state.workspace.selectedWorkspaceId)
      ?.projects.find(p => p.project_id === state.workspace.selectedProjectId)
  );

  const getSearchModules = () => {
    if (!selectedProject) return [];

    const enabledModules = [];
    
    enabledModules.push({
      key: "overview",
      labelKey: "overview",
      path: "/dashboard",
      icon: <Home className="h-4 w-4" />
    });
    
    if (selectedProject.features.login?.enabled) {
      enabledModules.push({
        key: "accounts",
        labelKey: "accounts",
        path: "/dashboard/accounts",
        icon: <User className="h-4 w-4" />
      });
    }

    if (selectedProject.features.identity?.enabled) {
      enabledModules.push({
        key: "identity",
        labelKey: "identity",
        path: "/dashboard/identity",
        icon: <User className="h-4 w-4" />
      });
    }

    if (selectedProject.features.email?.enabled) {
      enabledModules.push({
        key: "emails",
        labelKey: "email",
        path: "/dashboard/emails",
        icon: <Mail className="h-4 w-4" />
      });
    }

    if (selectedProject.features.wifi?.enabled) {
      enabledModules.push({
        key: "wifi",
        labelKey: "wifi",
        path: "/dashboard/wifi",
        icon: <Wifi className="h-4 w-4" />
      });
    }

    if (selectedProject.features.api_key?.enabled) {
      enabledModules.push({
        key: "api_keys",
        labelKey: "api_keys",
        path: "/dashboard/api-keys",
        icon: <Key className="h-4 w-4" />
      });
    }

    if (selectedProject.features.ssh_key?.enabled) {
      enabledModules.push({
        key: "ssh_keys",
        labelKey: "ssh_keys",
        path: "/dashboard/ssh-keys",
        icon: <Key className="h-4 w-4" />
      });
    }

    if (selectedProject.features.card?.enabled) {
      enabledModules.push({
        key: "cards",
        labelKey: "cards",
        path: "/dashboard/cards",
        icon: <CreditCard className="h-4 w-4" />
      });
    }

    if (selectedProject.features.wallet_address?.enabled) {
      enabledModules.push({
        key: "wallet_passphrases",
        labelKey: "wallet_passphrases",
        path: "/dashboard/wallet-passphrases",
        icon: <Wallet className="h-4 w-4" />
      });
    }

    if (selectedProject.features.software_license?.enabled) {
      enabledModules.push({
        key: "software_licenses",
        labelKey: "software_licenses",
        path: "/dashboard/software-licenses",
        icon: <FileText className="h-4 w-4" />
      });
    }

    enabledModules.push({
      key: "profile",
      labelKey: "profile",
      path: "/dashboard/user-settings",
      icon: <User className="h-4 w-4" />
    });

    return enabledModules;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <ExtensionMessenger />
      <ChatWidget />
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        modules={getSearchModules()}
        locale={currentLocale}
        onSelectModule={(path) => router.push(`/${currentLocale}${path}`)}
      />

      <SidebarNav
        currentLocale={currentLocale}
        onGeneratePassword={() => setShowGeneratePassword(true)}
        onProjectDialog={() => setShowProjectDialog(true)}
        onLogout={handleLogout}
        onLanguageChange={switchLanguage}
        languageLabels={languageLabels}
        sortedLocales={sortedLocales}
        user={user}
      />

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-border px-4 lg:px-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-md hover:bg-accent/50"
            onClick={() => document.dispatchEvent(new CustomEvent("toggle-sidebar"))}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>

          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder={translate("search", "dashboard")}
                  className="w-full rounded-lg border border-border bg-background/50 py-2.5 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  onClick={() => setShowSearchModal(true)}
                  readOnly
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                  <span className="text-xs">⌘</span>K
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

          {/** Language switcher temporarily hidden per requirements (keep for later use)
           *
           * <DropdownMenu>
           *   <DropdownMenuTrigger asChild>
           *     <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
           *       <Globe className="h-4 w-4" />
           *       <span className="sr-only">Change language</span>
           *     </Button>
           *   </DropdownMenuTrigger>
           *   <DropdownMenuContent align="end">
           *     <DropdownMenuLabel>Language</DropdownMenuLabel>
           *     <DropdownMenuSeparator />
           *     {sortedLocales.map((loc) => (
           *       <DropdownMenuItem
           *         key={loc}
           *         onClick={() => switchLanguage(loc)}
           *         className={loc === currentLocale ? "font-bold bg-accent/50" : ""}
           *       >
           *         {languageLabels[loc] || loc}
           *       </DropdownMenuItem>
           *     ))}
           *   </DropdownMenuContent>
           * </DropdownMenu>
           */}

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
    </div>
  );
}