import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, UserPlus, Calendar as CalendarIcon, User, Stethoscope, CheckCircle, Loader2 } from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPatientVisitModal({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  // New patient form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  
  // Visit form
  const [department, setDepartment] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const patients = useHospitalStore(state => state.patients);
  const doctors = useHospitalStore(state => state.doctors);
  const addPatient = useHospitalStore(state => state.addPatient);
  const addAppointment = useHospitalStore(state => state.addAppointment);
  const addNotification = useHospitalStore(state => state.addNotification);

  const searchResults = patients.filter(p => 
    searchQuery && (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.phone.includes(searchQuery) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setStep(3); // Skip to visit details
  };

  const handleRegisterPatient = async () => {
    setIsLoading(true);
    const newPatient = {
      id: `pat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      phone,
      dob,
      gender: gender as 'Male' | 'Female' | 'Other',
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      bloodGroup: 'Unknown',
      address: 'N/A',
      status: 'Outpatient' as const,
      createdAt: new Date().toISOString()
    };
    
    await addPatient(newPatient);
    setSelectedPatient(newPatient);
    setStep(3);
    setIsLoading(false);
  };

  // Recommend doctor based on department and queue length
  const recommendedDoctor = doctors.find(d => d.department === department);

  const handleCreateVisit = async () => {
    if (!selectedPatient || !selectedDoctorId) return;
    setIsLoading(true);
    
    const token = `T-${Math.floor(Math.random() * 100) + 1}`;
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    await addAppointment({
      id: appointmentId,
      patientId: selectedPatient.id,
      doctorId: selectedDoctorId,
      date: today,
      time: now,
      type: 'Consultation',
      status: 'Waiting',
      tokenNumber: token
    });
    
    // Notify doctor instantly
    await addNotification({
      userId: selectedDoctorId,
      title: 'New Patient Walk-in',
      message: `${selectedPatient.name} has arrived and is waiting. Token: ${token}`,
      type: 'warning'
    });

    setIsLoading(false);
    onOpenChange(false);
    
    // Reset state
    setStep(1);
    setSearchQuery('');
    setSelectedPatient(null);
    setName('');
    setPhone('');
    setDob('');
    setDepartment('');
    setSelectedDoctorId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-6 border-b border-border/50 bg-muted/20">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <UserPlus className="w-5 h-5 text-primary" />
            New Patient Visit
          </DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Search Existing Patient</h3>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by Name, Phone, or UHID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              
              {searchQuery && (
                <div className="border border-border rounded-xl divide-y divide-border/50 mt-4 overflow-hidden">
                  {searchResults.length > 0 ? searchResults.map(p => (
                    <div key={p.id} onClick={() => handleSelectPatient(p)} className="p-3 hover:bg-muted/50 cursor-pointer flex justify-between items-center transition-colors">
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.phone} • UHID: {p.id.substring(0,8)}</div>
                      </div>
                      <button className="text-primary bg-primary/10 px-3 py-1 rounded-lg text-xs font-medium">Select</button>
                    </div>
                  )) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">No patient found.</div>
                  )}
                </div>
              )}

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase font-medium">OR</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full py-3 border border-dashed border-primary/50 text-primary rounded-xl hover:bg-primary/5 transition-colors flex justify-center items-center gap-2 font-medium"
              >
                <UserPlus className="w-4 h-4" /> Register New Patient
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <h3 className="font-medium text-foreground">Register New Patient</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-primary focus:outline-none">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 py-2 border border-border rounded-xl text-foreground font-medium hover:bg-muted transition-colors">Back</button>
                <button onClick={handleRegisterPatient} disabled={!name || !phone || isLoading} className="flex-1 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register & Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && selectedPatient && (
            <div className="space-y-5 animate-in slide-in-from-right-4">
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground leading-tight">{selectedPatient.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedPatient.phone} • {selectedPatient.gender}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Select Department</label>
                  <select 
                    value={department} 
                    onChange={e => {
                      setDepartment(e.target.value);
                      const rec = doctors.find(d => d.department === e.target.value);
                      if (rec) setSelectedDoctorId(rec.id);
                    }} 
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">Choose department...</option>
                    {Array.from(new Set(doctors.map(d => d.department))).map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>

                {department && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-primary" /> Hospital Brain Recommendation
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {doctors.filter(d => d.department === department).map(doc => (
                        <div 
                          key={doc.id}
                          onClick={() => setSelectedDoctorId(doc.id)}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${selectedDoctorId === doc.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-background hover:bg-muted'}`}
                        >
                          <div>
                            <div className="font-medium text-foreground text-sm flex items-center gap-2">
                              Dr. {doc.name}
                              {recommendedDoctor?.id === doc.id && <span className="bg-amber-500/20 text-amber-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Optimal</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">{doc.specialization}</div>
                          </div>
                          {selectedDoctorId === doc.id && <CheckCircle className="w-5 h-5 text-primary" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 py-2 border border-border rounded-xl text-foreground font-medium hover:bg-muted transition-colors">Cancel</button>
                <button 
                  onClick={handleCreateVisit} 
                  disabled={!selectedDoctorId || isLoading} 
                  className="flex-[2] py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Token & Add to Queue'}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
