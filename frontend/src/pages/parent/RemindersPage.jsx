import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Clock, Calendar, CheckCircle2, CheckCheck, Trash2, BellRing, Filter } from 'lucide-react';

export function RemindersPage() {
  const { notifications, activeChild, markNotificationAsRead, markAllNotificationsAsRead, dismissNotification } = useHealthData();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread'

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifs = notifications.filter((n) => {
    if (filterType === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-[#294B57]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Notifications & Health Reminders
          </h1>
          <p className="text-xs text-[#294B57]">
            Dose due dates, frontline ANM visits, and developmental checkpoints
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#D8E6DA] text-xs font-semibold text-[#007F68] hover:bg-[#F0EBE1] transition-colors cursor-pointer shadow-2xs"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
          <Badge variant="teal">{unreadCount} Unread Alerts</Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#FBF8F2] border border-[#D8E6DA] rounded-xl text-xs font-medium w-fit">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            filterType === 'all' ? 'bg-[#103342] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('unread')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            filterType === 'unread' ? 'bg-[#007F68] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification Cards */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#294B57] bg-[#FBF8F2] rounded-2xl border border-[#D8E6DA]">
            No reminders in this view.
          </div>
        ) : (
          filteredNotifs.map((notif) => (
            <Card
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`p-4 transition-all cursor-pointer border ${
                !notif.read
                  ? 'bg-white border-[#007F68] shadow-xs'
                  : 'bg-[#FBF8F2] border-[#D8E6DA] hover:border-[#007F68]/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3.5">
                <div className="flex items-start gap-3.5 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.type === 'due_soon'
                        ? 'bg-[#FDF8EF] text-[#B87D14]'
                        : notif.type === 'appointment'
                        ? 'bg-[#DDF0E3] text-[#103342]'
                        : 'bg-[#DDF0E3] text-[#007F68]'
                    }`}
                  >
                    {notif.type === 'due_soon' ? (
                      <Clock className="w-5 h-5" />
                    ) : notif.type === 'appointment' ? (
                      <Calendar className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#103342] font-serif">{notif.title}</h3>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#007F68]" title="Unread" />
                      )}
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

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] text-[#294B57]/60 font-mono">{notif.timestamp}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notif.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
