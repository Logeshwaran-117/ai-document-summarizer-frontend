// src/components/Footer.jsx
// Place this inside Dashboard.jsx, just below </main> and above </div>

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="shrink-0 border-t px-6 py-3 flex items-center justify-between text-xs"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
        color: "var(--muted)",
      }}
    >
      {/* Left — branding */}
      <div className="flex items-center gap-2">
        <span className="font-semibold" style={{ color: "var(--text)" }}>
          SharyX OCR
        </span>
        <span>·</span>
        <span>© {year} SharyX OCR. All rights reserved.</span>
      </div>

      {/* Center — status pill */}
      <div className="hidden sm:flex items-center gap-1.5">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--success)" }}
        />
        <span>All systems operational</span>
      </div>

      {/* Right — links */}
      <div className="flex items-center gap-4">
        <a
          href="/pricing"
          className="hover:underline transition-colors"
          style={{ color: "var(--muted)" }}
        >
          Plans
        </a>
        <a
          href="/privacy"
          className="hover:underline transition-colors"
          style={{ color: "var(--muted)" }}
        >
          Privacy
        </a>
        <a
          href="/terms"
          className="hover:underline transition-colors"
          style={{ color: "var(--muted)" }}
        >
          Terms
        </a>
      </div>
    </footer>
  );
}