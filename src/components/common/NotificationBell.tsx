import React, { useState } from 'react';
import { Bell, Check, Trash2, X, AlertCircle, Info, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationBell: React.FC = () => {
  const { isolatedNotifications, markNotificationAsRead, clearNotifications, activeEvent } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = isolatedNotifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        title="Real-Time Attendee Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-slate-900">
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-900">Real-Time Attendee Alerts</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-mono text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isolatedNotifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-[11px] text-slate-500 hover:text-slate-700"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isolatedNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active notifications for {activeEvent.title.split(' ')[0]}.
              </div>
            ) : (
              isolatedNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationAsRead(n.id)}
                  className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${
                    !n.read ? 'bg-slate-50/70 font-medium' : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {n.type === 'urgent' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        )}
                        <h5 className="font-semibold text-slate-900 text-xs">{n.title}</h5>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
