import { useNavigate, Navigate } from "react-router-dom";
import { PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer } from "recharts";
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
  LuHeart,
  LuAward,
  LuTriangleAlert,
  LuSparkles,
  LuFileText,
  LuFileSpreadsheet,
  LuFileDown,
  LuCalendarClock,
  LuMailCheck,
  LuLandmark,
  LuCreditCard,
} from "react-icons/lu";

import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { usePreferences } from "../../hooks/usePreferences";

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { resolvedTheme, setTheme } = usePreferences();

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

  const capabilities = [
    { icon: LuWallet, label: "Income Tracking" },
    { icon: LuReceipt, label: "Expense Management" },
    { icon: LuTarget, label: "Budget Alerts" },
    { icon: LuFlag, label: "Savings Goals" },
    { icon: LuAward, label: "Achievements" },
    { icon: LuBellRing, label: "Smart Notifications" },
    { icon: LuChartPie, label: "Financial Analytics" },
    { icon: LuChartColumn, label: "CSV / Excel / PDF Reports" },
    { icon: LuMailCheck, label: "Email Verification" },
    { icon: LuLandmark, label: "Personal Data Export" },
  ];

  const ctaTrust = ["Free Forever", "Student Friendly", "No Credit Card Required"];

  const footerLinks = {
    Product: [
      { label: "Overview", href: "#overview" },
      { label: "Analytics", href: "#analytics" },
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
          <a href="#overview" onClick={scrollTo("overview")} className="landing-nav-link">
            Overview
          </a>
          <a href="#analytics" onClick={scrollTo("analytics")} className="landing-nav-link">
            Analytics
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
        {/* ================= 1. Hero ================= */}
        <div className="finance-hero landing-hero-band" style={{ padding: "4rem 0 4.5rem" }}>
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
            <div className="row align-items-center g-5 py-3">
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

              <div className="col-lg-6 d-none d-lg-block position-relative" style={{ minHeight: 420 }}>
                <HeroIllustration />
                <div className="landing-float landing-fade-up position-relative" style={{ "--delay": "0.15s" }}>
                  <DashboardPreview resolvedTheme={resolvedTheme} />
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
                <div
                  className="landing-preview-floater landing-fade-up d-none d-xl-flex align-items-center gap-2"
                  style={{ "--delay": "0.55s", top: -18, right: 6 }}
                >
                  <span className="stat-card-icon bg-surface-sunken text-warning" style={{ width: 30, height: 30 }}>
                    <LuAward size={14} />
                  </span>
                  <div>
                    <div className="text-muted-ink" style={{ fontSize: "0.62rem" }}>Achievement Unlocked</div>
                    <div className="font-currency fw-semibold text-ink" style={{ fontSize: "0.8rem" }}>Goa Trip</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container-xxl px-3 px-md-4 px-xl-5">

          {/* ================= 2. Capabilities strip ================= */}
          <section className="py-3 py-md-4">
            <div className="landing-chip-cloud">
              {capabilities.map(({ icon: Icon, label }) => (
                <span className="landing-chip" key={label}>
                  <Icon size={14} /> {label}
                </span>
              ))}
            </div>
          </section>

          <hr className="landing-section-divider my-3" />

          {/* ================= 3. Smart Financial Overview ================= */}
          <section id="overview" className="mb-3 py-1 py-md-2 position-relative">
            <div className="landing-section-soft p-4 p-md-5">
              <LuCoins
                className="landing-motif landing-motif-float-slow d-none d-lg-block"
                style={{ top: 24, right: "6%" }}
                size={70}
                aria-hidden="true"
              />
              <div className="row align-items-center g-4 g-lg-5">
                <div className="col-lg-6 landing-fade-up">
                  <div className="finance-hero-eyebrow mb-3" style={{ color: "var(--color-primary)" }}>Dashboard</div>
                  <h2 className="font-display fs-2 fw-semibold mb-3">Your finances, at a glance</h2>
                  <p className="text-muted-ink mb-4">
                    One dashboard shows income, expenses, and balance for any month, alongside a Financial
                    Health score and Smart Insights that flag what needs your attention — automatically.
                  </p>
                  <div className="d-flex flex-column gap-3">
                    {[
                      "Month/year-navigable income, expense & balance summary",
                      "A single Financial Health score built from your real activity",
                      "Smart Insights that surface over-budget categories on their own",
                      "Recent Activity feed of your latest transactions",
                    ].map((t) => (
                      <div className="d-flex align-items-start gap-2" key={t}>
                        <LuCircleCheck size={18} className="text-income flex-shrink-0 mt-1" />
                        <span className="text-ink">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-lg-6 landing-fade-up" style={{ "--delay": "0.1s" }}>
                  <div className="landing-preview-shell">
                    <div className="landing-preview-topbar">
                      <span className="landing-preview-dot" />
                      <span className="landing-preview-dot" />
                      <span className="landing-preview-dot" />
                      <span className="ms-auto text-muted-ink small">Demo preview</span>
                    </div>
                    <div className="p-3 p-md-4">
                      <div className="row g-2 mb-3">
                        {[
                          { label: "Balance", value: "₹24,350", color: "text-primary", icon: LuWallet },
                          { label: "Income", value: "₹45,000", color: "text-income", icon: LuTrendingUp },
                          { label: "Expenses", value: "₹20,650", color: "text-expense", icon: LuTrendingDown },
                        ].map((s) => (
                          <div className="col-4" key={s.label}>
                            <div className="bg-surface-sunken rounded p-2 text-center h-100">
                              <s.icon size={13} className={`${s.color} mb-1`} />
                              <div className="text-muted-ink" style={{ fontSize: "0.6rem" }}>{s.label}</div>
                              <div className={`font-currency fw-semibold ${s.color}`} style={{ fontSize: "0.78rem" }}>{s.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="d-flex align-items-center justify-content-between bg-surface border rounded p-3 mb-2">
                        <div>
                          <div className="text-muted-ink" style={{ fontSize: "0.7rem" }}>Financial Health</div>
                          <div className="font-display fw-semibold text-ink" style={{ fontSize: "1rem" }}>Good</div>
                        </div>
                        <ProgressRing percent={78} size={56} strokeWidth={6} color="var(--color-primary)" label="78" />
                      </div>
                      <div className="bg-surface-sunken rounded p-3 d-flex align-items-start gap-2 mb-2">
                        <LuSparkles size={16} className="text-primary flex-shrink-0 mt-1" />
                        <span className="text-ink small">
                          Your <strong>Shopping</strong> budget is 82% used — worth a look before month end.
                        </span>
                      </div>
                      <div className="bg-surface border rounded p-3">
                        <div className="fw-semibold text-ink mb-2" style={{ fontSize: "0.74rem" }}>Recent Activity</div>
                        {[
                          { label: "Grocery Store", amount: "-₹1,240", positive: false, icon: LuReceipt },
                          { label: "Salary Credit", amount: "+₹45,000", positive: true, icon: LuLandmark },
                          { label: "Electricity Bill", amount: "-₹2,150", positive: false, icon: LuCreditCard },
                        ].map((t) => (
                          <div key={t.label} className="d-flex align-items-center justify-content-between py-1">
                            <div className="d-flex align-items-center gap-2">
                              <span className="stat-card-icon bg-surface-sunken text-primary" style={{ width: 24, height: 24 }}>
                                <t.icon size={12} />
                              </span>
                              <span className="text-ink" style={{ fontSize: "0.75rem" }}>{t.label}</span>
                            </div>
                            <span className={`font-currency fw-semibold ${t.positive ? "text-income" : "text-expense"}`} style={{ fontSize: "0.75rem" }}>
                              {t.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="landing-section-divider my-3" />

          {/* ================= 4. Budget Control ================= */}
          <section className="mb-3 py-1 py-md-2 position-relative">
            <div className="landing-section-soft-cool p-4 p-md-5">
              <LuTarget
                className="landing-motif landing-motif-float d-none d-lg-block"
                style={{ bottom: 20, right: "5%" }}
                size={66}
                aria-hidden="true"
              />
              <div className="row align-items-center g-4 g-lg-5">
                <div className="col-lg-6 order-lg-2 landing-fade-up">
                  <div className="finance-hero-eyebrow mb-3" style={{ color: "var(--color-primary)" }}>Budgets</div>
                  <h2 className="font-display fs-2 fw-semibold mb-3">Set limits, get warned before you cross them</h2>
                  <p className="text-muted-ink mb-4">
                    Create a monthly budget per category and BudgetBuddy tracks utilization for you —
                    with alerts at 80%, 90%, and 100% so overspending is never a surprise.
                  </p>
                  <div className="d-flex flex-column gap-3">
                    {[
                      "One budget per category, per month",
                      "Live utilization and remaining-amount tracking",
                      "Three-tier threshold alerts: 80% / 90% / 100%",
                      "Notification the moment a limit is crossed",
                    ].map((t) => (
                      <div className="d-flex align-items-start gap-2" key={t}>
                        <LuCircleCheck size={18} className="text-income flex-shrink-0 mt-1" />
                        <span className="text-ink">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-lg-6 order-lg-1 landing-fade-up" style={{ "--delay": "0.1s" }}>
                  <div className="landing-preview-shell">
                    <div className="landing-preview-topbar">
                      <span className="landing-preview-dot" />
                      <span className="landing-preview-dot" />
                      <span className="landing-preview-dot" />
                      <span className="ms-auto text-muted-ink small">Demo preview</span>
                    </div>
                    <div className="p-3 p-md-4 d-flex flex-column gap-3">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="text-muted-ink small">This Month</span>
                        <span className="badge bg-primary-subtle text-primary">4 categories tracked</span>
                      </div>
                      {[
                        { cat: "Food & Dining", pct: 92, tone: "text-warning", bar: "var(--color-warning)" },
                        { cat: "Shopping", pct: 58, tone: "text-income", bar: "var(--color-income)" },
                        { cat: "Bills", pct: 104, tone: "text-expense", bar: "var(--color-expense)" },
                        { cat: "Travel", pct: 31, tone: "text-income", bar: "var(--color-income)" },
                      ].map((b) => (
                        <div key={b.cat}>
                          <div className="d-flex justify-content-between mb-1" style={{ fontSize: "0.78rem" }}>
                            <span className="text-ink fw-semibold">{b.cat}</span>
                            <span className={`fw-semibold ${b.tone}`}>{b.pct}%</span>
                          </div>
                          <div className="progress" style={{ height: 7 }}>
                            <div className="progress-bar" style={{ width: `${Math.min(b.pct, 100)}%`, backgroundColor: b.bar }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="landing-section-divider my-3" />

          {/* ================= 5. Savings Goals & Achievements ================= */}
          <section className="mb-3 py-1 py-md-2 position-relative">
            <div className="landing-section-soft-alt p-4 p-md-5">
              <LuPiggyBank
                className="landing-motif landing-motif-float d-none d-lg-block"
                style={{ bottom: 24, left: "4%" }}
                size={64}
                aria-hidden="true"
              />
              <div className="row align-items-center g-4 g-lg-5">
                <div className="col-lg-6 landing-fade-up">
                  <div className="finance-hero-eyebrow mb-3" style={{ color: "var(--color-primary)" }}>Savings Goals</div>
                  <h2 className="font-display fs-2 fw-semibold mb-3">Put spare money toward something real</h2>
                  <p className="text-muted-ink mb-4">
                    Set a target — a laptop, a trip, an emergency fund — deposit toward it whenever you
                    can, and watch progress build. Completed goals become Achievements you can look back on.
                  </p>
                  <div className="d-flex flex-column gap-3">
                    {[
                      "Deposits and withdrawals with full transaction history",
                      "Live progress ring for every active goal",
                      "Completed goals graduate to Achievements",
                      "Notifications on deposits, withdrawals, and completion",
                    ].map((t) => (
                      <div className="d-flex align-items-start gap-2" key={t}>
                        <LuCircleCheck size={18} className="text-income flex-shrink-0 mt-1" />
                        <span className="text-ink">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-lg-6 landing-fade-up" style={{ "--delay": "0.1s" }}>
                  <div className="landing-preview-shell">
                    <div className="p-4 d-flex flex-column gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <ProgressRing percent={68} size={52} strokeWidth={6} color="var(--color-income)" />
                        <div className="flex-grow-1">
                          <div className="fw-semibold text-ink" style={{ fontSize: "0.85rem" }}>New Laptop</div>
                          <div className="text-muted-ink" style={{ fontSize: "0.7rem" }}>₹34,000 of ₹50,000</div>
                        </div>
                        <span className="badge bg-income-subtle text-income">Active</span>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <ProgressRing percent={41} size={52} strokeWidth={6} color="var(--color-income)" />
                        <div className="flex-grow-1">
                          <div className="fw-semibold text-ink" style={{ fontSize: "0.85rem" }}>Emergency Fund</div>
                          <div className="text-muted-ink" style={{ fontSize: "0.7rem" }}>₹20,500 of ₹50,000</div>
                        </div>
                        <span className="badge bg-income-subtle text-income">Active</span>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <ProgressRing percent={100} size={52} strokeWidth={6} color="var(--color-accent)" />
                        <div className="flex-grow-1">
                          <div className="fw-semibold text-ink" style={{ fontSize: "0.85rem" }}>Goa Trip</div>
                          <div className="text-muted-ink" style={{ fontSize: "0.7rem" }}>₹35,000 of ₹35,000</div>
                        </div>
                        <span className="badge bg-warning-subtle text-warning">Completed</span>
                      </div>
                      <div className="bg-surface-sunken rounded p-3 d-flex align-items-center gap-2">
                        <span className="stat-card-icon bg-surface text-warning" style={{ width: 32, height: 32 }}>
                          <LuAward size={16} />
                        </span>
                        <div>
                          <div className="fw-semibold text-ink" style={{ fontSize: "0.8rem" }}>Goa Trip — Completed</div>
                          <div className="text-muted-ink" style={{ fontSize: "0.68rem" }}>Latest Achievement</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="landing-section-divider my-3" />

          {/* ================= 6. Financial Analytics (major) ================= */}
          <section id="analytics" className="mb-3 py-1 py-md-2 position-relative">
            <div className="text-center mb-4">
              <h2 className="font-display fs-2 fw-semibold mb-2">Analytics that explain your money, not just show it</h2>
              <p className="text-muted-ink mb-0">Trends, category breakdowns, and budget performance — computed from your own data</p>
            </div>

            <div className="row g-3 g-lg-4">
              <div className="col-12 landing-fade-up">
                <div className="landing-analytics-card bg-surface rounded shadow-token-sm p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <div className="fw-semibold text-ink">Income vs Expenses — 6 Months</div>
                    <div className="d-flex align-items-center gap-3">
                      <span className="d-flex align-items-center gap-1 small text-muted-ink">
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-income)", display: "inline-block" }} /> Income
                      </span>
                      <span className="d-flex align-items-center gap-1 small text-muted-ink">
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-expense)", display: "inline-block" }} /> Expenses
                      </span>
                    </div>
                  </div>
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <AreaChart data={trendPreviewData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="landingIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={resolvedTheme === "dark" ? "#34D399" : "#1F9D6C"} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={resolvedTheme === "dark" ? "#34D399" : "#1F9D6C"} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="landingExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={resolvedTheme === "dark" ? "#F87171" : "#D64545"} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={resolvedTheme === "dark" ? "#F87171" : "#D64545"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="income" stroke={resolvedTheme === "dark" ? "#34D399" : "#1F9D6C"} fill="url(#landingIncomeGrad)" strokeWidth={2} />
                        <Area type="monotone" dataKey="expenses" stroke={resolvedTheme === "dark" ? "#F87171" : "#D64545"} fill="url(#landingExpenseGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-muted-ink small mt-2">Illustrative preview data</div>
                </div>
              </div>

              <div className="col-12 col-md-6 landing-fade-up">
                <div className="landing-analytics-card bg-surface rounded shadow-token-sm p-4 h-100">
                  <div className="fw-semibold text-ink mb-3">Spending by Category</div>
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ width: 110, height: 110, flexShrink: 0 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={categoryPieData} dataKey="value" innerRadius={28} outerRadius={50} paddingAngle={2}>
                            {categoryPieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-grow-1 d-flex flex-column gap-2">
                      {categoryPieData.map((c, i) => (
                        <div key={c.name} className="d-flex align-items-center justify-content-between" style={{ fontSize: "0.78rem" }}>
                          <span className="d-flex align-items-center gap-2 text-ink">
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], display: "inline-block" }} />
                            {c.name}
                          </span>
                          <span className="text-muted-ink fw-semibold">{c.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 landing-fade-up" style={{ "--delay": "0.05s" }}>
                <div className="landing-analytics-card bg-surface rounded shadow-token-sm p-4 h-100">
                  <div className="fw-semibold text-ink mb-3">Income by Source</div>
                  <div className="d-flex flex-column gap-2">
                    {incomeSourcePreview.map((s) => (
                      <div key={s.name}>
                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: "0.78rem" }}>
                          <span className="text-ink">{s.name}</span>
                          <span className="text-muted-ink fw-semibold">{s.pct}%</span>
                        </div>
                        <div className="progress" style={{ height: 6 }}>
                          <div className="progress-bar" style={{ width: `${s.pct}%`, backgroundColor: "var(--color-primary)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 landing-fade-up" style={{ "--delay": "0.1s" }}>
                <div className="landing-analytics-card bg-surface rounded shadow-token-sm p-4 h-100">
                  <div className="fw-semibold text-ink mb-3">Budget Performance</div>
                  <div className="d-flex flex-column gap-2">
                    {budgetPerformancePreview.map((b) => (
                      <div key={b.category} className="d-flex align-items-center justify-content-between" style={{ fontSize: "0.78rem" }}>
                        <span className="text-ink">{b.category}</span>
                        <span className={`fw-semibold ${b.used > 90 ? "text-expense" : "text-primary"}`}>{b.used}% used</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 landing-fade-up" style={{ "--delay": "0.15s" }}>
                <div className="landing-analytics-card bg-surface rounded shadow-token-sm p-4 h-100">
                  <div className="fw-semibold text-ink mb-3">Financial Insights</div>
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-start gap-2">
                      <LuTriangleAlert size={16} className="text-warning flex-shrink-0 mt-1" />
                      <span className="text-ink small">Highest-spending category flagged automatically</span>
                    </div>
                    <div className="d-flex align-items-start gap-2">
                      <LuSparkles size={16} className="text-primary flex-shrink-0 mt-1" />
                      <span className="text-ink small">Best saving period surfaced from your own trend</span>
                    </div>
                    <div className="d-flex align-items-start gap-2">
                      <LuTarget size={16} className="text-income flex-shrink-0 mt-1" />
                      <span className="text-ink small">Savings rate calculated for every date range</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="landing-section-divider my-3" />

          {/* ================= 7. Reports ================= */}
          <section className="mb-3 py-1 py-md-2 position-relative">
            <div className="landing-section-soft p-4 p-md-5">
              <LuCalendarClock
                className="landing-motif landing-motif-float-slow d-none d-lg-block"
                style={{ top: 20, left: "4%" }}
                size={64}
                aria-hidden="true"
              />
              <div className="row align-items-center g-4 g-lg-5">
                <div className="col-lg-6 landing-fade-up">
                  <div className="finance-hero-eyebrow mb-3" style={{ color: "var(--color-primary)" }}>Reports</div>
                  <h2 className="font-display fs-2 fw-semibold mb-3">Any date range, one click to export</h2>
                  <p className="text-muted-ink mb-4">
                    Today, this week, this month, this year, or a custom range — the same report drives
                    the on-screen charts and every export, so nothing drifts out of sync.
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="landing-hero-badge" style={{ color: "var(--color-ink)", borderColor: "var(--color-border)" }}>
                      <LuCalendarClock size={14} /> Custom Date Range
                    </span>
                    <span className="landing-hero-badge" style={{ color: "var(--color-ink)", borderColor: "var(--color-border)" }}>
                      <LuFileText size={14} /> CSV
                    </span>
                    <span className="landing-hero-badge" style={{ color: "var(--color-ink)", borderColor: "var(--color-border)" }}>
                      <LuFileSpreadsheet size={14} /> Excel
                    </span>
                    <span className="landing-hero-badge" style={{ color: "var(--color-ink)", borderColor: "var(--color-border)" }}>
                      <LuFileDown size={14} /> PDF
                    </span>
                  </div>
                </div>

                <div className="col-lg-6 landing-fade-up" style={{ "--delay": "0.1s" }}>
                  <div className="landing-preview-shell">
                    <div className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-semibold text-ink" style={{ fontSize: "0.85rem" }}>Aug 1 — Aug 31, 2026</span>
                        <span className="badge bg-primary-subtle text-primary">Summary</span>
                      </div>
                      <div className="row g-2 mb-3">
                        {[
                          { label: "Income", value: "₹45,000", color: "text-income" },
                          { label: "Expenses", value: "₹20,650", color: "text-expense" },
                          { label: "Net Savings", value: "₹24,350", color: "text-primary" },
                        ].map((s) => (
                          <div className="col-4" key={s.label}>
                            <div className="bg-surface-sunken rounded p-2 text-center">
                              <div className="text-muted-ink" style={{ fontSize: "0.6rem" }}>{s.label}</div>
                              <div className={`font-currency fw-semibold ${s.color}`} style={{ fontSize: "0.78rem" }}>{s.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-surface-sunken rounded p-2 mb-3">
                        <div style={{ width: "100%", height: 44 }}>
                          <ResponsiveContainer>
                            <AreaChart data={trendPreviewData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                              <Area type="monotone" dataKey="income" stroke="var(--color-income)" fill="var(--color-income)" fillOpacity={0.15} strokeWidth={1.5} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        {["CSV", "Excel", "PDF"].map((f) => (
                          <span key={f} className="badge bg-surface-sunken text-ink border" style={{ fontWeight: 500 }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="landing-section-divider my-3" />

          {/* ================= 8. Stay Informed ================= */}
          <section className="mb-3 py-1 py-md-2 position-relative">
            <LuBellRing
              className="landing-motif landing-motif-float d-none d-lg-block"
              style={{ top: 4, right: "6%" }}
              size={60}
              aria-hidden="true"
            />
            <div className="text-center mb-4">
              <h2 className="font-display fs-2 fw-semibold mb-2">Stay informed, on your terms</h2>
              <p className="text-muted-ink mb-0">In-app alerts, plus email for the events you actually want to hear about</p>
            </div>

            <div className="row g-3 g-lg-4">
              <div className="col-12 col-md-4 landing-fade-up">
                <div className="landing-glass-card p-4 h-100">
                  <div className="landing-accent-bar c3" />
                  <span className="stat-card-icon bg-surface-sunken text-warning mb-2">
                    <LuTriangleAlert size={16} />
                  </span>
                  <h3 className="font-display fs-6 fw-semibold mb-1">Budget Warnings</h3>
                  <p className="text-muted-ink small mb-0">Alerted at 80%, 90%, and when a category goes over.</p>
                </div>
              </div>
              <div className="col-12 col-md-4 landing-fade-up" style={{ "--delay": "0.05s" }}>
                <div className="landing-glass-card p-4 h-100">
                  <div className="landing-accent-bar c0" />
                  <span className="stat-card-icon bg-surface-sunken text-warning mb-2">
                    <LuAward size={16} />
                  </span>
                  <h3 className="font-display fs-6 fw-semibold mb-1">Achievements</h3>
                  <p className="text-muted-ink small mb-0">Notified the moment a savings goal is completed.</p>
                </div>
              </div>
              <div className="col-12 col-md-4 landing-fade-up" style={{ "--delay": "0.1s" }}>
                <div className="landing-glass-card p-4 h-100">
                  <div className="landing-accent-bar c1" />
                  <span className="stat-card-icon bg-surface-sunken text-primary mb-2">
                    <LuCalendarClock size={16} />
                  </span>
                  <h3 className="font-display fs-6 fw-semibold mb-1">Monthly Reports</h3>
                  <p className="text-muted-ink small mb-0">A summary notification when your month wraps up.</p>
                </div>
              </div>
            </div>

            <div className="landing-glass-card p-4 mt-3 mt-lg-4 d-flex align-items-center gap-3 flex-wrap">
              <span className="stat-card-icon bg-surface-sunken text-income" style={{ flexShrink: 0 }}>
                <LuMailCheck size={16} />
              </span>
              <span className="text-ink small mb-0">
                Every notification category has its own email toggle — turn on only what matters to you,
                and email delivery only starts once your address is verified.
              </span>
            </div>
          </section>

          {/* ================= 9. Final CTA ================= */}
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
      </main>

      {/* ================= Footer ================= */}
      <footer className="landing-footer-elevated border-top px-4 px-xl-5 py-5 position-relative">
        <LuWallet
          className="landing-motif landing-motif-float-slow d-none d-lg-block"
          style={{ bottom: -24, right: "3%", opacity: 0.045 }}
          size={170}
          aria-hidden="true"
        />
        <div className="container-xxl">
          <div className="row g-4 g-lg-5">
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="stat-card-icon bg-surface-sunken text-primary">
                  <LuWallet size={16} />
                </span>
                <span className="font-display fw-semibold">BudgetBuddy</span>
              </div>
              <p className="text-muted-ink small mb-3" style={{ maxWidth: 320 }}>
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
              <div className="col-6 col-md-4" key={heading}>
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

const trendPreviewData = [
  { period: "Mar", income: 38000, expenses: 24000 },
  { period: "Apr", income: 41000, expenses: 22000 },
  { period: "May", income: 39500, expenses: 27000 },
  { period: "Jun", income: 44000, expenses: 21000 },
  { period: "Jul", income: 42000, expenses: 25500 },
  { period: "Aug", income: 45000, expenses: 20650 },
];

const budgetPerformancePreview = [
  { category: "Food & Dining", used: 78 },
  { category: "Travel", used: 45 },
  { category: "Shopping", used: 92 },
  { category: "Bills", used: 60 },
];

const incomeSourcePreview = [
  { name: "Salary", pct: 72 },
  { name: "Freelance", pct: 18 },
  { name: "Other", pct: 10 },
];

const categoryPieData = [
  { name: "Food", value: 35 },
  { name: "Transport", value: 25 },
  { name: "Shopping", value: 20 },
  { name: "Others", value: 20 },
];

const PIE_COLORS = ["#303B8E", "#1F9D6C", "#C89B3C", "#9AA3B5"];

function ProgressRing({ percent, size = 60, strokeWidth = 6, color, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-surface-sunken)" strokeWidth={strokeWidth} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
      {label && (
        <text x={center} y={center + 5} textAnchor="middle" fontFamily="var(--font-display)" fontSize={size * 0.28} fontWeight="600" fill="var(--color-ink)">
          {label}
        </text>
      )}
    </svg>
  );
}

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
      <ellipse cx="180" cy="180" rx="170" ry="140" fill="var(--color-accent)" opacity="0.06" />
      <rect x="30" y="150" width="180" height="120" rx="16" fill="#fff" opacity="0.9" />
      <rect x="30" y="150" width="180" height="34" rx="16" fill="var(--color-accent)" />
      <circle cx="180" cy="210" r="14" fill="var(--color-primary-deep)" />
      <circle cx="70" cy="130" r="22" fill="var(--color-accent)" opacity="0.95" />
      <text x="70" y="139" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--color-primary-deep)">
        ₹
      </text>
      <ellipse cx="270" cy="255" rx="46" ry="14" fill="var(--color-accent)" />
      <ellipse cx="270" cy="235" rx="46" ry="14" fill="#fff" opacity="0.85" />
      <ellipse cx="270" cy="215" rx="46" ry="14" fill="var(--color-accent)" />
      <ellipse cx="270" cy="195" rx="46" ry="14" fill="#fff" opacity="0.85" />
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

function DashboardPreview({ resolvedTheme }) {
  const pieData = categoryPieData;

  const stats = [
    { label: "Balance", value: "₹24,350", icon: LuWallet, color: "text-primary" },
    { label: "Income", value: "₹45,000", icon: LuTrendingUp, color: "text-income" },
    { label: "Expenses", value: "₹20,650", icon: LuTrendingDown, color: "text-expense" },
    { label: "Savings Rate", value: "54%", icon: LuPiggyBank, color: "text-accent" },
  ];

  const sparkColor = resolvedTheme === "dark" ? "#34D399" : "#1F9D6C";

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
        <div className="row g-2 mb-2">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div className="col-3" key={label}>
              <div className="bg-surface-sunken rounded p-2 h-100">
                <span className={`stat-card-icon bg-surface mb-1 ${color}`} style={{ width: 24, height: 24 }}>
                  <Icon size={12} />
                </span>
                <div className="text-muted-ink" style={{ fontSize: "0.56rem" }}>{label}</div>
                <div className={`font-currency fw-semibold ${color}`} style={{ fontSize: "0.72rem" }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-2 mb-2">
          <div className="col-5">
            <div className="bg-surface border rounded p-2 h-100">
              <div className="fw-semibold text-ink mb-1" style={{ fontSize: "0.68rem" }}>Spending</div>
              <div style={{ width: "100%", height: 76 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={18} outerRadius={34} paddingAngle={2}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="bg-surface border rounded p-2 h-100 d-flex flex-column align-items-center justify-content-center text-center">
              <div className="fw-semibold text-ink mb-1 align-self-start" style={{ fontSize: "0.68rem" }}>Health</div>
              <ProgressRing percent={78} size={46} strokeWidth={5} color="var(--color-primary)" label="78" />
            </div>
          </div>

          <div className="col-3">
            <div className="bg-surface border rounded p-2 h-100 d-flex flex-column align-items-center justify-content-center text-center">
              <div className="fw-semibold text-ink mb-1 align-self-start" style={{ fontSize: "0.66rem" }}>Goal</div>
              <ProgressRing percent={68} size={40} strokeWidth={5} color="var(--color-income)" />
            </div>
          </div>
        </div>

        <div className="bg-surface border rounded p-2 p-md-3">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <div className="fw-semibold text-ink" style={{ fontSize: "0.7rem" }}>Income vs Expenses — 6M</div>
            <LuChartPie size={12} className="text-muted-ink" />
          </div>
          <div style={{ width: "100%", height: 54 }}>
            <ResponsiveContainer>
              <AreaChart data={trendPreviewData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <Area type="monotone" dataKey="income" stroke={sparkColor} fill={sparkColor} fillOpacity={0.15} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
