"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  HardDrive,
  Home,
  Key,
  Lock,
  LogOut,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Share,
  User,
  Users,
  Wifi,
  CreditCard,
  Wallet,
} from "lucide-react"
import { cn } from "@/libs/utils"
import { useTranslator } from "@/hooks/use-translations"
import { useSelector } from "react-redux"
import { RootState } from "@/libs/Redux/store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect } from "react"

interface NavigationItem {
  key: string
  labelKey: string
  path: string
  icon: React.ReactElement
  always_visible?: boolean
  feature_key?: string
}

interface NavigationCategory {
  id: string
  labelKey: string
  items: NavigationItem[]
}

interface SidebarNavProps {
  currentLocale: string
  onGeneratePassword: () => void
  onProjectDialog: () => void
  onLogout: () => void
  onLanguageChange: (locale: string) => void
  languageLabels: Record<string, string>
  sortedLocales: string[]
  user: any
}

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
      },
      {
        key: "notes",
        labelKey: "notes",
        path: "/dashboard/notes",
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
        ),
        feature_key: "notes"
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
        key: "env",
        labelKey: "env_variables",
        path: "/dashboard/environments",
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
            <path d="M4 6V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H4" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M10.5 13.5c.5.5 2.5.5 3 0" />
            <path d="M11 12v1c0 1-1 2-2 2s-2-1-2-2v-1" />
            <path d="M17 12v1c0 1-1 2-2 2s-2-1-2-2v-1" />
          </svg>
        ),
        feature_key: "env"
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
]

const defaultFeatures = {
  login: { enabled: false, is_client_side_encryption: false },
  api_key: { enabled: false, is_client_side_encryption: false },
  wallet_address: { enabled: false, is_client_side_encryption: false },
  wifi: { enabled: false, is_client_side_encryption: false },
  identity: { enabled: false, is_client_side_encryption: false },
  card: { enabled: false, is_client_side_encryption: false },
  software_license: { enabled: false, is_client_side_encryption: false },
  email: { enabled: false, is_client_side_encryption: false },
  ssh_key: { enabled: false, is_client_side_encryption: false },
  env: { enabled: false, is_client_side_encryption: false }
}

export function SidebarNav({
  currentLocale,
  onGeneratePassword,
  onProjectDialog,
  onLogout,
  onLanguageChange,
  languageLabels,
  sortedLocales,
  user,
}: SidebarNavProps) {
  const pathname = usePathname()
  const { translate } = useTranslator()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    overview: false,
    general: false,
    security: false,
    business: false,
    licenses: false
  })

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId)
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId)
  const selectedProject = useSelector((state: RootState) =>
    Array.isArray(state.workspace.workspaces) && selectedWorkspaceId && selectedProjectId
      ? state.workspace.workspaces
          .find((ws) => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find((p) => p.project_id === selectedProjectId)
      : null
  )
  const defaultProject = useSelector((state: RootState) =>
    Array.isArray(state.workspace.workspaces) && selectedWorkspaceId
      ? state.workspace.workspaces
          .find((ws) => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find((p) => p.is_default)
      : null
  )
  const displayProject = selectedProject || defaultProject

  const normalizedFeatures = displayProject
    ? { ...defaultFeatures, ...(displayProject.features || {}) }
    : defaultFeatures

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const getVisibleCategories = () => {
    return navigationCategories.map(category => ({
      ...category,
      items: category.items.filter(item =>
        'always_visible' in item ? item.always_visible :
        'feature_key' in item && item.feature_key && normalizedFeatures[item.feature_key as keyof typeof defaultFeatures]?.enabled
      )
    })).filter(category => category.items.length > 0)
  }

  const visibleCategories = getVisibleCategories()

  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsCollapsed(prev => !prev)
    }

    document.addEventListener("toggle-sidebar", handleToggleSidebar)
    return () => {
      document.removeEventListener("toggle-sidebar", handleToggleSidebar)
    }
  }, [])

  return (
    <div
      className={cn(
        "flex flex-col border-r border-border bg-background/50 backdrop-blur-sm transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href={`/${currentLocale}/dashboard`} className="flex items-center gap-2">
          <img src="/favicon.ico" alt="Zecrypt" className="h-6 w-6" />
          {!isCollapsed && <span className="font-semibold">Zecrypt</span>}
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-2 flex flex-col">
        <div className="px-3 py-2">
          <div className="mb-4">
            {!isCollapsed && (
              <label className="px-2 text-xs font-semibold text-muted-foreground mb-2 block">
                {translate("project", "dashboard")}
              </label>
            )}
            <Button
              variant="outline"
              className={cn(
                "w-full justify-between hover:bg-accent/50 transition-colors",
                isCollapsed && "px-2"
              )}
              onClick={onProjectDialog}
              disabled={!selectedWorkspaceId}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: displayProject?.color || "#4f46e5" }}
                ></div>
                {!isCollapsed && (
                  <span className="truncate">
                    {displayProject?.name || translate("no_project_selected", "dashboard")}
                  </span>
                )}
              </div>
              {!isCollapsed && <ChevronDown className="h-4 w-4 opacity-50" />}
            </Button>
          </div>

          <div className="space-y-4">
            <Link
              href={`/${currentLocale}/dashboard`}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                pathname === `/${currentLocale}/dashboard`
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "justify-center"
              )}
            >
              <Home className="h-4 w-4" />
              {!isCollapsed && translate("overview", "dashboard")}
            </Link>

            {visibleCategories.map((category) => (
              <div key={category.id}>
                {!isCollapsed && (
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
                )}
                <div className={cn(
                  "space-y-1 transition-all duration-200 ease-in-out overflow-hidden",
                  !collapsedCategories[category.id] || isCollapsed
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
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        isCollapsed && "justify-center"
                      )}
                    >
                      {item.icon}
                      {!isCollapsed && translate(item.labelKey, "dashboard")}
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
              <div className={cn(
                "flex items-center gap-3 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent",
                isCollapsed && "justify-center"
              )}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || "/placeholder.svg?height=32&width=32"} alt={user?.displayName || "User"} />
                  <AvatarFallback>
                    {user?.displayName
                      ? user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.primaryEmail || "user@example.com"}</p>
                  </div>
                )}
                {!isCollapsed && <ChevronDown className="ml-auto h-4 w-4" />}
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
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{translate("logout", "dashboard")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

