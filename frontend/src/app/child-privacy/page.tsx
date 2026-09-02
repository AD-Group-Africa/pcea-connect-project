"use client"
import Link from "next/link"

export default function ChildPrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0f1e", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Child Privacy Policy</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "2rem" }}>PCEA Connect — Sunday School &amp; Children's Data</p>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Overview</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>PCEA Connect is designed to support applicable data-protection requirements and privacy-by-design practices. Children's data is treated with special care. This policy explains how Sunday School data is collected, stored, and accessed.</p>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>No Child Accounts</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>Children do not have login credentials in PCEA Connect. They cannot sign in. A child's record is created by a church administrator or teacher and is linked to their parent's or guardian's account.</p>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>What We Store</h2>
          <ul style={{ marginLeft: "1.5rem", fontSize: "0.9rem", color: "#94a3b8" }}>
            <li>Child's name</li>
            <li>Date of birth (optional, for age-appropriate class placement)</li>
            <li>Sunday School class assignment</li>
            <li>Attendance records</li>
            <li>Lesson progress and teacher notes</li>
          </ul>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6, marginTop: "0.5rem" }}>We do <strong>not</strong> store children's contact information (phone, email, address). There is no child financial data in the system.</p>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Who Can See Child Data</h2>
          <ul style={{ marginLeft: "1.5rem", fontSize: "0.9rem", color: "#94a3b8" }}>
            <li><strong>Parents/Guardians:</strong> Can see only their own linked children. This is enforced server-side — a parent cannot query another family's child.</li>
            <li><strong>Teachers:</strong> Can see only children in classes they are assigned to. A teacher cannot access other classes.</li>
            <li><strong>Church Administrators:</strong> Can manage classes, assign teachers, and link parents. This is a privileged role.</li>
            <li><strong>Ministry Leaders:</strong> Do <strong>not</strong> automatically see child data. They must be explicitly assigned as a teacher or hold an admin role.</li>
          </ul>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Access Controls</h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>All child data access is enforced on the server, not just in the frontend. Even if someone knows a child's ID, they cannot access the data without a verified parent link or teacher assignment. Child records are never exposed through generic member directory endpoints.</p>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Parental/Guardian Rights</h2>
          <ul style={{ marginLeft: "1.5rem", fontSize: "0.9rem", color: "#94a3b8" }}>
            <li>Request to view your child's data</li>
            <li>Request corrections to your child's records</li>
            <li>Request deletion of your child's data</li>
            <li>Withdraw consent for your child's data to be stored</li>
          </ul>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6, marginTop: "0.5rem" }}>To exercise these rights, contact your church administrator or visit our <Link href="/support" style={{ color: "#60a5fa" }}>Support page</Link>.</p>
        </div>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>&larr; Back to PCEA Connect</Link>
        </div>
      </div>
    </div>
  )
}
