"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/page-transition";
import { getUserId, getRoles, humanizeRole } from "@/lib/auth";
import api, { apiErrorMessage } from "@/lib/api";
import {
  Baby,
  Bell,
  ChevronRight,
  Church,
  FileText,
  Heart,
  Key,
  LifeBuoy,
  LogOut,
  Mail,
  Shield,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";

type TabKey = "profile" | "privacy" | "terms" | "child-privacy" | "support";

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "privacy", label: "Privacy", icon: Heart },
  { key: "terms", label: "Terms", icon: FileText },
  { key: "child-privacy", label: "Child Privacy", icon: Baby },
  { key: "support", label: "Support", icon: LifeBuoy },
];

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [user, setUser] = useState<any>(null);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReset, setSendingReset] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const uid = getUserId();
    if (!uid) {
      router.push("/login");
      return;
    }
    setRoles(getRoles());
    Promise.all([
      api.get("/api/membership-card").catch(() => ({ data: { data: null } })),
      api.get("/api/ministries/me").catch(() => ({ data: { data: [] } })),
    ]).then(([u, m]) => {
      setUser(u.data.data);
      setMinistries(m.data.data || []);
      setLoading(false);
    });
  }, [router]);

  // Keep the active tab in sync with ?tab= deep links (used across the app)
  useEffect(() => {
    const fromUrl = searchParams.get("tab") as TabKey | null;
    if (fromUrl && TABS.some((t) => t.key === fromUrl)) {
      setActiveTab(fromUrl);
    }
  }, [searchParams]);

  const selectTab = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/settings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleLogout = () => {
    const token = localStorage.getItem("token");
    if (token) {
      api.post("/api/auth/logout", {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await api.post("/api/auth/forgot-password", { email: user.email });
      toast.success("Reset link sent", {
        description: "If this email exists, a password reset link is on its way.",
      });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not send the reset link"), {
        description: "Please try again or contact your church administrator.",
      });
    } finally {
      setSendingReset(false);
    }
  };

  const resendVerification = async () => {
    if (!user?.email) return;
    setSendingVerification(true);
    try {
      await api.post("/api/auth/resend-verification", { email: user.email });
      toast.success("Verification email sent", {
        description: "If this email exists, a verification link is on its way.",
      });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not send the verification email"));
    } finally {
      setSendingVerification(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <PageTransition>
      <div className="space-y-6 text-foreground">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, security and church information
          </p>
        </div>

        {/* Tab navigation */}
        <div
          role="tablist"
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto border-b border-white/10 pb-0"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
                  active
                    ? "border-accent bg-card text-white"
                    : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {activeTab === "profile" && (
            <ProfileTab
              user={user}
              roles={roles}
              ministries={ministries}
              onSelectTab={selectTab}
              onLogout={handleLogout}
              sendingReset={sendingReset}
              onSendPasswordReset={sendPasswordReset}
              sendingVerification={sendingVerification}
              onSendVerification={resendVerification}
            />
          )}
          {activeTab === "privacy" && <PrivacyTab />}
          {activeTab === "terms" && <TermsTab />}
          {activeTab === "child-privacy" && <ChildPrivacyTab />}
          {activeTab === "support" && <SupportTab onSelectTab={selectTab} />}
        </div>
      </div>
    </PageTransition>
  );
}

/* ─────────────────────────── Profile tab ─────────────────────────── */

function ProfileTab({
  user,
  roles,
  ministries,
  onSelectTab,
  onLogout,
  sendingReset,
  onSendPasswordReset,
  sendingVerification,
  onSendVerification,
}: {
  user: any;
  roles: string[];
  ministries: any[];
  onSelectTab: (tab: TabKey) => void;
  onLogout: () => void;
  sendingReset: boolean;
  onSendPasswordReset: () => void;
  sendingVerification: boolean;
  onSendVerification: () => void;
}) {
  const displayRoles = [...new Set([...(user?.roles || []), ...roles])];
  const initials = (user?.fullName || "U")
    .split(" ")
    .map((p: string) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Identity */}
      <Card className="border-0 bg-card shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-semibold text-white">{user?.fullName || "PCEA Member"}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email || ""}</p>
              {user?.phone && <p className="truncate text-sm text-muted-foreground">{user.phone}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {displayRoles.length > 0 ? (
                  displayRoles.map((r: string) => (
                    <Badge key={r} variant="outline">
                      {humanizeRole(r)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">Member</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Membership */}
        <Card className="border-0 bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Church className="size-5 text-blue-400" aria-hidden="true" /> My Church
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/60">
              <span className="text-sm text-muted-foreground">Congregation</span>
              <span className="text-sm font-medium text-foreground">
                {user?.congregationName || "Not linked yet"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/60">
              <span className="text-sm text-muted-foreground">Member since</span>
              <span className="text-sm font-medium text-foreground">
                {user?.memberSince
                  ? new Date(user.memberSince).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                    })
                  : "—"}
              </span>
            </div>
            <Link
              href="/membership-card"
              className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <span className="text-sm text-muted-foreground">Digital membership card</span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-0 bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="size-5 text-blue-400" aria-hidden="true" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <button
              onClick={onSendPasswordReset}
              disabled={sendingReset || !user?.email}
              className="flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-muted/60 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <span className="flex items-center gap-2 text-sm text-foreground">
                <Key className="size-4 text-muted-foreground" aria-hidden="true" /> Change password
              </span>
              {sendingReset ? (
                <span className="text-xs text-muted-foreground">Sending…</span>
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
            <p className="px-2 pb-1 text-xs text-muted-foreground">
              A secure reset link will be emailed to {user?.email || "your address"}.
            </p>
            <button
              onClick={onSendVerification}
              disabled={sendingVerification || !user?.email}
              className="flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-muted/60 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <span className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="size-4 text-muted-foreground" aria-hidden="true" /> Verify my email
              </span>
              {sendingVerification ? (
                <span className="text-xs text-muted-foreground">Sending…</span>
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
          </CardContent>
        </Card>

        {/* Ministries */}
        <Card className="border-0 bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="size-5 text-blue-400" aria-hidden="true" /> My Ministries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ministries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not a member of any ministry yet.
              </p>
            ) : (
              <div className="space-y-1">
                {ministries.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg p-2">
                    <span className="text-sm text-foreground">{m.name}</span>
                    <Badge variant="outline">{humanizeRole(m.type.replace(/_/g, "_"))}</Badge>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/ministries"
              className="mt-2 inline-block text-sm font-medium text-blue-400 transition-colors hover:text-blue-300 hover:underline"
            >
              Explore ministries →
            </Link>
          </CardContent>
        </Card>

        {/* Notifications & help */}
        <Card className="border-0 bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="size-5 text-blue-400" aria-hidden="true" /> Stay Updated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/notifications"
              className="block rounded-lg p-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <span className="text-sm text-foreground">View notifications</span>
            </Link>
            <Link
              href="/membership-card"
              className="block rounded-lg p-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <span className="text-sm text-foreground">Digital membership card</span>
            </Link>
            <button
              onClick={() => onSelectTab("privacy")}
              className="w-full rounded-lg p-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <span className="text-sm text-foreground">Privacy &amp; data preferences</span>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Sign out */}
      <Button variant="outline" onClick={onLogout} className="w-full">
        <LogOut className="mr-2 size-4" aria-hidden="true" /> Sign Out
      </Button>
    </div>
  );
}

/* ─────────────────────────── Legal tabs ─────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

function ProseList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
      ))}
    </ul>
  );
}

function PrivacyTab() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
        <p className="mt-1 text-sm text-muted-foreground">PCEA Connect — The Digital Church</p>
      </div>
      <Section title="Information We Collect">
        <ProseList
          items={[
            "Account information: name, email, phone number",
            "Church membership data: congregation affiliation, ministry memberships",
            "Worship attendance records",
            "Giving and payment information (processed securely via M-Pesa)",
            "Pastoral care requests (visible only to authorized pastoral staff)",
            "Sunday School enrollment data (children's records — see Child Privacy)",
            "Notification preferences",
          ]}
        />
      </Section>
      <Section title="Why We Collect Information">
        <p>
          Information is collected to support church operations, ministry coordination, worship
          planning, pastoral care, and member engagement. We do not sell member data to third
          parties.
        </p>
      </Section>
      <Section title="Data Security">
        <ProseList
          items={[
            "Secure password hashing (BCrypt)",
            "JWT-based authentication with refresh tokens",
            "Role-based and object-level authorization",
            "Encrypted database connections in production",
            "Server-side enforcement of all access controls",
          ]}
        />
      </Section>
      <Section title="Children's Information">
        <p>
          Children&apos;s data in Sunday School is treated with special care. Children do not have
          login credentials. Their records are visible only to their linked parents/guardians and
          assigned teachers. See the Child Privacy policy for details.
        </p>
      </Section>
      <Section title="Third-Party Services">
        <ProseList
          items={[
            "M-Pesa (Safaricom) for giving payments",
            "YouTube for live streaming and sermon replays",
            "Africa's Talking for SMS notifications (where configured)",
            "Google for optional Sign-In (where configured)",
          ]}
        />
      </Section>
      <Section title="Data Retention">
        <p>
          Account data is retained while you are an active member. You may request deletion of your
          account data at any time (see Data Rights below).
        </p>
      </Section>
      <Section title="Your Data Rights">
        <ProseList
          items={[
            "Access your personal data",
            "Request corrections to inaccurate data",
            "Request deletion of your account and associated data",
            "Withdraw consent for notifications",
            "Export your data",
          ]}
        />
      </Section>
      <Section title="Contact">
        <p>
          For privacy questions or requests, contact your church administrator or visit the Support
          tab.
        </p>
      </Section>
    </div>
  );
}

function TermsTab() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Terms of Service</h2>
        <p className="mt-1 text-sm text-muted-foreground">PCEA Connect — The Digital Church</p>
      </div>
      <Section title="Acceptance of Terms">
        <p>
          By creating an account and using PCEA Connect, you agree to these Terms of Service. If you
          do not agree, please do not use the platform.
        </p>
      </Section>
      <Section title="Account Responsibilities">
        <p>
          You are responsible for maintaining the security of your account credentials. You must not
          share your password with others. All activity under your account is your responsibility.
        </p>
      </Section>
      <Section title="Acceptable Use">
        <p>PCEA Connect is provided for church engagement, worship, ministry coordination, and communication. You agree not to:</p>
        <ProseList
          items={[
            "Post content that is harmful, offensive, or unlawful",
            "Attempt to access data you are not authorized to view",
            "Share other members' personal information without consent",
            "Use the platform for commercial purposes unrelated to church activities",
          ]}
        />
      </Section>
      <Section title="Role-Based Access">
        <p>
          Your role within the church (member, elder, pastor, teacher, etc.) determines what actions
          you can take. Roles are assigned by church administrators. You must not attempt to elevate
          your own access.
        </p>
      </Section>
      <Section title="Giving and Payments">
        <p>
          Giving through PCEA Connect is processed by M-Pesa (Safaricom). The church does not store
          your M-Pesa PIN. Transaction records are maintained for receipt and reconciliation
          purposes. All payments are subject to Safaricom&apos;s terms of service.
        </p>
      </Section>
      <Section title="Privacy">
        <p>See the Privacy tab for how we handle your data.</p>
      </Section>
    </div>
  );
}

function ChildPrivacyTab() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Child Privacy Policy</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PCEA Connect — Sunday School &amp; Children&apos;s Data
        </p>
      </div>
      <Section title="Overview">
        <p>
          PCEA Connect is designed to support applicable data-protection requirements and
          privacy-by-design practices. Children&apos;s data is treated with special care. This policy
          explains how Sunday School data is collected, stored, and accessed.
        </p>
      </Section>
      <Section title="No Child Accounts">
        <p>
          Children do not have login credentials in PCEA Connect. They cannot sign in. A
          child&apos;s record is created by a church administrator or teacher and is linked to their
          parent&apos;s or guardian&apos;s account.
        </p>
      </Section>
      <Section title="What We Store">
        <ProseList
          items={[
            "Child's name",
            "Date of birth (optional, for age-appropriate class placement)",
            "Sunday School class assignment",
            "Attendance records",
            "Lesson progress and teacher notes",
          ]}
        />
        <p className="mt-2">
          We do <strong>not</strong> store children&apos;s contact information (phone, email,
          address). There is no child financial data in the system.
        </p>
      </Section>
      <Section title="Who Can See Child Data">
        <ProseList
          items={[
            "<strong>Parents/Guardians:</strong> Can see only their own linked children. This is enforced server-side.",
            "<strong>Teachers:</strong> Can see only children in classes they are assigned to.",
            "<strong>Church Administrators:</strong> Can manage classes, assign teachers, and link parents.",
            "<strong>Ministry Leaders:</strong> Do not automatically see child data unless explicitly assigned.",
          ]}
        />
      </Section>
      <Section title="Access Controls">
        <p>
          All child data access is enforced on the server, not just in the frontend. Even if someone
          knows a child&apos;s ID, they cannot access the data without a verified parent link or
          teacher assignment.
        </p>
      </Section>
      <Section title="Parental/Guardian Rights">
        <ProseList
          items={[
            "Request to view your child's data",
            "Request corrections to your child's records",
            "Request deletion of your child's data",
            "Withdraw consent for your child's data to be stored",
          ]}
        />
        <p className="mt-2">
          To exercise these rights, contact your church administrator or visit the Support tab.
        </p>
      </Section>
    </div>
  );
}

function SupportTab({ onSelectTab }: { onSelectTab: (tab: TabKey) => void }) {
  const legalLink = (label: string, tab: TabKey) => (
    <button
      onClick={() => onSelectTab(tab)}
      className="text-left text-sm text-blue-400 transition-colors hover:text-blue-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      → {label}
    </button>
  );
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Support</h2>
        <p className="mt-1 text-sm text-muted-foreground">PCEA Connect — The Digital Church</p>
      </div>
      <Section title="Need Help?">
        <p>
          If you need help with your PCEA Connect account, please contact your church administrator.
          They can assist with:
        </p>
        <ProseList
          items={[
            "Account issues (login, password reset)",
            "Congregation affiliation",
            "Ministry membership",
            "Sunday School enrollment",
            "Privacy requests",
          ]}
        />
      </Section>
      <Section title="Privacy & Data Requests">
        <p>
          To exercise your data rights (access, correction, deletion), contact your church
          administrator. Your administrator can also help you change your personal details.
        </p>
      </Section>
      <Section title="Security">
        <p>
          If you believe your account has been compromised, use the{" "}
          <button
            onClick={() => onSelectTab("profile")}
            className="font-medium text-blue-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            Security
          </button>{" "}
          section of the Profile tab to reset your password, and contact your church administrator.
        </p>
      </Section>
      <Section title="Resources">
        <div className="flex flex-col items-start gap-2">
          {legalLink("Privacy Policy", "privacy")}
          {legalLink("Terms of Service", "terms")}
          {legalLink("Child Privacy Policy", "child-privacy")}
        </div>
      </Section>
    </div>
  );
}
