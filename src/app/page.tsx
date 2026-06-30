"use client";

import { useAuth } from "@/context/auth-context";
import { useFocus } from "@/context/focus-context";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Target,
  Zap,
  Calendar,
  AlertTriangle,
  BarChart2,
  Sparkles,
  ChevronDown,
  Play,
  Clock,
  Brain,
} from "lucide-react";
import { ParticleField } from "@/components/particle-field";
import { NavShell } from "@/components/nav-shell";
import { DashboardView } from "@/components/dashboard-view";
import { TasksView } from "@/components/tasks-view";
import { PlannerView } from "@/components/planner-view";
import { ChatView } from "@/components/chat-view";
import { CalendarView } from "@/components/calendar-view";
import { FocusView } from "@/components/focus-view";
import { AnalyticsView } from "@/components/analytics-view";

/* ─────────────────────────────────────────────
   Framer Motion
   ───────────────────────────────────────────── */

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease, delay: i * 0.12 },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const fadeChild = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

/* ─────────────────────────────────────────────
   Logo
   ───────────────────────────────────────────── */

const Logo = () => (
  <div className="flex items-center gap-2.5 group cursor-pointer select-none">
    <div className="relative w-7 h-7 flex items-center justify-center">
      <div className="absolute inset-0 border border-ice/40 rounded-[var(--radius-md)] rotate-45 group-hover:rotate-90 transition-transform duration-700" />
      <div className="absolute inset-[6px] bg-current rounded-[2px] rotate-45 group-hover:-rotate-90 transition-transform duration-700" />
    </div>
    <span className="font-heading font-medium tracking-tight text-snow text-lg">
      Deadline<span className="text-aurora">AI</span>
    </span>
  </div>
);

/* ─────────────────────────────────────────────
   Navigation
   ───────────────────────────────────────────── */

