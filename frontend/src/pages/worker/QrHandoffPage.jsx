import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { SimulationBanner } from '../../components/common/SimulationBadge';
import { QrCode, ArrowRight, CheckCircle2, ShieldCheck, MapPin, RefreshCw } from 'lucide-react';

export function QrHandoffPage() {
  const { childrenList } = useHealthData();
  const [selectedChildId, setSelectedChildId] = useState('NJ-2024-0412'); // Ananya Verma (migrant_in)
  const [simulatedFacility, setSimulatedFacility] = useState('Rampur Sub-Centre (UP)');
  const [handoffStep, setHandoffStep] = useState(1);

  const child = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];
  const qrUrl = `${window.location.origin}/records/lookup/${child?.qrToken || 'demo_token'}`;

  const handleSimulateTransfer = () => {
    setHandoffStep(2);
    setTimeout(() => {
      setSimulatedFacility('Surat Urban Primary Health Centre (Gujarat)');
      setHandoffStep(3);
    }, 1500);
  };

  const handleResetTransfer = () => {
    setSimulatedFacility('Rampur Sub-Centre (UP)');
    setHandoffStep(1);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#17394A] font-serif">
          Inter-Facility QR Record Handoff Simulator
        </h1>
        <p className="text-xs text-slate-500">
          Demonstrate continuous care across state & district borders for seasonal migrant families
        </p>
      </div>

      <SimulationBanner
        title="Cross-Location Demonstration"
        message="Simulates a migrant family moving from Uttar Pradesh to Gujarat. The QR code contains only a random secure token reference (zero personal data in QR), retrieving verified records at the destination facility."
      />

      {/* Workflow Steps Indicator */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className={`p-3 rounded-xl border ${handoffStep >= 1 ? 'bg-white border-[#006B64] text-[#17394A] font-semibold' : 'bg-slate-100 text-slate-400'}`}>
          1. Generate / Select QR Pass
        </div>
        <div className={`p-3 rounded-xl border ${handoffStep === 2 ? 'bg-[#fef7e8] border-[#F5C45E] text-amber-900 font-semibold animate-pulse' : handoffStep > 2 ? 'bg-white border-[#006B64] text-[#17394A] font-semibold' : 'bg-slate-100 text-slate-400'}`}>
          2. Inter-State Relocation
        </div>
        <div className={`p-3 rounded-xl border ${handoffStep === 3 ? 'bg-[#EAF7F0] border-[#006B64] text-[#00524c] font-semibold' : 'bg-slate-100 text-slate-400'}`}>
          3. Destination Retrieval
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: QR Display */}
        <div className="md:col-span-5">
          <Card className="p-6 text-center flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
              Non-Sensitive Token Reference
            </span>
            <h3 className="font-bold text-sm text-[#17394A] mb-4">
              Health Pass: {child?.name}
            </h3>

            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-2xs mb-3">
              <QRCodeSVG
                value={qrUrl}
                size={160}
                bgColor={"#ffffff"}
                fgColor={"#17394A"}
                level={"M"}
              />
              <span className="block text-[10px] font-mono text-slate-400 mt-2">
                TOKEN: {child?.qrToken}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <p>Child ID: <strong className="font-mono">{child?.id}</strong></p>
              <p>Caregiver: <strong>{child?.caregiverName}</strong></p>
            </div>
          </Card>
        </div>

        {/* Right: Simulation Controller & Retried Record */}
        <div className="md:col-span-7 space-y-5">
          <Card className="p-5">
            <h3 className="font-bold text-sm text-[#17394A] mb-3">Location & Facility Simulation</h3>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Current Scanning Facility:</span>
                <span className="font-bold text-[#17394A]">{simulatedFacility}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Migration Flag:</span>
                <Badge variant="teal">{child?.migrationStatus}</Badge>
              </div>
            </div>

            {handoffStep < 3 ? (
              <button
                onClick={handleSimulateTransfer}
                disabled={handoffStep === 2}
                className="w-full py-2.5 rounded-xl bg-[#006B64] text-white font-semibold text-xs hover:bg-[#00524c] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <span>{handoffStep === 2 ? "Simulating Family Relocation..." : "Simulate Migration to Gujarat & Scan QR"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleResetTransfer}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Simulation to Origin</span>
              </button>
            )}
          </Card>

          {/* Retrieved Record preview */}
          {handoffStep === 3 && (
            <Card className="p-5 border-2 border-[#006B64] bg-[#EAF7F0]/40">
              <div className="flex items-center gap-2 text-[#00524c] font-bold text-sm mb-3">
                <CheckCircle2 className="w-5 h-5" />
                <span>Zero-Loss Record Retrieval at Destination Facility</span>
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                <p><strong>Child:</strong> {child?.name} ({child?.dob})</p>
                <p><strong>Previous Administered Vaccines:</strong> {child?.doses?.filter(d => d.status === 'administered').length} doses verified</p>
                <p><strong>Immediate Catch-up Needed:</strong> {child?.doses?.filter(d => d.status !== 'administered').map(d => d.vaccineName).join(', ') || 'Up to date'}</p>
                <p className="text-[11px] text-slate-500 pt-2 border-t border-[#006B64]/30">
                  New ANM at Surat Urban PHC can immediately proceed with scheduled vaccines without duplicate shots.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
