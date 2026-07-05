import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppointmentService } from '../../services/AppointmentService';
import { useHospitalStore } from '../../store/useHospitalStore';

const appointmentSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  doctorId: z.string().min(1, 'Please select a doctor'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  type: z.enum(['Consultation', 'Follow-up', 'Checkup', 'Emergency'] as const),
  symptoms: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface BookAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPatientId?: string;
  isPatientMode?: boolean;
}

export function BookAppointmentModal({ open, onOpenChange, defaultPatientId, isPatientMode }: BookAppointmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const patients = useHospitalStore(state => state.patients);
  const doctors = useHospitalStore(state => state.doctors);
  const addPatient = useHospitalStore(state => state.addPatient);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: 'Consultation',
      patientId: defaultPatientId,
      patientName: patients.find(p => p.id === defaultPatientId)?.name || '',
    }
  });

  const watchDoctorId = watch('doctorId');
  const selectedDoctor = doctors.find(d => d.id === watchDoctorId);
  const availableTimes = selectedDoctor?.availableTimes || [];

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      setIsSubmitting(true);
      
      let finalPatientId = defaultPatientId;
      
      if (data.patientName) {
        // Try to find by exact name match first
        const existingPatient = patients.find(p => p.name.toLowerCase() === data.patientName?.toLowerCase());
        if (existingPatient) {
          finalPatientId = existingPatient.id;
        } else {
          // It's a new name, create a placeholder patient
          finalPatientId = `pat_${Date.now()}`;
          await addPatient({
            id: finalPatientId,
            name: data.patientName,
            email: `${data.patientName.replace(/\\s+/g, '').toLowerCase() || 'unknown'}@hospitalos.local`,
            phone: 'N/A',
            dob: '2000-01-01',
            gender: 'Other',
            bloodGroup: 'Unknown',
            address: 'N/A',
            status: 'Outpatient',
            createdAt: new Date().toISOString()
          });
        }
      }
      
      if (!finalPatientId) {
        alert("Patient Name is required.");
        return;
      }
      
      const appointmentData = {
        patientId: finalPatientId,
        doctorId: data.doctorId,
        date: data.date,
        time: data.time,
        type: data.type,
        symptoms: data.symptoms
      };
      
      await AppointmentService.bookAppointment(appointmentData);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to book appointment', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border text-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Book Appointment</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Schedule a new appointment for a patient.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">
                Patient Name
              </label>
              <Input 
                {...register('patientName')} 
                placeholder="Enter patient name" 
                className="bg-muted border-border text-foreground placeholder:text-foreground/30"
              />
              {errors.patientName && <p className="text-xs text-destructive">{errors.patientName.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Select Doctor</label>
              <Select onValueChange={(val) => setValue('doctorId', val)}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground max-h-64">
                  {doctors.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name} ({d.department})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.doctorId && <p className="text-xs text-destructive">{errors.doctorId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Date</label>
              <Input 
                {...register('date')} 
                type="date"
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                className="bg-muted border-border text-foreground [&::-webkit-calendar-picker-indicator]:invert"
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              {selectedDoctor && (
                <p className="text-xs text-muted-foreground mt-1">Available: {selectedDoctor.availableDays.join(', ')}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Time</label>
              {availableTimes.length > 0 ? (
                <Select onValueChange={(val) => setValue('time', val)}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="Select available time" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground max-h-64">
                    {availableTimes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select disabled>
                  <SelectTrigger className="bg-muted border-border text-muted-foreground opacity-50">
                    <SelectValue placeholder={selectedDoctor ? "No available times for this doctor" : "Select a doctor first"} />
                  </SelectTrigger>
                </Select>
              )}
              {errors.time && <p className="text-xs text-destructive">{errors.time.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Appointment Type</label>
            <Select onValueChange={(val) => setValue('type', val as any)} defaultValue="Consultation">
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="Consultation">Consultation</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
                <SelectItem value="Checkup">Checkup</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Symptoms / Notes (Optional)</label>
            <Input 
              {...register('symptoms')} 
              placeholder="Brief description of symptoms..." 
              className="bg-muted border-border text-foreground placeholder:text-foreground/30"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border/50 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-foreground"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
