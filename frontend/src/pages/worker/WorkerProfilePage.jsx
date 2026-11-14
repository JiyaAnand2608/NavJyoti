import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { SimulationBadge } from '../../components/common/SimulationBadge';
import { Modal } from '../../components/common/Modal';
import { UserCheck, Building, ShieldCheck, MapPin, Award, LogOut, Edit2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function WorkerProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'Rekha Devi');
  const [phone, setPhone] = useState(user?.phone || '+91 94123 99887');
  const [workerType, setWorkerType] = useState(user?.workerType || 'ANM (Auxiliary Nurse Midwife)');
  const [feedback, setFeedback] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      workerType,
    });
    setIsEditing(false);
    setFeedback('Health worker profile updated.');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-[#294B57]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Health Worker Credentials & Jurisdiction
          </h1>
          <p className="text-xs text-[#294B57]">
            Authorized frontline provider profile and assigned public health jurisdiction
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SimulationBadge label="Verified Credentials" />
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68]" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#103342] text-[#F4B83F] flex items-center justify-center font-bold text-lg shadow-xs">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#103342] text-base font-serif">{user?.name || "Rekha Devi"}</h3>
                  <p className="text-xs text-[#007F68] font-semibold">{user?.workerType || "ANM (Auxiliary Nurse Midwife)"}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setName(user?.name || 'Rekha Devi');
                  setPhone(user?.phone || '+91 94123 99887');
                  setWorkerType(user?.workerType || 'ANM (Auxiliary Nurse Midwife)');
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-lg bg-white border border-[#D8E6DA] hover:bg-[#F0EBE1] text-[#007F68]"
                title="Edit Details"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#294B57] border-t border-[#D8E6DA] pt-3">
              <p><strong>Worker ID:</strong> <span className="font-mono font-bold text-[#103342]">{user?.workerId || "ANM-UP-BLS-4019"}</span></p>
              <p>
                <strong>Official Mobile:</strong>{' '}
                <a
                  href={`tel:${(user?.phone || '+91 94123 99887').replace(/\s+/g, '')}`}
                  className="underline hover:text-[#007F68] font-mono"
                  title="Call Official Mobile"
                >
                  {user?.phone || '+91 94123 99887'}
                </a>
              </p>
              <p>
                <strong>Support Desk:</strong>{' '}
                <a
                  href="mailto:support@navjyoti.gov.in"
                  className="underline hover:text-[#007F68]"
                  title="Email Support Desk"
                >
                  support@navjyoti.gov.in
                </a>
              </p>
              <p><strong>Designation:</strong> Primary Healthcare Frontline Vaccinator</p>
              <p><strong>Session Duty:</strong> Weekly Wednesday VHND Lead</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D8E6DA]/70 text-[11px] text-[#294B57]/70">
            Authorization: National UIP Schedule Administering Officer
          </div>
        </Card>

        <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA]">
          <h3 className="font-bold text-sm text-[#103342] mb-3 flex items-center gap-2 font-serif">
            <Building className="w-4 h-4 text-[#007F68]" />
            <span>Assigned Jurisdiction</span>
          </h3>
          <div className="space-y-2 text-xs text-[#294B57]">
            <p><strong>Sub-Centre:</strong> Rampur Sub-Centre (Sector 1)</p>
            <p><strong>Primary Health Centre (PHC):</strong> Bilaspur Sadar PHC</p>
            <p><strong>Block & District:</strong> Bilaspur Sadar, Uttar Pradesh</p>
            <p><strong>Assigned Villages:</strong> Rampur, Kalyanpur, Shivpur</p>
            <p><strong>Cohort Size:</strong> ~4,850 Population (0–5 Cohort)</p>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-[11px] text-[#294B57]">
            <ShieldCheck className="w-4 h-4 text-[#007F68] inline mr-1 -mt-0.5" />
            <span>Simulated frontline credentials verified against state MoHFW master roster.</span>
          </div>
        </Card>
      </div>

      {/* Edit Worker Modal */}
      {isEditing && (
        <Modal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          title="Edit Worker Profile"
          subtitle="Update frontline contact details"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs text-[#294B57]">
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
              <label className="block font-semibold text-[#103342] mb-1">Official Mobile</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Worker Designation</label>
              <select
                value={workerType}
                onChange={(e) => setWorkerType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              >
                <option value="ANM (Auxiliary Nurse Midwife)">ANM (Auxiliary Nurse Midwife)</option>
                <option value="ASHA Facilitator">ASHA Facilitator</option>
                <option value="Anganwadi Worker">Anganwadi Worker</option>
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
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
