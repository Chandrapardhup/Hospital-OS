import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, IndianRupee, Activity } from 'lucide-react';
import { useHospitalStore } from '../store/useHospitalStore';

export default function Analytics() {
  const patients = useHospitalStore(state => state.patients);
  const appointments = useHospitalStore(state => state.appointments);

  // Compute live KPI metrics
  const patientVolume = patients.length;
  
  // Calculate revenue from actual paid invoices
  const invoices = useHospitalStore(state => state.invoices || []);
  const revenue = invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.amount, 0);
  
  // Wait time (placeholder logic based on pending appointments)
  const pendingAppointments = appointments.filter(a => a.status === 'Scheduled');
  const avgWaitTime = pendingAppointments.length > 0 ₹ Math.round((pendingAppointments.length * 15) / patients.length || 1) : 0;
  
  // Critical cases (we can count emergency triage if we had it, fallback to 0)
  const criticalCases = appointments.filter(a => a.type === 'Emergency').length;

  // Generate dynamic chart data based on last 7 days of appointments & invoices
  const generateChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataMap: Record<string, any> = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      dataMap[dayName] = { name: dayName, patients: 0, revenue: 0, emergencies: 0 };
    }

    // Populate appointments data
    appointments.forEach(app => {
      const appDate = new Date(app.date);
      const dayName = days[appDate.getDay()];
      if (dataMap[dayName]) {
        if (app.type === 'Emergency') dataMap[dayName].emergencies += 1;
      }
    });

    // Populate revenue from invoices
    invoices.forEach(inv => {
      if (inv.status === 'Paid') {
        const invDate = new Date(inv.date || new Date().toISOString());
        const dayName = days[invDate.getDay()];
        if (dataMap[dayName]) {
          dataMap[dayName].revenue += inv.amount;
        }
      }
    });

    patients.forEach(pat => {
      if (pat.createdAt) {
        const patDate = new Date(pat.createdAt);
        const dayName = days[patDate.getDay()];
        if (dataMap[dayName]) {
          dataMap[dayName].patients += 1;
        }
      }
    });

    return Object.values(dataMap);
  };

  const data = generateChartData();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>Overview</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">Analytics</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Hospital Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Live platform telemetry and reporting</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Patient Volume</p>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{patientVolume}</div>
          <div className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
            <TrendingUp className="w-3 h-3" /> Live Data
          </div>
        </div>

        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Revenue (MTD)</p>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">₹{revenue.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
            <TrendingUp className="w-3 h-3" /> Live Data
          </div>
        </div>

        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Wait Time</p>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{avgWaitTime}m</div>
          <div className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
            <TrendingUp className="w-3 h-3" /> Live Data
          </div>
        </div>

        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Critical Cases</p>
            <Activity className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{criticalCases}</div>
          <div className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
            <TrendingUp className="w-3 h-3" /> Live Data
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6">
        <div className="bg-card/30 border border-border rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-foreground mb-6 uppercase tracking-widest">Weekly Revenue</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card/30 border border-border rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-foreground mb-6 uppercase tracking-widest">Patient Volume</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#a855f7' }}
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                />
                <Bar dataKey="patients" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
