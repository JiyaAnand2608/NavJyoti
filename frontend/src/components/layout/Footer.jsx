import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export function Footer() {
  const { lang, t } = useLanguage();

  return (
    <footer className="bg-[#103342] text-white pt-12 pb-8 border-t border-[#005F52]/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10 text-xs">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src="/logo.jpg"
                  alt="NavJyoti"
                  className="w-full h-full object-cover scale-115 object-center"
                />
              </div>
              <div>
                <span className="text-lg font-bold font-serif text-white tracking-tight">
                  NavJyoti
                </span>
                <span className="block text-[10px] text-[#A8D5B5] font-medium">
                  {lang === 'hi' ? 'स्वस्थ बच्चे • उज्ज्वल भविष्य' : 'Healthy Children • Brighter Tomorrows'}
                </span>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11.5px] max-w-sm">
              Dedicated child development & immunisation support platform for children aged 0–5, ensuring continuous healthcare during migration and rural relocation.
            </p>
          </div>

          {/* Quick Support Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A8D5B5] mb-3">Service Channels</h4>
            <ul className="space-y-2 text-slate-300 text-xs">
              <li><Link to="/parent/help" className="hover:text-white transition-colors">Help Centre & FAQs</Link></li>
              <li><Link to="/parent/appointments" className="hover:text-white transition-colors">Contact Village ANM</Link></li>
              <li><Link to="/auth/login" className="hover:text-white transition-colors">Caregiver Login</Link></li>
              <li><Link to="/auth/login" className="hover:text-white transition-colors">Health Worker Portal</Link></li>
            </ul>
          </div>

          {/* Public Health Framework */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4B83F] mb-3">Public Health Alignment</h4>
            <p className="text-[11.5px] text-slate-300 leading-relaxed mb-2">
              Aligned with the Universal Immunisation Programme (UIP), Ministry of Health and Family Welfare (MoHFW), Government of India.
            </p>
            <div className="text-[11.5px] text-[#A8D5B5] font-medium">
              Supporting UN SDG 3 (Good Health & Well-being)
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} NavJyoti. Healthy Children • Brighter Tomorrows.</p>
          <div className="text-[#A8D5B5]/90 text-center md:text-right">
            Healthcare Support Platform — UIP Aligned
          </div>
        </div>
      </div>
    </footer>
  );
}
