import React, { useState } from 'react';
import { Users, AlertTriangle, TestTube, Pill, Calendar, Clock, Activity, CalendarPlus, Search, CreditCard, CheckCircle, QrCode } from 'lucide-react';
import { NewPatientVisitModal } from '../../components/reception/NewPatientVisitModal';
import { AppointmentCheckInModal } from '../../components/reception/AppointmentCheckInModal';
import { QRScannerModal } from '../../components/reception/QRScannerModal';
import { useTranslation } from '../../translations';
import { useHospitalStore } from '../../store/useHospitalStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function ReceptionDashboard() {
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [callingId, setCallingId] = useState<string | null>(null);
  const [callLogs, setCallLogs] = useState<Record<string, any>>({});
  
  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await supabase.from('call_logs').select('*');
        if (data) {
          const logsMap: Record<string, any> = {};
          data.forEach(log => {
            if (!logsMap[log.appointment_id] || new Date(log.created_at) > new Date(logsMap[log.appointment_id].created_at)) {
              logsMap[log.appointment_id] = log;
            }
          });
          setCallLogs(logsMap);
        }
      } catch (e) {
        // Table might not exist yet
      }
    };
    fetchLogs();
  }, [callingId]);
  
  const patients = useHospitalStore(state => state.patients);
  const appointments = useHospitalStore(state => state.appointments);
  const doctors = useHospitalStore(state => state.doctors);
  const invoices = useHospitalStore(state => state.invoices);
  const updateAppointment = useHospitalStore(state => state.updateAppointment);
  const addNotification = useHospitalStore(state => state.addNotification);
  
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || id;
  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.name || id;

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  
  const statusWeight: Record<string, number> = {
    'Emergency': 1,
    'Waiting': 2,
    'In Progress': 3,
    'Completed': 4,
    'Scheduled': 5,
    'No Show': 6
  };

  const liveQueue = [...todayAppointments].sort((a, b) => {
    const aWeight = (a.type === 'Emergency' && a.status === 'Waiting') ? 0 : (statusWeight[a.status] || 99);
    const bWeight = (b.type === 'Emergency' && b.status === 'Waiting') ? 0 : (statusWeight[b.status] || 99);
    return aWeight - bWeight;
  });

  const waitingPatients = liveQueue.filter(a => a.status === 'Waiting').length;
  const emergencyQueue = liveQueue.filter(a => a.type === 'Emergency' && a.status === 'Waiting').length;
  const avgWaitTime = waitingPatients > 0 ? Math.max(5, waitingPatients * 5) : 0;
  const nextPatient = liveQueue.find(a => a.status === 'Waiting');

  const notifications = useHospitalStore(state => state.notifications);
  const markNotificationRead = useHospitalStore(state => state.markNotificationRead);

  // Extract unseen emergency instructions
  const unseenInstructions = notifications
    .filter(n => n.userId === 'reception' && !n.isRead && n.title.includes('EMERGENCY INSTRUCTION'))
    .map(n => {
      const patientName = n.title.replace('EMERGENCY INSTRUCTION: ', '');
      const docInfo = n.message.split(': ')[0];
      const text = n.message.split(': ').slice(1).join(': ');
      return { 
        id: n.id, 
        time: n.createdAt, 
        text, 
        by: docInfo, 
        patient: { name: patientName, id: '' },
        idx: 0
      };
    })
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const handleAction = async (id: string, action: 'Call Next' | 'Mark No Show') => {
    const appointment = todayAppointments.find(a => a.id === id);
    if (!appointment) return;

    if (action === 'Call Next') {
      await updateAppointment(id, { status: 'In Progress' });
      await addNotification({
        userId: appointment.patientId,
        title: 'Token Called',
        message: `Token ${appointment.tokenNumber} please proceed to Dr. ${getDoctorName(appointment.doctorId)}. Date: ${appointment.date}`,
        type: 'info'
      });
    } else if (action === 'Mark No Show') {
      await updateAppointment(id, { status: 'No Show' });
    }
  };

  const handleCallReminder = async (id: string) => {
    const appointment = todayAppointments.find(a => a.id === id);
    if (!appointment) return;
    
    const patient = patients.find(p => p.id === appointment.patientId);
    const doctor = doctors.find(d => d.id === appointment.doctorId);
    
    if (patient && doctor && patient.phone) {
      setCallingId(id);
      try {
        const formattedPhone = patient.phone.startsWith('+') ? patient.phone : '+1' + patient.phone.replace(/\D/g, '');
        
        const payload = {
          agent_id: import.meta.env.VITE_OMNIDIM_AGENT_ID,
          to_number: formattedPhone,
          call_context: {
            patient_name: patient.name,
            doctor_name: doctor.name,
            department: doctor.department,
            appointment_date: appointment.date,
            appointment_time: appointment.time,
            hospital_name: "Hospital OS",
            patient_id: patient.id,
            appointment_id: appointment.id
          }
        };

        const res = await fetch('https://backend.omnidim.io/api/v1/calls/dispatch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OMNIDIM_API_KEY}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to dispatch AI call');
        }

        toast.success(`AI Call Initiated Successfully.`);
      } catch (error: any) {
        toast.error(`AI Call Error: ${error.message || 'Unknown error'}`);
        console.error("AI Call Error Details:", error);
      } finally {
        setCallingId(null);
      }
    } else {
       toast.error(`Patient phone number missing.`);
    }
  };

  const filteredQueue = liveQueue.filter(a => 
    getPatientName(a.patientId).toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Reception Desk</h1>
          <p className="text-muted-foreground mt-1">Manage patient intake, token queues, and front-desk operations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setIsQRModalOpen(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" /> QR Check-In
          </button>
          <button 
            onClick={() => setIsCheckInModalOpen(true)}
            className="px-4 py-2 border border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-500 font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Express Check-In
          </button>
          <button 
            onClick={() => setIsNewPatientModalOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            <CalendarPlus className="w-4 h-4" /> New Patient Visit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6 md:mt-8">
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-lg font-bold text-foreground">Current Queue</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground relative z-10">{waitingPatients}</p>
          <p className="text-sm text-muted-foreground mt-1 relative z-10">Patients Waiting</p>
        </div>
        
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-lg font-bold text-foreground">Next Token</h3>
            <CheckCircle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-foreground relative z-10">{nextPatient?.tokenNumber || '--'}</p>
          <p className="text-sm text-muted-foreground mt-1 relative z-10 truncate">
            {nextPatient ? getPatientName(nextPatient.patientId) : 'Queue Empty'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-lg font-bold text-foreground">Avg. Wait Time</h3>
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-foreground relative z-10">~{avgWaitTime}m</p>
          <p className="text-sm text-muted-foreground mt-1 relative z-10">Estimated wait</p>
        </div>

        <div className="bg-card border border-red-500/30 rounded-2xl p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-lg font-bold text-foreground">Emergency</h3>
            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <p className="text-3xl font-bold text-red-500 relative z-10">{emergencyQueue}</p>
          <p className="text-sm text-red-500/80 mt-1 relative z-10">High Priority Waiting</p>
        </div>
      </div>

      {unseenInstructions.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-lg">Live Emergency Instructions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unseenInstructions.map((inst, i) => (
              <div key={i} className="bg-background rounded-xl p-4 border border-red-500/20 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2 border-b border-border/50 pb-2">
                    <div>
                      <span className="font-bold text-primary block text-sm">{inst.by}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Patient: <span className="font-medium text-foreground">{inst.patient.name}</span></p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{new Date(inst.time).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-foreground my-3">{inst.text}</p>
                </div>
                <button 
                  onClick={() => markNotificationRead(inst.id)}
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold rounded-lg transition-colors text-xs mt-2"
                >
                  Mark as Seen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-foreground px-2">Live Queue Management</h2>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by patient name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-full py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">TIME</th>
                <th className="px-6 py-4 font-bold">PATIENT</th>
                <th className="px-6 py-4 font-bold">DOCTOR</th>
                <th className="px-6 py-4 font-bold">STATUS</th>
                <th className="px-6 py-4 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredQueue.length > 0 ? (
                filteredQueue.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-foreground text-xs">
                      {appointment.time}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {getPatientName(appointment.patientId)}
                        {appointment.type === 'Emergency' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{appointment.type}</div>
                      {appointment.type === 'Emergency' && appointment.remarks && (
                        <div className="mt-1 p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-500 max-w-[250px]">
                          <strong>Dr. Instructions:</strong> {appointment.remarks}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      Dr. {getDoctorName(appointment.doctorId)}
                    </td>
                    <td className="px-6 py-4">
                      {appointment.status === 'Waiting' ? (
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Waiting ({appointment.tokenNumber})</span>
                        </div>
                      ) : appointment.status === 'In Progress' ? (
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">In Consultation</span>
                        </div>
                      ) : appointment.status === 'Scheduled' ? (
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Registered</span>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${appointment.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {appointment.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {appointment.status === 'Waiting' && (
                        <>
                          <button 
                            onClick={() => handleAction(appointment.id, 'Call Next')}
                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors border border-primary/20"
                          >
                            Call Next
                          </button>
                          <button 
                            onClick={() => handleAction(appointment.id, 'Mark No Show')}
                            className="px-3 py-1.5 hover:bg-muted text-muted-foreground text-xs font-medium rounded-lg transition-colors border border-border"
                          >
                            Skip
                          </button>
                        </>
                      )}
                      {(appointment.status === 'Completed' || appointment.status === 'No Show') && (
                        <span className="text-xs text-muted-foreground italic">Done</span>
                      )}
                      {appointment.status === 'Scheduled' && (
                        <div className="flex flex-col items-end gap-1">
                          <button 
                            onClick={() => handleCallReminder(appointment.id)}
                            disabled={callingId === appointment.id}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-xs font-semibold rounded-lg transition-colors border border-blue-500/20 flex items-center gap-1"
                          >
                            📞 {callingId === appointment.id ? 'Calling...' : 'Call Patient'}
                          </button>
                          {callLogs[appointment.id] && (
                            <div className="text-[10px] text-muted-foreground flex flex-col items-end">
                              <span className="font-semibold text-foreground/80">Status: {callLogs[appointment.id].call_status}</span>
                              <span>{new Date(callLogs[appointment.id].created_at).toLocaleTimeString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Queue is empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewPatientVisitModal open={isNewPatientModalOpen} onOpenChange={setIsNewPatientModalOpen} />
      <AppointmentCheckInModal open={isCheckInModalOpen} onOpenChange={setIsCheckInModalOpen} />
      <QRScannerModal open={isQRModalOpen} onOpenChange={setIsQRModalOpen} />
    </div>
  );
}


export function NurseDashboard() {
  const patients = useHospitalStore(state => state.patients);
  const criticalCount = patients.filter(p => p.status === 'Emergency').length;
  const admittedCount = patients.filter(p => p.status === 'Admitted').length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Nursing Station</h1>
          <p className="text-muted-foreground mt-1">Monitor patient vitals and ward assignments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-foreground">Critical Patients</h3>
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-3xl font-bold text-foreground">{criticalCount}</p>
          <p className="text-sm text-muted-foreground mt-1">Require immediate rounds</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-foreground">My Ward (ICU)</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{admittedCount}/15</p>
          <p className="text-sm text-emerald-500 mt-1">Beds occupied</p>
        </div>
      </div>
    </div>
  );
}

export function LabDashboard() {
  const appointments = useHospitalStore(state => state.appointments);
  const patients = useHospitalStore(state => state.patients);
  const [completedTests, setCompletedTests] = useState<string[]>([]);

  // Generate dynamic lab tests from appointments with actual lab requests
  const pendingTests = appointments
    .filter(a => a.status === 'Completed' && a.labRequest && !completedTests.includes(a.id))
    .map(a => ({
      id: a.id,
      patientName: patients.find(p => p.id === a.patientId)?.name || 'Unknown Patient',
      testType: a.labRequest,
      date: new Date(a.date).toLocaleDateString()
    }));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Laboratory</h1>
        <p className="text-muted-foreground mt-1">Process test samples and publish results.</p>
      </div>

      {pendingTests.length === 0 ? (
        <div className="bg-card/30 border border-border rounded-2xl p-8 text-center mt-8">
          <TestTube className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold text-foreground mb-2">Queue Empty</h2>
          <p className="text-muted-foreground">There are no pending lab requests at the moment.</p>
        </div>
      ) : (
        <div className="bg-card/30 border border-border rounded-2xl overflow-hidden mt-8">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/50">
              <tr>
                <th className="px-6 py-4 font-bold">PATIENT</th>
                <th className="px-6 py-4 font-bold">TEST TYPE</th>
                <th className="px-6 py-4 font-bold">REQUEST DATE</th>
                <th className="px-6 py-4 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pendingTests.map(test => (
                <tr key={test.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{test.patientName}</td>
                  <td className="px-6 py-4 text-foreground">{test.testType}</td>
                  <td className="px-6 py-4 text-muted-foreground">{test.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setCompletedTests([...completedTests, test.id])}
                      className="px-4 py-1.5 bg-primary/10 text-primary font-medium text-xs rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      Mark Completed
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { AIService } from '../../services/AIService';

export function PharmacyDashboard() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dispensed, setDispensed] = useState<string[]>([]);
  
  const appointments = useHospitalStore(state => state.appointments);
  const patients = useHospitalStore(state => state.patients);

  // Generate dynamic prescriptions from completed appointments with actual prescriptions
  const activePrescriptions = appointments
    .filter(a => a.status === 'Completed' && a.prescription && !dispensed.includes(a.id))
    .map(a => ({
      id: a.id,
      patientName: patients.find(p => p.id === a.patientId)?.name || 'Unknown Patient',
      medication: a.prescription,
      instructions: 'As prescribed by doctor'
    }));

  const handleAskAI = async () => {
    if (!query) return;
    setIsLoading(true);
    const res = await AIService.getAIResponse(query, "You are a Pharmacy AI Assistant for a hospital. Give SHORT, CONCISE answers (2-4 sentences max). Focus strictly on: medicine names, dosages, drug interactions, side effects, prescription guidance, and medication scheduling. Do not give long paragraphs. Be direct and clinical. If asked about non-medicine topics, politely redirect to pharmacy-related queries only.");
    setResponse(res);
    setIsLoading(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Pharmacy</h1>
        <p className="text-muted-foreground mt-1">Dispense medications and manage inventory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border rounded-2xl p-6 flex flex-col h-[450px]">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" /> Active Prescriptions
          </h3>
          
          {activePrescriptions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-80" />
              <h2 className="text-lg font-bold text-foreground mb-1">All Caught Up</h2>
              <p className="text-sm text-muted-foreground">No active prescriptions to dispense.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {activePrescriptions.map(rx => (
                <div key={rx.id} className="p-4 bg-background border border-border rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-foreground">{rx.patientName}</h4>
                    <button 
                      onClick={() => setDispensed([...dispensed, rx.id])}
                      className="text-xs bg-emerald-500/10 text-emerald-500 font-medium px-2 py-1 rounded-md hover:bg-emerald-500/20 transition-colors"
                    >
                      Dispense
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-primary">{rx.medication}</p>
                  <p className="text-xs text-muted-foreground mt-1">{rx.instructions}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card/40 border border-border rounded-2xl p-6 flex flex-col h-[450px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-xs">AI</span>
            </div>
            <h3 className="font-semibold text-foreground">Pharmacist Assistant</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-4 p-4 rounded-xl bg-background/50 border border-border text-sm text-foreground whitespace-pre-wrap">
            {response || "Ask me about drug interactions, side effects, or dosing guidelines..."}
          </div>
          
          <div className="flex gap-2">
            <input 
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAskAI()}
              placeholder="e.g. Interaction between Amoxicillin and Ibuprofen?"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
            <button 
              onClick={handleAskAI}
              disabled={isLoading}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
