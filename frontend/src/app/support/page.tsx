"use client"
import Link from "next/link"

export default function SupportPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0f1e", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Support</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "2rem" }}>PCEA Connect — The Digital Church</p>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Need Help?</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>If you need help with your PCEA Connect account, please contact your church administrator. They can assist with:</p>
          <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem", fontSize: "0.9rem", color: "#94a3b8" }}>
            <li>Account issues (login, password reset)</li>
            <li>Congregation affiliation</li>
            <li>Ministry membership</li>
            <li>Sunday School enrollment</li>
            <li>Privacy requests</li>
          </ul>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Privacy &amp; Data Requests</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>To exercise your data rights (access, correction, deletion), contact your church administrator or submit a request through your <Link href="/profile" style={{ color: "#60a5fa" }}>Profile settings</Link>.</p>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Security</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>If you believe your account has been compromised, change your password immediately from your <Link href="/profile" style={{ color: "#60a5fa" }}>Profile settings</Link> and contact your church administrator.</p>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Resources</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Link href="/privacy" style={{ color: "#60a5fa", textDecoration: "none" }}>&rarr; Privacy Policy</Link>
            <Link href="/terms" style={{ color: "#60a5fa", textDecoration: "none" }}>&rarr; Terms of Service</Link>
            <Link href="/child-privacy" style={{ color: "#60a5fa", textDecoration: "none" }}>&rarr; Child Privacy Policy</Link>
          </div>
        </div>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>&larr; Back to PCEA Connect</Link>
        </div>
      </div>
    </div>
  )
}
