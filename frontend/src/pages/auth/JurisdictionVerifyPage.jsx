import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SimulationBadge, SimulationBanner } from '../../components/common/SimulationBadge';
import { CheckCircle2, ArrowRight, UserCheck } from 'lucide-react';

export function JurisdictionVerifyPage() {
  const { loginWithDemo } = useAuth();
  const navigate = useNavigate();

  const [workerId, setWorkerId] = useState('ANM-UP-BLS-4019');
  const [phc, setPhc] = useState('Bilaspur Primary Health Centre');
  const [subCentre, setSubCentre] = useState('Rampur Sub-Centre');
  const [verified, setVerified] = useState(false);

  const handleVerify = (e) => {
    e.preventDefault();
    setVerified(true);
  };

  const handleProceed = () => {
    loginWithDemo('worker');
    navigate('/worker/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-[#294B57]">
      <div className="max-w-xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 overflow-hidden border border-[#D8E6DA] flex items-center justify-center">
            <img src="/logo.jpg" alt="NavJyoti" className="w-full h-full object-cover scale-115 object-center" />
          </div>
          <div>
            <span className="font-bold text-lg font-serif text-[#103342]">NavJyoti</span>
            <span className="block text-[9px] text-[#007F68] font-semibold uppercase">
              Worker Authority Check
            </span>
          </div>
        </Link>
        <SimulationBadge label="Simulated Verification" />
      </div>

      <div className="max-w-xl mx-auto w-full my-auto py-6">
        <div className="bg-[#FBF8F2] rounded-3xl border border-[#D8E6DA] p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#103342] text-[#F4B83F] flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#103342] font-serif">
                Health Worker Jurisdiction Verification
              </h1>
              <p className="text-xs text-[#294B57]">
                Frontline staff credential check for UIP administration rights
              </p>
            </div>
          </div>

          <SimulationBanner
            title="Demonstration Feature: Simulated Staff Verification"
            message="In a production deployment, this step validates ANM/ASHA credentials against the state health registry. In this demo, verification is simulated locally."
          />

          {!verified ? (
            <form onSubmit={handleVerify} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">
                  National / State Health Worker ID
                </label>
                <input
                  type="text"
                  required
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white font-mono text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#103342] mb-1">Primary Health Centre (PHC)</label>
                <select
                  value={phc}
                  onChange={(e) => setPhc(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                >
                  <option value="Bilaspur Primary Health Centre">Bilaspur Primary Health Centre</option>
                  <option value="Sadar Community Health Centre">Sadar Community Health Centre</option>
                  <option value="Ratanpur Primary Health Centre">Ratanpur Primary Health Centre</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#103342] mb-1">Assigned Sub-Centre</label>
                <select
                  value={subCentre}
                  onChange={(e) => setSubCentre(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                >
                  <option value="Rampur Sub-Centre">Rampur Sub-Centre (Sector 1)</option>
                  <option value="Kalyanpur Sub-Centre">Kalyanpur Sub-Centre (Sector 2)</option>
                  <option value="Shivpur Sub-Centre">Shivpur Sub-Centre (Sector 3)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer mt-2 shadow-xs"
              >
                Validate Health Worker Credentials
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs">
                <div className="flex items-center gap-2 text-[#005F52] font-bold text-sm mb-2">
                  <CheckCircle2 className="w-5 h-5 text-[#007F68]" />
                  <span>Jurisdiction Confirmed & Authorised</span>
                </div>
                <div className="space-y-1 text-[#294B57] pt-2 border-t border-[#A8D5B5]/50">
                  <p><strong>Worker:</strong> Rekha Devi (ANM)</p>
                  <p><strong>Assigned Sub-Centre:</strong> {subCentre}</p>
                  <p><strong>Covered Villages:</strong> Rampur, Kalyanpur, Shivpur</p>
                  <p><strong>UIP Administration Rights:</strong> Authorized for UIP Doses 0–5 Yrs</p>
                </div>
              </div>

              <button
                onClick={handleProceed}
                className="w-full py-3 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Launch Health Worker Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-[11px] text-[#294B57]/70 py-2">
        NavJyoti Healthcare Platform • Healthy Children, Brighter Tomorrows
      </div>
    </div>
  );
}
