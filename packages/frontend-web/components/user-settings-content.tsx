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

export function UserSettingsContent() {
  const [activeTab, setActiveTab] = useState("profile")
  const [name, setName] = useState("Sadik Ali")
  const [email, setEmail] = useState("sadik@example.com")
  const [avatarSrc, setAvatarSrc] = useState("/placeholder.svg?height=128&width=128")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const router = useRouter();
  const pathname = usePathname();
  
  // Get current locale from pathname
  const [currentLocale, setCurrentLocale] = useState("en");
  
  // Set the current locale on component mount
  useEffect(() => {
    const pathSegments = pathname?.split('/') || [];
    if (pathSegments.length > 1 && locales.includes(pathSegments[1] as any)) {
      setCurrentLocale(pathSegments[1]);
    }
  }, [pathname]);
  
  // Localized labels for languages
  const languageLabels = {
    en: "English",
    fr: "French (Français)",
    es: "Spanish (Español)",
    de: "German (Deutsch)",
    vi: "Vietnamese (Tiếng Việt)",
    uk: "Ukrainian (Українська)",
    'zh-Hant': "Traditional Chinese (繁體中文)",
    'pt-BR': "Brazilian Portuguese (Português Brasileiro)",
    pt: "Portuguese (Português)",
    ro: "Romanian (Română)",
    ru: "Russian (Pусский)",
    sr: "Serbian (Српски)"
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
              <div className="space-y-4">
                <p>View your recent login activity</p>
              </div>
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

