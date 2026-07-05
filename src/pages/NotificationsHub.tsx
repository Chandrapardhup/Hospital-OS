import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { useHospitalStore } from '../store/useHospitalStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../translations';

export default function NotificationsHub() {
  const { t } = useTranslation();
  const notifications = useHospitalStore(state => state.notifications);
  const markNotificationRead = useHospitalStore(state => state.markNotificationRead);
  const user = useAuthStore(state => state.user);
  const patients = useHospitalStore(state => state.patients);
  
  const currentPatientId = patients.find(p => p.email === user?.email)?.id;

  // Filter notifications for this user or global notifications
  const userNotifications = notifications.filter(n => n.userId === user?.id || n.userId === currentPatientId || n.userId === 'global');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>System</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">Inbox</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Notifications Hub</h1>
            <p className="text-sm text-muted-foreground mt-1">Your recent alerts and messages</p>
          </div>
          {userNotifications.some(n => !n.isRead) && (
            <button 
              onClick={() => {
                userNotifications.forEach(n => {
                  if (!n.isRead) markNotificationRead(n.id);
                });
              }}
              className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 font-medium rounded-xl transition-colors text-sm"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {userNotifications.length === 0 ? (
          <div className="text-center py-20 bg-card/20 rounded-2xl border border-border border-dashed">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground mb-2">You're all caught up!</h3>
            <p className="text-muted-foreground text-sm">No new notifications at this time.</p>
          </div>
        ) : (
          userNotifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                notif.isRead 
                  ? 'bg-card/20 border-border/30 opacity-70' 
                  : 'bg-card/60 border-border/80 shadow-lg shadow-black/20'
              }`}
            >
              <div className={`mt-1 p-2 rounded-full ${
                notif.type === 'error' ? 'bg-red-500/20 text-red-500' :
                notif.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                notif.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                'bg-blue-500/20 text-blue-500'
              }`}>
                {notif.type === 'error' && <ShieldAlert className="w-5 h-5" />}
                {notif.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                {notif.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {notif.type === 'info' && <Info className="w-5 h-5" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className={`font-bold ${notif.isRead ? 'text-foreground/80' : 'text-foreground'}`}>{notif.title}</h4>
                    <p className={`text-sm mt-1 ${notif.isRead ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>{notif.message}</p>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                
                {!notif.isRead && (
                  <button 
                    onClick={() => markNotificationRead(notif.id)}
                    className="mt-3 text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
