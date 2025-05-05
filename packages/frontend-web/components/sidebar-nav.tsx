"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/libs/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  CreditCard,
  FileText,
  Home,
  Settings,
  Users,
  FolderOpen,
  Clock,
  Star,
  Share2,
  HardDrive,
  Key,
  Wallet,
  Wifi,
  Mail,
  UserCheck,
  KeySquare,
} from "lucide-react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: React.ReactNode
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)} {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline",
            "justify-start gap-2",
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  )
}

export const dashboardNavItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Logins",
    href: "/dashboard/accounts",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    title: "API Keys",
    href: "/dashboard/api-keys",
    icon: <Key className="h-4 w-4" />,
  },
  {
    title: "Wallet Phrases",
    href: "/dashboard/wallet-passphrases",
    icon: <Wallet className="h-4 w-4" />,
  },
  {
    title: "Cards",
    href: "/dashboard/credit-cards",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    title: "Identity",
    href: "/dashboard/identities",
    icon: <UserCheck className="h-4 w-4" />,
  },
  {
    title: "WiFi",
    href: "/dashboard/wifi-passwords",
    icon: <Wifi className="h-4 w-4" />,
  },
  {
    title: "Software Licenses",
    href: "/dashboard/licenses",
    icon: <KeySquare className="h-4 w-4" />,
  },
  {
    title: "Emails",
    href: "/dashboard/emails",
    icon: <Mail className="h-4 w-4" />,
  },
]

export const settingsNavItems = [
  {
    title: "Team",
    href: "/dashboard/team",
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "User Settings",
    href: "/dashboard/user-settings",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    title: "Project Settings",
    href: "/dashboard/project-settings",
    icon: <Settings className="h-4 w-4" />,
  },
]

