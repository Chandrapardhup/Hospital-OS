import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, User, Clock, FileText } from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalPatientSearchModal({ open, onOpenChange }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const patients = useHospitalStore(state => state.patients);
  const appointments = useHospitalStore(state => state.appointments);

  const searchResults = patients.filter(p => {
    if (!searchQuery) return false;
    
    // Check if any appointment matches the query
    const patientAppointments = appointments.filter(a => a.patientId === p.id);
    const appointmentMatches = patientAppointments.some(a => 
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.tokenNumber && a.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.phone.includes(searchQuery) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointmentMatches
    );
  }).slice(0, 10); // Limit to 10 results

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-background border-border">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Name, Phone, UHID, Appointment ID, or Token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-foreground focus:outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {searchQuery && searchResults.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="divide-y divide-border">
              {searchResults.map(p => (
                <div key={p.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        {p.name}
                        <span className="px-2 py-0.5 bg-muted rounded text-[10px] uppercase font-mono">{p.id.substring(0,8)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p.phone} • {p.gender} • DOB: {p.dob}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Profile
                    </button>
                    <button className="flex-1 md:flex-none px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
