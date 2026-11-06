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
    <div className="min-h-screen flex flex-col bg-[#F5F1E9] w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8 my-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#294B57] hover:text-[#007F68] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>

        <Card className="p-6 sm:p-8 bg-[#FBF8F2] border border-[#D8E6DA] shadow-xs">
          <div className="flex items-start justify-between border-b border-[#D8E6DA] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center font-bold shadow-2xs">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#007F68]">
                  Verified Digital Resolver
                </span>
                <h1 className="text-xl font-bold text-[#103342] font-serif">
                  Child Health Record Lookup
                </h1>
              </div>
            </div>
            <Badge variant="upToDate">National UIP Verified</Badge>
          </div>

          <div className="space-y-4 text-xs text-[#294B57]">
            <div className="grid grid-cols-2 gap-3 p-4 bg-[#F0EBE1]/70 rounded-xl border border-[#D8E6DA]">
              <div>
                <span className="text-[#294B57]/60 block text-[10px] uppercase font-semibold">Child Name</span>
                <span className="font-bold text-[#103342] text-sm font-serif">{child?.name}</span>
              </div>
              <div>
                <span className="text-[#294B57]/60 block text-[10px] uppercase font-semibold">Unique Child ID</span>
                <span className="font-mono font-bold text-[#103342]">{child?.id}</span>
              </div>
              <div>
                <span className="text-[#294B57]/60 block text-[10px] uppercase font-semibold">Age / Gender</span>
                <span className="font-semibold text-[#103342]">{child?.ageMonths} Months ({child?.gender})</span>
              </div>
              <div>
                <span className="text-[#294B57]/60 block text-[10px] uppercase font-semibold">Caregiver</span>
                <span className="font-semibold text-[#103342]">{child?.caregiverName}</span>
              </div>
            </div>

            <div className="p-4 bg-[#DDF0E3]/70 rounded-xl border border-[#A8D5B5] text-[#005F52]">
              <div className="flex items-center gap-2 font-bold mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#007F68]" />
                <span className="font-serif">Administered Immunisation Summary</span>
              </div>
              <p className="text-xs text-[#294B57]">
                Total Doses Verified: <strong className="text-[#005F52]">{child?.doses?.filter(d => d.status === 'administered').length} of {child?.doses?.length}</strong>
              </p>
              <div className="mt-2 text-[11px] text-[#294B57]/80">
                Authorized for continuity of care at any Government Sub-Centre, PHC, or CHC.
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-colors shadow-xs"
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
