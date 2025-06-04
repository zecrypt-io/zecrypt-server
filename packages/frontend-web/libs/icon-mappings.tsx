import {
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Github,
  Linkedin,
  Youtube,
  Chrome,
  Dribbble,
  Figma,
  Gitlab,
  Twitch,
  Mail,
  Lock,
  Key,
  CreditCard,
  Wallet,
  Wifi,
  User,
  UserCheck,
  Shield,
  FileText,
  Activity,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Star,
  Heart,
  Zap,
  Sparkles,
  Crown,
  Trophy,
  Award,
  Badge,
  Medal,
  Ribbon,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldPlus,
  ShieldMinus,
  ShieldOff,
 
} from "lucide-react";
import React from "react";

const iconMap: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  github: Github,
  gitlab: Gitlab,
  linkedin: Linkedin,
  youtube: Youtube,
  google: Chrome,
  chrome: Chrome,
  dribbble: Dribbble,
  figma: Figma,
  twitch: Twitch,
  mail: Mail,
  lock: Lock,
  key: Key,
  creditcard: CreditCard,
  wallet: Wallet,
  wifi: Wifi,
  user: User,
  usercheck: UserCheck,
  shield: Shield,
  filetext: FileText,
  activity: Activity,
  plus: Plus,
  edit: Edit,
  trash: Trash2,
  eye: Eye,
  eyeoff: EyeOff,
  star: Star,
  heart: Heart,
  zap: Zap,
  sparkles: Sparkles,
  crown: Crown,
  trophy: Trophy,
  award: Award,
  badge: Badge,
  medal: Medal,
  ribbon: Ribbon,
  shieldcheck: ShieldCheck,
  shieldalert: ShieldAlert,
  shieldx: ShieldX,
  shieldplus: ShieldPlus,
  shieldminus: ShieldMinus,
  shieldoff: ShieldOff,
  
};

export function getWebsiteIcon(url: string, className: string = "h-4 w-4") {
  if (!url) return <Globe className={className} />;
  const domain = url.toLowerCase();
  for (const [key, IconComponent] of Object.entries(iconMap)) {
    if (domain.includes(key)) {
      return <IconComponent className={className} />;
    }
  }
  // Fallback: Chrome for .com/.net/.org, else Globe
  if (domain.match(/\.(com|net|org|io|app|dev|site|shop|store|xyz|co|ai)/)) {
    return <Chrome className={className} />;
  }
  return <Globe className={className} />;
} 