import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { User, LayoutDashboard, Menu, X, ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal';

export function Navbar() {
  const { lang, toggleLanguage, t } = useLanguage();
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dashboardPath = role === 'worker' ? '/worker/dashboard' : '/parent/dashboard';
  const isHome = location.pathname === '/';

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Official NavJyoti Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-white flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
              <img src="/logo.jpg" alt="NavJyoti Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-[#17394A] flex items-center gap-1 font-serif">
                NavJyoti
              </span>
              <span className="block text-[10px] tracking-wide text-slate-500 font-medium">
                Healthy Children • Brighter Tomorrows
              </span>
            </div>
          </Link>

          {/* Right Navigation Desktop */}
          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#17394A]">
            <Link
              to="/"
              className={`hover:text-[#006B64] transition-colors relative py-1 ${
                isHome ? 'text-[#006B64] font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#006B64] after:rounded-full' : ''
              }`}
            >
              Home
            </Link>

            <Link
              to="/parent/help"
              className="hover:text-[#006B64] transition-colors py-1"
            >
              Help
            </Link>

            <button
              onClick={() => setAboutModalOpen(true)}
              className="hover:text-[#006B64] transition-colors py-1 cursor-pointer"
            >
              About NavJyoti
            </button>

            {/* Language Switcher Pill (EN | हिंदी) */}
            <div className="flex items-center rounded-full bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => lang !== 'en' && toggleLanguage()}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-white text-[#17394A] shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => lang !== 'hi' && toggleLanguage()}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'hi' ? 'bg-white text-[#17394A] shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Login or My Dashboard Pill Button */}
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#006B64] text-white hover:bg-[#00544e] transition-all shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#F5C45E]" />
                <span>My Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#006B64] text-white hover:bg-[#00544e] transition-all shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-white/90" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-[#17394A]"
            >
              {lang === 'en' ? 'हिंदी' : 'EN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-5 pt-3 pb-6 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-xs font-semibold text-slate-700 hover:text-[#006B64]"
            >
              Home
            </Link>
            <Link
              to="/parent/help"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-xs font-semibold text-slate-700 hover:text-[#006B64]"
            >
              Help Centre
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setAboutModalOpen(true);
              }}
              className="block py-2 text-xs font-semibold text-slate-700 hover:text-[#006B64] text-left w-full"
            >
              About NavJyoti
            </button>
            <div className="pt-2 border-t border-slate-100">
              <Link
                to={isAuthenticated ? dashboardPath : "/auth/login"}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full bg-[#006B64] text-white text-xs font-bold inline-flex items-center justify-center gap-2"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isAuthenticated ? "My Dashboard" : "Login"}</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* About NavJyoti Modal */}
      <Modal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        title="About NavJyoti"
        subtitle="National Digital Child Health & Immunisation Support"
      >
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>
            NavJyoti is an early-childhood digital healthcare support platform designed to prevent missed immunisations, fragmented records, and delayed developmental monitoring among children aged 0–5 years, particularly for migrant, rural, and underserved families.
          </p>

          <div className="p-3.5 rounded-2xl bg-[#DCEFE5]/60 border border-[#DCEFE5] text-[#17394A] space-y-1">
            <span className="font-bold block">Public Health Framework:</span>
            <span>
              Aligned with the Universal Immunisation Programme (UIP), Ministry of Health and Family Welfare (MoHFW), Government of India, supporting frontline ASHA and ANM healthcare workers.
            </span>
          </div>

          <div className="space-y-1 text-slate-600">
            <span className="font-bold text-[#17394A] block">Target UN Sustainable Development Goals:</span>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>SDG 3:</strong> Good Health & Well-being</li>
              <li><strong>SDG 10:</strong> Reduced Inequalities (Migrant continuity of care)</li>
              <li><strong>SDG 4:</strong> Quality Education & Awareness (Early developmental milestones)</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
}
