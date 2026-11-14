import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { PhoneCall, Heart, MapPin, AlertTriangle, Send, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export function HelpSupportPage() {
  const { user } = useAuth();
  const { activeChild, sendSimulatedMessage } = useHealthData();

  // Contact ANM Modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('Dose Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const faqs = [
    {
      q: "Why is it critical to complete all UIP childhood doses on time?",
      a: "Timely immunisation protects infants during the most vulnerable period of life against 12 preventable deadly diseases including Measles, Rubella, Polio, Hepatitis B, and Tuberculosis. Delaying vaccines leaves infants exposed to high-risk community infections."
    },
    {
      q: "What should I do if my child missed a scheduled dose date?",
      a: "Do not restart the vaccination series from the beginning. Simply visit your nearest Anganwadi centre or Sub-centre during the weekly Village Health & Nutrition Day (VHND) on Wednesday to receive the appropriate catch-up dose."
    },
    {
      q: "What if our family relocates to a different village or state?",
      a: "Show your NavJyoti Digital Health Pass QR code to the frontline ANM at your new location. The healthcare provider will immediately access your child's verified dose records and continue care without administering duplicate shots."
    },
    {
      q: "How does NavJyoti milestone tracking relate to medical diagnoses?",
      a: "Milestones in NavJyoti are observational benchmarks intended solely for parental engagement and awareness. They do not constitute clinical evaluations. If you observe persistent developmental differences, consult your Primary Health Centre physician."
    }
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;

    sendSimulatedMessage({
      recipientName: "Rekha Devi (ANM)",
      recipientPhone: "+91 94123 99887",
      childId: activeChild?.id || "NJ-2024-0891",
      childName: activeChild?.name || "Aarav Sharma",
      message: `[${contactSubject}] ${contactMessage.trim()}`,
      type: "inquiry",
    });

    setIsContactModalOpen(false);
    setContactMessage('');
    setFeedback('Simulated message sent to ANM Rekha Devi. In a live system, your frontline worker is alerted.');
    setTimeout(() => setFeedback(''), 4500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">
      <div>
        <h1 className="text-2xl font-bold text-[#103342] font-serif">Help & Healthcare Support</h1>
        <p className="text-xs text-[#294B57]">
          UIP guidelines, healthcare helplines, and frontline worker communication channels
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Emergency Guidance Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block mb-0.5">Medical Emergency Disclaimer:</span>
          <span>
            NavJyoti is an administrative tracking tool and observational support prototype. It is <strong>NOT</strong> an emergency medical response service. In acute life-threatening situations, high fever, or severe pediatric illness, immediately dial <a href="tel:108" className="font-bold underline hover:text-amber-800">108 (Ambulance)</a> or visit your nearest Community Health Centre / Emergency Hospital.
          </span>
        </div>
      </div>

      {/* 3 Support Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 bg-[#DDF0E3] border border-[#A8D5B5] text-[#005F52] flex flex-col justify-between">
          <div>
            <PhoneCall className="w-6 h-6 mb-3 text-[#007F68]" />
            <h3 className="font-bold text-sm text-[#103342]">National Health Helpline</h3>
            <p className="text-xs text-[#294B57] mt-1">Toll-Free 24x7 Mother & Child Health Line</p>
          </div>
          <div className="text-xl font-bold text-[#007F68] mt-3 flex items-center gap-2">
            <a href="tel:1075" className="hover:underline" title="Call 1075">1075</a>
            <span>/</span>
            <a href="tel:104" className="hover:underline" title="Call 104">104</a>
          </div>
        </Card>

        <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA] text-[#103342] flex flex-col justify-between">
          <div>
            <MapPin className="w-6 h-6 mb-3 text-[#007F68]" />
            <h3 className="font-bold text-sm text-[#103342]">Assigned Frontline ANM</h3>
            <p className="text-xs text-[#294B57] mt-1">Rampur Sub-Centre • Sector 1</p>
            <div className="text-xs font-semibold text-[#007F68] mt-1.5">
              ANM Rekha Devi:{' '}
              <a href="tel:+919412399887" className="underline hover:text-[#005F52]" title="Call ANM">
                +91 94123 99887
              </a>
            </div>
            <div className="text-[11px] text-[#294B57] mt-1">
              Support:{' '}
              <a href="mailto:support@navjyoti.gov.in" className="underline hover:text-[#007F68]" title="Email Support">
                support@navjyoti.gov.in
              </a>
            </div>
          </div>
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="mt-3 px-3 py-1.5 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-colors cursor-pointer w-fit"
          >
            Send Inquiry (Demo)
          </button>
        </Card>

        <Card className="p-5 bg-[#FDF8EF] border border-[#F4B83F]/50 text-[#103342] flex flex-col justify-between">
          <div>
            <Heart className="w-6 h-6 mb-3 text-[#F4B83F]" />
            <h3 className="font-bold text-sm text-[#103342]">Emergency Childline</h3>
            <p className="text-xs text-[#294B57] mt-1">Nationwide child protection & rescue assistance</p>
          </div>
          <div className="text-xl font-bold text-[#B87D14] mt-3">
            <a href="tel:1098" className="hover:underline" title="Call Emergency Childline">
              1098
            </a>
          </div>
        </Card>
      </div>

      {/* FAQ Accordion */}
      <Card className="bg-[#FBF8F2] border-[#D8E6DA] overflow-hidden">
        <CardHeader
          title="Frequently Asked Child Health & Immunisation Questions"
          subtitle="Universal Immunisation Programme (UIP) India Guidelines"
        />
        <div className="divide-y divide-[#D8E6DA]/70 text-xs text-[#294B57]">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="p-4">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  className="w-full text-left font-bold text-sm text-[#103342] flex items-center justify-between cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#007F68]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <p className="text-[#294B57] mt-2 leading-relaxed text-xs pt-1 border-t border-slate-100">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Contact ANM Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Contact Assigned ANM (Rekha Devi)"
        subtitle="Simulated caregiver inquiry to frontline worker"
      >
        <form onSubmit={handleSendMessage} className="space-y-4 text-xs text-[#294B57]">
          <div className="p-3 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs">
            <strong>Simulation Channel:</strong> Messages sent here are logged in the health worker's communication center for demonstration.
          </div>

          <div>
            <label className="block font-semibold text-[#103342] mb-1">Subject</label>
            <select
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            >
              <option value="Dose Inquiry">Dose Schedule Inquiry</option>
              <option value="VHND Session Timing">VHND Session Timings</option>
              <option value="Home Visit Request">Home Visit Query</option>
              <option value="Milestone Concern">Milestone Observation Question</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#103342] mb-1">Message</label>
            <textarea
              rows={3}
              required
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="e.g. Namaste Rekha ji, will the MR-1 dose be given this Wednesday at Rampur Sub-Centre?"
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:ring-2 focus:ring-[#007F68]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
