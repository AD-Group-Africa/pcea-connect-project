import {
  Bell,
  BookMarked,
  BriefcaseBusiness,
  CalendarDays,
  Church,
  GraduationCap,
  HandCoins,
  Headphones,
  Heart,
  HeartHandshake,
  Home,
  CupSoda,
  MapPin,
  Megaphone,
  MessagesSquare,
  Radio,
  Search,
  Sun,
  UserRound,
  Users,
  Video,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
}

/**
 * Primary congregant destinations — exactly five, on mobile AND desktop:
 *   HOME · BIBLE · SERVICES · MINISTRIES · PROFILE
 *
 * Complexity lives behind permissions, not in the navigation: administrative
 * surfaces (members, analytics, attendance, media management, moderation…)
 * stay reachable for authorised roles from Profile → leadership tools, and
 * everyone else via the header "More" menu — never as bottom-nav items.
 */
export const MOBILE_NAV: NavItem[] = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "Bible", path: "/bible", icon: BookMarked },
  { label: "Services", path: "/services", icon: Church, matchPrefix: true },
  { label: "Ministries", path: "/ministries", icon: Users, matchPrefix: true },
  { label: "Profile", path: "/profile", icon: UserRound },
];

/** Desktop header navigation — same five destinations, room for Give. */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "Bible", path: "/bible", icon: BookMarked },
  { label: "Services", path: "/services", icon: Church, matchPrefix: true },
  { label: "Ministries", path: "/ministries", icon: Users, matchPrefix: true },
  { label: "Give", path: "/giving", icon: HandCoins },
];

/** Everything else, grouped — surfaced through the "More" menu and ⌘K palette. */
export const EXPLORE_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Worship & Media",
    items: [
      { label: "Worship", path: "/worship", icon: Church },
      { label: "Events", path: "/events", icon: CalendarDays },
      { label: "Livestream", path: "/livestream", icon: Radio },
      { label: "Sermons", path: "/sermons", icon: Video },
      { label: "Media Library", path: "/media", icon: Headphones },
    ],
  },
  {
    title: "Grow in Faith",
    items: [
      { label: "Communion", path: "/communion", icon: CupSoda, matchPrefix: true },
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
      { label: "Giving", path: "/giving", icon: HandCoins },
      { label: "Membership Card", path: "/membership-card", icon: Waypoints },
      { label: "Find a Church", path: "/locator", icon: MapPin },
      { label: "Church Structure", path: "/church", icon: Waypoints },
      { label: "Works", path: "/works", icon: BriefcaseBusiness },
    ],
  },
];

/** Flat, ordered list of every navigable dashboard route (for the ⌘K palette). */
export const ALL_NAV_ITEMS: NavItem[] = [
  ...PRIMARY_NAV,
  ...MOBILE_NAV,
  ...EXPLORE_SECTIONS.flatMap((section) => section.items),
].filter(
  (item, index, all) => all.findIndex((other) => other.path === item.path) === index,
);
