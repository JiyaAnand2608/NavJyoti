import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import {
  Syringe,
  Activity,
  FileText,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Baby,
  BriefcaseMedical,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Bell,
  HeartHandshake,
  Sprout,
  FolderLock,
} from 'lucide-react';

export function LandingPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleQuickAction = (targetPath) => {
    if (isAuthenticated) {
      navigate(targetPath);
    } else {
      navigate('/auth/login', { state: { from: targetPath } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBF8] text-[#17394A]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12">
        {/* 1. HERO SECTION — Matches Reference Visual Direction */}
        <section className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-gradient-to-b from-[#EAF7F0] via-[#DCEFE5] to-[#D5EBDD] border border-[#CDE5D6] p-6 sm:p-10 lg:p-14 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Column: Hero Content */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#17394A] tracking-tight leading-[1.2] font-serif">
                Your Child's Health Journey, Made Simple.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Track vaccinations, follow developmental milestones and keep your child's health records organised — all in one convenient place.
              </p>

              {/* Primary & Secondary Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  onClick={() => handleQuickAction('/parent/dashboard')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#006B64] hover:bg-[#00544e] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                >
                  <User className="w-4 h-4 text-white/90" />
                  <span>Continue as Parent</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/auth/login', { state: { role: 'worker', from: '/worker/dashboard' } })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#17394A] border border-slate-200/90 font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
                >
                  <BriefcaseMedical className="w-4 h-4 text-[#006B64]" />
                  <span>Health Worker Login</span>
                </button>
              </div>

              {/* Sub-link */}
              <div className="pt-1">
                <Link
                  to="/auth/register"
                  className="text-xs text-slate-500 hover:text-[#006B64] font-medium transition-colors"
                >
                  New here? <span className="underline font-semibold text-[#006B64]">Create an account</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Original Abstract Healthcare Landscape & Floating Checklist Card */}
            <div className="lg:col-span-5 flex items-center justify-center relative">
              <div className="relative w-full max-w-[420px] h-[300px] sm:h-[340px] flex items-center justify-center overflow-hidden rounded-2xl">
                {/* SVG Abstract Soft Landscape Backdrop */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 500 380"
                  fill="none"
                  preserveAspectRatio="xMidYMid slice"
                >
                  {/* Subtle Sunrise Glow & Rays */}
                  <g transform="translate(360, 100)">
                    <circle cx="0" cy="0" r="38" fill="#F5C45E" />
                    {/* Sun rays */}
                    <line x1="0" y1="-50" x2="0" y2="-64" stroke="#F5C45E" strokeWidth="3" strokeLinecap="round" />
                    <line x1="36" y1="-36" x2="48" y2="-48" stroke="#F5C45E" strokeWidth="3" strokeLinecap="round" />
                    <line x1="-36" y1="-36" x2="-48" y2="-48" stroke="#F5C45E" strokeWidth="3" strokeLinecap="round" />
                    <line x1="50" y1="0" x2="64" y2="0" stroke="#F5C45E" strokeWidth="3" strokeLinecap="round" />
                    <line x1="-50" y1="0" x2="-64" y2="0" stroke="#F5C45E" strokeWidth="3" strokeLinecap="round" />
                  </g>

                  {/* Soft Background Hills */}
                  <path
                    d="M-40 280 Q 150 140, 360 210 T 540 200 L 540 400 L -40 400 Z"
                    fill="#C9E6D8"
                    opacity="0.8"
                  />
                  <path
                    d="M-20 300 Q 180 200, 380 280 T 540 260 L 540 400 L -20 400 Z"
                    fill="#BBDCCB"
                    opacity="0.9"
                  />

                  {/* Subtle Botanical Leaf Shapes (Right & Left) */}
                  <g transform="translate(420, 260) rotate(-15)">
                    <path d="M0 0 Q 20 -40, 0 -70 Q -20 -40, 0 0 Z" fill="#78B89F" opacity="0.7" />
                    <path d="M0 -30 Q 35 -60, 25 -95 Q 5 -75, 0 -30 Z" fill="#78B89F" opacity="0.6" />
                    <path d="M0 -40 Q -35 -70, -25 -105 Q -5 -85, 0 -40 Z" fill="#78B89F" opacity="0.6" />
                  </g>
                  <g transform="translate(80, 290) rotate(20)">
                    <path d="M0 0 Q 18 -35, 0 -60 Q -18 -35, 0 0 Z" fill="#88C2AA" opacity="0.6" />
                    <path d="M0 -25 Q 30 -50, 20 -80 Q 5 -60, 0 -25 Z" fill="#88C2AA" opacity="0.5" />
                  </g>
                </svg>

                {/* Floating White Healthcare Checklist Card (Matches Reference Card Exactly) */}
                <div className="relative z-10 w-72 sm:w-80 rounded-2xl bg-white/95 backdrop-blur-md p-5 shadow-md border border-white/90 transform rotate-[-1deg] hover:rotate-0 transition-transform">
                  <div className="space-y-3.5">
                    {/* Row 1: Vaccinations */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFBF8] border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#EAF7F0] text-[#006B64] flex items-center justify-center shrink-0">
                          <Syringe className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-[#17394A]">Vaccinations</span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-[#006B64] text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Row 2: Milestones */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFBF8] border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#EAF7F0] text-[#006B64] flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-[#17394A]">Milestones</span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-[#006B64] text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Row 3: Health Records */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFBF8] border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#EAF7F0] text-[#006B64] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-[#17394A]">Health Records</span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-[#006B64] text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. QUICK ACCESS SECTION ("What would you like to do?") */}
        <section className="space-y-6 pt-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#17394A] font-serif">
            What would you like to do?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Vaccinations */}
            <div
              onClick={() => handleQuickAction('/parent/vaccines')}
              className="group p-4 sm:p-5 rounded-2xl bg-white border border-[#DCEFE5] hover:border-[#006B64]/50 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#EAF7F0] text-[#006B64] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Syringe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17394A]">Vaccinations</h3>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Check upcoming and completed doses.
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#EAF7F0] text-[#006B64] flex items-center justify-center shrink-0 group-hover:bg-[#006B64] group-hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: Milestones */}
            <div
              onClick={() => handleQuickAction('/parent/milestones')}
              className="group p-4 sm:p-5 rounded-2xl bg-white border border-[#fbeccb] hover:border-[#F5C45E] hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#fdf8ef] text-[#dfab3e] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17394A]">Milestones</h3>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Follow your child's development.
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#fdf8ef] text-[#dfab3e] flex items-center justify-center shrink-0 group-hover:bg-[#F5C45E] group-hover:text-[#17394A] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: Health Records */}
            <div
              onClick={() => handleQuickAction('/parent/records')}
              className="group p-4 sm:p-5 rounded-2xl bg-white border border-[#d4eaf0] hover:border-[#006B64]/50 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#EAF5F8] text-[#17394A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FolderLock className="w-5 h-5 text-[#006B64]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17394A]">Health Records</h3>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Access important child records.
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#EAF5F8] text-[#006B64] flex items-center justify-center shrink-0 group-hover:bg-[#006B64] group-hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 4: Appointments */}
            <div
              onClick={() => handleQuickAction('/parent/appointments')}
              className="group p-4 sm:p-5 rounded-2xl bg-white border border-[#f9dbdb] hover:border-[#D98282] hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#fdf2f2] text-[#D98282] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17394A]">Appointments</h3>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Manage visits and reminders.
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#fdf2f2] text-[#D98282] flex items-center justify-center shrink-0 group-hover:bg-[#D98282] group-hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. HOW NAVJYOTI WORKS */}
        <section className="space-y-6 pt-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#17394A] font-serif">
            How NavJyoti Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Step 1 */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-[#EAF7F0] text-[#006B64] flex items-center justify-center shrink-0 font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#17394A] block">
                  1. Create or link your child's profile
                </span>
                <span className="text-[11px] text-slate-500">Quick sign-in with your mobile number</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-[#EAF5F8] text-[#006B64] flex items-center justify-center shrink-0 font-bold">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#17394A] block">
                  2. Track vaccinations and milestones
                </span>
                <span className="text-[11px] text-slate-500">Official UIP schedule and observations</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-[#fdf8ef] text-[#dfab3e] flex items-center justify-center shrink-0 font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#17394A] block">
                  3. Receive reminders and coordinate visits
                </span>
                <span className="text-[11px] text-slate-500">Stay informed with ANM home support</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SUPPORT BANNER — Matches Reference Sage Green Banner */}
        <section className="rounded-2xl sm:rounded-3xl bg-[#DCEFE5] border border-[#CDE5D6] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base sm:text-lg font-bold text-[#17394A]">
              Need help with your child's health records?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Find answers, get guidance or connect with your health worker.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/parent/help"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#17394A] font-semibold text-xs border border-slate-200 shadow-2xs transition-all"
            >
              <span>Visit Help Centre</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/parent/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#006B64] hover:bg-[#00544e] text-white font-semibold text-xs shadow-xs transition-all"
            >
              <span>Contact Your Health Worker</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
