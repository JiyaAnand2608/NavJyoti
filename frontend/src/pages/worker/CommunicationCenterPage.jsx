import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { SimulationBadge, SimulationBanner } from '../../components/common/SimulationBadge';
import { Send, CheckCircle2, MessageSquare, Clock, Phone, AlertCircle } from 'lucide-react';

export function CommunicationCenterPage() {
  const { childrenList, communications, sendSimulatedMessage } = useHealthData();
  const [selectedChildId, setSelectedChildId] = useState(childrenList[0]?.id || '');
  const [templateLang, setTemplateLang] = useState('hi');
  const [messageType, setMessageType] = useState('due_soon');
  const [sentNotice, setSentNotice] = useState(false);

  const selectedChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];

  const templates = {
    hi: {
      due_soon: `नमस्ते ${selectedChild?.caregiverName || 'अभिभावक'}, आपके बच्चे ${selectedChild?.name || 'बच्चे'} का अगला नियमित टीका अगले सप्ताह देय है। कृपया बुधवार को रामपुर उप-केंद्र पर VHND सत्र में संपर्क करें। - एएनएम रेखा देवी, नवज्योति`,
      overdue: `महत्वपूर्ण सूचना: ${selectedChild?.caregiverName || 'अभिभावक'}, आपके बच्चे ${selectedChild?.name || 'बच्चे'} की आवश्यक खुराक छूट गई है। पूर्ण बाल स्वास्थ्य सुरक्षा के लिए कृपया आगामी टीकाकरण सत्र में अवश्य आएं। - एएनएम रेखा देवी`,
      general: `नमस्ते ${selectedChild?.caregiverName || 'अभिभावक'}, बुधवार को रामपुर उप-केंद्र पर नियमित बाल स्वास्थ्य एवं पोषण दिवस (VHND) सत्र आयोजित होगा। - एएनएम रेखा देवी`,
    },
    en: {
      due_soon: `Dear ${selectedChild?.caregiverName || 'Parent'}, your child ${selectedChild?.name || 'child'}'s next UIP dose is due next week. Please visit Rampur Sub-Centre on Wednesday for the session. - ANM Rekha Devi, NavJyoti`,
      overdue: `Urgent Reminder: Dear ${selectedChild?.caregiverName || 'Parent'}, child ${selectedChild?.name || 'child'} has an overdue UIP dose. Please visit the clinic to catch up on protected immunisation. - ANM Rekha Devi`,
      general: `Dear ${selectedChild?.caregiverName || 'Parent'}, regular Village Health & Nutrition Day (VHND) will be held this Wednesday at Rampur Sub-Centre. - ANM Rekha Devi`,
    }
  };

  const [messageText, setMessageText] = useState(templates[templateLang][messageType]);

  const handleSelectTemplate = (type) => {
    setMessageType(type);
    setMessageText(templates[templateLang][type]);
  };

  const handleLangToggle = (l) => {
    setTemplateLang(l);
    setMessageText(templates[l][messageType]);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChild) return;

    sendSimulatedMessage({
      recipientName: selectedChild.caregiverName,
      recipientPhone: selectedChild.caregiverPhone,
      childId: selectedChild.id,
      childName: selectedChild.name,
      message: messageText.trim(),
      type: messageType,
    });

    setSentNotice(true);
    setTimeout(() => setSentNotice(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Parent Communication Center
          </h1>
          <p className="text-xs text-[#294B57]">
            Dispatch bilingual SMS reminders, outreach alerts, and view message delivery history
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
          <span>Simulated SMS alert successfully delivered to {selectedChild?.caregiverPhone}! Added to message log.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Caregiver Selector */}
        <div className="md:col-span-5 space-y-4">
          <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
            <h3 className="font-bold text-xs uppercase text-[#294B57]/70 mb-3 tracking-wider">
              Select Caregiver / Family ({childrenList.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {childrenList.map((child) => (
                <div
                  key={child.id}
                  onClick={() => {
                    setSelectedChildId(child.id);
                    setMessageText(templates[templateLang][messageType]);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                    child.id === selectedChildId
                      ? 'bg-[#DDF0E3] border-[#007F68] font-semibold shadow-2xs'
                      : 'bg-white border-[#D8E6DA] hover:bg-[#F0EBE1]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#103342]">{child.caregiverName}</span>
                    {child.priorityLevel === 'red' && <Badge variant="overdue">Overdue</Badge>}
                    {child.priorityLevel === 'amber' && <Badge variant="dueSoon">Due Soon</Badge>}
                  </div>
                  <div className="text-[11px] text-[#294B57] mt-0.5">
                    Child: <strong>{child.name}</strong> • {child.village}
                  </div>
                  <div className="text-[10px] text-[#294B57]/70 font-mono mt-0.5">
                    {child.caregiverPhone}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Message Composition & History */}
        <div className="md:col-span-7 space-y-5">
          <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#103342] font-serif">Compose Alert Message</h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleLangToggle('hi')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    templateLang === 'hi' ? 'bg-[#007F68] text-white font-bold' : 'bg-white border border-[#D8E6DA] text-[#294B57]'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => handleLangToggle('en')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    templateLang === 'en' ? 'bg-[#007F68] text-white font-bold' : 'bg-white border border-[#D8E6DA] text-[#294B57]'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Template Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleSelectTemplate('due_soon')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  messageType === 'due_soon'
                    ? 'bg-[#FDF8EF] border border-[#F4B83F] text-[#B87D14]'
                    : 'bg-white border border-[#D8E6DA] text-[#294B57]'
                }`}
              >
                Upcoming Dose Reminder
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate('overdue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  messageType === 'overdue'
                    ? 'bg-[#FDECEC] border border-[#E57373] text-[#D9534F]'
                    : 'bg-white border border-[#D8E6DA] text-[#294B57]'
                }`}
              >
                Urgent Overdue Catch-up
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate('general')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  messageType === 'general'
                    ? 'bg-[#DDF0E3] border border-[#007F68] text-[#005F52]'
                    : 'bg-white border border-[#D8E6DA] text-[#294B57]'
                }`}
              >
                VHND Announcement
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">
                  Recipient: <span className="font-bold">{selectedChild?.caregiverName}</span> ({selectedChild?.caregiverPhone})
                </label>
                <textarea
                  rows={4}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:ring-2 focus:ring-[#007F68] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#294B57]/70 font-mono">
                  {messageText.length} characters (1 SMS credit simulated)
                </span>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-xs cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Simulated SMS</span>
                </button>
              </div>
            </form>
          </Card>

          {/* Communications History Feed */}
          <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] space-y-3">
            <h3 className="font-bold text-sm text-[#103342] font-serif">
              Recent Communication Dispatches ({communications.length})
            </h3>
            <div className="space-y-2.5 max-h-60 overflow-y-auto text-xs">
              {communications.map((comm) => (
                <div key={comm.id} className="p-3 bg-white rounded-xl border border-[#D8E6DA] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#103342]">
                      To: {comm.recipientName} ({comm.recipientPhone})
                    </span>
                    <Badge variant="teal">{comm.status}</Badge>
                  </div>
                  <p className="text-[11px] text-[#294B57]">{comm.message}</p>
                  <span className="text-[10px] text-[#294B57]/60 font-mono block">
                    Sent via {comm.channel} • {new Date(comm.sentAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
