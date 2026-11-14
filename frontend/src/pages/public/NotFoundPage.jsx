import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, LayoutDashboard, HelpCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

export function NotFoundPage() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = role === 'worker' ? '/worker/dashboard' : '/parent/dashboard';

  return (
    <div className="min-h-screen bg-[#F5F1E9] text-[#294B57] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 overflow-hidden border border-[#D8E6DA] shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <img src="/logo.jpg" alt="NavJyoti" className="w-full h-full object-cover scale-115 object-center" />
          </div>
          <div>
            <span className="font-bold text-lg font-serif text-[#103342]">NavJyoti</span>
            <span className="block text-[9.5px] text-[#007F68] font-semibold uppercase tracking-wider">
              Child Health Support
            </span>
          </div>
        </Link>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#D8E6DA] text-xs font-semibold text-[#103342] hover:bg-[#F0EBE1] transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>
      </header>

      {/* Main 404 Centerpiece */}
      <main className="max-w-xl mx-auto w-full my-auto py-12 text-center">
        <div className="p-8 sm:p-10 rounded-3xl bg-white/90 border border-[#D8E6DA] shadow-sm backdrop-blur-xs space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#DDF0E3] border border-[#A8D5B5] flex items-center justify-center mx-auto text-[#007F68]">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#F0EBE1] border border-[#D8E6DA] text-[11px] font-bold text-[#005F52] uppercase tracking-wider font-mono">
              Error 404 • Resource Not Found
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#103342] font-serif tracking-tight">
              Page Not Found
            </h1>
            <p className="text-xs sm:text-sm text-[#294B57] leading-relaxed max-w-md mx-auto pt-1">
              The page you are looking for doesn't exist, has been relocated, or is temporarily unavailable. Let's guide you back to your child health resources.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-[#F4B83F]" />
              <span>Return to Home</span>
            </Link>

            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white border border-[#007F68] text-[#007F68] hover:bg-[#DDF0E3]/60 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>My Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white border border-[#D8E6DA] text-[#103342] hover:bg-[#F0EBE1] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-[#007F68]" />
                <span>Portal Login</span>
              </Link>
            )}

            <Link
              to="/parent/help"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#F0EBE1] hover:bg-[#EAE5DC] text-[#294B57] text-xs font-semibold border border-[#D8E6DA] transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#294B57]" />
              <span>Help & FAQs</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-[#294B57]/70 py-4 border-t border-[#D8E6DA]/70">
        <p>© {new Date().getFullYear()} NavJyoti. Dedicated Child Development & Universal Immunisation Programme Support.</p>
      </footer>
    </div>
  );
}
