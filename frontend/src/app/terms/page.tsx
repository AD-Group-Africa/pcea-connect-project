"use client"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0f1e", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Terms of Service</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "2rem" }}>PCEA Connect — The Digital Church</p>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Acceptance of Terms</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>By creating an account and using PCEA Connect, you agree to these Terms of Service. If you do not agree, please do not use the platform.</p>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Account Responsibilities</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>You are responsible for maintaining the security of your account credentials. You must not share your password with others. All activity under your account is your responsibility.</p>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Acceptable Use</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>PCEA Connect is provided for church engagement, worship, ministry coordination, and communication. You agree not to:</p>
          <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem", fontSize: "0.9rem", color: "#94a3b8" }}>
            <li>Post content that is harmful, offensive, or unlawful</li>
            <li>Attempt to access data you are not authorized to view</li>
            <li>Share other members' personal information without consent</li>
            <li>Use the platform for commercial purposes unrelated to church activities</li>
          </ul>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Role-Based Access</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>Your role within the church (member, elder, pastor, teacher, etc.) determines what actions you can take. Roles are assigned by church administrators. You must not attempt to elevate your own access.</p>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Giving and Payments</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>Giving through PCEA Connect is processed by M-Pesa (Safaricom). The church does not store your M-Pesa PIN. Transaction records are maintained for receipt and reconciliation purposes. All payments are subject to Safaricom's terms of service.</p>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Privacy</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>See our <Link href="/privacy" style={{ color: "#60a5fa" }}>Privacy Policy</Link> for how we handle your data.</p>
        </div>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>&larr; Back to PCEA Connect</Link>
        </div>
      </div>
    </div>
  )
}
