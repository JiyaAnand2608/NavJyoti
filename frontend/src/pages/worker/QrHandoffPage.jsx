import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { SimulationBanner } from '../../components/common/SimulationBadge';
import { QrCode, ArrowRight, CheckCircle2, ShieldCheck, MapPin, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function QrHandoffPage() {
  const { childrenList } = useHealthData();
  const [selectedChildId, setSelectedChildId] = useState(childrenList[0]?.id || 'NJ-2024-0412');
  const [simulatedFacility, setSimulatedFacility] = useState('Rampur Sub-Centre (UP)');
  const [handoffStep, setHandoffStep] = useState(1);

  const child = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];
  const qrUrl = `${window.location.origin}/records/lookup/${child?.qrToken || 'demo_token'}`;

  const handleSimulateTransfer = () => {
    setHandoffStep(2);
    setTimeout(() => {
      setSimulatedFacility('Surat Urban Primary Health Centre (Gujarat)');
      setHandoffStep(3);
    }, 1200);
  };

  const handleResetTransfer = () => {
    setSimulatedFacility('Rampur Sub-Centre (UP)');
    setHandoffStep(1);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">
      <div>
        <h1 className="text-2xl font-bold text-[#103342] font-serif">
          Inter-Facility QR Record Handoff Simulator
        </h1>
        <p className="text-xs text-[#294B57]">
          Demonstrate continuous care across state & district borders for seasonal migrant families
        </p>
      </div>

      <SimulationBanner
        title="Cross-Location Demonstration"
        message="Simulates a migrant family moving from Uttar Pradesh to Gujarat. The QR code contains only a random secure token reference (zero personal data in QR), retrieving verified records at the destination facility."
      />

      {/* Select Child Dropdown */}
      <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-[#103342]">Select Child to Generate Handoff Pass:</span>
          <select
            value={selectedChildId}
            onChange={(e) => {
              setSelectedChildId(e.target.value);
              setHandoffStep(1);
              setSimulatedFacility('Rampur Sub-Centre (UP)');
            }}
            className="px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] font-bold"
          >
            {childrenList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.id}) • {c.village} ({c.migrationStatus})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Workflow Steps Indicator */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className={`p-3 rounded-xl border transition-all ${handoffStep >= 1 ? 'bg-[#FBF8F2] border-[#007F68] text-[#103342] font-semibold shadow-xs' : 'bg-[#F0EBE1] border-[#D8E6DA] text-[#294B57]/50'}`}>
          1. Generate / Select QR Pass
        </div>
        <div className={`p-3 rounded-xl border transition-all ${handoffStep === 2 ? 'bg-[#FDF8EF] border-[#F4B83F] text-amber-900 font-semibold animate-pulse shadow-xs' : handoffStep > 2 ? 'bg-[#FBF8F2] border-[#007F68] text-[#103342] font-semibold' : 'bg-[#F0EBE1] border-[#D8E6DA] text-[#294B57]/50'}`}>
          2. Inter-State Relocation
        </div>
        <div className={`p-3 rounded-xl border transition-all ${handoffStep === 3 ? 'bg-[#DDF0E3] border-[#007F68] text-[#005F52] font-semibold shadow-xs' : 'bg-[#F0EBE1] border-[#D8E6DA] text-[#294B57]/50'}`}>
          3. Destination Retrieval
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: QR Display */}
        <div className="md:col-span-5">
          <Card className="p-6 text-center flex flex-col items-center bg-[#FBF8F2] border border-[#D8E6DA]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#294B57]/60 mb-2">
              Non-Sensitive Token Reference
            </span>
            <h3 className="font-bold text-sm text-[#103342] mb-4 font-serif">
              Health Pass: {child?.name}
            </h3>

            <div className="p-4 bg-white rounded-2xl border-2 border-[#D8E6DA] shadow-2xs mb-3">
              <QRCodeSVG
                value={qrUrl}
                size={160}
                bgColor={"#ffffff"}
                fgColor={"#103342"}
                level={"M"}
              />
              <span className="block text-[10px] font-mono text-[#007F68] mt-2 font-bold">
                TOKEN: {child?.qrToken}
              </span>
            </div>

            <div className="text-[11px] text-[#294B57] space-y-1 mb-3">
              <p>Child ID: <strong className="font-mono text-[#103342]">{child?.id}</strong></p>
              <p>Caregiver: <strong className="text-[#103342]">{child?.caregiverName}</strong></p>
            </div>

            <Link
              to={`/records/lookup/${child?.qrToken}`}
              target="_blank"
              className="text-xs font-semibold text-[#007F68] hover:underline inline-flex items-center gap-1"
            >
              <span>Test Public QR Lookup Screen</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </Card>
        </div>

        {/* Right: Simulation Controller & Retrieved Record */}
        <div className="md:col-span-7 space-y-5">
          <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA]">
            <h3 className="font-bold text-sm text-[#103342] mb-3 font-serif">Location & Facility Simulation</h3>
            <div className="p-3.5 rounded-xl bg-[#F0EBE1]/70 border border-[#D8E6DA] text-xs space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[#294B57]">Current Scanning Facility:</span>
                <span className="font-bold text-[#103342]">{simulatedFacility}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#294B57]">Migration Flag:</span>
                <Badge variant="teal">{child?.migrationStatus}</Badge>
              </div>
            </div>

            {handoffStep < 3 ? (
              <button
                onClick={handleSimulateTransfer}
                disabled={handoffStep === 2}
                className="w-full py-2.5 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <span>{handoffStep === 2 ? "Simulating Family Relocation..." : "Simulate Migration to Gujarat & Scan QR"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleResetTransfer}
                className="w-full py-2 rounded-xl bg-[#F0EBE1] hover:bg-[#E5DFD4] text-[#103342] font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-[#D8E6DA]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Simulation to Origin Facility</span>
              </button>
            )}
          </Card>

          {/* Retrieved Record preview */}
          {handoffStep === 3 && (
            <Card className="p-5 border-2 border-[#007F68] bg-[#DDF0E3]/40">
              <div className="flex items-center gap-2 text-[#005F52] font-bold text-sm mb-3">
                <CheckCircle2 className="w-5 h-5 text-[#007F68]" />
                <span className="font-serif">Zero-Loss Record Retrieval at Destination Facility</span>
              </div>
              <div className="space-y-2 text-xs text-[#294B57]">
                <p><strong>Child:</strong> {child?.name} (DOB: {child?.dob}, {child?.ageMonths}m old)</p>
                <p><strong>Previous Administered Vaccines:</strong> {child?.doses?.filter(d => d.status === 'administered').length} doses verified</p>
                <p><strong>Immediate Catch-up Needed:</strong> {child?.doses?.filter(d => d.status !== 'administered').map(d => d.vaccineName).join(', ') || 'Up to date'}</p>
                <p className="text-[11px] text-[#294B57]/80 pt-2 border-t border-[#007F68]/20">
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
