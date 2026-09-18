import {
  Bell,
  BookOpen,
  CalendarDays,
  Church,
  Compass,
  GraduationCap,
  BriefcaseBusiness,
  HandCoins,
  Headphones,
  Heart,
  HeartHandshake,
  Home,
  MapPin,
  Megaphone,
  MessagesSquare,
  Radio,
  Search,
  Sun,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
}

/** Primary destinations shown in the header and mobile bottom bar. */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "Worship", path: "/worship", icon: Church, matchPrefix: true },
  { label: "Ministries", path: "/ministries", icon: Users, matchPrefix: true },
  { label: "Give", path: "/giving", icon: HandCoins },
  { label: "Works", path: "/works", icon: BriefcaseBusiness },
];

/** Everything else, grouped — surfaced through the “More” menu and the ⌘K palette. */
export const EXPLORE_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Worship & Media",
    items: [
      { label: "Events", path: "/events", icon: CalendarDays },
      { label: "Livestream", path: "/livestream", icon: Radio },
      { label: "Sermons", path: "/sermons", icon: Video },
      { label: "Media Library", path: "/media", icon: Headphones },
    ],
  },
  {
    title: "Grow in Faith",
    items: [
      { label: "Bible", path: "/bible", icon: BookOpen },
      { label: "Catechism", path: "/catechism", icon: GraduationCap },
      { label: "Sunday School", path: "/sunday-school", icon: Sun, matchPrefix: true },
      { label: "Church Feed", path: "/feed", icon: MessagesSquare },
      { label: "Search", path: "/search", icon: Search },
    ],
  },
  {
    title: "Serve & Care",
    items: [
      { label: "Volunteer", path: "/volunteer", icon: HeartHandshake },
      { label: "Prayer & Care", path: "/pastoral-care", icon: Heart },
      { label: "Announcements", path: "/communication", icon: Megaphone },
      { label: "Notifications", path: "/notifications", icon: Bell },
    ],
  },
  {
    title: "Church Life",
    items: [
      { label: "Membership Card", path: "/membership-card", icon: Compass },
      { label: "Find a Church", path: "/locator", icon: MapPin },
      { label: "Church Structure", path: "/church", icon: Church },
      { label: "Members Directory", path: "/members", icon: Users },
    ],
  },
];

/** Flat, ordered list of every navigable dashboard route (for the ⌘K palette). */
export const ALL_NAV_ITEMS: NavItem[] = [
  ...PRIMARY_NAV,
  ...EXPLORE_SECTIONS.flatMap((section) => section.items),
];
