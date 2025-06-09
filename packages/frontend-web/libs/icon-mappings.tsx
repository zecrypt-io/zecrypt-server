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
  MessageCircle,
  MessageSquare,
  Send,
  Phone,
  Video,
  Calendar,
  Briefcase,
  Code,
  Server,
  Cloud,
  Database,
  Settings,
  Users,
  PenTool,
  Palette,
  Camera,
  PlayCircle,
  Music,
  ShoppingCart,
  ShoppingBag,
  Store,
  DollarSign,
  CreditCard as Card,
  Bitcoin,
  TrendingUp,
  GraduationCap,
  BookOpen,
  Monitor,
  Smartphone,
  Car,
  MapPin,
  Plane,
  Home,
  Building,
  Search,
  Triangle,
  CheckCircle,
  Bug,
  Archive,
  Gamepad,
  Target,
  Bookmark,
  Rss,
} from "lucide-react";
import React from "react";

// Direct Lucide icon mappings
const lucideIconMap: Record<string, React.ElementType> = {
  // Social Media
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  
  // Communication
  discord: MessageSquare,
  telegram: Send,
  signal: Shield,
  whatsapp: MessageCircle,
  viber: Phone,
  line: MessageCircle,
  slack: MessageSquare,
  
  // Development & Tech
  github: Github,
  gitlab: Gitlab,
  stackoverflow: Code,
  replit: Code,
  glitch: Zap,
  vercel: Triangle,
  netlify: Globe,
  heroku: Server,
  render: Server,
  digitalocean: Server,
  aws: Cloud,
  azure: Cloud,
  firebase: Database,
  
  // Email
  gmail: Mail,
  outlook: Mail,
  protonmail: ShieldCheck,
  
  // Design & Productivity
  figma: Figma,
  canva: Palette,
  adobe: Camera,
  notion: FileText,
  trello: Settings,
  asana: Users,
  clickup: CheckCircle,
  jira: Bug,
  zoom: Video,
  calendly: Calendar,
  grammarly: PenTool,
  loom: Video,
  miro: PenTool,
  docusign: FileText,
  
  // Storage
  dropbox: Cloud,
  onedrive: Cloud,
  box: Archive,
  wetransfer: Send,
  
  // Gaming
  steam: Gamepad,
  xbox: Gamepad,
  playstation: Gamepad,
  nintendo: Gamepad,
  
  // E-commerce
  amazon: ShoppingBag,
  ebay: Store,
  etsy: Heart,
  walmart: ShoppingCart,
  flipkart: ShoppingBag,
  myntra: ShoppingBag,
  target: Target,
  aliexpress: ShoppingCart,
  alibaba: Building,
  
  // Finance
  paypal: DollarSign,
  stripe: CreditCard,
  razorpay: CreditCard,
  coinbase: Bitcoin,
  binance: Bitcoin,
  zerodha: TrendingUp,
  robinhood: TrendingUp,
  
  // Education
  coursera: GraduationCap,
  udemy: BookOpen,
  edx: GraduationCap,
  codecademy: Code,
  duolingo: Globe,
  brilliant: Zap,
  
  // Media & News
  medium: BookOpen,
  substack: Mail,
  pocket: Bookmark,
  feedly: Rss,
  
  // Entertainment
  netflix: PlayCircle,
  hulu: PlayCircle,
  spotify: Music,
  twitch: Twitch,
  hotstar: PlayCircle,
  
  // Travel & Transport
  airbnb: Home,
  uber: Car,
  ola: Car,
  lyft: Car,
  skyscanner: Plane,
  booking: Building,
  
  // Fallback icons
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

// Brand colors for custom icons
const brandColors: Record<string, string> = {
  // Social Media
  facebook: "#1877F2",
  instagram: "#E4405F",
  twitter: "#1DA1F2",
  snapchat: "#FFFC00",
  tiktok: "#000000",
  linkedin: "#0A66C2",
  pinterest: "#BD081C",
  reddit: "#FF4500",
  tumblr: "#00CF35",
  threads: "#000000",
  wechat: "#07C160",
  discord: "#5865F2",
  telegram: "#0088CC",
  signal: "#3A76F0",
  whatsapp: "#25D366",
  clubhouse: "#F1C40F",
  bereal: "#000000",
  viber: "#665CAC",
  line: "#00C300",
  mastodon: "#563ACC",
  
  // Email
  gmail: "#EA4335",
  yahoo: "#6001D2",
  outlook: "#0078D4",
  zoho: "#C9302C",
  protonmail: "#6D4AFF",
  fastmail: "#355F7F",
  icloud: "#007AFF",
  gmx: "#1D4F8C",
  aol: "#FF0B00",
  
  // Job Platforms
  upwork: "#6FDA44",
  freelancer: "#0E74BC",
  fiverr: "#00B22D",
  toptal: "#204ECF",
  indeed: "#003A9B",
  monster: "#6358DC",
  glassdoor: "#0CAA41",
  angellist: "#000000",
  
  // Development
  github: "#000000",
  gitlab: "#FC6D26",
  bitbucket: "#0052CC",
  stackoverflow: "#F58025",
  replit: "#F26207",
  glitch: "#3333FF",
  vercel: "#000000",
  netlify: "#00C7B7",
  heroku: "#430098",
  render: "#46E3B7",
  digitalocean: "#0080FF",
  aws: "#FF9900",
  azure: "#0078D4",
  googlecloud: "#4285F4",
  firebase: "#FFCA28",
  
  // Productivity
  notion: "#000000",
  evernote: "#00A82D",
  trello: "#0079BF",
  asana: "#273347",
  clickup: "#7B68EE",
  jira: "#0052CC",
  slack: "#4A154B",
  teams: "#6264A7",
  zoom: "#2D8CFF",
  googlemeet: "#00897B",
  calendly: "#006BFF",
  grammarly: "#15C39A",
  loom: "#625DF5",
  miro: "#FFD02F",
  figma: "#F24E1E",
  canva: "#00C4CC",
  adobe: "#FF0000",
  quillbot: "#6C5CE7",
  docusign: "#FFB800",
  
  // Storage
  dropbox: "#0061FF",
  box: "#0061D5",
  onedrive: "#0078D4",
  wetransfer: "#409FFF",
  
  // Gaming
  steam: "#000000",
  epicgames: "#000000",
  origin: "#FF6600",
  xbox: "#107C10",
  playstation: "#003087",
  nintendo: "#E60012",
  riotgames: "#D32936",
  battlenet: "#00AEFF",
  ubisoft: "#0064C8",
  gog: "#86328A",
  
  // E-commerce
  amazon: "#FF9900",
  ebay: "#E53238",
  etsy: "#F16521",
  walmart: "#0071CE",
  flipkart: "#047BD6",
  myntra: "#FF3F6C",
  target: "#CC0000",
  aliexpress: "#FF6A00",
  alibaba: "#FF6A00",
  meesho: "#6E1889",
  olx: "#002F34",
  craigslist: "#00AB44",
  
  // Finance
  paypal: "#00457C",
  stripe: "#635BFF",
  razorpay: "#3395FF",
  googlepay: "#4285F4",
  applepay: "#000000",
  phonepe: "#5F259F",
  venmo: "#008CFF",
  cashapp: "#00C244",
  wise: "#37517E",
  revolut: "#0075EB",
  coinbase: "#0052FF",
  binance: "#F3BA2F",
  wazirx: "#3B82F6",
  zerodha: "#387ED1",
  robinhood: "#00C805",
  
  // Education
  coursera: "#0056D3",
  udemy: "#A435F0",
  edx: "#02262B",
  khanacademy: "#14BF96",
  skillshare: "#00FF88",
  codecademy: "#3A3B3C",
  duolingo: "#58CC02",
  brilliant: "#FFB100",
  unacademy: "#08BD80",
  linkedinlearning: "#0A66C2",
  
  // Media
  medium: "#000000",
  substack: "#FF6719",
  pocket: "#EF3F56",
  feedly: "#2BB24C",
  nytimes: "#000000",
  wsj: "#000000",
  bbc: "#BB1919",
  guardian: "#052962",
  reuters: "#FF8000",
  hackernews: "#FF6600",
  
  // Security
  auth0: "#EB5424",
  okta: "#007DC1",
  onepassword: "#0094F5",
  lastpass: "#D32C2C",
  dashlane: "#00B386",
  keeper: "#173A56",
  nordvpn: "#4690FF",
  protonvpn: "#6D4AFF",
  surfshark: "#00D4AA",
  expressvpn: "#DA020E",
  
  // Entertainment
  youtube: "#FF0000",
  netflix: "#E50914",
  hulu: "#1CE783",
  disneyplus: "#113CCF",
  primevideo: "#00A8E1",
  spotify: "#1DB954",
  applemusic: "#FA243C",
  soundcloud: "#FF5500",
  twitch: "#9146FF",
  hotstar: "#0F79AF",
  
  // Travel
  airbnb: "#FF5A5F",
  booking: "#003580",
  skyscanner: "#0770E3",
  uber: "#000000",
  ola: "#FFE600",
  lyft: "#FF00BF",
  makemytrip: "#E73C7E",
  agoda: "#3A5998",
  trivago: "#EB6F0C",
  expedia: "#FCC72C",
};

// Service categories for better icon selection
const serviceCategories: Record<string, string[]> = {
  social: ["facebook", "instagram", "twitter", "snapchat", "tiktok", "linkedin", "pinterest", "reddit", "tumblr", "threads", "mastodon"],
  messaging: ["discord", "telegram", "signal", "whatsapp", "wechat", "viber", "line", "slack", "teams"],
  email: ["gmail", "yahoo", "outlook", "zoho", "protonmail", "fastmail", "icloud", "gmx", "aol"],
  work: ["upwork", "freelancer", "fiverr", "toptal", "indeed", "monster", "glassdoor", "angellist"],
  development: ["github", "gitlab", "bitbucket", "stackoverflow", "replit", "glitch", "vercel", "netlify", "heroku", "render", "digitalocean", "aws", "azure", "googlecloud", "firebase"],
  productivity: ["notion", "evernote", "trello", "asana", "clickup", "jira", "zoom", "googlemeet", "calendly", "grammarly", "loom", "miro", "figma", "canva", "adobe", "docusign"],
  storage: ["dropbox", "box", "onedrive", "wetransfer"],
  gaming: ["steam", "epicgames", "origin", "xbox", "playstation", "nintendo", "riotgames", "battlenet", "ubisoft", "gog"],
  ecommerce: ["amazon", "ebay", "etsy", "walmart", "flipkart", "myntra", "target", "aliexpress", "alibaba", "meesho", "olx", "craigslist"],
  finance: ["paypal", "stripe", "razorpay", "googlepay", "applepay", "phonepe", "venmo", "cashapp", "wise", "revolut", "coinbase", "binance", "wazirx", "zerodha", "robinhood"],
  education: ["coursera", "udemy", "edx", "khanacademy", "skillshare", "codecademy", "duolingo", "brilliant", "unacademy", "linkedinlearning"],
  media: ["medium", "substack", "pocket", "feedly", "nytimes", "wsj", "bbc", "guardian", "reuters", "hackernews"],
  security: ["auth0", "okta", "onepassword", "lastpass", "dashlane", "keeper", "nordvpn", "protonvpn", "surfshark", "expressvpn"],
  entertainment: ["youtube", "netflix", "hulu", "disneyplus", "primevideo", "spotify", "applemusic", "soundcloud", "twitch", "hotstar"],
  travel: ["airbnb", "booking", "skyscanner", "uber", "ola", "lyft", "makemytrip", "agoda", "trivago", "expedia"]
};

// Custom icon component for services without Lucide icons
const CustomIcon: React.FC<{ 
  service: string; 
  className?: string; 
  fallbackIcon?: React.ElementType;
}> = ({ service, className = "h-4 w-4", fallbackIcon: FallbackIcon }) => {
  const color = brandColors[service.toLowerCase()] || "#6B7280";
  const initials = service.split(/[\s-_]/).map(word => word[0]?.toUpperCase()).join('').slice(0, 2);
  
  if (FallbackIcon) {
    return <FallbackIcon className={className} style={{ color }} />;
  }
  
  return (
    <div 
      className={`${className} rounded-full flex items-center justify-center text-white font-bold text-xs`}
      style={{ 
        backgroundColor: color,
        minWidth: className.includes('h-') ? className.split('h-')[1]?.split(' ')[0] + 'rem' : '1rem',
        minHeight: className.includes('h-') ? className.split('h-')[1]?.split(' ')[0] + 'rem' : '1rem'
      }}
    >
      {initials}
    </div>
  );
};

// Enhanced function to get website/service icon
export function getWebsiteIcon(url: string, className: string = "h-4 w-4"): React.ReactElement {
  if (!url) return <Globe className={className} />;
  
  const normalizedUrl = url.toLowerCase();
  
  // First, try direct Lucide icon mapping
  for (const [key, IconComponent] of Object.entries(lucideIconMap)) {
    if (normalizedUrl.includes(key)) {
      return <IconComponent className={className} />;
    }
  }
  
  // Then try brand-specific matching with custom icons
  for (const [service, color] of Object.entries(brandColors)) {
    if (normalizedUrl.includes(service)) {
      // Get category-based fallback icon
      let fallbackIcon = Globe;
      for (const [category, services] of Object.entries(serviceCategories)) {
        if (services.includes(service)) {
          switch (category) {
            case 'social': fallbackIcon = Users; break;
            case 'messaging': fallbackIcon = MessageCircle; break;
            case 'email': fallbackIcon = Mail; break;
            case 'work': fallbackIcon = Briefcase; break;
            case 'development': fallbackIcon = Code; break;
            case 'productivity': fallbackIcon = Settings; break;
            case 'storage': fallbackIcon = Cloud; break;
            case 'gaming': fallbackIcon = Gamepad; break;
            case 'ecommerce': fallbackIcon = ShoppingCart; break;
            case 'finance': fallbackIcon = DollarSign; break;
            case 'education': fallbackIcon = GraduationCap; break;
            case 'media': fallbackIcon = BookOpen; break;
            case 'security': fallbackIcon = Shield; break;
            case 'entertainment': fallbackIcon = PlayCircle; break;
            case 'travel': fallbackIcon = MapPin; break;
          }
          break;
        }
      }
      
      return <CustomIcon service={service} className={className} fallbackIcon={fallbackIcon} />;
    }
  }
  
  // Final fallback based on domain type
  if (normalizedUrl.match(/\.(com|net|org|io|app|dev|site|shop|store|xyz|co|ai|in)/)) {
    return <Chrome className={className} />;
  }
  
  return <Globe className={className} />;
}

// Helper function to get service category
export function getServiceCategory(url: string): string {
  const normalizedUrl = url.toLowerCase();
  
  for (const [category, services] of Object.entries(serviceCategories)) {
    for (const service of services) {
      if (normalizedUrl.includes(service)) {
        return category;
      }
    }
  }
  
  return 'general';
}

// Helper function to get brand color
export function getBrandColor(url: string): string {
  const normalizedUrl = url.toLowerCase();
  
  for (const [service, color] of Object.entries(brandColors)) {
    if (normalizedUrl.includes(service)) {
      return color;
    }
  }
  
  return '#6B7280'; // Default gray
}