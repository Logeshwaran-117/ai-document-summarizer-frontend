// src/pages/LandingPage.jsx
// Public marketing page — shown at "/" when user is NOT authenticated.
// No external dependencies beyond react-router-dom (already in the project).

import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "📄",
    title: "Summarize any document",
    desc: "Upload PDFs, Word docs, or text files and get a crisp summary in seconds.",
  },
  {
    icon: "📊",
    title: "Extract tables",
    desc: "Pull structured data from PDFs and spreadsheets — ready to export or query.",
  },
  {
    icon: "🏦",
    title: "Banking intelligence",
    desc: "Parse bank statements into categorized spend reports and visual charts.",
  },
  {
    icon: "💬",
    title: "Chat with your docs",
    desc: "Ask follow-up questions directly against any uploaded document.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    cta: "Get started",
    highlight: false,
    perks: ["5 summaries / day", "2 table extractions / day", "PDF & DOCX support"],
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/ month",
    cta: "Start free trial",
    highlight: true,
    perks: [
      "Unlimited summaries",
      "Unlimited tables",
      "Banking reports",
      "Document chat",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "₹1999",
    period: "/ month",
    cta: "Contact sales",
    highlight: false,
    perks: [
      "Everything in Pro",
      "5 team seats",
      "Admin dashboard",
      "Usage analytics",
      "SLA support",
    ],
  },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: "#1a1a1a" }}>
      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid #e5e7eb",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: "60px",
      }}>
        <span style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
          📑 PreciQo
        </span>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <a href="#features" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.9rem" }}>Features</a>
          <a href="#pricing" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.9rem" }}>Pricing</a>
          <Link to="/login" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.9rem" }}>Sign in</Link>
          <Link to="/signup" style={{
            background: "#2563eb", color: "#fff", padding: "0.45rem 1.1rem",
            borderRadius: "8px", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600,
          }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        textAlign: "center", padding: "6rem 2rem 5rem",
        background: "linear-gradient(180deg, #eff6ff 0%, #fff 100%)",
      }}>
        <div style={{
          display: "inline-block", background: "#dbeafe", color: "#1d4ed8",
          borderRadius: "999px", padding: "0.25rem 0.9rem",
          fontSize: "0.8rem", fontWeight: 600, marginBottom: "1.5rem",
        }}>
          AI-powered document intelligence
        </div>
        <h1 style={{
          fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 800,
          lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 auto 1.25rem",
          maxWidth: "700px",
        }}>
          Your documents,<br />understood instantly.
        </h1>
        <p style={{
          color: "#6b7280", fontSize: "1.15rem", maxWidth: "520px",
          margin: "0 auto 2.5rem", lineHeight: 1.7,
        }}>
          Upload a PDF, Word doc, or spreadsheet. Get summaries, extracted tables,
          and answers — in seconds.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/signup" style={{
            background: "#2563eb", color: "#fff", padding: "0.75rem 1.75rem",
            borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "1rem",
            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
          }}>
            Start for free →
          </Link>
          <a href="#features" style={{
            background: "#fff", color: "#374151", padding: "0.75rem 1.75rem",
            borderRadius: "10px", textDecoration: "none", fontWeight: 600, fontSize: "1rem",
            border: "1px solid #d1d5db",
          }}>
            See how it works
          </a>
        </div>
        <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "1.25rem" }}>
          No credit card required · Free plan available
        </p>
      </section>

      {/* ── Social proof strip ── */}
      <div style={{
        textAlign: "center", padding: "1.5rem 2rem",
        borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6",
        color: "#9ca3af", fontSize: "0.85rem",
      }}>
        Trusted by teams at &nbsp;
        <strong style={{ color: "#6b7280" }}>Startups, agencies, and finance teams</strong>
        &nbsp;across India
      </div>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
          fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.75rem",
        }}>
          Everything you need to work faster
        </h2>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "3.5rem", fontSize: "1.05rem" }}>
          One tool for summaries, tables, banking analysis, and document Q&amp;A.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "1.5rem",
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: "14px", padding: "1.75rem 1.5rem",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>{f.title}</h3>
              <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{
        background: "#f9fafb", padding: "5rem 2rem",
        borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800,
            letterSpacing: "-0.02em", marginBottom: "3rem",
          }}>
            Three steps, done.
          </h2>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { step: "1", title: "Upload", body: "Drag in a PDF, DOCX, or spreadsheet — up to 10 MB." },
              { step: "2", title: "Process", body: "AI reads and extracts key content in under 10 seconds." },
              { step: "3", title: "Explore", body: "Read the summary, download tables, or chat with the doc." },
            ].map((s) => (
              <div key={s.step} style={{ flex: "1 1 200px", minWidth: "180px" }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%",
                  background: "#2563eb", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: "1.1rem", margin: "0 auto 1rem",
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.4rem" }}>{s.title}</h3>
                <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "5rem 2rem", maxWidth: "1000px", margin: "0 auto" }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
          fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.75rem",
        }}>
          Simple, honest pricing
        </h2>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "3rem", fontSize: "1.05rem" }}>
          Start free. Upgrade when you need more.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5rem",
        }}>
          {PLANS.map((plan) => (
            <div key={plan.name} style={{
              background: plan.highlight ? "#2563eb" : "#fff",
              color: plan.highlight ? "#fff" : "#1a1a1a",
              border: plan.highlight ? "none" : "1px solid #e5e7eb",
              borderRadius: "16px", padding: "2rem 1.75rem",
              boxShadow: plan.highlight ? "0 8px 30px rgba(37,99,235,0.3)" : "none",
            }}>
              {plan.highlight && (
                <div style={{
                  background: "#1d4ed8", color: "#93c5fd",
                  fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em",
                  padding: "0.25rem 0.75rem", borderRadius: "999px",
                  display: "inline-block", marginBottom: "1rem",
                }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{plan.name}</div>
              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "2.2rem", fontWeight: 800 }}>{plan.price}</span>
                <span style={{ opacity: 0.7, fontSize: "0.9rem", marginLeft: "0.25rem" }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {plan.perks.map((p) => (
                  <li key={p} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                    <span style={{ opacity: plan.highlight ? 1 : 0.7 }}>✓</span> {p}
                  </li>
                ))}
              </ul>
              <Link to={plan.name === "Team" ? "/login" : "/signup"} style={{
                display: "block", textAlign: "center",
                background: plan.highlight ? "#fff" : "#2563eb",
                color: plan.highlight ? "#2563eb" : "#fff",
                padding: "0.7rem", borderRadius: "10px",
                textDecoration: "none", fontWeight: 700, fontSize: "0.95rem",
              }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section style={{
        background: "#1e3a5f", color: "#fff",
        textAlign: "center", padding: "5rem 2rem",
      }}>
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, marginBottom: "1rem" }}>
          Ready to save hours every week?
        </h2>
        <p style={{ color: "#93c5fd", fontSize: "1.1rem", marginBottom: "2rem" }}>
          Join teams that have already processed thousands of documents.
        </p>
        <Link to="/signup" style={{
          background: "#2563eb", color: "#fff",
          padding: "0.85rem 2rem", borderRadius: "12px",
          textDecoration: "none", fontWeight: 700, fontSize: "1.05rem",
          boxShadow: "0 4px 20px rgba(37,99,235,0.5)",
        }}>
          Create your free account
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid #e5e7eb", padding: "2rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "1rem", color: "#9ca3af", fontSize: "0.85rem",
      }}>
        <span>© {new Date().getFullYear()} DocSummarizer</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link to="/login" style={{ color: "#9ca3af", textDecoration: "none" }}>Sign in</Link>
          <Link to="/signup" style={{ color: "#9ca3af", textDecoration: "none" }}>Sign up</Link>
          <a href="mailto:support@docsummarizer.com" style={{ color: "#9ca3af", textDecoration: "none" }}>Support</a>
        </div>
      </footer>
    </div>
  );
}