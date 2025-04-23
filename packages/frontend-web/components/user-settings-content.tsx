"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTranslator } from "@/hooks/use-translations"

import {
  User,
  Shield,
  Camera,
  Upload,
  Trash,
  Mail,
  AlertCircle,
  Smartphone,
  Search,
  Clock,
  Monitor,
  Laptop,
  Globe,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bell,
  Key,
  Users,
  Megaphone,
  FileText,
  Download,
  Filter,
  RotateCcw,
  Settings,
  Loader2,
  Tablet,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { UpdatePasswordModal } from "@/components/update-password-modal"
import { useRouter, usePathname } from "next/navigation"
import { locales } from "@/middleware"
import { useTranslations } from "next-intl"
import { fetchLoginHistory, formatDate, getDeviceInfo } from "@/libs/api-client"
import { useUser } from '@stackframe/stack'

// Interface for login history entry
interface LoginHistoryEntry {
  ip_address: string;
  created_by: string;
  created_at: string;
  user_agent: string;
  browser: string;
  os: string;
  device: {
    type: string;
    is_mobile: boolean;
    is_tablet: boolean;
    is_pc: boolean;
  };
}

export function UserSettingsContent() {
  const [activeTab, setActiveTab] = useState("profile")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [avatarSrc, setAvatarSrc] = useState("/placeholder.svg?height=128&width=128")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter();
  const pathname = usePathname();
  const { translate } = useTranslator();
  const user = useUser();

  
  // Login history state
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
  
  // Get current locale from pathname
  const [currentLocale, setCurrentLocale] = useState("en");
  
  // Fetch user profile on mount
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        // If we have user data from @stackframe/stack, use it
        if (user) {
          setName(user.displayName || "");
          setEmail(user.primaryEmail || "");
          setAvatarSrc(user.profileImageUrl || "/placeholder.svg?height=128&width=128");
          setLoading(false);
          return;
        }

        // Fallback to API call if no user data from @stackframe/stack
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
          credentials: "include",
        });
        if (!res.ok) {
          // Silently log the error without setting it to state
          console.error("Failed to fetch profile");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data?.data) {
          setName(data.data.name || "");
          setEmail(data.data.email || "");
          setAvatarSrc(data.data.profile_url || "/placeholder.svg?height=128&width=128");
          setCurrentLocale(data.data.language || "en");
        }
      } catch (err: any) {
        // Silently log the error without setting it to state
        console.error("Error fetching profile:", err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  // Set the current locale from URL if present
  useEffect(() => {
    const pathSegments = pathname?.split('/') || [];
    if (pathSegments.length > 1 && locales.includes(pathSegments[1] as any)) {
      setCurrentLocale(pathSegments[1]);
    }
  }, [pathname]);
  
  // Fetch login history when the history tab is activated
  useEffect(() => {
    if (activeTab === "history") {
      loadLoginHistory();
    }
  }, [activeTab]);
  
  // Function to load login history
  const loadLoginHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    
    try {
      const response = await fetchLoginHistory();
      if (response.status_code === 200 && response.data) {
        // Remove duplicates by using the exact timestamp as the unique key
        const uniqueByTimestamp = new Map();
        
        // First pass to identify duplicates
        response.data.forEach((entry: LoginHistoryEntry) => {
          // Use the exact created_at timestamp as the unique key
          const timestamp = entry.created_at;
          
          if (!uniqueByTimestamp.has(timestamp)) {
            uniqueByTimestamp.set(timestamp, entry);
          }
        });
        
        const uniqueEntries = Array.from(uniqueByTimestamp.values());
        console.log(`Filtered ${response.data.length} entries down to ${uniqueEntries.length} unique entries`);
        
        setLoginHistory(uniqueEntries);
        setCurrentPage(1); // Reset to first page when loading new data
      } else {
        setHistoryError(response.message || "Failed to load login history");
      }
    } catch (error) {
      console.error("Error loading login history:", error);
      setHistoryError("Failed to load login history. Please try again later.");
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Get current entries for pagination
  const getCurrentEntries = () => {
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    return loginHistory.slice(indexOfFirstEntry, indexOfLastEntry);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(loginHistory.length / entriesPerPage);
  
  // Change page
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  // Previous page
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  // Next page
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  // Localized labels for languages
  const languageLabels = {
    en: "English",
    fr: "French (Français)",
    es: "Spanish (Español)",
    de: "German (Deutsch)",
    vi: "Vietnamese (Tiếng Việt)",
    uk: "Ukrainian (Українська)",
    'zh-Hant': "Chinese Traditional (繁體中文)",
    'pt-BR': "Brazilian Portuguese (Português Brasileiro)",
    pt: "Portuguese (Português)",
    ro: "Romanian (Română)",
    ru: "Russian (Pусский)",
    sr: "Serbian (Српски)",
    sv: "Swedish (Svenska)",
    tr: "Turkish (Türkçe)",
    pl: "Polish (Polskie)",
    no: "Norwegian (Norsk)",
    nl: "Dutch (Nederlands)",
    ko: "Korean (한국어)",
    ja: "Japanese (日本語)",
    it: "Italian (Italiano)",
    id: "Indonesian (Bahasa Indonesia)",
    hu: "Hungarian (Magyar)",
    he: "Hebrew (עִברִית)",
    fi: "Finnish (Suomalainen)",
    el: "Greek (Ελληνικά)",
    da: "Danish (Dansk)",
    cs: "Czech (Čeština)",
    'zh-CN': "Chinese Simplified (简体中文)",
    ca: "Catalan (Català)",
    ar: "Arabic (عربى)",
    af: "Afrikaans (Afrikaans)",
  };
  
  // Sort locales by display name
  const sortedLocales = [...locales].sort((a, b) => {
    const nameA = languageLabels[a as keyof typeof languageLabels] || a;
    const nameB = languageLabels[b as keyof typeof languageLabels] || b;
    return nameA.localeCompare(nameB);
  });
  
  // Handle language change
  const handleLanguageChange = (newLocale: string) => {
    setCurrentLocale(newLocale);
  };

  // Handle save changes
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          language: currentLocale,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setSuccess("Profile updated successfully");
      // Optionally update the URL to reflect the new locale
      const segments = pathname?.split('/') || [];
      if (segments.length > 1 && locales.includes(segments[1] as any)) {
        segments[1] = currentLocale;
        const newPath = segments.join('/');
        if (newPath !== pathname) router.push(newPath);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{translate("title", "user_settings")}</h1>
          <p className="text-muted-foreground">{translate("description", "user_settings")}</p>
        </div>
      </div>
      {loading && <div className="mb-4 text-blue-500">Loading...</div>}
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {success && <div className="mb-4 text-green-600">{success}</div>}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-3 mb-6">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            {translate("profile", "user_settings")}
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-2 h-4 w-4" />
            {translate("login_history", "user_settings")}
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="mr-2 h-4 w-4" /> 
            {translate("audit_log", "user_settings")}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{translate("profile_title", "user_settings")}</CardTitle>
              <CardDescription>{translate("profile_description", "user_settings")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Image Section - Kept but without edit options */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={avatarSrc} alt={name} />
                      <AvatarFallback className="text-xl">
                        {name
                          ? name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-sm text-muted-foreground">{translate("profile_picture", "user_settings")}</p>
                </div>

                {/* Form Fields Section */}
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{translate("full_name", "user_settings")}</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    {/* Username field - Commented out as requested */}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">{translate("email_address", "user_settings")}</Label>
                      <Input id="email" type="email" value={email} disabled />
                    </div>
                    {/* Phone Number field - Commented out as requested */}
                    
                    <div className="space-y-2">
                      <Label htmlFor="language">{translate("language", "user_settings")}</Label>
                      <Select value={currentLocale} onValueChange={handleLanguageChange}>
                        <SelectTrigger id="language">
                          <SelectValue placeholder={translate("select_language", "user_settings")} />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedLocales.map(locale => (
                            <SelectItem key={locale} value={locale}>
                              {languageLabels[locale as keyof typeof languageLabels] || locale}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Timezone field - Commented out as requested */}
                    
                  </div>

                  <Button className="w-full mt-6" onClick={handleSave} disabled={loading}>
                    {loading ? (translate("saving", "user_settings")) : (translate("save_changes", "user_settings"))}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Recent account activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Loading login history...</p>
                </div>
              ) : historyError ? (
                <div className="bg-destructive/10 text-destructive rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <p>{historyError}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={loadLoginHistory}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : loginHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No login history available</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Table header */}
                  <div className="grid grid-cols-3 gap-4 px-4 py-2 font-medium text-sm border-b">
                    <div>Device & Browser</div>
                    <div>IP Address</div>
                    <div>Time</div>
                  </div>
                  
                  {/* Table rows */}
                  <div className="space-y-1">
                    {getCurrentEntries().map((entry, index: number) => (
                      <div 
                        key={`login-entry-${index}-${entry.created_at}`} 
                        className="grid grid-cols-3 gap-4 px-4 py-3 text-sm hover:bg-muted/50 rounded-md transition-colors"
                      >
                        {/* Device & Browser column */}
                        <div className="flex items-start">
                          {entry.device?.is_mobile ? (
                            <Smartphone className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                          ) : entry.device?.is_tablet ? (
                            <Tablet className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                          ) : (
                            <Laptop className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                          )}
                          <div>
                            <p>{entry.browser} on {entry.os}</p>
                            <p className="text-muted-foreground text-xs">{getDeviceInfo(entry)}</p>
                          </div>
                        </div>
                        
                        {/* IP Address column */}
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{entry.ip_address}</span>
                        </div>
                        
                        {/* Time column */}
                        <div className="text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {loginHistory.length > 0 && (
                    <div className="mt-6 flex items-center justify-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {translate("previous", "user_settings")}
                      </Button>
                      
                      <div className="flex items-center px-4">
                        <span className="text-sm text-muted-foreground">
                          {translate("page", "user_settings")} {currentPage} {translate("of", "user_settings")} {totalPages}
                        </span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        {translate("next", "user_settings")}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Track all account activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>View detailed audit logs of your account</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {showPasswordModal && <UpdatePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  )
}

function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

