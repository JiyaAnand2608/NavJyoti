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
  User,
  Users,
  BriefcaseMedical,
  Check,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Bell,
  Sprout,
  FolderPlus,
  Headphones,
  Plus,
} from 'lucide-react';

export function LandingPage() {
  const { lang, t } = useLanguage();
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
    <div className="min-h-screen w-full flex flex-col bg-[#F5F1E9] text-[#294B57] overflow-x-hidden">
      {/* 1. HEADER */}
      <Navbar />

      {/* 2. HERO SECTION — Full-width landscape-inspired hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#F5F1E9] via-[#EBF4EE] to-[#E5F2E9] pt-6 sm:pt-10 pb-12 sm:pb-16 lg:pb-20">
        {/* Full-width Responsive Landscape Waves & Sunrise SVG Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 1440 440"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C7E4CD" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#A8D5B5" stopOpacity="0.65" />
              </linearGradient>
              <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A8D5B5" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#89C49B" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="sunGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F4B83F" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Back Wave / Hill */}
            <path
              d="M-50 320 C 280 230, 680 340, 1020 220 C 1220 150, 1380 180, 1500 200 L 1500 460 L -50 460 Z"
              fill="url(#hillGrad1)"
            />

            {/* Foreground Wave / Hill */}
            <path
              d="M-50 360 C 320 270, 720 380, 1080 280 C 1260 230, 1400 270, 1500 280 L 1500 460 L -50 460 Z"
              fill="url(#hillGrad2)"
            />

            {/* Bottom Gentle Wave Transition */}
            <path
              d="M-50 410 Q 400 370, 850 410 T 1500 400 L 1500 460 L -50 460 Z"
              fill="#E5F2E9"
              opacity="0.9"
            />

            {/* Decorative Leaves on Left Corner */}
            <g transform="translate(18, 220) scale(0.9)" opacity="0.8">
              <path d="M0 40 Q 25 15, 45 35 Q 25 55, 0 40 Z" fill="#84C499" />
              <path d="M-10 10 Q 15 -15, 35 5 Q 15 25, -10 10 Z" fill="#71B587" />
              <path d="M10 -20 Q 35 -40, 50 -15 Q 30 0, 10 -20 Z" fill="#84C499" />
            </g>

            {/* Center Decorative Leaf Plant Sprouting from Hills */}
            <g transform="translate(670, 240) scale(0.95)" opacity="0.85">
              <path d="M0 100 Q 5 50, 0 0" stroke="#5E9F76" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M0 70 Q -25 55, -35 70 Q -20 85, 0 70 Z" fill="#6FB386" />
              <path d="M0 50 Q 25 35, 35 50 Q 20 65, 0 50 Z" fill="#7CBD93" />
              <path d="M0 30 Q -30 15, -40 30 Q -20 45, 0 30 Z" fill="#6FB386" />
              <path d="M0 10 Q 25 -5, 35 10 Q 18 25, 0 10 Z" fill="#7CBD93" />
              <path d="M0 0 Q -5 -25, 0 -35 Q 5 -25, 0 0 Z" fill="#5E9F76" />
            </g>

            {/* Decorative Leaves on Right Edge */}
            <g transform="translate(1320, 220) scale(1.1)" opacity="0.85">
              <path d="M80 80 Q 20 50, 10 90" stroke="#5E9F76" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M40 70 Q 15 45, 0 65 Q 20 80, 40 70 Z" fill="#6FB386" />
              <path d="M55 60 Q 75 35, 95 50 Q 75 70, 55 60 Z" fill="#7CBD93" />
              <path d="M25 78 Q 0 60, -15 80 Q 5 95, 25 78 Z" fill="#6FB386" />
            </g>
          </svg>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* LEFT COLUMN: Hero Headline & Action Buttons */}
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#103342] tracking-tight leading-[1.18] font-serif">
                  {lang === 'hi' ? (
                    t('hero.headline')
                  ) : (
                    <>
                      Your Child's Health<br className="hidden sm:inline" /> Journey, Made Simple.
                    </>
                  )}
                </h1>
                {/* Thick small green accent bar under title */}
                <div className="w-14 h-1.5 bg-[#007F68] rounded-full mt-3 mx-auto lg:mx-0"></div>
              </div>

              <p className="text-sm sm:text-base text-[#294B57] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {t('hero.description')}
              </p>

              {/* Action Buttons Row */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  onClick={() => handleQuickAction('/parent/dashboard')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 text-white/95" />
                  <span>{t('hero.continueParent')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/auth/login', { state: { role: 'worker', from: '/worker/dashboard' } })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#FBF8F2] hover:bg-white text-[#007F68] border border-[#007F68] font-semibold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#007F68] stroke-[3]" />
                  <BriefcaseMedical className="w-4 h-4 text-[#007F68]" />
                  <span>{t('hero.workerLogin')}</span>
                </button>
              </div>

              {/* Sub-link underneath buttons */}
              <div className="pt-1.5">
                <span className="text-xs text-[#294B57]">
                  {t('hero.newHere') || 'New here?'}{' '}
                </span>
                <Link
                  to="/auth/register"
                  className="text-xs font-semibold text-[#007F68] hover:text-[#005F52] underline transition-colors"
                >
                  {t('hero.createAccount') || 'Create an account'}
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: Floating Tilted Checklist Panel with Responsive Rising Sun */}
            <div className="lg:col-span-5 flex items-center justify-center relative">
              <div className="relative w-full max-w-[340px] sm:max-w-[360px] py-4">
                {/* Responsive Rising Sun: anchored to the card's top-right corner so it remains visible at all screen widths */}
                <div className="absolute -top-7 -right-6 sm:-top-9 sm:-right-8 pointer-events-none select-none z-0">
                  <svg
                    viewBox="-85 -85 170 170"
                    className="w-28 h-28 sm:w-32 sm:h-32"
                    fill="none"
                  >
                    <defs>
                      <linearGradient id="sunGlowCard" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#F4B83F" stopOpacity="0.95" />
                      </linearGradient>
                    </defs>
                    {/* Radial Sun Rays */}
                    <line x1="0" y1="-56" x2="0" y2="-72" stroke="#F4B83F" strokeWidth="3" strokeLinecap="round" />
                    <line x1="28" y1="-50" x2="38" y2="-66" stroke="#F4B83F" strokeWidth="3" strokeLinecap="round" />
                    <line x1="52" y1="-30" x2="68" y2="-40" stroke="#F4B83F" strokeWidth="3" strokeLinecap="round" />
                    <line x1="64" y1="-6" x2="80" y2="-6" stroke="#F4B83F" strokeWidth="3" strokeLinecap="round" />
                    <line x1="-28" y1="-50" x2="-38" y2="-66" stroke="#F4B83F" strokeWidth="3" strokeLinecap="round" />
                    <line x1="-52" y1="-30" x2="-68" y2="-40" stroke="#F4B83F" strokeWidth="3" strokeLinecap="round" />
                    <line x1="-64" y1="-6" x2="-80" y2="-6" stroke="#F4B83F" strokeWidth="3" strokeLinecap="round" />

                    {/* Sun Semi-Circle */}
                    <path
                      d="M -54 0 A 54 54 0 0 1 54 0 Z"
                      fill="url(#sunGlowCard)"
                    />
                  </svg>
                </div>

                {/* Floating Ivory Card with completed-state checkmarks */}
                <div className="relative z-10 w-full rounded-2xl sm:rounded-3xl bg-[#FBF8F2] p-5 sm:p-6 shadow-[0_12px_32px_rgba(16,51,66,0.08),0_4px_12px_rgba(16,51,66,0.04)] border border-[#D8E6DA] transform rotate-[-2.5deg] hover:rotate-0 transition-transform duration-300">
                  <div className="space-y-3">
                    {/* Item 1: Vaccinations */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D8E6DA]/70 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0">
                          <Syringe className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-[#103342]">
                          {t('hero.checklist.vaccinations') || 'Vaccinations'}
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-[#007F68] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    {/* Item 2: Growth & Milestones */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D8E6DA]/70 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-[#103342]">
                          {t('hero.checklist.growthMilestones') || 'Growth & Milestones'}
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-[#007F68] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    {/* Item 3: Health Records */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D8E6DA]/70 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0">
                          <FolderPlus className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-[#103342]">
                          {t('hero.checklist.healthRecords') || 'Health Records'}
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-[#007F68] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT: Compact arrangement & clear hierarchy */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10 sm:space-y-12">
        {/* SECTION: Explore NavJyoti */}
        <section className="space-y-4">
          <h2 className="text-2xl sm:text-[28px] font-bold text-[#103342] font-serif tracking-tight">
            {t('explore.heading') || 'Explore NavJyoti'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Vaccination Tracker */}
            <div
              onClick={() => handleQuickAction('/parent/vaccines')}
              className="group p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] hover:border-[#007F68] hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Syringe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#103342]">
                    {t('explore.vaccinationTracker') || 'Vaccination Tracker'}
                  </h3>
                  <p className="text-xs text-[#294B57] leading-snug mt-0.5">
                    {t('explore.vaccinationTrackerDesc') || 'Check upcoming and completed doses.'}
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0 group-hover:bg-[#007F68] group-hover:text-white transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2: Child Development */}
            <div
              onClick={() => handleQuickAction('/parent/milestones')}
              className="group p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] hover:border-[#70A558] hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#EAF5EC] text-[#558B2F] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#103342]">
                    {t('explore.childDevelopment') || 'Child Development'}
                  </h3>
                  <p className="text-xs text-[#294B57] leading-snug mt-0.5">
                    {t('explore.childDevelopmentDesc') || 'Track growth and key milestones.'}
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#EAF5EC] text-[#558B2F] flex items-center justify-center shrink-0 group-hover:bg-[#558B2F] group-hover:text-white transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 3: Health Records */}
            <div
              onClick={() => handleQuickAction('/parent/records')}
              className="group p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] hover:border-[#007F68] hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#103342]">
                    {t('explore.healthRecords') || 'Health Records'}
                  </h3>
                  <p className="text-xs text-[#294B57] leading-snug mt-0.5">
                    {t('explore.healthRecordsDesc') || "Access and manage your child's reports."}
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0 group-hover:bg-[#007F68] group-hover:text-white transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 4: Appointments */}
            <div
              onClick={() => handleQuickAction('/parent/appointments')}
              className="group p-4 rounded-2xl bg-[#FBF8F2] border border-[#f0d4d4] hover:border-[#D9534F] hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#FDECEC] text-[#D9534F] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#103342]">
                    {t('explore.appointments') || 'Appointments'}
                  </h3>
                  <p className="text-xs text-[#294B57] leading-snug mt-0.5">
                    {t('explore.appointmentsDesc') || 'Book and manage health visits.'}
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#FDECEC] text-[#D9534F] flex items-center justify-center shrink-0 group-hover:bg-[#D9534F] group-hover:text-white transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: How NavJyoti Works */}
        <section className="space-y-4">
          <h2 className="text-2xl sm:text-[28px] font-bold text-[#103342] font-serif tracking-tight">
            {t('howItWorks.heading') || 'How NavJyoti Works'}
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 bg-transparent">
            {/* Step 1 */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-12 h-12 rounded-full bg-[#DDF0E3] border border-[#C7E4CD] text-[#007F68] flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-[#103342]">
                {t('howItWorks.step1') || "1. Create your child's profile"}
              </span>
            </div>

            {/* Dotted Line 1 */}
            <div className="hidden md:flex flex-1 items-center justify-center px-4">
              <div className="w-full border-t-2 border-dotted border-[#A8D5B5]"></div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-12 h-12 rounded-full bg-[#DDF0E3] border border-[#C7E4CD] text-[#007F68] flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-[#103342]">
                {t('howItWorks.step2') || '2. Track vaccinations and development'}
              </span>
            </div>

            {/* Dotted Line 2 */}
            <div className="hidden md:flex flex-1 items-center justify-center px-4">
              <div className="w-full border-t-2 border-dotted border-[#A8D5B5]"></div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-12 h-12 rounded-full bg-[#EAF5EC] border border-[#C7E4CD] text-[#70A558] flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-[#103342]">
                {t('howItWorks.step3') || '3. Get timely reminders and manage visits'}
              </span>
            </div>
          </div>
        </section>

        {/* SECTION: Help Banner */}
        <section className="relative rounded-2xl sm:rounded-3xl bg-[#DDF0E3]/70 border border-[#D8E6DA] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          {/* Decorative Leaf Sprig on right corner of the banner */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 hidden sm:block">
            <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
              <path d="M90 50 Q 50 30, 30 70" stroke="#007F68" strokeWidth="2.5" fill="none" />
              <path d="M50 45 Q 30 25, 20 40 Q 35 55, 50 45 Z" fill="#A8D5B5" />
              <path d="M65 40 Q 75 20, 85 30 Q 75 50, 65 40 Z" fill="#007F68" />
              <path d="M40 55 Q 20 45, 10 60 Q 25 70, 40 55 Z" fill="#A8D5B5" />
            </svg>
          </div>

          <div className="flex items-center gap-4 text-center md:text-left relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D8E6DA] text-[#007F68] flex items-center justify-center shrink-0 shadow-2xs">
              <Headphones className="w-6 h-6 text-[#007F68]" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold text-[#103342]">
                {t('helpBanner.heading') || "Need help with your child's health journey?"}
              </h3>
              <p className="text-xs sm:text-sm text-[#294B57]">
                {t('helpBanner.description') || 'Get guidance, find answers or connect with your health worker.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 relative z-10 shrink-0">
            <Link
              to="/parent/help"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#FBF8F2] text-[#103342] font-semibold text-xs border border-[#D8E6DA] shadow-2xs hover:shadow-xs transition-all"
            >
              <span>{t('helpBanner.visitHelp') || 'Visit Help Centre'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#294B57]" />
            </Link>

            <Link
              to="/parent/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-xs hover:shadow transition-all"
            >
              <Users className="w-3.5 h-3.5 text-white/90" />
              <span>{t('helpBanner.contactWorker') || 'Contact Your Health Worker'}</span>
            </Link>
          </div>
        </section>
      </main>

      {/* 4. FOOTER */}
      <Footer />
    </div>
  );
}
