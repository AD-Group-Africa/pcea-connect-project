"use client"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0f1e", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Privacy Policy</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "2rem" }}>PCEA Connect &mdash; The Digital Church</p>

        <Section title="Information We Collect">
          <p>PCEA Connect collects information you provide directly, including:</p>
          <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
            <li>Account information: name, email, phone number</li>
            <li>Church membership data: congregation affiliation, ministry memberships</li>
            <li>Worship attendance records</li>
            <li>Giving and payment information (processed securely via M-Pesa)</li>
            <li>Pastoral care requests (visible only to authorized pastoral staff)</li>
            <li>Sunday School enrollment data (children's records — see <Link href="/child-privacy" style={{ color: "#60a5fa" }}>Child Privacy</Link>)</li>
            <li>Notification preferences</li>
          </ul>
        </Section>

        <Section title="Why We Collect Information">
          <p>Information is collected to support church operations, ministry coordination, worship planning, pastoral care, and member engagement. We do not sell member data to third parties.</p>
        </Section>

        <Section title="Data Security">
          <p>PCEA Connect is designed to support applicable data-protection requirements and privacy-by-design practices. We use:</p>
          <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
            <li>Secure password hashing (BCrypt)</li>
            <li>JWT-based authentication with refresh tokens</li>
            <li>Role-based and object-level authorization</li>
            <li>Encrypted database connections in production</li>
            <li>Server-side enforcement of all access controls</li>
          </ul>
        </Section>

        <Section title="Children's Information">
          <p>Children's data in Sunday School is treated with special care. Children do not have login credentials. Their records are visible only to their linked parents/guardians and assigned teachers. See our <Link href="/child-privacy" style={{ color: "#60a5fa" }}>Child Privacy Policy</Link> for details.</p>
        </Section>

        <Section title="Third-Party Services">
          <p>PCEA Connect integrates with the following services for specific functions:</p>
          <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
            <li>M-Pesa (Safaricom) for giving payments</li>
            <li>YouTube for live streaming and sermon replays</li>
            <li>Africa's Talking for SMS notifications (where configured)</li>
            <li>Google for optional Sign-In (where configured)</li>
          </ul>
          <p style={{ marginTop: "0.5rem" }}>Each service has its own privacy policy. We share only the minimum data necessary for the service to function.</p>
        </Section>

        <Section title="Data Retention">
          <p>Account data is retained while you are an active member. You may request deletion of your account data at any time (see Data Rights below).</p>
        </Section>

        <Section title="Your Data Rights">
          <p>You have the right to:</p>
          <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
            <li>Access your personal data</li>
            <li>Request corrections to inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent for notifications</li>
            <li>Export your data</li>
          </ul>
          <p style={{ marginTop: "0.5rem" }}>To exercise these rights, contact your church administrator or visit our <Link href="/support" style={{ color: "#60a5fa" }}>Support page</Link>.</p>
        </Section>

        <Section title="Contact">
          <p>For privacy questions or requests, contact your church administrator or visit our <Link href="/support" style={{ color: "#60a5fa" }}>Support page</Link>.</p>
        </Section>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>&larr; Back to PCEA Connect</Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>{title}</h2>
      <div style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}
