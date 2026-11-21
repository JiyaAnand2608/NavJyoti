import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Clock,
  Calendar,
  CheckCircle2,
  CheckCheck,
  Trash2,
  BellRing,
  Filter,
  Syringe,
  AlertCircle,
  Mail,
  Smartphone,
  Info,
  ShieldAlert
} from 'lucide-react';

export function RemindersPage() {
  const {
    notifications = [],
    activeChild,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification
  } = useHealthData();

  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'vaccination' | 'appointment' | 'followup'

  // Notification Preferences UI State (Display only, explicitly labeled unavailable for persistence)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifs = notifications.filter((notif) => {
    if (filterType === 'unread' && notif.read) return false;

    if (categoryFilter === 'vaccination') {
      return (
        notif.type === 'due_soon' ||
        notif.type === 'reminder' ||
        notif.title?.toLowerCase().includes('vaccin') ||
        notif.message?.toLowerCase().includes('dose')
      );
    }
    if (categoryFilter === 'appointment') {
      return (
        notif.type === 'appointment' ||
        notif.title?.toLowerCase().includes('appoint') ||
        notif.message?.toLowerCase().includes('session')
      );
    }
    if (categoryFilter === 'followup') {
      return (
        notif.type === 'followup' ||
        notif.title?.toLowerCase().includes('follow') ||
        notif.message?.toLowerCase().includes('check')
      );
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-[#294B57]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Notifications & Health Reminders
          </h1>
          <p className="text-xs text-[#294B57] mt-0.5">
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
          <Badge variant={unreadCount > 0 ? 'teal' : 'default'}>
            {unreadCount} Unread Alert{unreadCount === 1 ? '' : 's'}
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FBF8F2] border border-[#D8E6DA] rounded-2xl text-xs">
        {/* Read / Unread */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#D8E6DA] rounded-xl font-medium">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#103342] text-white font-semibold'
                : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'unread'
                ? 'bg-[#007F68] text-white font-semibold'
                : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#294B57]/70 font-semibold mr-1">Category:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'vaccination', label: 'Vaccines Due' },
            { id: 'appointment', label: 'Appointments' },
            { id: 'followup', label: 'Follow-ups' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-[#007F68] border-[#007F68] text-white font-semibold'
                  : 'bg-white border-[#D8E6DA] text-[#294B57] hover:bg-[#F0EBE1]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Cards */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#294B57] bg-[#FBF8F2] rounded-2xl border border-[#D8E6DA] space-y-2">
            <BellRing className="w-8 h-8 text-[#007F68]/40 mx-auto" />
            <p className="font-semibold text-sm text-[#103342]">No notifications found</p>
            <p className="text-[11px] text-[#294B57]/70">
              {filterType === 'unread'
                ? 'You have caught up with all reminders! Switch filter to view previous alerts.'
                : 'No alerts matching the selected category.'}
            </p>
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
                      notif.type === 'due_soon' || notif.type === 'reminder'
                        ? 'bg-[#FDF8EF] text-[#B87D14]'
                        : notif.type === 'appointment'
                        ? 'bg-[#DDF0E3] text-[#103342]'
                        : 'bg-[#DDF0E3] text-[#007F68]'
                    }`}
                  >
                    {notif.type === 'due_soon' || notif.type === 'reminder' ? (
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
                        Child: {activeChild?.name || 'Linked Child'}
                      </span>
                      <span className="text-[10px] text-[#007F68] font-semibold">
                        UIP Aligned Notification
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] text-[#294B57]/60 font-mono">
                    {notif.timestamp || notif.created_at?.slice(0, 10) || 'Recent'}
                  </span>
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

      {/* Reminder Preferences & Backend Availability Notice */}
      <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8E6DA] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#103342] font-serif">
              Alert Delivery Preferences
            </h3>
            <p className="text-xs text-[#294B57]">
              Configure preferred communication channels for immunization due date reminders
            </p>
          </div>
          <Badge variant="default">System Default</Badge>
        </div>

        {/* Required Disclaimer: Do NOT fake saving preferences when backend does not support it */}
        <div className="p-3.5 rounded-xl bg-[#FDF8EF] border border-[#F4B83F]/60 text-xs text-[#103342] flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#B87D14]" />
          <div>
            <p className="font-semibold text-[#B87D14]">Server Preference Synchronization Notice:</p>
            <p className="text-[11px] text-[#294B57] mt-0.5 leading-relaxed">
              In-app notifications are automatically synchronized from your child's vaccination registry. Custom external SMS and Email preference persistence is currently unavailable on the backend server. All active reminders remain viewable directly within this portal.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D8E6DA] opacity-80">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#007F68]" />
              <div>
                <span className="font-semibold text-[#103342] block">Email Vaccination Digest</span>
                <span className="text-[11px] text-[#294B57]/70">Receive dose reminders 7 days prior to scheduled VHND</span>
              </div>
            </div>
            <input
              type="checkbox"
              disabled
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 text-[#007F68] rounded border-[#D8E6DA] cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D8E6DA] opacity-80">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-[#007F68]" />
              <div>
                <span className="font-semibold text-[#103342] block">SMS Alert Gateway</span>
                <span className="text-[11px] text-[#294B57]/70">Send urgent catch-up notifications to caregiver phone</span>
              </div>
            </div>
            <input
              type="checkbox"
              disabled
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 text-[#007F68] rounded border-[#D8E6DA] cursor-not-allowed"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
