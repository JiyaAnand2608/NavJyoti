import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ParentProfilePage() {
  const { user } = useAuth();
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
    <div className="space-y-6 max-w-4xl mx-auto text-[#294B57]">
      <div>
        <h1 className="text-2xl font-bold text-[#103342] font-serif">Caregiver Profile & Settings</h1>
        <p className="text-xs text-[#294B57]">
          Manage language, linked child details, and account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center font-bold text-lg">
              {user?.name ? user.name[0] : 'C'}
            </div>
            <div>
              <h3 className="font-bold text-[#103342] text-base">{user?.name || "Caregiver"}</h3>
              <p className="text-xs text-[#294B57]">Registered Caregiver • {user?.village || "Rampur"}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-[#294B57] border-t border-[#D8E6DA]/70 pt-3">
            <p><strong>Caregiver ID:</strong> <span className="font-mono text-[#007F68]">{user?.id}</span></p>
            <p><strong>Mobile Number:</strong> {user?.phone || "+91 98765 43210"}</p>
            <p><strong>Assigned PHC:</strong> Bilaspur Primary Health Centre</p>
            <p><strong>State / Region:</strong> Uttar Pradesh (India)</p>
          </div>
        </Card>

        <Card className="p-5 space-y-4 bg-[#FBF8F2] border-[#D8E6DA]">
          <h3 className="font-bold text-sm text-[#103342]">Preferences</h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs">
            <div>
              <span className="font-semibold text-[#103342] block">Interface Language</span>
              <span className="text-[#294B57]">Currently: {lang === 'en' ? 'English' : 'हिन्दी'}</span>
            </div>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#D8E6DA] font-semibold text-xs text-[#103342] hover:bg-[#FBF8F2] cursor-pointer"
            >
              Toggle
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs text-[#294B57] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#103342]">
              <ShieldCheck className="w-4 h-4 text-[#007F68]" />
              <span>Data Storage Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This prototype stores non-sensitive demo session state in browser localStorage. Real-world medical data and cross-device account synchronization will be provided through a dedicated PostgreSQL backend.
            </p>
          </div>
        </Card>
      </div>

      {/* Developer / Demo Testing Area */}
      <div className="mt-8 pt-6 border-t border-[#D8E6DA]">
        <div className="p-4 rounded-2xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs text-[#294B57] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-[#103342] block">Developer & Evaluation Tools</span>
              <span className="text-[11px] text-[#294B57]">
                Reset synthetic children, appointments, and test records to initial factory state
              </span>
            </div>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-[#FDF8EF] text-[#B87D14] border border-[#F4B83F]/50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo State</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteReset}
                  className="px-3 py-1.5 rounded-full bg-[#E57373] text-white font-semibold text-xs hover:bg-[#d45d5d] cursor-pointer"
                >
                  Confirm Full Reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 rounded-full bg-[#D8E6DA] text-[#103342] font-semibold text-xs hover:bg-[#C7E4CD] cursor-pointer"
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
