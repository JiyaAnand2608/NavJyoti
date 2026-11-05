import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { SimulationBadge, SimulationBanner } from '../../components/common/SimulationBadge';
import { MessageSquare, Send, CheckCircle2, Phone, Baby } from 'lucide-react';

export function CommunicationCenterPage() {
  const { childrenList } = useHealthData();
  const [selectedChildId, setSelectedChildId] = useState(childrenList[0]?.id || '');
  const [templateLang, setTemplateLang] = useState('hi');
  const [sentNotice, setSentNotice] = useState(false);

  const selectedChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];

  const templates = {
    hi: {
      dueSoon: `नमस्ते ${selectedChild?.caregiverName || 'अभिभावक'}, आपके बच्चे ${selectedChild?.name || 'बच्चे'} का अगला नियमित टीका अगले सप्ताह देय है। कृपया बुधवार को निकटतम उप-केंद्र या आंगनवाड़ी केंद्र पर संपर्क करें। - एएनएम रेखा देवी, नवज्योति`,
      overdue: `महत्वपूर्ण सूचना: ${selectedChild?.caregiverName || 'अभिभावक'}, आपके बच्चे ${selectedChild?.name || 'बच्चे'} की आवश्यक खुराक छूट गई है। बाल स्वास्थ्य सुरक्षा के लिए कृपया आगामी टीकाकरण सत्र में अवश्य आएं। - एएनएम रेखा देवी`,
    },
    en: {
      dueSoon: `Dear ${selectedChild?.caregiverName || 'Parent'}, your child ${selectedChild?.name || 'child'}'s next UIP dose is due next week. Please visit Rampur Sub-Centre on Wednesday for the session. - ANM Rekha Devi, NavJyoti`,
      overdue: `Urgent Reminder: Dear ${selectedChild?.caregiverName || 'Parent'}, child ${selectedChild?.name || 'child'} has an overdue UIP dose. Please visit the clinic to catch up on protected immunisation. - ANM Rekha Devi`,
    }
  };

  const [messageText, setMessageText] = useState(templates.hi.dueSoon);

  const handleSelectTemplate = (type) => {
    setMessageText(templates[templateLang][type]);
  };

  const handleSend = (e) => {
    e.preventDefault();
    setSentNotice(true);
    setTimeout(() => setSentNotice(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17394A] font-serif">
            Parent Communication Center
          </h1>
          <p className="text-xs text-slate-500">
            Send bilingual SMS/WhatsApp immunisation reminders and follow-up alerts
          </p>
        </div>
        <SimulationBadge label="Simulated SMS Dispatch" />
      </div>

      <SimulationBanner
        title="Simulated Communication Gateway"
        message="This demonstration simulates SMS delivery to caregiver mobile devices. No real SMS charges or external telecom gateways are triggered."
      />

      {sentNotice && (
        <div className="p-3.5 rounded-xl bg-[#EAF7F0] border border-[#6bc5b5]/40 text-xs text-[#00524c] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Simulated SMS alert successfully delivered to {selectedChild?.caregiverPhone}!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Child Selector */}
        <div className="md:col-span-4 space-y-4">
          <Card className="p-4">
            <h3 className="font-bold text-xs uppercase text-slate-400 mb-3 tracking-wider">Select Caregiver</h3>
            <div className="space-y-2">
              {childrenList.map((child) => (
                <div
                  key={child.id}
                  onClick={() => {
                    setSelectedChildId(child.id);
                    setMessageText(templates[templateLang].dueSoon);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                    child.id === selectedChildId ? 'bg-[#EAF5F8] border-[#006B64] font-semibold' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-[#17394A]">{child.caregiverName}</div>
                  <div className="text-[11px] text-slate-500">Child: {child.name} • {child.caregiverPhone}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Message Composition */}
        <div className="md:col-span-8">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#17394A]">Compose Alert</h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setTemplateLang('hi');
                    setMessageText(templates.hi.dueSoon);
                  }}
                  className={`px-2.5 py-1 rounded-lg ${templateLang === 'hi' ? 'bg-[#17394A] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTemplateLang('en');
                    setMessageText(templates.en.dueSoon);
                  }}
                  className={`px-2.5 py-1 rounded-lg ${templateLang === 'en' ? 'bg-[#17394A] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleSelectTemplate('dueSoon')}
                className="px-3 py-1.5 rounded-lg bg-[#fef7e8] border border-[#fbe09e] text-amber-900 text-xs font-medium cursor-pointer"
              >
                Template: Due Soon Notice
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate('overdue')}
                className="px-3 py-1.5 rounded-lg bg-[#fdf2f2] border border-[#ECA4A2]/60 text-[#d87e7b] text-xs font-medium cursor-pointer"
              >
                Template: Overdue Catch-up Alert
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Message Content (Sent to {selectedChild?.caregiverPhone})
                </label>
                <textarea
                  rows={5}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#006B64]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#006B64] text-white font-semibold text-xs hover:bg-[#00524c] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Simulated SMS Alert</span>
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
