import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Download, Printer, ShieldCheck, CheckCircle2, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';

export function DigitalHealthRecordsPage() {
  const { activeChild } = useHealthData();
  const [downloadNotice, setDownloadNotice] = useState(false);
  const [activeTab, setActiveTab] = useState('pass'); // 'pass' | 'growth' | 'visits'

  if (!activeChild) return null;

  const qrUrl = `${window.location.origin}/records/lookup/${activeChild.qrToken || 'demo_token'}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate simple structured text summary for download demo
    const summary = `NAVJYOTI DIGITAL CHILD HEALTH PASS
----------------------------------------
Child Name: ${activeChild.name}
Child ID: ${activeChild.id}
DOB: ${activeChild.dob} (${activeChild.ageMonths} Months)
Gender: ${activeChild.gender}
Blood Group: ${activeChild.bloodGroup || 'B+'}
Caregiver: ${activeChild.caregiverName} (${activeChild.caregiverPhone})
Village: ${activeChild.village}
Sub-Centre: ${activeChild.subCentre}
PHC: ${activeChild.phc}

UIP IMMUNISATION DOSES:
${activeChild.doses?.map(d => `- ${d.vaccineName}: ${d.status.toUpperCase()} ${d.dateAdministered ? `(${d.dateAdministered})` : ''}`).join('\n')}

GROWTH MEASUREMENTS:
${activeChild.growthRecords?.map(g => `- Age ${g.ageMonths}m: ${g.weightKg} kg, ${g.heightCm} cm`).join('\n') || 'None recorded'}

Generated from NavJyoti Healthcare Platform (Simulated Record)`;

    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `navjyoti_health_pass_${activeChild.id}.txt`;
    a.click();

    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 3000);
  };

  const administeredDoses = activeChild.doses?.filter(d => d.status === 'administered') || [];
  const growthRecords = activeChild.growthRecords || [];
  const visitHistory = activeChild.visitHistory || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Digital Child Health Pass
          </h1>
          <p className="text-xs text-[#294B57]">
            Portable, non-sensitive health record pass for {activeChild.name} (ID: {activeChild.id})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FBF8F2] border border-[#D8E6DA] text-xs font-semibold text-[#103342] hover:bg-white transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#007F68]" />
            <span>Download Summary</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass</span>
          </button>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68]" />
          <span>Demo Health Pass Summary successfully exported for {activeChild.name}!</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D8E6DA] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pass')}
          className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'pass'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Digital Pass & QR
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'growth'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Growth Trajectory ({growthRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'visits'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Recorded Visits ({visitHistory.length})
        </button>
      </div>

      {activeTab === 'pass' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Printable ID Card */}
          <div className="md:col-span-7">
            <Card className="p-6 bg-[#FBF8F2] border-2 border-[#D8E6DA]">
              <div className="flex items-start justify-between border-b border-[#D8E6DA] pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white p-0.5 overflow-hidden border border-[#D8E6DA] flex items-center justify-center">
                    <img src="/logo.jpg" alt="NavJyoti" className="w-full h-full object-cover scale-115 object-center" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#103342] font-serif">NavJyoti Health Pass</h3>
                    <span className="text-[10px] uppercase tracking-wider text-[#007F68] font-bold block">
                      Ministry of Health & Family Welfare Aligned
                    </span>
                  </div>
                </div>
                <Badge variant="upToDate">Verified Record</Badge>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-white rounded-xl border border-[#D8E6DA]">
                  <div>
                    <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Child Full Name</span>
                    <span className="font-bold text-[#103342] text-sm font-serif">{activeChild.name}</span>
                  </div>
                  <div>
                    <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Child Unique ID</span>
                    <span className="font-mono font-bold text-[#007F68]">{activeChild.id}</span>
                  </div>
                  <div>
                    <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Date of Birth / Age</span>
                    <span className="font-semibold text-[#103342]">{activeChild.dob} ({activeChild.ageMonths} Months)</span>
                  </div>
                  <div>
                    <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Blood Group & Gender</span>
                    <span className="font-semibold text-[#103342]">{activeChild.bloodGroup || 'B+'} • {activeChild.gender}</span>
                  </div>
                  <div>
                    <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Caregiver</span>
                    <span className="font-semibold text-[#103342]">{activeChild.caregiverName}</span>
                  </div>
                  <div>
                    <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Caregiver Phone</span>
                    <span className="font-semibold text-[#103342]">{activeChild.caregiverPhone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 bg-white rounded-xl border border-[#D8E6DA]">
                  <div>
                    <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Assigned Village</span>
                    <span className="font-semibold text-[#103342]">{activeChild.village}</span>
                  </div>
                  <div>
                    <span className="text-[#294B57]/70 block text-[10px] uppercase font-semibold">Sub-Centre / PHC</span>
                    <span className="font-semibold text-[#103342]">{activeChild.subCentre}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#DDF0E3] rounded-xl border border-[#A8D5B5] text-[#005F52]">
                  <div className="flex justify-between font-bold mb-1">
                    <span>Universal Immunisation Coverage:</span>
                    <span>{administeredDoses.length} of {activeChild.doses?.length} UIP Doses</span>
                  </div>
                  <div className="text-[11px] text-[#294B57]">
                    Last Verified Dose: {administeredDoses[administeredDoses.length - 1]?.vaccineName || 'BCG'} on {administeredDoses[administeredDoses.length - 1]?.dateAdministered || activeChild.dob}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: QR Code Security Box */}
          <div className="md:col-span-5">
            <Card className="p-6 bg-[#FBF8F2] border border-[#D8E6DA] text-center flex flex-col items-center justify-between h-full">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#294B57]/70">
                  Non-Sensitive QR Reference
                </span>
                <h3 className="text-base font-bold text-[#103342] font-serif">Emergency Inter-Facility Scan</h3>
                <p className="text-xs text-[#294B57] max-w-xs mx-auto">
                  Contains only a non-sensitive token reference that opens the child's record safely across different state health centres.
                </p>
              </div>

              <div className="p-4 my-6 bg-white rounded-2xl border-2 border-[#D8E6DA] shadow-xs inline-block">
                <QRCodeSVG
                  value={qrUrl}
                  size={160}
                  bgColor={"#ffffff"}
                  fgColor={"#103342"}
                  level={"M"}
                  includeMargin={false}
                />
                <span className="block text-[10px] font-mono text-[#007F68] mt-2 font-bold">
                  TOKEN: {activeChild.qrToken}
                </span>
              </div>

              <div className="w-full text-xs text-[#294B57] bg-[#F0EBE1] p-3 rounded-xl border border-[#D8E6DA]">
                <ShieldCheck className="w-4 h-4 text-[#007F68] inline mr-1 -mt-0.5" />
                <span>Zero sensitive health data encoded in QR matrix.</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'growth' && (
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-[#103342] font-serif">
                Physical Growth Measurements
              </h3>
              <p className="text-xs text-[#294B57]">
                Weight, length/height, and head circumference recorded at health visits
              </p>
            </div>
            <div className="text-xs font-semibold text-[#007F68] bg-[#DDF0E3] px-3 py-1 rounded-full">
              Birth Weight: {activeChild.birthWeightKg || 3.1} kg
            </div>
          </div>

          {growthRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#294B57]">No growth records logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Age</th>
                    <th className="py-2.5 px-3">Weight (kg)</th>
                    <th className="py-2.5 px-3">Height (cm)</th>
                    <th className="py-2.5 px-3">Head Circ. (cm)</th>
                    <th className="py-2.5 px-3">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/70 text-[#294B57]">
                  {growthRecords.map((g) => (
                    <tr key={g.id} className="hover:bg-white/60">
                      <td className="py-3 px-3 font-mono font-semibold text-[#103342]">{g.date}</td>
                      <td className="py-3 px-3">{g.ageMonths} Months</td>
                      <td className="py-3 px-3 font-bold text-[#007F68]">{g.weightKg} kg</td>
                      <td className="py-3 px-3">{g.heightCm} cm</td>
                      <td className="py-3 px-3">{g.headCircumferenceCm} cm</td>
                      <td className="py-3 px-3 text-[#294B57]/80">{g.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'visits' && (
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
          <h3 className="font-bold text-sm text-[#103342] font-serif mb-4">
            Recorded Clinical & Home Visits
          </h3>
          {visitHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#294B57]">No clinical visits recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {visitHistory.map((vh) => (
                <div key={vh.id} className="p-4 rounded-xl bg-white border border-[#D8E6DA] flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-[#103342]">{vh.visitType}</h4>
                      <span className="font-mono text-[10px] text-[#294B57]/70">{vh.date}</span>
                    </div>
                    <p className="text-[#294B57] mt-1">{vh.notes}</p>
                    <span className="text-[10px] text-[#007F68] font-semibold block mt-1.5">
                      Attending Provider: {vh.provider}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
