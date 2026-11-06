import React from 'react';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { PhoneCall, Heart, MapPin } from 'lucide-react';

export function HelpSupportPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">
      <div>
        <h1 className="text-2xl font-bold text-[#103342] font-serif">Help & Support</h1>
        <p className="text-xs text-[#294B57]">
          UIP guidelines, healthcare helplines, and frontline worker contact channels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 bg-[#DDF0E3] border border-[#A8D5B5] text-[#005F52]">
          <PhoneCall className="w-6 h-6 mb-3 text-[#007F68]" />
          <h3 className="font-bold text-sm text-[#103342]">National Health Helpline</h3>
          <p className="text-xs text-[#294B57] mt-1">Toll-Free 24x7 Child & Mother Health Support</p>
          <div className="text-lg font-bold text-[#007F68] mt-2">1075 / 104</div>
        </Card>

        <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA] text-[#103342]">
          <MapPin className="w-6 h-6 mb-3 text-[#007F68]" />
          <h3 className="font-bold text-sm text-[#103342]">Assigned Primary Health Centre</h3>
          <p className="text-xs text-[#294B57] mt-1">Bilaspur Primary Health Centre (PHC)</p>
          <div className="text-xs font-semibold text-[#007F68] mt-2">ANM Rekha Devi: +91 94123 99887</div>
        </Card>

        <Card className="p-5 bg-[#FDF8EF] border border-[#F4B83F]/50 text-[#103342]">
          <Heart className="w-6 h-6 mb-3 text-[#F4B83F]" />
          <h3 className="font-bold text-sm text-[#103342]">Emergency Childline</h3>
          <p className="text-xs text-[#294B57] mt-1">Emergency protection & rescue assistance</p>
          <div className="text-lg font-bold text-[#B87D14] mt-2">1098</div>
        </Card>
      </div>

      <Card className="bg-[#FBF8F2] border-[#D8E6DA]">
        <CardHeader title="Frequently Asked Immunisation Questions (UIP India)" />
        <CardBody className="p-5 space-y-4 text-xs text-[#294B57]">
          <div>
            <h4 className="font-bold text-[#103342] text-sm">Why is it important to complete all doses on time?</h4>
            <p className="text-[#294B57] mt-1 leading-relaxed">
              Timely immunisation protects infants during the most vulnerable period of life against 12 preventable deadly diseases including Measles, Rubella, Polio, and Tuberculosis.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-[#103342] text-sm">What should I do if my child missed a scheduled dose?</h4>
            <p className="text-[#294B57] mt-1 leading-relaxed">
              Do not worry or restart the schedule from the beginning. Simply visit your nearest Anganwadi centre or Sub-centre on the weekly vaccination day (VHND) to receive the catch-up dose.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-[#103342] text-sm">What if our family relocates to a different village or city?</h4>
            <p className="text-[#294B57] mt-1 leading-relaxed">
              Show your NavJyoti Digital Health Pass QR code to the frontline ANM at your new location. They will immediately see your child's previous dose history and continue care smoothly.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
