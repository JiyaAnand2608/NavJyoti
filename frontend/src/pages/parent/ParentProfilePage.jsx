import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { User, Globe, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ParentProfilePage() {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage } = useLanguage();
  const { resetDemoData } = useHealthData();
  const navigate = useNavigate();

  const [confirmReset, setConfirmReset] = useState(false);

  const handleExecuteReset = () => {
    resetDemoData();
    setConfirmReset(false);
    alert("Demo data successfully restored to factory initial state.");
    navigate('/');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#17394A] font-serif">Caregiver Profile & Settings</h1>
        <p className="text-xs text-slate-500">
          Manage language, linked child details, and account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F3EE] text-[#00524c] flex items-center justify-center font-bold text-lg">
              {user?.name ? user.name[0] : 'C'}
            </div>
            <div>
              <h3 className="font-bold text-[#17394A] text-base">{user?.name || "Caregiver"}</h3>
              <p className="text-xs text-slate-500">Registered Caregiver • {user?.village || "Rampur"}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <p><strong>Caregiver ID:</strong> <span className="font-mono">{user?.id}</span></p>
            <p><strong>Mobile Number:</strong> {user?.phone || "+91 98765 43210"}</p>
            <p><strong>Assigned PHC:</strong> Bilaspur Primary Health Centre</p>
            <p><strong>State / Region:</strong> Uttar Pradesh (India)</p>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-bold text-sm text-[#17394A]">Preferences</h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="font-semibold text-[#17394A] block">Interface Language</span>
              <span className="text-slate-500">Currently: {lang === 'en' ? 'English' : 'हिन्दी'}</span>
            </div>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
            >
              Toggle
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#17394A]">
              <ShieldCheck className="w-4 h-4 text-[#00524c]" />
              <span>Data Storage Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This prototype stores non-sensitive demo session state in browser localStorage. Real-world medical data and cross-device account synchronization will be provided through a dedicated PostgreSQL backend.
            </p>
          </div>
        </Card>
      </div>

      {/* Developer / Demo Testing Area (Clearly labelled per Section 4) */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/90 text-xs text-slate-600 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-[#17394A] block">Developer & Evaluation Tools</span>
              <span className="text-[11px] text-slate-500">
                Reset synthetic children, appointments, and test records to initial factory state
              </span>
            </div>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo State</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteReset}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 cursor-pointer"
                >
                  Confirm Full Reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
