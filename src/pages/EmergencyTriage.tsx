import React, { useState } from 'react';
import { AlertTriangle, Plus, HeartPulse, Activity, Bot, Loader2, X } from 'lucide-react';
import { useHospitalStore } from '../store/useHospitalStore';
import { useTranslation } from '../translations';
import { AIService } from '../services/AIService';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '../store/useAuthStore';
import { AssignDoctorModal } from '../components/AssignDoctorModal';

export default function EmergencyTriage() {
  const { t } = useTranslation();
  const currentUser = useAuthStore(state => state.user);
  const patients = useHospitalStore(state => state.patients);
  const addNotification = useHospitalStore(state => state.addNotification);
  const updatePatient = useHospitalStore(state => state.updatePatient);
  
  const emergencyPatients = patients.filter(p => p.status === 'Emergency');

  const [isAdmitOpen, setIsAdmitOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{score: number, category: string, notification: string} | null>(null);

  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const doctors = useHospitalStore(state => state.doctors);
  const addPatient = useHospitalStore(state => state.addPatient);
  const addAppointment = useHospitalStore(state => state.addAppointment);

  const handleEvaluate = async () => {
    if (!symptoms) return;
    setIsEvaluating(true);
    const result = await AIService.evaluateEmergencyPriority(symptoms);
    setEvaluation(result);
    setIsEvaluating(false);
  };

  const handleAdmit = async () => {
    const pId = `emg_${Date.now()}`;
    await addPatient({
      id: pId,
      name: 'Emergency Patient ' + Math.floor(Math.random() * 1000),
      email: 'emergency@hospitalos.local',
      phone: 'N/A',
      dob: '2000-01-01',
      gender: 'Other',
      bloodGroup: 'Unknown',
      address: 'N/A',
      status: 'Emergency',
      createdAt: new Date().toISOString()
    });

    await addAppointment({
      id: `apt_${Date.now()}`,
      patientId: pId,
      doctorId: doctors[0]?.id || 'unknown',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().substring(0, 5),
      type: 'Emergency',
      status: 'Scheduled',
      symptoms: symptoms
    });

    // Notify ALL doctors with a critical popup
    doctors.forEach(doc => {
      import('../store/useAuthStore').then(({ useAuthStore }) => {
        const docAuth = useAuthStore.getState().users.find(u => u.email === doc.email);
        addNotification({
          userId: docAuth ? docAuth.id : doc.id,
          title: 'CRITICAL EMERGENCY ADMITTED',
          message: `Priority: ${evaluation?.category || 'High'}. Symptoms: ${symptoms}`,
          type: 'error'
        });
      });
    });

    setIsAdmitOpen(false);
    setSymptoms('');
    setEvaluation(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">
          <AlertTriangle className="w-4 h-4" />
          <span>Critical Care</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Emergency Triage</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time critical patient monitoring</p>
          </div>
          <button 
            onClick={() => setIsAdmitOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
          >
            <Plus className="w-5 h-5" /> Admit Critical
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
        {emergencyPatients.length === 0 ? (
          <div className="col-span-3 text-center py-20 bg-card/20 rounded-2xl border border-border border-dashed">
            <HeartPulse className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Active Emergencies</h3>
            <p className="text-muted-foreground text-sm">The triage queue is currently clear.</p>
          </div>
        ) : (
          emergencyPatients.map(patient => (
            <div key={patient.id} className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{patient.name}</h3>
                  <p className="text-xs text-red-400 font-mono mt-1">ID: {patient.id}</p>
                </div>
                <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider animate-pulse">
                  Critical
                </div>
              </div>
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Blood Group</span>
                  <span className="font-bold text-red-500">{patient.bloodGroup}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time Admitted</span>
                  <span className="font-mono">{new Date(patient.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="mt-6 flex gap-2 relative z-10">
                <button 
                  onClick={() => setIsAssignModalOpen(true)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Assign Doctor
                </button>
                {currentUser?.role === 'doctor' && (
                  <button 
                    onClick={() => { setSelectedPatient(patient); setIsInstructionOpen(true); }}
                    className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-foreground group relative"
                    title="Doctor Instructions"
                  >
                    <Bot className="w-5 h-5 group-hover:text-primary transition-colors" />
                  </button>
                )}
                <button 
                  onClick={() => { setSelectedPatient(patient); setIsVitalsOpen(true); }}
                  className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-foreground group relative"
                  title="View Patient Vitals"
                >
                  <Activity className="w-5 h-5 group-hover:text-red-500 transition-colors" />
                </button>
              </div>

              {/* Instructions Chat Display */}
              {patient.emergencyInstructions && patient.emergencyInstructions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50 relative z-10">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Live Instructions
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {patient.emergencyInstructions.map((inst, idx) => (
                      <div key={idx} className="bg-background/50 rounded-lg p-2 text-sm border border-border/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-primary text-xs">{inst.by}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(inst.time).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-foreground">{inst.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Triage Intake Dialog */}
      <Dialog.Root open={isAdmitOpen} onOpenChange={setIsAdmitOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-xl bg-card border border-border shadow-2xl rounded-2xl p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Triage Intake
              </Dialog.Title>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Describe patient symptoms for AI triage evaluation.</p>
              <textarea 
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="e.g. Severe chest pain radiating to left arm, shortness of breath, sweating..."
                className="w-full h-32 bg-background border border-border rounded-xl p-4 text-sm focus:border-red-500 focus:outline-none"
              />
              <button 
                onClick={handleEvaluate}
                disabled={isEvaluating || !symptoms}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {isEvaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                {isEvaluating ? 'Evaluating Priority...' : 'AI Triage Evaluation'}
              </button>

              {evaluation && (
                <div className={`p-4 rounded-xl border mt-4 ${evaluation.category === 'Critical' ? 'bg-red-500/10 border-red-500/50' : 'bg-amber-500/10 border-amber-500/50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold uppercase tracking-wider">Priority: {evaluation.category}</span>
                    <span className="text-lg font-black">Score: {evaluation.score}/100</span>
                  </div>
                  <p className="text-sm">{evaluation.notification}</p>
                  <button onClick={handleAdmit} className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 rounded-lg text-sm">
                    Admit to Queue
                  </button>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Doctor Instructions Dialog */}
      <Dialog.Root open={isInstructionOpen} onOpenChange={setIsInstructionOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Pre-Arrival Instructions
              </Dialog.Title>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Dispatch immediate instructions to Reception and Nursing staff for {selectedPatient?.name}.
              </p>
              <textarea 
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="e.g. Administer O2 immediately, prepare ECG, I am 5 mins away."
                className="w-full h-32 bg-background border border-border rounded-xl p-4 text-sm focus:border-red-500 focus:outline-none"
              />
              <button 
                onClick={() => {
                  if (selectedPatient && instructions && currentUser) {
                    addNotification({
                      userId: 'reception', // Send to general reception
                      title: `EMERGENCY INSTRUCTION: ${selectedPatient.name}`,
                      message: `Dr. ${currentUser.name}: ${instructions}`,
                      type: 'error'
                    });
                    addNotification({
                      userId: 'nurse', // Send to general nurse staff
                      title: `EMERGENCY INSTRUCTION: ${selectedPatient.name}`,
                      message: `Dr. ${currentUser.name}: ${instructions}`,
                      type: 'error'
                    });

                    // Add instruction to patient's record
                    const updatedInstructions = [
                      ...(selectedPatient.emergencyInstructions || []),
                      { time: new Date().toISOString(), text: instructions, by: `Dr. ${currentUser.name}` }
                    ];
                    updatePatient(selectedPatient.id, { emergencyInstructions: updatedInstructions });

                    setIsInstructionOpen(false);
                    setInstructions('');
                  }
                }}
                disabled={!instructions}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                Send Instructions
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AssignDoctorModal open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen} />

      <Dialog.Root open={isVitalsOpen} onOpenChange={setIsVitalsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                Live Vitals: {selectedPatient?.name}
              </h2>
              <Dialog.Close className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Heart Rate</div>
                <div className="text-3xl font-bold text-red-500 flex items-end gap-2">
                  112 <span className="text-sm font-normal text-muted-foreground mb-1">bpm</span>
                </div>
                <div className="text-xs text-red-400 mt-2">↑ Elevated</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Blood Pressure</div>
                <div className="text-3xl font-bold text-blue-500 flex items-end gap-2">
                  145/90 <span className="text-sm font-normal text-muted-foreground mb-1">mmHg</span>
                </div>
                <div className="text-xs text-amber-500 mt-2">! Hypertension Stg 2</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">SpO2</div>
                <div className="text-3xl font-bold text-emerald-500 flex items-end gap-2">
                  94 <span className="text-sm font-normal text-muted-foreground mb-1">%</span>
                </div>
                <div className="text-xs text-emerald-400 mt-2">✓ Stable</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Temperature</div>
                <div className="text-3xl font-bold text-amber-500 flex items-end gap-2">
                  101.2 <span className="text-sm font-normal text-muted-foreground mb-1">°F</span>
                </div>
                <div className="text-xs text-amber-500 mt-2">↑ Fever</div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setIsVitalsOpen(false)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors"
              >
                Close Vitals
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
