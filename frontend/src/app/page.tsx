"use client"
import Link from "next/link"
import { Church, Users, BookOpen, Heart, Video, GraduationCap, ArrowRight, Shield, Bell, Newspaper, Music } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center"
        style={{ background: "radial-gradient(ellipse at top, rgba(26,60,143,0.3), transparent 70%)" }}>
        <div className="mb-8">
          <svg viewBox="0 0 100 140" width="60" height="84" xmlns="http://www.w3.org/2000/svg">
            <path d="M35 0 L40 0 L40 45 L0 45 L0 50 L40 50 L40 95 L35 95 L35 140 L40 140 L40 95 L100 95 L100 90 L40 90 L40 50 L60 50 L60 45 L40 45 L40 0 Z" fill="#1A3C8F" />
            <path d="M40 0 L45 0 L45 45 L100 45 L100 50 L45 50 L45 90 L100 90 L100 95 L45 95 L45 140 L40 140 L40 0 Z" fill="#E2A619" />
            <rect x="39.5" y="0" width="1" height="140" fill="white" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold mb-2">
          PCEA <span className="text-[#E2A619]">Connect</span>
        </h1>
        <p className="text-xl text-[#94a3b8] mb-1">The Digital Church</p>
        <p className="text-base text-[#64748b] max-w-lg mb-8 leading-relaxed">
          Worship, community, ministries, giving and church life &mdash; connected in one secure platform.
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1A3C8F] hover:bg-[#153074] text-white font-semibold text-base transition-colors">
            Join Your Church <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white font-semibold text-base hover:bg-white/5 transition-colors">
            Explore PCEA Connect
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Everything your church needs</h2>
          <p className="text-gray-400">One platform for the whole congregation.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={Church} title="Worship" desc="Today's service, preacher, scripture, bulletin and live stream in one place." />
          <Feature icon={Users} title="Ministries" desc="PCMF, YPCMF, Guild, Youth, Choir, Mission and more &mdash; each with its own experience." />
          <Feature icon={GraduationCap} title="Sunday School" desc="Child, parent and teacher journeys with privacy-first, server-side access control." />
          <Feature icon={BookOpen} title="Catechism" desc="Structured courses, modules, lessons and progress tracking for learners." />
          <Feature icon={Heart} title="Giving" desc="Secure M-Pesa tithes and offerings with transparent records and receipts." />
          <Feature icon={Video} title="Livestream" desc="Watch services live or catch up on sermon replays anytime." />
        </div>
      </section>

      {/* Community & Communication */}
      <section className="py-20 px-6 max-w-4xl mx-auto border-t border-white/5">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <Newspaper className="h-8 w-8 text-[#E2A619] mb-3" />
            <h3 className="text-lg font-bold mb-1">Church News &amp; Updates</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Stay informed about congregation announcements, ministry activity, and PCEA news. No more fragmented WhatsApp groups.</p>
          </div>
          <div>
            <Bell className="h-8 w-8 text-[#E2A619] mb-3" />
            <h3 className="text-lg font-bold mb-1">Notifications</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Receive updates about services, events, ministry activities and announcements &mdash; in one inbox, not scattered across channels.</p>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="py-20 px-6 max-w-4xl mx-auto border-t border-white/5">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-[#1A3C8F] mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Security &amp; Privacy by Design</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">PCEA Connect is designed to support applicable data-protection requirements and privacy-by-design practices. Child data is treated with special care &mdash; children have no login credentials, and access is enforced server-side.</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center text-sm">
          <Link href="/privacy" className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Terms of Service</Link>
          <Link href="/child-privacy" className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Child Privacy</Link>
          <Link href="/support" className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Support</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center border-t border-white/5">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to connect?</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">Join your congregation on PCEA Connect today.</p>
        <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1A3C8F] hover:bg-[#153074] text-white font-semibold transition-colors">
          Get Started <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-white/5">
        <p className="text-sm text-gray-500">
          Built for the whole church. A product of{" "}
          <span className="text-gray-400 font-semibold">Afrika Digitalis</span>.
        </p>
      </footer>
    </div>
  )
}

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-xl p-6 bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
      <Icon size={28} className="text-[#E2A619] mb-3" />
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  )
}
