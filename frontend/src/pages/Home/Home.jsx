import { useNavigate, Navigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  LuWallet,
  LuPiggyBank,
  LuTarget,
  LuFlag,
  LuBellRing,
  LuChartColumn,
  LuCircleCheck,
  LuShieldCheck,
  LuLock,
  LuArrowRight,
  LuTrendingUp,
  LuTrendingDown,
  LuBell,
  LuUser,
  LuHouse,
  LuReceipt,
  LuChartPie,
  LuLinkedin,
  LuGithub,
  LuSun,
  LuMoon,
  LuCoins,
  LuCreditCard,
  LuVault,
  LuHeart,
} from "react-icons/lu";

import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { usePreferences } from "../../hooks/usePreferences";

/**
 * Public Landing Page - premium finance-identity pass.
 *
 * Scope: visual/structural polish of Home.jsx only, plus the minimum
 * additive CSS under the existing `.landing-page`-scoped block in
 * index.css. No auth logic, Dashboard/Expenses/Income/Budgets/
 * SavingsGoals/Reports/Notifications/Profile/Settings/Admin, or
 * backend/API calls were touched. Routing changes are limited to: the
 * public /contact route (Contact page), the removal of the now-merged
 * standalone /feedback route, and unauthenticated visitors landing on
 * "/" instead of "/login" after logout (ProtectedRoute/
 * AdminProtectedRoute's redirect target only - no token/session logic
 * changed).
 *
 * Hero: now a full-bleed band (`.landing-hero-band`) flush against the
 * navbar with its own layered gradient background, rather than a
 * rounded card floating on plain white - the page's dot-texture
 * background (`.landing-textured`) starts only after the hero, not
 * behind it.
 *
 * Theme: reuses the app's real PreferencesContext (usePreferences)
 * rather than any new/duplicated theme logic - the navbar toggle here
 * calls the exact same setTheme() Settings > Appearance uses, which
 * already persists to localStorage and flips `data-theme` on <html>
 * immediately. The hero dashboard preview is built entirely from
 * theme-reactive classes/tokens (.bg-surface, .text-ink, .text-muted-
 * ink, .stat-card-icon, var(--color-*)) - nothing in it hardcodes a
 * light-only color, so it relabels itself the instant the toggle is
 * clicked, same as the real Dashboard page does.
 *
 * Repetition: Login/Get Started still appear in exactly three
 * non-redundant places - navbar, hero, and the final CTA (one primary
 * button + one subtle "Sign In" text link).
 */
