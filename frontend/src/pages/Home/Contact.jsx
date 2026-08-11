import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LuWallet,
  LuArrowLeft,
  LuArrowRight,
  LuMail,
  LuGithub,
  LuLinkedin,
  LuMapPin,
  LuCode,
  LuBrainCircuit,
  LuSparkles,
  LuWalletCards,
  LuChevronDown,
  LuSend,
  LuGraduationCap,
} from "react-icons/lu";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";

/**
 * Public Contact page - replaces the old "expose the email directly
 * in the footer" pattern with a proper page (footer's Contact link
 * now points here). Also absorbs what used to be a separate
 * standalone Feedback page/route (removed) via the "What's this
 * about?" reason field on the form below (General Question / Feedback
 * / Feature Request / Bug Report / Collaboration / Other) - one form,
 * one page, instead of two near-identical ones. No backend endpoint
 * exists for this form - submit just shows a success toast via the
 * app's existing ToastProvider.
 *
 * Reuses .finance-hero for its own hero banner (same gradient
 * treatment as Home.jsx's hero and Dashboard's HeroSection.jsx - not
 * a new gradient), .landing-glass-card / .landing-contact-card /
 * .landing-topic-chip / .landing-avatar-placeholder from the landing
 * CSS block, and the existing Input/Button/Toast components.
 */
