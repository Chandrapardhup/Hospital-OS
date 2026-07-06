import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, UserCheck, Search } from 'lucide-react';
import { useHospitalStore } from '../store/useHospitalStore';

export function AssignDoctorModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const patients = useHospitalStore(state => state.patients);
  const doctors = useHospitalStore(state => state.doctors);
  const updatePatient = useHospitalStore(state => state.updatePatient);
  const addNotification = useHospitalStore(state => state.addNotification);

  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [search, setSearch] = useState('');

  const unassignedPatients = patients.filter(p => !p.assignedDoctorId && p.status !== 'Discharged');

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.department.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = () => {
    if (!selectedPatient || !selectedDoctor) return;
    
    updatePatient(selectedPatient, { assignedDoctorId: selectedDoctor });
    
    const p = patients.find(p => p.id === selectedPatient);
    
    addNotification({
      userId: selectedDoctor,
      title: 'New Patient Assigned',
      message: `You have been assigned a new patient: ${p?.name}`,
      type: 'info'
    });
    
    addNotification({
      userId: 'global',
      title: 'Patient Assigned',
      message: `Patient ${p?.name} has been assigned to a doctor.`,
      type: 'success'
    });

    onOpenChange(false);
    setSelectedPatient('');
    setSelectedDoctor('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl p-6 z-50">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-foreground flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" /> Assign Doctor
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">1. Select Unassigned Patient</label>
              <select 
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">-- Choose a Patient --</option>
                {unassignedPatients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                ))}
                {unassignedPatients.length === 0 && <option disabled>No unassigned patients available</option>}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">2. Select Doctor</label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search doctors by name or department..." 
                  className="w-full bg-background border border-border rounded-xl py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              
              <div className="h-48 overflow-y-auto border border-border rounded-xl bg-background/50 divide-y divide-border">
                {filteredDoctors.map(doctor => (
                  <div 
                    key={doctor.id} 
                    onClick={() => setSelectedDoctor(doctor.id)}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${selectedDoctor === doctor.id ? 'bg-primary/20' : 'hover:bg-muted'}`}
                  >
                    <img src={doctor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=random`} alt={doctor.name} className="w-8 h-8 rounded-full border border-border" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground">{doctor.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{doctor.department} • {doctor.status}</p>
                    </div>
                  </div>
                ))}
                {filteredDoctors.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">No doctors match your search.</div>
                )}
              </div>
            </div>

            <button 
              onClick={handleAssign}
              disabled={!selectedPatient || !selectedDoctor}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all disabled:opacity-50"
            >
              Confirm Assignment
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
