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
  const [name, setName] = useState("Sadik Ali")
  const [email, setEmail] = useState("sadik@example.com")
  const [avatarSrc, setAvatarSrc] = useState("/placeholder.svg?height=128&width=128")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const router = useRouter();
  const pathname = usePathname();
  
  // Login history state
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  // Get current locale from pathname
  const [currentLocale, setCurrentLocale] = useState("en");
  
  // Set the current locale on component mount
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
        setLoginHistory(response.data);
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
  
  // Localized labels for languages
  const languageLabels = {
    en: "English",
    fr: "French (Français)",
    es: "Spanish (Español)"
  };
  
  // Handle language change
  const handleLanguageChange = (newLocale: string) => {
    // Switch language by changing the URL path
    const segments = pathname?.split('/') || [];
    // Remove the current locale segment
    segments.splice(1, 1, newLocale);
    const newPath = segments.join('/');
    router.push(newPath);
    setCurrentLocale(newLocale);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-3 mb-6">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-2 h-4 w-4" />
            Login History
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="mr-2 h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile & Account Information</CardTitle>
              <CardDescription>Manage your personal and account details</CardDescription>
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
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-sm text-muted-foreground">Profile picture</p>
                </div>

                {/* Form Fields Section */}
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    {/* Username field - Commented out as requested */}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    {/* Phone Number field - Commented out as requested */}
                    
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={currentLocale} onValueChange={handleLanguageChange}>
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {locales.map(locale => (
                            <SelectItem key={locale} value={locale}>
                              {languageLabels[locale as keyof typeof languageLabels] || locale}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Timezone field - Commented out as requested */}
                    
                  </div>

                  <Button className="w-full mt-6">Save Changes</Button>
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
                  {loginHistory.map((entry, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          {entry.device?.is_mobile ? (
                            <Smartphone className="h-5 w-5 mr-2 text-muted-foreground" />
                          ) : (
                            <Laptop className="h-5 w-5 mr-2 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{entry.browser} on {entry.os}</p>
                            <p className="text-sm text-muted-foreground">{getDeviceInfo(entry)}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">IP: {entry.ip_address}</span>
                      </div>
                    </div>
                  ))}
                  
                  {loginHistory.length > 0 && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm">
                        View More
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

