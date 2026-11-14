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
      <header className="sticky top-0 z-40 w-full bg-[#F5F1E9] border-b border-[#D8E6DA]/70 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Official NavJyoti Logo & Brand */}
          <Link to={isAuthenticated ? dashboardPath : "/"} className="flex items-center gap-3.5 group" title={isAuthenticated ? "Go to Dashboard" : "NavJyoti Home"}>
            {/* Logo container with 15-20% increased visible symbol scale & CSS crop */}
            <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl overflow-hidden bg-white flex items-center justify-center p-0.5 shadow-xs border border-[#D8E6DA] shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/logo.jpg"
                alt="NavJyoti Logo"
                className="w-full h-full object-cover scale-115 object-center"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#103342] font-serif leading-tight">
                NavJyoti
              </span>
              <span className="block text-[10.5px] sm:text-[11px] tracking-wide text-[#294B57] font-medium leading-snug">
                {lang === 'hi' ? 'स्वस्थ बच्चे • उज्ज्वल भविष्य' : 'Healthy Children • Brighter Tomorrows'}
              </span>
            </div>
          </Link>

          {/* Right Navigation Desktop */}
          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#103342]">
            <Link
              to="/"
              className={`hover:text-[#007F68] transition-colors relative py-1 ${
                isHome
                  ? 'text-[#007F68] font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#007F68] after:rounded-full'
                  : 'text-[#294B57]'
              }`}
            >
              {t('nav.home') || 'Home'}
            </Link>

            <Link
              to="/parent/help"
              className="hover:text-[#007F68] text-[#294B57] transition-colors py-1"
            >
              {t('nav.help') || 'Help'}
            </Link>

            <button
              onClick={() => setAboutModalOpen(true)}
              className="hover:text-[#007F68] text-[#294B57] transition-colors py-1 cursor-pointer font-semibold"
            >
              {t('nav.about') || 'About NavJyoti'}
            </button>

            {/* Language Switcher Pill (EN | हिंदी) */}
            <div className="flex items-center rounded-full bg-[#EAE5DC]/80 p-0.5 border border-[#D8E6DA]">
              <button
                onClick={() => lang !== 'en' && toggleLanguage()}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-[#103342] shadow-xs'
                    : 'text-[#294B57] hover:text-[#103342]'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => lang !== 'hi' && toggleLanguage()}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-white text-[#103342] shadow-xs'
                    : 'text-[#294B57] hover:text-[#103342]'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Login or My Dashboard Pill Button */}
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#007F68] text-white hover:bg-[#005F52] transition-all shadow-xs font-semibold"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#F4B83F]" />
                <span>{t('nav.myDashboard') || 'My Dashboard'}</span>
              </Link>
            ) : (
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#007F68] text-white hover:bg-[#005F52] transition-all shadow-xs font-semibold"
              >
                <User className="w-3.5 h-3.5 text-white/90" />
                <span>{t('nav.login') || 'Login'}</span>
              </Link>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex md:hidden items-center gap-2.5">
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-full bg-white border border-[#D8E6DA] text-xs font-bold text-[#103342]"
            >
              {lang === 'en' ? 'हिंदी' : 'EN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#103342] hover:bg-[#EAE5DC]/60"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#D8E6DA] bg-[#F5F1E9] px-5 pt-3 pb-6 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-xs font-semibold text-[#103342] hover:text-[#007F68]"
            >
              {t('nav.home') || 'Home'}
            </Link>
            <Link
              to="/parent/help"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-xs font-semibold text-[#294B57] hover:text-[#007F68]"
            >
              {t('nav.help') || 'Help'}
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setAboutModalOpen(true);
              }}
              className="block py-2 text-xs font-semibold text-[#294B57] hover:text-[#007F68] text-left w-full cursor-pointer"
            >
              {t('nav.about') || 'About NavJyoti'}
            </button>
            <div className="pt-2 border-t border-[#D8E6DA]">
              <Link
                to={isAuthenticated ? dashboardPath : "/auth/login"}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full bg-[#007F68] text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isAuthenticated ? (t('nav.myDashboard') || "My Dashboard") : (t('nav.login') || "Login")}</span>
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
        <div className="space-y-4 text-xs text-[#294B57] leading-relaxed">
          <p>
            NavJyoti is an early-childhood digital healthcare support platform designed to prevent missed immunisations, fragmented records, and delayed developmental monitoring among children aged 0–5 years, particularly for migrant, rural, and underserved families.
          </p>

          <div className="p-3.5 rounded-2xl bg-[#DDF0E3]/70 border border-[#D8E6DA] text-[#103342] space-y-1">
            <span className="font-bold block text-[#005F52]">Public Health Framework:</span>
            <span>
              Aligned with the Universal Immunisation Programme (UIP), Ministry of Health and Family Welfare (MoHFW), Government of India, supporting frontline ASHA and ANM healthcare workers.
            </span>
          </div>

          <div className="space-y-1 text-[#294B57]">
            <span className="font-bold text-[#103342] block">Target UN Sustainable Development Goals:</span>
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