export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { theme, resolvedTheme, setTheme } = usePreferences();

  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const heroBullets = [
    "Track every expense automatically",
    "Stay on top of budgets",
    "Reach savings goals faster",
  ];

  const features = [
    {
      icon: LuPiggyBank,
      title: "Income Tracking",
      description: "Log salary, freelance income, or scholarships and see it all in one place.",
    },
    {
      icon: LuWallet,
      title: "Expense Tracking",
      description: "Record daily spending by category with a running history of every transaction.",
    },
    {
      icon: LuTarget,
      title: "Budget Planning",
      description: "Set monthly, category-wise budgets and track utilization before you overspend.",
    },
    {
      icon: LuFlag,
      title: "Savings Goals",
      description: "Create goals like a new laptop or a trip, deposit toward them, watch progress.",
    },
    {
      icon: LuBellRing,
      title: "Smart Notifications",
      description: "Get alerted on budget limits, goal milestones, and reminders to keep saving.",
    },
    {
      icon: LuChartColumn,
      title: "Reports & Analytics",
      description: "Visualize spending trends and export monthly summaries as PDF or Excel.",
    },
  ];

  const benefits = [
    {
      icon: LuWallet,
      title: "Expense Tracking",
      text: "Automatically categorize daily expenses as you log them.",
    },
    {
      icon: LuFlag,
      title: "Savings Goals",
      text: "Track progress toward every financial goal you set.",
    },
    {
      icon: LuChartColumn,
      title: "Reports",
      text: "Generate beautiful PDF and Excel reports in a click.",
    },
    {
      icon: LuBellRing,
      title: "Budget Alerts",
      text: "Get notified before you're about to overspend.",
    },
    {
      icon: LuVault,
      title: "Financial Health",
      text: "Understand your financial habits at a glance.",
    },
    {
      icon: LuChartPie,
      title: "Analytics",
      text: "Visual spending insights across every category.",
    },
  ];

  const highlights = [
    "Smart Budget Alerts",
    "Monthly Reports",
    "PDF Export",
    "Excel Export",
    "Financial Health Score",
    "Savings Goal Tracking",
    "Analytics Dashboard",
    "Dark Mode",
    "Admin Dashboard",
  ];

  const ctaTrust = ["Free Forever", "Student Friendly", "No Credit Card Required"];

  const footerLinks = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "Why BudgetBuddy", href: "#why" },
    ],
    Developer: [
      { label: "About Me", href: "/contact#about" },
      { label: "Contact", href: "/contact" },
      { label: "GitHub", href: "https://github.com/Axhataaa", external: true },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/akshata-lokhande-643789284/", external: true },
    ],
  };

  return (
    <div className="landing-page">
      {/* ================= Top Nav ================= */}
      <header className="landing-navbar d-flex align-items-center justify-content-between px-4 px-xl-5 py-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <span className="stat-card-icon bg-surface-sunken text-primary">
            <LuWallet size={18} />
          </span>
          <span className="font-display fs-5 fw-semibold">BudgetBuddy</span>
        </div>

        <nav className="d-none d-md-flex align-items-center gap-4">
          <a href="#features" onClick={scrollTo("features")} className="landing-nav-link">
            Features
          </a>
          <a href="#why" onClick={scrollTo("why")} className="landing-nav-link">
            Why BudgetBuddy
          </a>
          <a
            href="/contact"
            onClick={(e) => { e.preventDefault(); navigate("/contact"); }}
            className="landing-nav-link"
          >
            Contact
          </a>
        </nav>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="landing-theme-toggle"
            onClick={toggleTheme}
            aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {resolvedTheme === "dark" ? <LuSun size={16} /> : <LuMoon size={16} />}
          </button>
          <Button variant="secondary" size="sm" onClick={() => navigate("/login")}>
            Login
          </Button>
          <Button variant="primary" size="sm" icon={LuArrowRight} onClick={() => navigate("/register")}>
            Get Started
          </Button>
        </div>
      </header>

      <main>
        {/* ================= 1. Hero Section (full-bleed band, owns
            its own immersive background - no gap/margin between it
            and the navbar, no dot-pattern behind it; see
            .landing-hero-band and .landing-textured in index.css) ===== */}
        <div className="finance-hero landing-hero-band" style={{ padding: "4.5rem 0 5rem" }}>
          <div
            className="landing-blob"
            style={{ width: 320, height: 320, top: -100, right: -80, background: "var(--color-accent)", opacity: 0.3 }}
            aria-hidden="true"
          />
          <div
            className="landing-blob"
            style={{ width: 260, height: 260, bottom: -110, right: 260, background: "#fff", opacity: 0.07 }}
            aria-hidden="true"
          />
          <div
            className="landing-blob"
            style={{ width: 200, height: 200, top: 60, left: -60, background: "var(--color-accent)", opacity: 0.12 }}
            aria-hidden="true"
          />
          <svg
            className="coin-ring"
            width="100%"
            height="100%"
            viewBox="0 0 600 220"
            preserveAspectRatio="xMaxYMin slice"
            aria-hidden="true"
          >
            <circle cx="540" cy="28" r="70" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.5" />
            <circle cx="540" cy="28" r="52" fill="none" stroke="var(--color-accent)" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
            <circle cx="592" cy="128" r="44" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.35" />
          </svg>

          <div className="container-xxl px-3 px-md-4 px-xl-5 position-relative">
            <div className="row align-items-center g-5 py-4">
              <div className="col-lg-6 landing-fade-up">
                <div className="finance-hero-eyebrow mb-3">Personal Finance, Simplified</div>
                <h1 className="font-display fw-semibold mb-4" style={{ fontSize: "clamp(2.3rem, 4.6vw, 3.4rem)", lineHeight: 1.14, letterSpacing: "-0.01em" }}>
                  Personal Finance,<br />
                  <span className="landing-hero-accent">Simplified.</span>
                </h1>
                <p className="mb-4" style={{ color: "rgba(255,255,255,0.78)", maxWidth: 460, fontSize: "1.08rem", lineHeight: 1.7 }}>
                  Track expenses, plan budgets, and achieve your savings goals — all in one
                  place, built to fit real financial habits.
                </p>

                <div className="d-flex flex-column gap-3 mb-4">
                  {heroBullets.map((b) => (
                    <div className="d-flex align-items-center gap-2" key={b}>
                      <LuCircleCheck size={18} style={{ color: "#7FE0AE" }} className="flex-shrink-0" />
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="d-flex flex-wrap gap-3 mb-4">
                  <span className="landing-btn-pop">
                    <Button variant="primary" icon={LuArrowRight} onClick={() => navigate("/register")}>
                      Get Started Free
                    </Button>
                  </span>
                  <span className="landing-btn-pop">
                    <Button
                      variant="secondary"
                      onClick={() => navigate("/login")}
                      style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}
                    >
                      Login
                    </Button>
                  </span>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <span className="landing-hero-badge">
                    <LuShieldCheck size={14} /> Secure Authentication
                  </span>
                  <span className="landing-hero-badge">
                    <LuBellRing size={14} /> Smart Budget Alerts
                  </span>
                  <span className="landing-hero-badge">
                    <LuChartColumn size={14} /> Reports &amp; Analytics
                  </span>
                  <span className="landing-hero-badge">
                    <LuLock size={14} /> Privacy Focused
                  </span>
                </div>
              </div>

              {/* Right: illustrative dashboard preview - light/dark aware,
                  wrapped in one cohesive finance illustration (not
                  scattered icons) plus a floating stat badge overlapping
                  its corner so the composition reads as layered rather
                  than one flat screenshot. */}
              <div className="col-lg-6 d-none d-lg-block position-relative" style={{ minHeight: 380 }}>
                <HeroIllustration />
                <div className="landing-float landing-fade-up position-relative" style={{ "--delay": "0.15s" }}>
                  <DashboardPreview />
                </div>
                <div
                  className="landing-preview-floater landing-fade-up d-none d-xl-flex align-items-center gap-2"
                  style={{ "--delay": "0.4s", bottom: -22, left: -26 }}
                >
                  <span className="stat-card-icon bg-surface-sunken text-income" style={{ width: 30, height: 30 }}>
                    <LuFlag size={14} />
                  </span>
                  <div>
                    <div className="text-muted-ink" style={{ fontSize: "0.62rem" }}>Savings Goal</div>
                    <div className="font-currency fw-semibold text-income" style={{ fontSize: "0.8rem" }}>68% complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Everything below the hero shares the subtle dot-textured
            backdrop (.landing-textured) - the hero above owns its own
            clean gradient background instead. */}
        <div className="landing-textured">
        <div className="container-xxl px-3 px-md-4 px-xl-5">

          {/* ================= 2. Features Section ================= */}
          <section id="features" className="mb-5 py-3 py-md-4 position-relative" style={{ paddingTop: "3rem" }}>
            <div className="landing-section-soft p-4 p-md-5">
              <LuCreditCard
                className="landing-motif landing-motif-float-slow d-none d-lg-block"
                style={{ top: -10, right: "2%" }}
                size={100}
                aria-hidden="true"
              />
              <div className="text-center mb-4 position-relative">
                <h2 className="font-display fs-2 fw-semibold mb-2">Everything you need to manage money</h2>
                <p className="text-muted-ink mb-0">Powerful tools to help you take control of your financial life</p>
              </div>

              <div className="row g-3 g-xl-4 position-relative">
                {features.map(({ icon: Icon, title, description }, i) => (
                  <div className="col-12 col-sm-6 col-lg-4 landing-fade-up" style={{ "--delay": `${i * 0.06}s` }} key={title}>
                    <div className="landing-feature-card bg-surface rounded shadow-token-sm hover-card p-4 h-100">
                      <span className="landing-feature-icon stat-card-icon bg-surface-sunken text-primary mb-3">
                        <Icon size={22} />
                      </span>
                      <h3 className="font-display fs-6 fw-semibold mb-1">{title}</h3>
                      <p className="text-muted-ink small mb-0">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <hr className="landing-section-divider my-5" />

          {/* ================= 3. Why Choose Us Section ================= */}
          <section id="why" className="mb-5 py-3 py-md-4 position-relative">
            <div className="landing-section-soft-cool p-4 p-md-5">
              <LuPiggyBank
                className="landing-motif landing-motif-float d-none d-md-block"
                style={{ bottom: -10, left: "2%" }}
                size={100}
                aria-hidden="true"
              />
              <div className="text-center mb-4 position-relative">
                <h2 className="font-display fs-2 fw-semibold mb-2">Why Choose BudgetBuddy</h2>
                <p className="text-muted-ink mb-0">Small, consistent habits that add up to real financial discipline</p>
              </div>

              <div className="row g-3 g-xl-4 position-relative">
                {benefits.map(({ icon: Icon, title, text }, i) => (
                  <div className="col-12 col-sm-6 col-lg-4 landing-fade-up" style={{ "--delay": `${i * 0.05}s` }} key={title}>
                    <div className="landing-glass-card p-4 h-100">
                      <div className={`landing-accent-bar c${i % 6}`} />
                      <span className="stat-card-icon bg-surface-sunken text-primary mb-2">
                        <Icon size={16} />
                      </span>
                      <h3 className="font-display fs-6 fw-semibold mb-1">{title}</h3>
                      <p className="text-muted-ink small mb-0">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <hr className="landing-section-divider my-5" />

          {/* ================= 4. Product Highlights ================= */}
          <section className="mb-5 py-3 py-md-4 position-relative">
            <div className="landing-section-soft-alt p-4 p-md-5">
              <LuChartColumn
                className="landing-motif landing-motif-float-slow d-none d-lg-block"
                style={{ top: 10, left: "3%" }}
                size={90}
                aria-hidden="true"
              />
              <div className="text-center mb-4 position-relative">
                <h2 className="font-display fs-2 fw-semibold mb-2">Everything, built in</h2>
                <p className="text-muted-ink mb-0">No add-ons, no upsells — it's all included from day one</p>
              </div>

              <div className="d-flex flex-wrap justify-content-center gap-2 position-relative">
                {highlights.map((h, i) => (
                  <span className="landing-highlight-badge landing-fade-up" style={{ "--delay": `${i * 0.04}s` }} key={h}>
                    <LuCircleCheck size={15} className="landing-highlight-icon" />
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ================= 5. Final CTA ================= */}
          <section className="mb-5">
            <div className="landing-cta-banner p-5 p-md-5 text-center" style={{ padding: "3.5rem 2.5rem" }}>
              <div
                className="landing-blob"
                style={{ width: 240, height: 240, top: -60, left: -60, background: "var(--color-accent)", opacity: 0.3 }}
                aria-hidden="true"
              />
              <LuCoins
                className="landing-motif landing-motif-float-slow d-none d-md-block"
                style={{ top: 20, right: "8%", color: "#fff", opacity: 0.1 }}
                size={80}
                aria-hidden="true"
              />
              <div className="position-relative">
                <div className="landing-cta-icon-wrap mb-3">
                  <LuWallet size={28} />
                </div>
                <h2 className="font-display fs-2 fw-semibold mb-2">Ready to take control of your money?</h2>
                <p className="mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Create your free account and start tracking today — no credit card needed.
                </p>
                <div>
                  <span className="landing-btn-pop">
                    <Button
                      variant="primary"
                      size="lg"
                      icon={LuArrowRight}
                      onClick={() => navigate("/register")}
                      style={{ backgroundColor: "#fff", color: "var(--color-primary)", borderColor: "#fff" }}
                    >
                      Create Free Account
                    </Button>
                  </span>
                </div>
                <div className="mt-3">
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem" }}>
                    Already have an account?{" "}
                    <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }} style={{ color: "#fff", fontWeight: 600, textDecoration: "underline" }}>
                      Sign In
                    </a>
                  </span>
                </div>

                <div className="d-flex flex-wrap justify-content-center gap-4 mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                  {ctaTrust.map((t) => (
                    <span className="landing-cta-trust" key={t}>
                      <LuCircleCheck size={14} /> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

        </div>
        </div>
      </main>

      {/* ================= 6. Footer ================= */}
      <footer className="landing-footer-elevated border-top px-4 px-xl-5 py-5 position-relative">
        <LuWallet
          className="landing-motif landing-motif-float-slow d-none d-lg-block"
          style={{ top: 20, right: "6%", opacity: 0.04 }}
          size={130}
          aria-hidden="true"
        />
        <div className="container-xxl">
          <div className="row g-4">
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="stat-card-icon bg-surface-sunken text-primary">
                  <LuWallet size={16} />
                </span>
                <span className="font-display fw-semibold">BudgetBuddy</span>
              </div>
              <p className="text-muted-ink small mb-3" style={{ maxWidth: 280 }}>
                Your personal finance companion for tracking expenses, planning budgets, and
                reaching savings goals.
              </p>
              <div className="d-flex gap-2">
                <a
                  href="https://github.com/Axhataaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-social-icon"
                  aria-label="GitHub"
                >
                  <LuGithub size={15} />
                </a>
                <a
                  href="https://www.linkedin.com/in/akshata-lokhande-643789284/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-social-icon"
                  aria-label="LinkedIn"
                >
                  <LuLinkedin size={15} />
                </a>
              </div>
            </div>

            {Object.entries(footerLinks).map(([heading, links]) => (
              <div className="col-6 col-md-2" key={heading}>
                <h4 className="font-display fs-6 fw-semibold mb-3">{heading}</h4>
                <div className="d-flex flex-column gap-2">
                  {links.map(({ label, href, external }) =>
                    external ? (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="landing-footer-link"
                      >
                        {label}
                      </a>
                    ) : (
                      <a
                        key={label}
                        href={href}
                        onClick={
                          href.startsWith("#")
                            ? scrollTo(href.slice(1))
                            : (e) => { e.preventDefault(); navigate(href); }
                        }
                        className="landing-footer-link"
                      >
                        {label}
                      </a>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4" />

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
            <p className="text-muted-ink small mb-0">
              &copy; {new Date().getFullYear()} BudgetBuddy. All rights reserved.
            </p>
            <p className="landing-footer-credit d-flex align-items-center gap-1 mb-0">
              Built with <LuHeart size={13} style={{ color: "var(--color-expense)" }} /> by Akshata Lokhande
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =====================================================================
   Hero finance illustration - sits behind the dashboard preview card,
   large and very low opacity (via .landing-hero-illustration) so it
   reads as ambient texture rather than competing with the preview.
   A simple wallet + coin-stack + rising line-chart composition, built
   as inline SVG (no image asset, no illustration library) using only
   white/gold - the same two colors already used everywhere else in
   the navy hero (.finance-hero, .coin-ring, .landing-blob).
===================================================================== */
function HeroIllustration() {
  return (
    <svg
      className="landing-hero-illustration"
      style={{ top: -30, right: -20, width: "88%", height: "88%" }}
      viewBox="0 0 360 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Ambient glow tying the composition together */}
      <ellipse cx="180" cy="180" rx="170" ry="140" fill="var(--color-accent)" opacity="0.06" />
      {/* Wallet */}
      <rect x="30" y="150" width="180" height="120" rx="16" fill="#fff" opacity="0.9" />
      <rect x="30" y="150" width="180" height="34" rx="16" fill="var(--color-accent)" />
      <circle cx="180" cy="210" r="14" fill="var(--color-primary-deep)" />
      {/* Rupee coin, tucked beside the wallet flap so it reads as part
          of the same scene rather than a separate floating icon */}
      <circle cx="70" cy="130" r="22" fill="var(--color-accent)" opacity="0.95" />
      <text x="70" y="139" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--color-primary-deep)">
        ₹
      </text>
      {/* Coin stack */}
      <ellipse cx="270" cy="255" rx="46" ry="14" fill="var(--color-accent)" />
      <ellipse cx="270" cy="235" rx="46" ry="14" fill="#fff" opacity="0.85" />
      <ellipse cx="270" cy="215" rx="46" ry="14" fill="var(--color-accent)" />
      <ellipse cx="270" cy="195" rx="46" ry="14" fill="#fff" opacity="0.85" />
      {/* Rising line chart */}
      <polyline
        points="40,120 90,95 140,110 190,60 240,75 300,30"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="300" cy="30" r="8" fill="var(--color-accent)" />
    </svg>
  );
}

/* =====================================================================
   Illustrative hero "dashboard screenshot" - static/illustrative data
   only, styled with the exact same classes the real Dashboard page
   uses (StatCards' .stat-card-icon, ExpensePieChart's <PieChart>,
   BudgetProgress's .progress-bar, RecentActivity's .transaction-item).
   Every color here routes through a theme-reactive class or CSS
   variable (bg-surface, bg-surface-sunken, text-ink, text-muted-ink,
   text-primary/text-income/text-expense, var(--color-border)) - none
   of it is a hardcoded light-only value, so switching the site's
   theme via the navbar toggle re-themes this preview automatically,
   exactly like the real Dashboard page. Not wired to any API - a
   marketing preview, same as any SaaS homepage screenshot.
===================================================================== */
function DashboardPreview() {
  const pieData = [
    { name: "Food", value: 35 },
    { name: "Transport", value: 25 },
    { name: "Shopping", value: 20 },
    { name: "Others", value: 20 },
  ];
  const PIE_COLORS = ["#303B8E", "#1F9D6C", "#C89B3C", "#9AA3B5"];

  const stats = [
    { label: "Total Balance", value: "₹24,350", sub: "+12.3% this month", icon: LuWallet, color: "text-primary" },
    { label: "Income", value: "₹45,000", sub: "This month", icon: LuTrendingUp, color: "text-income" },
    { label: "Expenses", value: "₹20,650", sub: "This month", icon: LuTrendingDown, color: "text-expense" },
  ];

  return (
    <div className="landing-preview-shell">
      <div className="landing-preview-topbar">
        <span className="landing-preview-dot" />
        <span className="landing-preview-dot" />
        <span className="landing-preview-dot" />
        <span className="d-flex align-items-center gap-2 ms-2">
          <LuHouse size={14} className="text-primary" />
          <span className="small fw-semibold text-ink">Dashboard</span>
        </span>
        <span className="ms-auto d-flex align-items-center gap-2 text-muted-ink">
          <LuBell size={15} />
          <span className="stat-card-icon bg-surface-sunken" style={{ width: 24, height: 24 }}>
            <LuUser size={12} />
          </span>
        </span>
      </div>

      <div className="p-3 p-md-4">
        <div className="row g-2 mb-3">
          {stats.map(({ label, value, sub, icon: Icon, color }) => (
            <div className="col-4" key={label}>
              <div className="bg-surface-sunken rounded p-2 p-md-3 h-100">
                <span className={`stat-card-icon bg-surface mb-1 ${color}`} style={{ width: 28, height: 28 }}>
                  <Icon size={14} />
                </span>
                <div className="text-muted-ink" style={{ fontSize: "0.64rem" }}>{label}</div>
                <div className={`font-currency fw-semibold ${color}`} style={{ fontSize: "0.9rem" }}>{value}</div>
                <div className="text-muted-ink" style={{ fontSize: "0.58rem" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-2 mb-3">
          <div className="col-6">
            <div className="bg-surface border rounded p-2 p-md-3 h-100">
              <div className="fw-semibold text-ink mb-1" style={{ fontSize: "0.74rem" }}>Spending Overview</div>
              <div style={{ width: "100%", height: 100 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={22} outerRadius={42} paddingAngle={2}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-6">
            <div className="bg-surface border rounded p-2 p-md-3 h-100">
              <div className="fw-semibold text-ink mb-2" style={{ fontSize: "0.74rem" }}>Budget Progress</div>
              <div className="mb-1 d-flex justify-content-between" style={{ fontSize: "0.64rem" }}>
                <span className="text-muted-ink">Monthly Budget</span>
                <span className="text-muted-ink">67%</span>
              </div>
              <div className="progress mb-2" style={{ height: 5 }}>
                <div className="progress-bar" style={{ width: "67%", backgroundColor: "var(--color-primary)" }} />
              </div>
              <div className="mb-1 d-flex justify-content-between" style={{ fontSize: "0.64rem" }}>
                <span className="text-muted-ink">Savings Goal</span>
                <span className="text-muted-ink">55%</span>
              </div>
              <div className="progress" style={{ height: 5 }}>
                <div className="progress-bar" style={{ width: "55%", backgroundColor: "var(--color-income)" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border rounded p-2 p-md-3">
          <div className="fw-semibold text-ink mb-2" style={{ fontSize: "0.74rem" }}>Recent Transactions</div>
          {[
            { label: "Grocery Store", amount: "-₹1,240", positive: false },
            { label: "Salary Credit", amount: "+₹45,000", positive: true },
          ].map((t) => (
            <div key={t.label} className="d-flex align-items-center justify-content-between py-1">
              <div className="d-flex align-items-center gap-2">
                <span className="stat-card-icon bg-surface-sunken text-primary" style={{ width: 24, height: 24 }}>
                  <LuReceipt size={12} />
                </span>
                <span className="text-ink" style={{ fontSize: "0.7rem" }}>{t.label}</span>
              </div>
              <span
                className={`font-currency fw-semibold ${t.positive ? "text-income" : "text-expense"}`}
                style={{ fontSize: "0.7rem" }}
              >
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
