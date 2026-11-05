import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ShieldCheck, CheckCircle2, ArrowLeft, QrCode, Building } from 'lucide-react';

export function QrLookupPage() {
  const { qrToken } = useParams();
  const { childrenList } = useHealthData();

  // Find child by token or default to first
  const child = childrenList.find((c) => c.qrToken === qrToken) || childrenList[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F2]">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8 my-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#17394A] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>

        <Card className="p-6 sm:p-8 bg-white border-2 border-slate-200">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#EAF5F8] text-[#006B64] flex items-center justify-center font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#006B64]">
                  Verified Digital Resolver
                </span>
                <h1 className="text-xl font-bold text-[#17394A] font-serif">
                  Child Health Record Lookup
                </h1>
              </div>
            </div>
            <Badge variant="upToDate">National UIP Verified</Badge>
          </div>

          <div className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Child Name</span>
                <span className="font-bold text-[#17394A] text-sm">{child?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Unique Child ID</span>
                <span className="font-mono font-bold text-[#17394A]">{child?.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Age / Gender</span>
                <span className="font-semibold">{child?.ageMonths} Months ({child?.gender})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Caregiver</span>
                <span className="font-semibold">{child?.caregiverName}</span>
              </div>
            </div>

            <div className="p-4 bg-[#EAF7F0] rounded-xl border border-[#6bc5b5]/40 text-[#00524c]">
              <div className="flex items-center gap-2 font-bold mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Administered Immunisation Summary</span>
              </div>
              <p className="text-xs">
                Total Doses Verified: <strong>{child?.doses?.filter(d => d.status === 'administered').length} of {child?.doses?.length}</strong>
              </p>
              <div className="mt-2 text-[11px] text-slate-600">
                Authorized for continuity of care at any Government Sub-Centre, PHC, or CHC.
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#17394A] text-white font-semibold text-xs hover:bg-[#0f2632] transition-colors"
              >
                Sign in to Authorized Staff Portal for Full Medical Record
              </Link>
            </div>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
