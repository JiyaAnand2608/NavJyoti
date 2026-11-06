import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { SimulationBadge, SimulationBanner } from '../../components/common/SimulationBadge';
import { Send, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Parent Communication Center
          </h1>
          <p className="text-xs text-[#294B57]">
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
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68]" />
          <span>Simulated SMS alert successfully delivered to {selectedChild?.caregiverPhone}!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Child Selector */}
        <div className="md:col-span-4 space-y-4">
          <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
            <h3 className="font-bold text-xs uppercase text-[#294B57]/70 mb-3 tracking-wider">Select Caregiver</h3>
            <div className="space-y-2">
              {childrenList.map((child) => (
                <div
                  key={child.id}
                  onClick={() => {
                    setSelectedChildId(child.id);
                    setMessageText(templates[templateLang].dueSoon);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                    child.id === selectedChildId ? 'bg-[#DDF0E3] border-[#007F68] font-semibold' : 'bg-white border-[#D8E6DA] hover:bg-[#F0EBE1]'
                  }`}
                >
                  <div className="font-bold text-[#103342]">{child.caregiverName}</div>
                  <div className="text-[11px] text-[#294B57]">Child: {child.name} • {child.caregiverPhone}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Message Composition */}
        <div className="md:col-span-8">
          <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#103342]">Compose Alert</h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setTemplateLang('hi');
                    setMessageText(templates.hi.dueSoon);
                  }}
                  className={`px-3 py-1 rounded-full ${templateLang === 'hi' ? 'bg-[#103342] text-white' : 'bg-white text-[#294B57] border border-[#D8E6DA]'}`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTemplateLang('en');
                    setMessageText(templates.en.dueSoon);
                  }}
                  className={`px-3 py-1 rounded-full ${templateLang === 'en' ? 'bg-[#103342] text-white' : 'bg-white text-[#294B57] border border-[#D8E6DA]'}`}
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
                className="px-3 py-1.5 rounded-full bg-[#FDF8EF] border border-[#F4B83F]/50 text-[#B87D14] text-xs font-medium cursor-pointer hover:bg-amber-100"
              >
                Template: Due Soon Notice
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate('overdue')}
                className="px-3 py-1.5 rounded-full bg-[#FDECEC] border border-[#E57373]/50 text-[#D9534F] text-xs font-medium cursor-pointer hover:bg-red-100"
              >
                Template: Overdue Catch-up Alert
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">
                  Message Content (Sent to {selectedChild?.caregiverPhone})
                </label>
                <textarea
                  rows={5}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
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
