import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHospitalStore } from '../../store/useHospitalStore';
import type { Doctor } from '../../types/hospital';

interface ManageScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor;
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ALL_TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

export function ManageScheduleModal({ open, onOpenChange, doctor }: ManageScheduleModalProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(doctor.availableDays || []);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(doctor.availableTimes || ['09:00', '10:00', '11:00', '14:00', '15:00']);
  const updateDoctor = useHospitalStore(state => state.updateDoctor);
  const [isSaving, setIsSaving] = useState(false);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateDoctor(doctor.id, {
      availableDays: selectedDays,
      availableTimes: selectedTimes.sort()
    });
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border text-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Manage Schedule</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select the days and specific times you are available for appointments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Available Days</h4>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedDays.includes(day)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Available Time Slots</h4>
            <div className="grid grid-cols-4 gap-2">
              {ALL_TIMES.map(time => (
                <button
                  key={time}
                  onClick={() => toggleTime(time)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors border ${
                    selectedTimes.includes(time)
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-background text-foreground border-border hover:bg-muted">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || selectedDays.length === 0 || selectedTimes.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSaving ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
