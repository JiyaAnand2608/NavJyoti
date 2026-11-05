import React from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Bell, Clock, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';

export function RemindersPage() {
  const { notifications, activeChild } = useHealthData();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17394A] font-serif">
            Notifications & Reminders
          </h1>
          <p className="text-xs text-slate-500">
            Dose due dates, frontline worker visits, and developmental checkpoints
          </p>
        </div>
        <Badge variant="teal">{notifications.length} Active Alerts</Badge>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <Card key={notif.id} className="p-4 hover:border-slate-300 transition-colors">
            <div className="flex items-start gap-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                notif.type === 'due_soon' ? 'bg-[#fef7e8] text-[#dc9a23]' :
                notif.type === 'appointment' ? 'bg-[#EAF5F8] text-[#17394A]' :
                'bg-[#EAF7F0] text-[#00524c]'
              }`}>
                {notif.type === 'due_soon' ? <Clock className="w-5 h-5" /> :
                 notif.type === 'appointment' ? <Calendar className="w-5 h-5" /> :
                 <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#17394A]">{notif.title}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                    Child: {activeChild?.name || 'Aarav'}
                  </span>
                  <span className="text-[10px] text-[#006B64] font-semibold">UIP Aligned Notification</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
