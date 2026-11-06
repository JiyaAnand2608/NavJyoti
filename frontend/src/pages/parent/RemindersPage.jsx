import React from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';

export function RemindersPage() {
  const { notifications, activeChild } = useHealthData();

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-[#294B57]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Notifications & Reminders
          </h1>
          <p className="text-xs text-[#294B57]">
            Dose due dates, frontline worker visits, and developmental checkpoints
          </p>
        </div>
        <Badge variant="teal">{notifications.length} Active Alerts</Badge>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <Card key={notif.id} className="p-4 bg-[#FBF8F2] border-[#D8E6DA] hover:border-[#007F68]/40 transition-colors">
            <div className="flex items-start gap-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                notif.type === 'due_soon' ? 'bg-[#FDF8EF] text-[#B87D14]' :
                notif.type === 'appointment' ? 'bg-[#DDF0E3] text-[#103342]' :
                'bg-[#DDF0E3] text-[#007F68]'
              }`}>
                {notif.type === 'due_soon' ? <Clock className="w-5 h-5" /> :
                 notif.type === 'appointment' ? <Calendar className="w-5 h-5" /> :
                 <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#103342]">{notif.title}</h3>
                  <span className="text-[10px] text-[#294B57]/70 font-mono">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-[#294B57] mt-1 leading-relaxed">{notif.message}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[10px] bg-[#F0EBE1] text-[#103342] px-2 py-0.5 rounded-md font-mono border border-[#D8E6DA]">
                    Child: {activeChild?.name || 'Aarav'}
                  </span>
                  <span className="text-[10px] text-[#007F68] font-semibold">UIP Aligned Notification</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