export default function Contact() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({ name: "", email: "", reason: "general", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Merged in from the old standalone Feedback page - this "reason"
  // field is what replaces it, so General Question/Feedback/Feature
  // Request/Bug Report/Collaboration/Other all flow through this one
  // form instead of a separate page.
  const reasonOptions = [
    { value: "general", label: "General Question" },
    { value: "feedback", label: "Feedback" },
    { value: "feature", label: "Feature Request" },
    { value: "bug", label: "Bug Report" },
    { value: "collaboration", label: "Collaboration" },
    { value: "other", label: "Other" },
  ];

  // Client-side route changes (e.g. footer's "About" link -> /contact#about)
  // don't auto-scroll to a hash the way a full page load does - this
  // covers that gap without adding any routing/scroll-restoration
  // library.
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setFormData({ name: "", email: "", reason: "general", subject: "", message: "" });
      showToast("Message sent! I'll get back to you within 24-48 hours.", "success");
    }, 500);
  };

  const contactCards = [
    {
      icon: LuMail,
      label: "Email",
      description: "Best for detailed questions, bug reports, or collaboration ideas.",
      action: "Send an email",
      href: "mailto:akshata666lokhande@gmail.com",
      external: false,
    },
    {
      icon: LuGithub,
      label: "GitHub",
      description: "Explore BudgetBuddy's code and my other projects.",
      action: "View GitHub",
      href: "https://github.com/Axhataaa",
      external: true,
    },
    {
      icon: LuLinkedin,
      label: "LinkedIn",
      description: "Let's connect professionally - open to collaboration and opportunities.",
      action: "Connect on LinkedIn",
      href: "https://www.linkedin.com/in/akshata-lokhande-643789284/",
      external: true,
    },
    {
      icon: LuMapPin,
      label: "Location",
      description: "Based in India, working with developers and teams worldwide.",
      action: null,
      href: null,
      external: false,
    },
  ];

  const topics = ["React", "Django", "AI", "Web Development", "Projects", "Open Source", "Career"];

  const faqs = [
    { q: "Can I collaborate with you?", a: "Yes! I'm always open to collaborating on interesting projects, especially around full-stack development, AI, or personal finance tools." },
    { q: "How quickly do you reply?", a: "Usually within 24-48 hours. Email is the fastest way to reach me." },
    { q: "Can I report bugs found in BudgetBuddy?", a: "Absolutely - that's exactly what this Contact form is for. Pick \"Bug Report\" as the reason, and include what you were doing, what you expected, and what happened instead." },
  ];

  return (
    <div className="landing-page">
      {/* ================= Top Nav (matches Home.jsx) ================= */}
      <header className="landing-navbar d-flex align-items-center justify-content-between px-4 px-xl-5 py-3 border-bottom">
        <div
          className="d-flex align-items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
        >
          <span className="stat-card-icon bg-surface-sunken text-primary">
            <LuWallet size={18} />
          </span>
          <span className="font-display fs-5 fw-semibold">BudgetBuddy</span>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-link text-muted-ink text-decoration-none d-inline-flex align-items-center gap-1 small"
        >
          <LuArrowLeft size={14} /> Back
        </button>
      </header>

      <main>
        <div className="container-xxl px-3 px-md-4 px-xl-5">

          {/* ================= Hero ================= */}
          <div className="finance-hero my-4 my-md-5" style={{ padding: "3rem 2.75rem" }}>
            <div
              className="landing-blob"
              style={{ width: 240, height: 240, top: -70, right: -50, background: "var(--color-accent)", opacity: 0.32 }}
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
              <circle cx="592" cy="128" r="44" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.35" />
            </svg>

            <div className="row align-items-center g-4 position-relative py-3">
              <div className="col-lg-7 landing-fade-up">
                <div className="finance-hero-eyebrow mb-3">Get in touch</div>
                <h1 className="font-display fw-semibold mb-3" style={{ fontSize: "clamp(2rem, 4vw, 2.9rem)", lineHeight: 1.15 }}>
                  Contact <span className="landing-hero-accent">BudgetBuddy</span>
                </h1>
                <p className="mb-4" style={{ color: "rgba(255,255,255,0.8)", maxWidth: 480, fontSize: "1.05rem", lineHeight: 1.7 }}>
                  Questions? Suggestions? Collaboration? I'd love to hear from you.
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <span className="landing-btn-pop">
                    <Button
                      variant="primary"
                      icon={LuSend}
                      onClick={() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      Send a Message
                    </Button>
                  </span>
                  <span className="landing-btn-pop">
                    <Button
                      variant="secondary"
                      style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}
                      onClick={() => window.open("https://github.com/Axhataaa", "_blank", "noopener,noreferrer")}
                    >
                      View GitHub
                    </Button>
                  </span>
                </div>
              </div>

              {/* Finance-themed illustration side */}
              <div className="col-lg-5 d-none d-lg-flex justify-content-center position-relative">
                <LuWalletCards
                  size={220}
                  style={{ color: "#fff", opacity: 0.14 }}
                  className="landing-motif-float"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* ================= Meet the Developer ================= */}
          <section id="about" className="mb-5 py-3">
            <div className="landing-section-soft p-4 p-md-5">
              <div className="row align-items-center g-4">
                <div className="col-12 col-md-4 text-center">
                  <div className="landing-avatar-placeholder">AL</div>
                  <p className="text-muted-ink small mt-2 mb-0">Photo coming soon</p>
                </div>
                <div className="col-12 col-md-8">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <LuGraduationCap size={20} className="text-primary" />
                    <span className="text-muted-ink small fw-semibold text-uppercase" style={{ letterSpacing: "0.06em" }}>
                      Meet the developer
                    </span>
                  </div>
                  <h2 className="font-display fs-3 fw-semibold mb-2">Akshata Lokhande</h2>
                  <p className="text-muted-ink mb-3">
                    B.Tech Information Technology student passionate about building useful,
                    real-world software.
                  </p>
                  <div className="row g-2">
                    {[
                      "Full Stack Development",
                      "Artificial Intelligence",
                      "Building Useful Software",
                      "Personal Finance Applications",
                    ].map((item) => (
                      <div className="col-12 col-sm-6" key={item}>
                        <div className="d-flex align-items-center gap-2">
                          <LuSparkles size={14} className="text-primary flex-shrink-0" />
                          <span className="small">{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="landing-section-divider my-4" />

          {/* ================= Contact Cards ================= */}
          <section className="mb-5 py-3">
            <div className="text-center mb-4">
              <h2 className="font-display fs-2 fw-semibold mb-2">Ways to reach me</h2>
              <p className="text-muted-ink mb-0">Pick whichever works best for you</p>
            </div>

            <div className="row g-3">
              {contactCards.map(({ icon: Icon, label, description, action, href, external }) => (
                <div className="col-12 col-sm-6 col-lg-3" key={label}>
                  <div className="landing-contact-card p-4 h-100 d-flex flex-column">
                    <span className="stat-card-icon bg-surface-sunken text-primary mb-3">
                      <Icon size={18} />
                    </span>
                    <h3 className="font-display fs-6 fw-semibold mb-1">{label}</h3>
                    <p className="text-muted-ink small mb-3 flex-grow-1">{description}</p>
                    {action && href && (
                      external ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="small fw-semibold text-primary text-decoration-none d-inline-flex align-items-center gap-1"
                        >
                          {action} <LuArrowRight size={13} />
                        </a>
                      ) : (
                        <a
                          href={href}
                          className="small fw-semibold text-primary text-decoration-none d-inline-flex align-items-center gap-1"
                        >
                          {action} <LuArrowRight size={13} />
                        </a>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ================= Contact Form ================= */}
          <section id="contact-form" className="mb-5 py-3">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-7">
                <div className="bg-surface rounded shadow-token-md p-4 p-md-5">
                  <div className="text-center mb-4">
                    <h2 className="font-display fs-3 fw-semibold mb-2">Send a message</h2>
                    <p className="text-muted-ink mb-0">I read every message personally.</p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-12 col-sm-6">
                        <Input label="Name" name="name" value={formData.name} onChange={handleChange} required />
                      </div>
                      <div className="col-12 col-sm-6">
                        <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                      </div>
                    </div>
                    <Input
                      label="What's this about?"
                      as="select"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      options={reasonOptions}
                    />
                    <Input label="Subject" name="subject" value={formData.subject} onChange={handleChange} required />
                    <Input
                      label="Message"
                      as="textarea"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      required
                    />
                    <Button type="submit" icon={LuSend} className="w-100 justify-content-center mt-2" loading={submitting}>
                      Send Message
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          <hr className="landing-section-divider my-4" />

          {/* ================= Why Contact Me ================= */}
          <section className="mb-5 py-3">
            <div className="text-center mb-4">
              <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                <LuBrainCircuit size={20} className="text-primary" />
                <h2 className="font-display fs-3 fw-semibold mb-0">Topics I enjoy discussing</h2>
              </div>
            </div>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {topics.map((t) => (
                <span className="landing-topic-chip" key={t}>
                  <LuCode size={14} className="me-1" /> {t}
                </span>
              ))}
            </div>
          </section>

          {/* ================= FAQ ================= */}
          <section className="mb-5 py-3">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-8">
                <div className="text-center mb-4">
                  <h2 className="font-display fs-3 fw-semibold mb-2">Frequently asked</h2>
                </div>

                <div className="d-flex flex-column gap-2">
                  {faqs.map(({ q, a }, i) => {
                    const expanded = openFaq === i;
                    return (
                      <div className="bg-surface rounded shadow-token-sm p-3 p-md-4" key={q}>
                        <button
                          type="button"
                          className="landing-faq-trigger d-flex align-items-center justify-content-between"
                          aria-expanded={expanded}
                          onClick={() => setOpenFaq(expanded ? -1 : i)}
                        >
                          <span className="fw-semibold">{q}</span>
                          <LuChevronDown size={18} className="landing-faq-chevron text-muted-ink flex-shrink-0" />
                        </button>
                        <div className="activity-collapse" data-expanded={expanded}>
                          <div className="activity-collapse-inner">
                            <p className="text-muted-ink small mb-0 pt-2">{a}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* ================= Footer ================= */}
      <footer className="landing-footer-elevated border-top px-4 px-xl-5 py-4">
        <div className="container-xxl d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <p className="text-muted-ink small mb-0">
            &copy; {new Date().getFullYear()} BudgetBuddy. All rights reserved.
          </p>
          <p className="text-center text-md-end small mb-0">
            <Link to="/" className="landing-footer-link">Back to home</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