const Navigation = ({ onSignIn, onDemo }: { onSignIn: () => void, onDemo: () => void }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#012624]/85 backdrop-blur-xl border-b border-fog/10 py-3.5"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto px-6 md:px-12 flex justify-between items-center max-w-[var(--page-max-width)]">
        <Logo />

        <div className="hidden md:flex items-center gap-7 text-[13px] text-fog font-normal tracking-wide">
          <a href="#problem" className="hover:text-ice transition-colors">Why DeadlineAI</a>
          <a href="#how" className="hover:text-ice transition-colors">How It Works</a>
          <a href="#features" className="hover:text-ice transition-colors">Features</a>
          <a href="#pricing" className="hover:text-ice transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onSignIn} className="hidden sm:block px-4 py-2 text-[13px] font-normal text-fog hover:text-ice transition-colors">
            Sign In with Google
          </button>
          <button onClick={onDemo} className="dala-primary-action text-[11px] px-5 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-500 border-none text-abyss font-bold shadow-[0_0_15px_rgba(45,212,191,0.4)]">
            GET STARTED ✨
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

/* ─────────────────────────────────────────────
   Features Data
   ───────────────────────────────────────────── */

const features = [
  {
    icon: <Target className="w-5 h-5" />,
    title: "Smart Priorities",
    desc: "Know exactly what to work on next.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Focus Coach",
    desc: "Get small, actionable steps whenever you feel stuck.",
  },
  {
    icon: <Calendar className="w-5 h-5" />,
    title: "Automatic Planning",
    desc: "Your schedule updates automatically when plans change.",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Deadline Alerts",
    desc: "Get early warnings before deadlines become difficult to manage.",
  },
  {
    icon: <BarChart2 className="w-5 h-5" />,
    title: "Progress Dashboard",
    desc: "Track your work, productivity, and upcoming tasks in one place.",
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: "AI Insights",
    desc: "Understand why DeadlineAI made each recommendation.",
  },
];

const steps = [
  { num: "01", text: "Add your tasks and deadlines." },
  { num: "02", text: "DeadlineAI understands what\u2019s important." },
  { num: "03", text: "It builds your daily plan automatically." },
  { num: "04", text: "You stay focused and finish more work." },
];

const outcomes = [
  "Less stress",
  "Better focus",
  "No missed deadlines",
  "Smarter planning",
  "More work completed",
  "Clear daily direction",
];

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function Home() {
  const { user, loading, loginWithGoogle, loginMock } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-abyss flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border border-current/60 rounded-[var(--radius-md)] rotate-45 animate-spin" style={{ animationDuration: "2.5s" }} />
          <div className="absolute inset-2 bg-current rounded-[2px] rotate-45 animate-spin" style={{ animationDuration: "2.5s", animationDirection: "reverse" }} />
        </div>
      </div>
    );
  }

  if (user) {
    return <AuthenticatedApp />;
  }

  return (
    <div className="min-h-screen bg-abyss text-snow selection:bg-current selection:text-trench overflow-x-hidden font-sans relative">
      {/* Full-page particle background */}
      <ParticleField />

      <Navigation onSignIn={loginWithGoogle} onDemo={() => loginMock("Workspace Admin", "morning")} />

      {/* ═══════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════ */}
      <section className="relative min-h-[100svh] pt-28 sm:pt-32 pb-20 flex items-center">
        {/* Ambient glow */}
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-current/8 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[40%] bg-twilight/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto px-6 md:px-12 max-w-[var(--page-max-width)] relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">

            {/* Left — Copy */}
            <motion.div
              className="max-w-xl"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {/* Eyebrow */}
              <motion.div
                variants={fadeChild}
                className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-tags)] bg-reef/60 border border-fog/10 text-[10px] font-medium text-fog uppercase tracking-[2.4px]"
              >
                <Sparkles className="w-3 h-3 text-aurora" />
                AI THAT PLANS, PRIORITIZES &amp; KEEPS YOU ON TRACK
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeChild}
                className="font-heading text-[clamp(2.4rem,5.5vw,4rem)] font-medium tracking-[-0.03em] leading-[1.08] mb-6"
              >
                Stop Managing Tasks.
                <br />
                <span className="text-fog">Start Making Progress.</span>
              </motion.h1>

              {/* Subheading */}
              <motion.p
                variants={fadeChild}
                className="text-[16px] md:text-[18px] text-fog leading-[1.55] max-w-md mb-10"
              >
                DeadlineAI is your AI work assistant that helps you decide what
                to do next, organize your day, and finish work on time—without
                feeling overwhelmed.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeChild} className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => loginMock("Workspace Admin", "morning")} className="dala-primary-action h-12 px-7 text-[12px] gap-2 bg-gradient-to-r from-teal-400 to-emerald-500 border-none text-abyss font-bold shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                  GET STARTED
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => loginMock("Workspace Admin", "morning")} className="dala-outlined-action h-12 px-7 text-[12px] gap-2 border-teal-500/30 text-teal-400 hover:bg-teal-500/10">
                  ✨ ENTER DEMO MODE (SKIP SIGN IN)
                </button>
              </motion.div>

              {/* Social proof */}
              <motion.div variants={fadeChild} className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-abyss bg-reef/70 backdrop-blur-sm"
                    />
                  ))}
                </div>
                <p className="text-[13px] text-fog">
                  Trusted by students, founders &amp; teams globally.
                </p>
              </motion.div>
            </motion.div>

            {/* Right — Visual container */}
            <motion.div
              className="relative h-[420px] sm:h-[480px] lg:h-[560px] w-full rounded-[var(--radius-cards)] overflow-hidden border border-fog/10 bg-trench/60 backdrop-blur-sm group"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease, delay: 0.15 }}
            >
              {/* Corner accents */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-ice/25 rounded-tl-[6px] z-20 pointer-events-none group-hover:border-ice/50 transition-colors" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-ice/25 rounded-tr-[6px] z-20 pointer-events-none group-hover:border-ice/50 transition-colors" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-ice/25 rounded-bl-[6px] z-20 pointer-events-none group-hover:border-ice/50 transition-colors" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-ice/25 rounded-br-[6px] z-20 pointer-events-none group-hover:border-ice/50 transition-colors" />

              {/* Depth gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-abyss via-transparent to-transparent z-10 pointer-events-none opacity-70" />

              {/* Floating dashboard preview card */}
              <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none">
                <div className="bg-trench/90 backdrop-blur-xl border border-fog/10 rounded-[var(--radius-xl)] p-4 shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-aurora animate-pulse" />
                      <span className="text-[13px] font-medium text-ice">Focus Mode Active</span>
                    </div>
                    <span className="text-[10px] text-fog font-mono tracking-[1.2px] uppercase">Next: Research Report</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-abyss/60 rounded-[var(--radius-md)] p-2.5">
                      <div className="text-[9px] text-fog tracking-[1px] uppercase mb-1">Tasks</div>
                      <div className="text-[18px] font-medium text-snow">12</div>
                    </div>
                    <div className="bg-abyss/60 rounded-[var(--radius-md)] p-2.5">
                      <div className="text-[9px] text-fog tracking-[1px] uppercase mb-1">Done</div>
                      <div className="text-[18px] font-medium text-aurora">8</div>
                    </div>
                    <div className="bg-abyss/60 rounded-[var(--radius-md)] p-2.5">
                      <div className="text-[9px] text-fog tracking-[1px] uppercase mb-1">Risk</div>
                      <div className="text-[18px] font-medium text-twilight">Low</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-fog/40" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 2 — THE PROBLEM
          ═══════════════════════════════════════ */}
      <section id="problem" className="py-28 md:py-36 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--page-max-width)] h-px bg-gradient-to-r from-transparent via-fog/15 to-transparent" />

        <motion.div
          className="mx-auto px-6 md:px-12 max-w-2xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeChild}
            className="font-heading text-[clamp(1.6rem,4vw,2.5rem)] font-medium tracking-[-0.02em] leading-[1.2] mb-6"
          >
            Most productivity apps remind you.
            <br />
            <span className="text-fog">They don&apos;t help you decide.</span>
          </motion.h2>
          <motion.p variants={fadeChild} className="text-[15px] text-fog leading-[1.6] max-w-lg mx-auto">
            Long task lists, constant notifications, and missed deadlines make it
            hard to stay focused. Instead of helping, most apps simply keep adding
            more things to your list.
          </motion.p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 3 — WHY DEADLINEAI
          ═══════════════════════════════════════ */}
      <section className="py-28 md:py-36 relative">
        <div className="mx-auto px-6 md:px-12 max-w-[var(--page-max-width)]">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
            >
              <motion.h2
                variants={fadeChild}
                className="font-heading text-[clamp(1.6rem,4vw,2.5rem)] font-medium tracking-[-0.02em] leading-[1.15] mb-5"
              >
                An AI that thinks
                <br />
                <span className="text-fog">before you do.</span>
              </motion.h2>
              <motion.p variants={fadeChild} className="text-[15px] text-fog leading-[1.6] max-w-md">
                DeadlineAI looks at your tasks, deadlines, priorities, and
                available time to build a clear action plan. Instead of asking
                &ldquo;What should I do now?&rdquo; — you&apos;ll always know the
                next best step.
              </motion.p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
            >
              {[
                "Knows what you should work on next",
                "Automatically reorganizes your schedule",
                "Warns you before deadlines become a problem",
                "Keeps you focused without the stress",
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  variants={fadeChild}
                  className="flex items-start gap-4 p-5 rounded-[var(--radius-cards)] bg-trench/50 border border-fog/8 hover:border-fog/18 transition-colors duration-400"
                >
                  <div className="w-7 h-7 rounded-[var(--radius-md)] bg-current/15 border border-current/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-aurora" />
                  </div>
                  <span className="text-[15px] text-ice leading-snug">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 4 — HOW IT WORKS
          ═══════════════════════════════════════ */}
      <section id="how" className="py-28 md:py-36 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--page-max-width)] h-px bg-gradient-to-r from-transparent via-fog/15 to-transparent" />

        <div className="mx-auto px-6 md:px-12 max-w-[var(--page-max-width)]">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeChild}
              className="font-heading text-[clamp(1.6rem,4vw,2.5rem)] font-medium tracking-[-0.02em] leading-[1.15] mb-4"
            >
              From Chaos to Clarity
            </motion.h2>
          </motion.div>

          {/* Pipeline */}
          <div className="relative">
            {/* Connecting line (desktop only) */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-current/5 via-current/30 to-current/5 -translate-y-1/2 hidden lg:block" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: idx * 0.15, ease }}
                  className="relative"
                >
                  <div className="bg-trench border border-fog/10 hover:border-fog/20 p-6 rounded-[var(--radius-cards)] h-full transition-colors duration-400 group">
                    <div className="text-[10px] font-mono text-current tracking-[2.4px] uppercase mb-4">
                      {step.num} — STEP
                    </div>
                    <p className="text-[15px] text-ice leading-snug group-hover:text-snow transition-colors">
                      {step.text}
                    </p>
                  </div>
                  {/* Node connector */}
                  {idx < 3 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-abyss border border-current/50 items-center justify-center -translate-y-1/2 z-20">
                      <div className="w-1.5 h-1.5 bg-current rounded-full" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 5 — FEATURES
          ═══════════════════════════════════════ */}
      <section id="features" className="py-28 md:py-36 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--page-max-width)] h-px bg-gradient-to-r from-transparent via-fog/15 to-transparent" />

        <div className="mx-auto px-6 md:px-12 max-w-[var(--page-max-width)]">
          <motion.div
            className="text-center max-w-xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeChild}
              className="font-heading text-[clamp(1.6rem,4vw,2.5rem)] font-medium tracking-[-0.02em] leading-[1.15] mb-4"
            >
              Built to help you <span className="text-fog">get things done.</span>
            </motion.h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.08, ease }}
                className="group p-7 rounded-[var(--radius-cards)] bg-trench/40 border border-fog/8 hover:border-fog/20 transition-all duration-400 flex flex-col"
              >
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-reef border border-fog/15 flex items-center justify-center mb-5 text-aurora group-hover:scale-105 group-hover:border-current/40 transition-all duration-400">
                  {f.icon}
                </div>
                <h3 className="text-[17px] font-medium mb-2 text-ice group-hover:text-snow transition-colors">
                  {f.title}
                </h3>
                <p className="text-[14px] text-fog leading-[1.55]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 6 — WHY PEOPLE LOVE IT
          ═══════════════════════════════════════ */}
      <section className="py-28 md:py-36 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--page-max-width)] h-px bg-gradient-to-r from-transparent via-fog/15 to-transparent" />

        <div className="mx-auto px-6 md:px-12 max-w-3xl">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeChild}
              className="font-heading text-[clamp(1.6rem,4vw,2.5rem)] font-medium tracking-[-0.02em] leading-[1.15] mb-4"
            >
              Real results. <span className="text-fog">Not just features.</span>
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {outcomes.map((o, i) => (
              <motion.div
                key={i}
                variants={fadeChild}
                className="flex items-center gap-3 p-4 rounded-[var(--radius-xl)] bg-trench/40 border border-fog/8"
              >
                <div className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-aurora" />
                </div>
                <span className="text-[14px] text-ice">{o}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 7 — DASHBOARD PREVIEW
          ═══════════════════════════════════════ */}
      <section className="py-28 md:py-36 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--page-max-width)] h-px bg-gradient-to-r from-transparent via-fog/15 to-transparent" />

        <div className="mx-auto px-6 md:px-12 max-w-[var(--page-max-width)]">
          <motion.div
            className="text-center max-w-xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeChild}
              className="font-heading text-[clamp(1.6rem,4vw,2.5rem)] font-medium tracking-[-0.02em] leading-[1.15] mb-4"
            >
              Everything You Need.
              <br />
              <span className="text-fog">One Simple Dashboard.</span>
            </motion.h2>
            <motion.p variants={fadeChild} className="text-[15px] text-fog leading-[1.6]">
              View your tasks, schedule, focus timer, AI recommendations, and
              progress—all from one place.
            </motion.p>
          </motion.div>

          {/* Mock Dashboard */}
          <motion.div
            className="rounded-[var(--radius-cards)] border border-fog/12 bg-trench/60 backdrop-blur-sm overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease }}
          >
            {/* Title bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-fog/8 bg-abyss/60">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-current/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-fog/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-fog/20" />
              </div>
              <span className="text-[10px] text-fog font-mono tracking-[1.5px] uppercase">
                DeadlineAI Dashboard
              </span>
              <div className="w-16" />
            </div>

            {/* Dashboard grid */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Focus Task */}
              <div className="md:col-span-2 bg-abyss/50 rounded-[var(--radius-xl)] p-5 border border-fog/8">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-current" />
                  <span className="text-[11px] text-fog font-mono tracking-[1.2px] uppercase">Focus Now</span>
                </div>
                <h4 className="text-[16px] font-medium text-snow mb-2">Research Report — Chapter 3</h4>
                <p className="text-[13px] text-fog mb-4">Due Tomorrow · Priority #1 · Est. 2 hours</p>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 bg-current/15 border border-current/25 rounded-[var(--radius-md)] text-[11px] text-aurora">
                    Start 2-Min Micro
                  </div>
                  <div className="px-3 py-1.5 bg-reef/40 border border-fog/10 rounded-[var(--radius-md)] text-[11px] text-fog">
                    Start Pomodoro
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <div className="bg-abyss/50 rounded-[var(--radius-xl)] p-4 border border-fog/8">
                  <div className="text-[10px] text-fog tracking-[1px] uppercase mb-1">Productivity</div>
                  <div className="text-[24px] font-medium text-snow">87%</div>
                  <div className="text-[11px] text-aurora">+14% this week</div>
                </div>
                <div className="bg-abyss/50 rounded-[var(--radius-xl)] p-4 border border-fog/8">
                  <div className="text-[10px] text-fog tracking-[1px] uppercase mb-1">Risk Level</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-aurora" />
                    <span className="text-[15px] font-medium text-aurora">LOW</span>
                  </div>
                </div>
              </div>

              {/* Schedule blocks */}
              <div className="md:col-span-3 bg-abyss/50 rounded-[var(--radius-xl)] p-5 border border-fog/8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-current" />
                  <span className="text-[11px] text-fog font-mono tracking-[1.2px] uppercase">Today&apos;s Schedule</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { time: "9:00 AM", task: "Research Report", active: true },
                    { time: "11:00 AM", task: "Team Standup", active: false },
                    { time: "1:00 PM", task: "Design Review", active: false },
                    { time: "3:00 PM", task: "Code Sprint", active: false },
                  ].map((block, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-[var(--radius-md)] border ${
                        block.active
                          ? "bg-current/10 border-current/30"
                          : "bg-trench/30 border-fog/8"
                      }`}
                    >
                      <div className="text-[10px] text-fog font-mono mb-1">{block.time}</div>
                      <div className={`text-[13px] ${block.active ? "text-aurora font-medium" : "text-fog"}`}>
                        {block.task}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 8 — PRICING
          ═══════════════════════════════════════ */}
      <section id="pricing" className="py-28 md:py-36 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--page-max-width)] h-px bg-gradient-to-r from-transparent via-fog/15 to-transparent" />

        <div className="mx-auto px-6 md:px-12 max-w-[var(--page-max-width)]">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeChild}
              className="font-heading text-[clamp(1.6rem,4vw,2.5rem)] font-medium tracking-[-0.02em] leading-[1.15] mb-3"
            >
              Simple, fair pricing.
            </motion.h2>
            <motion.p variants={fadeChild} className="text-[15px] text-fog">
              Start for free. Upgrade when you need more power.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
              className="bg-trench border border-fog/10 rounded-[var(--radius-cards)] p-7 flex flex-col"
            >
              <div className="mb-7">
                <h3 className="text-[18px] font-medium text-ice mb-2">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-[36px] font-medium text-snow">$0</span>
                  <span className="text-fog text-[13px]">/ forever</span>
                </div>
              </div>
              <ul className="space-y-3 mb-7 flex-1">
                {["1 Workspace", "Basic AI Models", "100 Tasks/month", "Community Support"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-fog">
                    <Check className="w-4 h-4 text-fog/50 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="dala-outlined-action w-full py-3 text-[11px]">
                START FREE
              </button>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease }}
              className="bg-trench border border-current/40 rounded-[var(--radius-cards)] p-7 flex flex-col relative shadow-[0_0_50px_rgba(0,130,124,0.08)] md:-translate-y-3"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-current to-aurora text-trench text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-[1px]">
                Most Popular
              </div>
              <div className="mb-7">
                <h3 className="text-[18px] font-medium text-ice mb-2">Professional</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-[36px] font-medium text-snow">$29</span>
                  <span className="text-fog text-[13px]">/ user / month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-7 flex-1">
                {[
                  "Unlimited Workspaces",
                  "Advanced AI Models",
                  "Unlimited Tasks",
                  "Priority Support",
                  "Custom Workflows",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-ice">
                    <Check className="w-4 h-4 text-aurora shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="dala-primary-action w-full py-3 text-[11px]">
                START 14-DAY TRIAL
              </button>
            </motion.div>

            {/* Enterprise */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease }}
              className="bg-trench border border-fog/10 rounded-[var(--radius-cards)] p-7 flex flex-col"
            >
              <div className="mb-7">
                <h3 className="text-[18px] font-medium text-ice mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-[36px] font-medium text-snow">Custom</span>
                </div>
              </div>
              <ul className="space-y-3 mb-7 flex-1">
                {["Dedicated Instance", "Custom Fine-tuning", "SAML SSO", "24/7 Support", "SLA Guarantee"].map(
                  (f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] text-fog">
                      <Check className="w-4 h-4 text-fog/50 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  )
                )}
              </ul>
              <button className="dala-outlined-action w-full py-3 text-[11px]">
                CONTACT SALES
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 9 — FINAL CTA
          ═══════════════════════════════════════ */}
      <section className="py-28 md:py-40 relative text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--page-max-width)] h-px bg-gradient-to-r from-transparent via-fog/15 to-transparent" />

        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[50%] bg-current/6 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          className="mx-auto px-6 md:px-12 max-w-xl relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeChild}
            className="font-heading text-[clamp(1.8rem,5vw,3rem)] font-medium tracking-[-0.03em] leading-[1.1] mb-5"
          >
            Work Smarter.
            <br />
            <span className="text-fog">Finish On Time.</span>
          </motion.h2>
          <motion.p variants={fadeChild} className="text-[15px] text-fog leading-[1.6] mb-10 max-w-sm mx-auto">
            Stop wondering what to do next. Let DeadlineAI organize your day
            while you focus on getting things done.
          </motion.p>
          <motion.div variants={fadeChild} className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={loginWithGoogle} className="dala-primary-action h-12 px-8 text-[12px] gap-2">
              START FREE
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={loginWithGoogle} className="dala-outlined-action h-12 px-8 text-[12px] gap-2">
              <Play className="w-4 h-4" />
              VIEW DEMO
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════ */}
      <footer className="border-t border-fog/10 py-10">
        <div className="mx-auto px-6 md:px-12 max-w-[var(--page-max-width)] flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-[12px] text-fog ml-2">© 2026 DeadlineAI. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-[12px] text-fog">
            <a href="#" className="hover:text-ice transition-colors">Privacy</a>
            <a href="#" className="hover:text-ice transition-colors">Terms</a>
            <a href="#" className="hover:text-ice transition-colors">Twitter</a>
            <a href="#" className="hover:text-ice transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Authenticated App (PRESERVED — DO NOT MODIFY)
   ───────────────────────────────────────────── */

function AuthenticatedApp() {
  const { activeTab } = useFocus();

  // Lifted Timer State for Focus Timer (Retains state when switching tabs)
  const [timeLeft, setTimeLeft] = useState(1500); // 25 mins
  const [isActive, setIsActive] = useState(false);

  return (
    <NavShell>
      <div className={activeTab === "dashboard" ? "block" : "hidden"}>
        <DashboardView />
      </div>
      <div className={activeTab === "tasks" ? "block" : "hidden"}>
        <TasksView />
      </div>
      <div className={activeTab === "calendar" ? "block" : "hidden"}>
        <CalendarView />
      </div>
      <div className={activeTab === "planner" ? "block" : "hidden"}>
        <PlannerView />
      </div>
      <div className={activeTab === "timer" ? "block" : "hidden"}>
        <FocusView 
          timeLeft={timeLeft} 
          setTimeLeft={setTimeLeft} 
          isActive={isActive} 
          setIsActive={setIsActive} 
        />
      </div>
      <div className={activeTab === "chat" ? "block" : "hidden"}>
        <ChatView />
      </div>
      <div className={activeTab === "analytics" ? "block" : "hidden"}>
        <AnalyticsView />
      </div>
    </NavShell>
  );
}

/* ─────────────────────────────────────────────
   SVG Icons
   ───────────────────────────────────────────── */

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
