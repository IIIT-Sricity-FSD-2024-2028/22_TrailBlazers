import React from "react";
import {
  Sparkles,
  Calendar,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Users,
  Zap,
  CheckCircle2,
  Award,
  Play,
  Ticket,
  Building2,
  Star,
  Search,
  ChevronDown,
} from "lucide-react";
import EventCard from "../components/EventCard";
import { EVENT_IMAGES } from "../utils/assets";

export default function LandingPage({
  events = [],
  onNavigate,
  onSelectEvent,
  onOpenAuth,
  user,
}) {
  const featuredEvents = events.slice(0, 3);

  return (
    <div className="w-full text-[#26334A]">
      {/* 1. FULL-WIDTH HERO SECTION (100% VIEWPORT WIDTH, ZERO MARGINS, ZERO MAX-WIDTH) */}
      <section className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] flex flex-col justify-between overflow-hidden bg-[#0B132B] px-4 sm:px-8 lg:px-12 pt-24 sm:pt-28 lg:pt-32 pb-6 sm:pb-8 text-white">
        {/* Static Tech Summit 2026 Hero Background Image */}
        <img
          src={EVENT_IMAGES.heroBgImage}
          alt="Wavevents Tech Summit 2026 Stage and Audience"
          className="absolute inset-0 object-cover object-center w-full h-full pointer-events-none"
        />

        {/* Subtle Dark Navy Hero Overlay for Crisp Visibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(11, 19, 43, 0.40) 0%, rgba(11, 19, 43, 0.15) 50%, rgba(11, 19, 43, 0.65) 100%)",
          }}
        />

        {/* Localized Radial Light Spotlight Behind Heading & Subheading Only */}
        <div
          className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] pointer-events-none rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(147, 51, 234, 0.35) 0%, rgba(59, 130, 246, 0.25) 35%, transparent 75%)",
            filter: "blur(30px)",
          }}
        />

        {/* Hero Top Bar: Translucent Glass Badges */}
        <div className="relative z-10 flex items-center justify-between w-full mx-auto max-w-7xl">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold text-white border border-white/30 shadow-md">
            <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
            <span>Next-Generation Event Platform</span>
          </div>

          {/* Floating Live Badge Card Top Right */}
          <div className="items-center hidden gap-3 p-3 text-white border shadow-lg sm:flex rounded-2xl bg-white/20 backdrop-blur-md border-white/30">
            <div className="flex items-center justify-center w-8 h-8 border rounded-xl bg-white/20 border-white/30 shadow-2xs">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-extrabold">
                  LIVE NOW
                </span>
              </div>
              <div className="text-xs font-extrabold text-white">
                Tech Summit 2026
              </div>
              <div className="text-[10px] text-slate-300 font-medium">
                • 2,534 watching
              </div>
            </div>
          </div>
        </div>

        {/* Hero Central Content Box */}
        <div className="relative z-10 max-w-3xl py-8 mx-auto space-y-5 text-center sm:py-10">
          {/* Main Headline */}
          <div className="relative space-y-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] font-sans">
              Plan. Experience. <br />
              <span className="inline-block text-gradient-purple-pink">
                Measure.
              </span>
            </h1>
          </div>

          {/* Subheading */}
          <p className="max-w-xl mx-auto text-sm font-semibold leading-relaxed sm:text-base text-slate-200">
            The all-in-one platform to create, manage, attend and analyze
            extraordinary events.
          </p>

          {/* Pastel Pill Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            <button
              onClick={() => onNavigate("explore")}
              className="flex items-center gap-2.5 px-7 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold text-sm hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all hover:scale-105 shadow-lg border border-white/30 cursor-pointer"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            <button
              onClick={() => {
                if (user) onNavigate("create-event");
                else
                  onOpenAuth(
                    "login",
                    "Please sign in to continue.",
                    "create-event",
                  );
              }}
              className="flex items-center gap-2.5 px-7 py-3 rounded-full bg-white/20 backdrop-blur-md text-white font-extrabold text-sm hover:bg-white/30 transition-all hover:scale-105 shadow-lg border border-white/40 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-purple-300" />
              <span>Create Your Event</span>
            </button>
          </div>

          {/* Video Trigger Bar */}
          <div className="flex items-center justify-center pt-1">
            <div className="inline-flex items-center gap-3 px-5 py-2 text-left text-white transition border rounded-full shadow-md cursor-pointer bg-white/20 backdrop-blur-md border-white/30 hover:bg-white/30">
              <div className="flex items-center justify-center w-6 h-6 text-white bg-indigo-500 rounded-full shadow-xs">
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-white">
                  See Wavevents in Action
                </div>
                <div className="text-[10px] text-slate-300">
                  Watch how we transform event experiences
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Section: 4 Statistics Cards Placed Directly On The Hero Stage Image */}
        <div className="relative z-20 w-full pt-4 pb-2 mx-auto max-w-7xl sm:pt-6 sm:pb-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#1C0E38]/85 backdrop-blur-2xl border border-purple-400/40 shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex items-center gap-3.5 hover:-translate-y-1 hover:border-purple-300/70 transition-all duration-300 group text-white">
              <div className="flex items-center justify-center w-10 h-10 font-bold transition-transform border rounded-xl bg-blue-500/20 text-cyan-300 border-cyan-400/40 shrink-0 shadow-2xs group-hover:scale-105">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-white sm:text-xl">
                  2,500+
                </div>
                <div className="text-xs font-bold text-purple-200">
                  Happy Attendees
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#1C0E38]/85 backdrop-blur-2xl border border-purple-400/40 shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex items-center gap-3.5 hover:-translate-y-1 hover:border-purple-300/70 transition-all duration-300 group text-white">
              <div className="flex items-center justify-center w-10 h-10 font-bold text-pink-300 transition-transform border rounded-xl bg-pink-500/20 border-pink-400/40 shrink-0 shadow-2xs group-hover:scale-105">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-white sm:text-xl">
                  150+
                </div>
                <div className="text-xs font-bold text-purple-200">
                  Events Organized
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#1C0E38]/85 backdrop-blur-2xl border border-purple-400/40 shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex items-center gap-3.5 hover:-translate-y-1 hover:border-purple-300/70 transition-all duration-300 group text-white">
              <div className="flex items-center justify-center w-10 h-10 font-bold transition-transform border rounded-xl bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shrink-0 shadow-2xs group-hover:scale-105">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-white sm:text-xl">
                  120+
                </div>
                <div className="text-xs font-bold text-purple-200">
                  Organizations
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#1C0E38]/85 backdrop-blur-2xl border border-purple-400/40 shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex items-center gap-3.5 hover:-translate-y-1 hover:border-purple-300/70 transition-all duration-300 group text-white">
              <div className="flex items-center justify-center w-10 h-10 font-bold text-purple-300 transition-transform border rounded-xl bg-purple-500/20 border-purple-400/40 shrink-0 shadow-2xs group-hover:scale-105">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-white sm:text-xl">
                  98%
                </div>
                <div className="text-xs font-bold text-purple-200">
                  Satisfaction Rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Luminous Lavender Atmospheric Bleed */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end h-16 pointer-events-none sm:h-24">
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(147, 51, 234, 0.20) 50%, #3B1A6E 100%)",
            }}
          />
        </div>
      </section>

      {/* GLOBAL ATMOSPHERE CANVAS WRAPPER (Gradual Transition: Medium Dark Lavender -> Soft Lavender -> Light Lavender) */}
      <div className="relative w-full bg-gradient-to-b from-[#3B1A6E] via-[#653A9E] via-[#A880DF] via-[#D8C7F5] to-[#E9E1FA] pt-8 sm:pt-10 pb-16 overflow-hidden text-[#0F172A]">
        {/* Background Luminous Neon & Lavender Atmosphere Orbs */}
        <div className="absolute top-8 left-1/4 w-[750px] h-[750px] rounded-full bg-purple-500/25 blur-[150px] pointer-events-none" />
        <div className="absolute top-48 right-1/4 w-[700px] h-[700px] rounded-full bg-indigo-500/25 blur-[150px] pointer-events-none" />
        <div className="absolute top-[40%] left-1/3 w-[650px] h-[650px] rounded-full bg-pink-400/20 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/3 w-[700px] h-[700px] rounded-full bg-sky-300/30 blur-[150px] pointer-events-none" />

        {/* Floating Glass Orbs */}
        <div className="absolute hidden w-8 h-8 border rounded-full pointer-events-none lg:block top-16 left-12 bg-gradient-to-tr from-purple-400/40 to-indigo-500/40 blur-xs border-white/60 animate-pastel-float" />
        <div
          className="absolute hidden w-10 h-10 border rounded-full pointer-events-none lg:block top-28 right-16 bg-gradient-to-tr from-cyan-400/40 to-teal-400/40 blur-xs border-white/60 animate-pastel-float"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute hidden w-12 h-12 border rounded-full pointer-events-none lg:block bottom-36 left-20 bg-gradient-to-tr from-pink-400/40 to-purple-500/40 blur-xs border-white/60 animate-pastel-float"
          style={{ animationDelay: "3s" }}
        />

        {/* Decorative Dotted Grid Patterns Left & Right */}
        <div className="absolute hidden w-32 h-32 pointer-events-none xl:block top-16 left-6 opacity-30">
          <svg width="100%" height="100%" fill="none">
            <pattern
              id="dotGridLeft"
              x="0"
              y="0"
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" className="fill-purple-300" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dotGridLeft)" />
          </svg>
        </div>

        <div className="absolute hidden w-32 h-32 pointer-events-none xl:block top-16 right-6 opacity-30">
          <svg width="100%" height="100%" fill="none">
            <pattern
              id="dotGridRight"
              x="0"
              y="0"
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" className="fill-cyan-300" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dotGridRight)" />
          </svg>
        </div>

        <div className="relative z-10 px-4 mx-auto space-y-12 max-w-7xl sm:px-6 lg:px-8 sm:space-y-14">
          {/* 2. FEATURED UPCOMING EVENTS CATALOGUE PREVIEW (Medium Dark Lavender Translucent Glass Panel) */}
          <section className="relative p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-[#301659]/85 via-[#271249]/85 to-[#200D3D]/90 backdrop-blur-2xl border border-purple-400/40 shadow-[0_25px_80px_rgba(0,0,0,0.5)] space-y-6 transition-all duration-500">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[11px] font-extrabold text-cyan-300 uppercase tracking-widest shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                  <span>Upcoming Discoveries</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Featured Platform Events
                </h2>
              </div>
              <button
                onClick={() => onNavigate("explore")}
                className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold transition border rounded-full bg-white/10 hover:bg-white/20 border-purple-400/40 text-cyan-300 hover:text-white shadow-2xs group cursor-pointer"
              >
                <span>Browse Catalogue ({events.length} Available)</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Level 3 Light Sea-Blue Glass Event Cards Grid */}
            <div className="grid items-stretch grid-cols-1 gap-6 md:grid-cols-3">
              {featuredEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} onSelect={onSelectEvent} />
              ))}
            </div>
          </section>

          {/* 3. WHY CHOOSE WAVEVENTS FEATURE CARDS (TRANSLUCENT SOFT LAV دستER GLASS PANEL) */}
          <section className="p-8 sm:p-10 rounded-[32px] bg-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_20px_60px_rgba(88,28,135,0.15)] space-y-6">
            <div className="space-y-1 text-center">
              <span className="text-[11px] font-extrabold text-purple-900 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <span>✦</span> WHY CHOOSE WAVEVENTS? <span>✦</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* 1. Event Discovery */}
              <div className="flex flex-col items-center p-5 space-y-3 text-center transition-all duration-300 border rounded-2xl bg-white/80 backdrop-blur-xl border-white/80 hover:border-purple-400 hover:bg-white hover:shadow-xl group">
                <div className="flex items-center justify-center w-12 h-12 font-bold text-white transition-transform shadow-lg rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 group-hover:scale-110">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-[#0F172A]">
                    Event Discovery
                  </h3>
                  <p className="text-[11px] text-[#475569] leading-relaxed font-medium">
                    Find and explore events that match your interests and goals.
                  </p>
                </div>
              </div>

              {/* 2. Seamless Registration */}
              <div className="flex flex-col items-center p-5 space-y-3 text-center transition-all duration-300 border rounded-2xl bg-white/80 backdrop-blur-xl border-white/80 hover:border-pink-400 hover:bg-white hover:shadow-xl group">
                <div className="flex items-center justify-center w-12 h-12 font-bold text-white transition-transform shadow-lg rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-400 group-hover:scale-110">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-[#0F172A]">
                    Seamless Registration
                  </h3>
                  <p className="text-[11px] text-[#475569] leading-relaxed font-medium">
                    Quick, secure, and hassle-free event registration.
                  </p>
                </div>
              </div>

              {/* 3. Smart Ticketing */}
              <div className="flex flex-col items-center p-5 space-y-3 text-center transition-all duration-300 border rounded-2xl bg-white/80 backdrop-blur-xl border-white/80 hover:border-emerald-400 hover:bg-white hover:shadow-xl group">
                <div className="flex items-center justify-center w-12 h-12 font-bold text-white transition-transform shadow-lg rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 group-hover:scale-110">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-[#0F172A]">
                    Smart Ticketing
                  </h3>
                  <p className="text-[11px] text-[#475569] leading-relaxed font-medium">
                    Digital tickets, QR check-ins, and real-time attendance.
                  </p>
                </div>
              </div>

              {/* 4. Real-time Insights */}
              <div className="flex flex-col items-center p-5 space-y-3 text-center transition-all duration-300 border rounded-2xl bg-white/80 backdrop-blur-xl border-white/80 hover:border-purple-400 hover:bg-white hover:shadow-xl group">
                <div className="flex items-center justify-center w-12 h-12 font-bold text-white transition-transform shadow-lg rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 group-hover:scale-110">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-[#0F172A]">
                    Real-time Insights
                  </h3>
                  <p className="text-[11px] text-[#475569] leading-relaxed font-medium">
                    Track engagement and performance with live analytics.
                  </p>
                </div>
              </div>

              {/* 5. Memorable Experiences */}
              <div className="flex flex-col items-center p-5 space-y-3 text-center transition-all duration-300 border rounded-2xl bg-white/80 backdrop-blur-xl border-white/80 hover:border-amber-400 hover:bg-white hover:shadow-xl group">
                <div className="flex items-center justify-center w-12 h-12 font-bold text-white transition-transform shadow-lg rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 group-hover:scale-110">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-[#0F172A]">
                    Memorable Experiences
                  </h3>
                  <p className="text-[11px] text-[#475569] leading-relaxed font-medium">
                    Deliver exceptional events people will love.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. HOW IT WORKS 4-STEP CONNECTED TIMELINE (TRANSLUCENT LIGHT LAVENDER GLASS PANEL) */}
          <section className="p-8 sm:p-10 rounded-[32px] bg-white/50 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(37,99,235,0.10)] space-y-6">
            <div className="space-y-1 text-center">
              <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <span>✦</span> HOW IT WORKS <span>✦</span>
              </span>
            </div>

            <div className="relative grid grid-cols-1 gap-6 md:grid-cols-4">
              {/* Step 01: Discover */}
              <div className="flex items-center gap-4 p-6 space-y-3 transition-all duration-300 border rounded-2xl bg-white/80 backdrop-blur-xl border-white/80 hover:border-cyan-500 hover:bg-white hover:shadow-xl group">
                <div className="flex items-center justify-center w-10 h-10 text-sm font-extrabold transition-transform border shadow-md rounded-2xl bg-cyan-500/15 text-cyan-800 shrink-0 border-cyan-300/80 group-hover:scale-110">
                  01
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0F172A] text-sm">
                    Discover
                  </h4>
                  <p className="text-xs text-[#475569] font-medium">
                    Find events that inspire you.
                  </p>
                </div>
              </div>

              {/* Step 02: Register */}
              <div className="flex items-center gap-4 p-6 space-y-3 transition-all duration-300 border rounded-2xl bg-white/80 backdrop-blur-xl border-white/80 hover:border-pink-500 hover:bg-white hover:shadow-xl group">
                <div className="flex items-center justify-center w-10 h-10 text-sm font-extrabold text-pink-800 transition-transform border shadow-md rounded-2xl bg-pink-500/15 shrink-0 border-pink-300/80 group-hover:scale-110">
                  02
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0F172A] text-sm">
                    Register
                  </h4>
                  <p className="text-xs text-[#475569] font-medium">
                    Secure your spot in just a few clicks.
                  </p>
                </div>
              </div>

              {/* Step 03: Attend */}
              <div className="flex items-center gap-4 p-6 space-y-3 transition-all duration-300 border rounded-2xl bg-white/80 backdrop-blur-xl border-white/80 hover:border-emerald-500 hover:bg-white hover:shadow-xl group">
                <div className="flex items-center justify-center w-10 h-10 text-sm font-extrabold transition-transform border shadow-md rounded-2xl bg-emerald-500/15 text-emerald-800 shrink-0 border-emerald-300/80 group-hover:scale-110">
                  03
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0F172A] text-sm">
                    Attend
                  </h4>
                  <p className="text-xs text-[#475569] font-medium">
                    Enjoy the event and make connections.
                  </p>
                </div>
              </div>

              {/* Step 04: Analyze */}
              <div className="flex items-center gap-4 p-6 space-y-3 transition-all duration-300 border rounded-2xl bg-white/80 backdrop-blur-xl border-white/80 hover:border-purple-500 hover:bg-white hover:shadow-xl group">
                <div className="flex items-center justify-center w-10 h-10 text-sm font-extrabold text-purple-800 transition-transform border shadow-md rounded-2xl bg-purple-500/15 shrink-0 border-purple-300/80 group-hover:scale-110">
                  04
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0F172A] text-sm">
                    Analyze
                  </h4>
                  <p className="text-xs text-[#475569] font-medium">
                    Get insights and measure impact.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. POST-EVENT ANALYTICS BANNER (HIGH WOW FACTOR GLASS BANNER) */}
          <section>
            <div className="bg-gradient-to-r from-[#2E1256] via-[#4A1778] to-[#6B21A8] backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_25px_70px_rgba(147,51,234,0.35)] border border-white/40">
              <div className="flex items-center gap-5">
                <div className="flex items-center justify-center font-bold text-white shadow-lg w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 shrink-0">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <div className="max-w-xl space-y-1">
                  <h3 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                    Post-Event Analytics That Drive Impact
                  </h3>
                  <p className="text-xs font-medium leading-relaxed sm:text-sm text-purple-100/90">
                    Measure engagement, analyze feedback, and make data-driven
                    decisions for your next extraordinary event.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (user) onNavigate("dashboard");
                  else onOpenAuth("login");
                }}
                className="shrink-0 px-6 py-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 hover:scale-105 text-white font-extrabold text-xs transition shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-white/30 flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Analytics Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
