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
  const [showImageOptions, setShowImageOptions] = useState(false)
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarSrc(event.target.result as string)
          setShowImageOptions(false)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setAvatarSrc("/placeholder.svg?height=128&width=128")
    setShowImageOptions(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-5 mb-6">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-2 h-4 w-4" />
            Login History
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="mr-2 h-4 w-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Preferences
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
                {/* Profile Image Section */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32 cursor-pointer" onClick={() => setShowImageOptions(!showImageOptions)}>
                      <AvatarImage src={avatarSrc} alt={name} />
                      <AvatarFallback className="text-xl">
                        {name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 cursor-pointer"
                      onClick={() => setShowImageOptions(!showImageOptions)}
                    >
                      <Camera className="h-5 w-5 text-white" />
                    </div>

                    {showImageOptions && (
                      <div className="absolute top-full mt-2 w-48 bg-card rounded-md shadow-md border border-border z-10">
                        <div className="p-2 space-y-1">
                          <label className="flex items-center gap-2 p-2 text-sm rounded-md cursor-pointer hover:bg-accent">
                            <Upload className="h-4 w-4" />
                            <span>Upload Image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
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

                {/* Form Fields Section */}
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value="sadikali" disabled />
                      <p className="text-xs text-muted-foreground">Your username cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
                    </div>
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
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="utc-8">
                        <SelectTrigger id="timezone">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utc-12">UTC-12:00</SelectItem>
                          <SelectItem value="utc-8">UTC-08:00 (Pacific Time)</SelectItem>
                          <SelectItem value="utc-5">UTC-05:00 (Eastern Time)</SelectItem>
                          <SelectItem value="utc-0">UTC+00:00 (GMT)</SelectItem>
                          <SelectItem value="utc+1">UTC+01:00 (Central European Time)</SelectItem>
                          <SelectItem value="utc+5.5">UTC+05:30 (Indian Standard Time)</SelectItem>
                          <SelectItem value="utc+8">UTC+08:00 (China Standard Time)</SelectItem>
                          <SelectItem value="utc+9">UTC+09:00 (Japan Standard Time)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button className="w-full mt-6">Save Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Password</h3>
                  <div className="p-4 border rounded-md border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-muted-foreground">
                          Update your password to keep your account secure
                        </p>
                      </div>
                      <Button onClick={() => setShowPasswordModal(true)}>Update Password</Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                      <Switch id="two-factor" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Protect your account with an additional security layer
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-md border-border">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">Authenticator App</p>
                          <p className="text-sm text-muted-foreground">
                            Use an authenticator app to generate verification codes
                          </p>
                        </div>
                      </div>
                      <Button className="w-full mt-4" variant="outline">
                        Set Up
                      </Button>
                    </div>

                    <div className="p-4 border rounded-md border-border">
                      <div className="flex items-center gap-3">
                        <Mail className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">Email Authentication</p>
                          <p className="text-sm text-muted-foreground">Receive verification codes via email</p>
                        </div>
                      </div>
                      <Button className="w-full mt-4" variant="outline">
                        Set Up
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Additional Security</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-logout">Auto-Logout</Label>
                        <Switch id="auto-logout" defaultChecked />
                      </div>
                      <p className="text-sm text-muted-foreground">Automatically log out when inactive</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                      <Input id="session-timeout" type="number" defaultValue="30" min="5" max="240" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password-policy">Enforce Password Policy</Label>
                        <Switch id="password-policy" defaultChecked />
                      </div>
                      <p className="text-sm text-muted-foreground">Require strong passwords for your account</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ip-restriction">IP Restriction</Label>
                        <Switch id="ip-restriction" />
                      </div>
                      <p className="text-sm text-muted-foreground">Limit access to specific IP addresses</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4">Save Security Settings</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Login History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Recent account activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search sessions..." className="pl-8" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-md border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium text-sm">Device</th>
                      <th className="text-left p-3 font-medium text-sm">Location</th>
                      <th className="text-left p-3 font-medium text-sm">IP Address</th>
                      <th className="text-left p-3 font-medium text-sm">Time</th>
                      <th className="text-left p-3 font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Monitor className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Chrome on Windows</p>
                            <p className="text-xs text-muted-foreground">Windows 11</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p>New York, USA</p>
                      </td>
                      <td className="p-3">
                        <p>192.168.1.1</p>
                      </td>
                      <td className="p-3">
                        <p>Just now</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-xs">Current</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Laptop className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Safari on macOS</p>
                            <p className="text-xs text-muted-foreground">macOS Sonoma</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p>San Francisco, USA</p>
                      </td>
                      <td className="p-3">
                        <p>192.168.1.2</p>
                      </td>
                      <td className="p-3">
                        <p>Yesterday, 2:45 PM</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                          <span className="text-xs">Inactive</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Smartphone className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Mobile App</p>
                            <p className="text-xs text-muted-foreground">iOS 17</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p>Chicago, USA</p>
                      </td>
                      <td className="p-3">
                        <p>192.168.1.3</p>
                      </td>
                      <td className="p-3">
                        <p>2 days ago</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                          <span className="text-xs">Inactive</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Globe className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Firefox on Ubuntu</p>
                            <p className="text-xs text-muted-foreground">Ubuntu 22.04</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p>London, UK</p>
                      </td>
                      <td className="p-3">
                        <p>192.168.1.4</p>
                      </td>
                      <td className="p-3">
                        <p>3 days ago</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                          <span className="text-xs">Inactive</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          </div>
                          <div>
                            <p className="font-medium">Unknown Device</p>
                            <p className="text-xs text-muted-foreground">Android 14</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p>Mumbai, India</p>
                      </td>
                      <td className="p-3">
                        <p>192.168.1.5</p>
                      </td>
                      <td className="p-3">
                        <p>5 days ago</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                          <span className="text-xs">Suspicious</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">Showing 5 of 24 sessions</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Security Tip</h4>
                    <p className="text-sm text-muted-foreground">
                      If you notice any suspicious activity, immediately change your password and enable two-factor
                      authentication.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Track all security-related activities in your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search audit logs..." className="pl-8" />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="password">Password Change</SelectItem>
                      <SelectItem value="settings">Settings Change</SelectItem>
                      <SelectItem value="account">Account Activity</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <RotateCcw className="h-4 w-4" />
                    <span>Refresh</span>
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">Last updated: Today, 11:45 AM</div>
              </div>

              <div className="border rounded-md border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium text-sm">Event</th>
                      <th className="text-left p-3 font-medium text-sm">User</th>
                      <th className="text-left p-3 font-medium text-sm">IP Address</th>
                      <th className="text-left p-3 font-medium text-sm">Date & Time</th>
                      <th className="text-left p-3 font-medium text-sm">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <Shield className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">Login Success</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">sadik@example.com</td>
                      <td className="p-3">192.168.1.1</td>
                      <td className="p-3">Today, 10:45 AM</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <FileText className="h-4 w-4" />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <Key className="h-4 w-4 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">Password Changed</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">sadik@example.com</td>
                      <td className="p-3">192.168.1.1</td>
                      <td className="p-3">Yesterday, 3:22 PM</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <FileText className="h-4 w-4" />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          </div>
                          <div>
                            <p className="font-medium">Failed Login Attempt</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">sadik@example.com</td>
                      <td className="p-3">203.0.113.42</td>
                      <td className="p-3">3 days ago</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <FileText className="h-4 w-4" />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                            <Settings className="h-4 w-4 text-purple-500" />
                          </div>
                          <div>
                            <p className="font-medium">Settings Updated</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">sadik@example.com</td>
                      <td className="p-3">192.168.1.1</td>
                      <td className="p-3">5 days ago</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <FileText className="h-4 w-4" />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <Users className="h-4 w-4 text-red-500" />
                          </div>
                          <div>
                            <p className="font-medium">Team Member Added</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">sadik@example.com</td>
                      <td className="p-3">192.168.1.1</td>
                      <td className="p-3">1 week ago</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <FileText className="h-4 w-4" />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">Showing 5 of 124 events</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">About Audit Logs</h4>
                    <p className="text-sm text-muted-foreground">
                      Audit logs record all important actions taken in your account. They are retained for 90 days and
                      can be exported for your records.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance & Notifications</CardTitle>
              <CardDescription>Customize your experience and notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Appearance Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Appearance</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="grid grid-cols-5 gap-2">
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-8 w-8 rounded-full bg-blue-500 cursor-pointer ring-2 ring-offset-2 ring-blue-500"></div>
                          <span className="text-xs">Blue</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-8 w-8 rounded-full bg-purple-500 cursor-pointer"></div>
                          <span className="text-xs">Purple</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-8 w-8 rounded-full bg-green-500 cursor-pointer"></div>
                          <span className="text-xs">Green</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-8 w-8 rounded-full bg-orange-500 cursor-pointer"></div>
                          <span className="text-xs">Orange</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-8 w-8 rounded-full bg-pink-500 cursor-pointer"></div>
                          <span className="text-xs">Pink</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="animations">Interface Animations</Label>
                        <Switch id="animations" defaultChecked />
                      </div>
                      <p className="text-sm text-muted-foreground">Enable animations throughout the interface</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notifications Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Notifications</h3>

                  {/* Notification Channels */}
                  <div className="mb-6 space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Notification Channels</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-md border-border hover:border-primary/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            <Label htmlFor="email-notifications" className="font-medium">
                              Email Notifications
                            </Label>
                          </div>
                          <Switch id="email-notifications" defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">Receive important alerts and updates via email</p>
                      </div>

                      <div className="p-4 border rounded-md border-border hover:border-primary/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            <Label htmlFor="browser-notifications" className="font-medium">
                              Browser Notifications
                            </Label>
                          </div>
                          <Switch id="browser-notifications" defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">Get real-time alerts in your browser</p>
                      </div>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Notification Types</h4>
                    <div className="space-y-3 bg-muted/30 p-4 rounded-md">
                      <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <Shield className="h-4 w-4 text-red-500" />
                          </div>
                          <div>
                            <Label htmlFor="security-alerts" className="font-medium">
                              Security Alerts
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Login attempts, password changes, and security threats
                            </p>
                          </div>
                        </div>
                        <Switch id="security-alerts" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <Key className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <Label htmlFor="password-updates" className="font-medium">
                              Password Updates
                            </Label>
                            <p className="text-xs text-muted-foreground">Password expiration and credential updates</p>
                          </div>
                        </div>
                        <Switch id="password-updates" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <Users className="h-4 w-4 text-green-500" />
                          </div>
                          <div>
                            <Label htmlFor="team-invites" className="font-medium">
                              Team Invites
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Workspace invitations and team member updates
                            </p>
                          </div>
                        </div>
                        <Switch id="team-invites" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                            <Megaphone className="h-4 w-4 text-purple-500" />
                          </div>
                          <div>
                            <Label htmlFor="marketing" className="font-medium">
                              Marketing & Updates
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Product updates, tips, and promotional offers
                            </p>
                          </div>
                        </div>
                        <Switch id="marketing" />
                      </div>
                    </div>
                  </div>

                  {/* Notification Frequency */}
                  <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Notification Frequency</h4>
                    <div className="p-4 border rounded-md border-border">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="notification-frequency">Email Digest Frequency</Label>
                          <Select defaultValue="daily">
                            <SelectTrigger id="notification-frequency">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="realtime">Real-time</SelectItem>
                              <SelectItem value="daily">Daily Digest</SelectItem>
                              <SelectItem value="weekly">Weekly Digest</SelectItem>
                              <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Choose how often you receive email notification digests
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="quiet-hours" className="font-medium">
                              Quiet Hours
                            </Label>
                            <p className="text-xs text-muted-foreground">Pause notifications during specific hours</p>
                          </div>
                          <Switch id="quiet-hours" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-8">Save</Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="text-red-500">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-400">Irreversible actions that affect your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md border-red-200 dark:border-red-900 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950"
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove all
                          associated data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-500 hover:bg-red-600">Delete Account</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
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

