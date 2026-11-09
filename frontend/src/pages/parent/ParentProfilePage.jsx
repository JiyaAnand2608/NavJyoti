import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { RotateCcw, ShieldCheck, Edit2, LogOut, CheckCircle2, User, Phone, MapPin, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ParentProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { lang, setLang, toggleLanguage } = useLanguage();
  const { resetDemoData } = useHealthData();
  const navigate = useNavigate();

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [village, setVillage] = useState(user?.village || 'Rampur');
  const [feedback, setFeedback] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      village,
    });

    setIsEditing(false);
    setFeedback('Profile details saved successfully.');
    setTimeout(() => setFeedback(''), 3500);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleExecuteReset = () => {
    resetDemoData();
    setConfirmReset(false);
    alert("Demo data successfully restored to factory initial state.");
    navigate('/');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-[#294B57]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">Caregiver Profile & Settings</h1>
          <p className="text-xs text-[#294B57]">
            Manage language, contact information, linked child details, and account preferences
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Caregiver Identity Card */}
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center font-bold text-lg">
                  {user?.name ? user.name[0] : 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-[#103342] text-base font-serif">{user?.name || "Caregiver"}</h3>
                  <p className="text-xs text-[#294B57]">Registered Caregiver • {user?.village || "Rampur"}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setName(user?.name || '');
                  setPhone(user?.phone || '');
                  setVillage(user?.village || 'Rampur');
                  setIsEditing(true);
                }}
                className="p-2 rounded-xl bg-white border border-[#D8E6DA] hover:bg-[#F0EBE1] text-[#007F68] transition-colors"
                title="Edit Profile"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#294B57] border-t border-[#D8E6DA]/70 pt-3">
              <p><strong>Caregiver ID:</strong> <span className="font-mono text-[#007F68]">{user?.id}</span></p>
              <p><strong>Mobile Number:</strong> {user?.phone || "+91 98765 43210"}</p>
              <p><strong>Village / Ward:</strong> {user?.village || "Rampur"}</p>
              <p><strong>Assigned PHC:</strong> Bilaspur Primary Health Centre</p>
              <p><strong>State / Region:</strong> Uttar Pradesh (India)</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D8E6DA]/70 text-[11px] text-[#294B57]/70">
            Account verified for child health tracking
          </div>
        </Card>

        {/* Preferences & Language */}
        <Card className="p-5 space-y-4 bg-[#FBF8F2] border-[#D8E6DA]">
          <h3 className="font-bold text-sm text-[#103342] font-serif">Preferences & Localisation</h3>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs">
            <div>
              <span className="font-semibold text-[#103342] block">Interface Language</span>
              <span className="text-[#294B57]">Currently: {lang === 'en' ? 'English' : 'हिन्दी (Hindi)'}</span>
            </div>
            <button
              onClick={toggleLanguage}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-[#D8E6DA] font-semibold text-xs text-[#007F68] hover:bg-[#FBF8F2] cursor-pointer shadow-2xs"
            >
              Toggle (EN / हिंदी)
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs text-[#294B57] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#103342]">
              <ShieldCheck className="w-4 h-4 text-[#007F68]" />
              <span>Data Architecture Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This prototype stores non-sensitive demo session state in browser localStorage. Real-world medical data and cross-device account synchronization will be provided through a dedicated PostgreSQL backend.
            </p>
          </div>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit Caregiver Profile"
        subtitle="Update contact and location information"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs text-[#294B57]">
          <div>
            <label className="block font-semibold text-[#103342] mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#103342] mb-1">Mobile Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#103342] mb-1">Village / Ward</label>
            <select
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            >
              <option value="Rampur">Rampur</option>
              <option value="Kalyanpur">Kalyanpur</option>
              <option value="Shivpur">Shivpur</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] cursor-pointer shadow-xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Developer / Demo Reset */}
      <div className="mt-8 pt-6 border-t border-[#D8E6DA]">
        <div className="p-4 rounded-2xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs text-[#294B57] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-[#103342] block">Prototype Evaluation & Reset</span>
              <span className="text-[11px] text-[#294B57]">
                Restore all synthetic children, appointments, and test records to initial factory baseline.
              </span>
            </div>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FDF8EF] text-[#B87D14] border border-[#F4B83F]/50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo State</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExecuteReset}
                  className="px-3 py-1.5 rounded-full bg-red-600 text-white font-semibold text-xs hover:bg-red-700 cursor-pointer shadow-2xs"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 rounded-full bg-white text-slate-600 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
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
