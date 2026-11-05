import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#17394A] text-white pt-12 pb-8 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10 text-xs">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white p-1">
                <img src="/logo.jpg" alt="NavJyoti" className="w-full h-full object-contain" />
              </div>
              <span className="text-base font-bold font-serif">
                Nav<span className="text-[#F5C45E]">Jyoti</span>
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Child Development & Immunisation Support platform dedicated to children aged 0–5, ensuring continuous healthcare during migration and rural relocation.
            </p>
          </div>

          {/* Quick Support Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#00524c] mb-3">Service Channels</h4>
            <ul className="space-y-2 text-slate-300 text-xs">
              <li><Link to="/parent/help" className="hover:text-white transition-colors">Help Centre & FAQs</Link></li>
              <li><Link to="/parent/help" className="hover:text-white transition-colors">Contact Village ANM</Link></li>
              <li><Link to="/auth/login" className="hover:text-white transition-colors">Caregiver Login</Link></li>
              <li><Link to="/auth/login" className="hover:text-white transition-colors">Health Worker Portal</Link></li>
            </ul>
          </div>

          {/* Public Health Framework */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5C45E] mb-3">Public Health Alignment</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
              Aligned with the Universal Immunisation Programme (UIP), Ministry of Health and Family Welfare (MoHFW), Government of India.
            </p>
            <div className="text-[11px] text-[#00524c] font-medium">
              Supporting UN SDG 3 (Good Health & Well-being)
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} NavJyoti. Healthy Children • Brighter Tomorrows.</p>
          <div className="text-amber-200/80 text-center md:text-right">
            Healthcare Support Prototype — Not a diagnostic medical device.
          </div>
        </div>
      </div>
    </footer>
  );
}
