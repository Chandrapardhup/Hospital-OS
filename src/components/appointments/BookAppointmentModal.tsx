import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
import { useAuthStore } from '../../store/useAuthStore';

const appointmentSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  doctorId: z.string().min(1, 'Please select a doctor'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  type: z.enum(['Consultation', 'Follow-up', 'Checkup', 'Emergency', 'Admitting'] as const),
  symptoms: z.string().optional(),
  paymentMethod: z.enum(['Pay in Hospital', 'Card', 'PhonePe']).optional(),
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
  const [successAppointment, setSuccessAppointment] = useState<any | null>(null);
  const patients = useHospitalStore(state => state.patients);
  const doctors = useHospitalStore(state => state.doctors);
  const addPatient = useHospitalStore(state => state.addPatient);
  const addInvoice = useHospitalStore(state => state.addInvoice);
  const user = useAuthStore(state => state.user);

  // Safely auto-detect patient ID if a patient is booking themselves
  const effectivePatientId = defaultPatientId || (user?.role === 'user' ? patients.find(p => p.email === user.email)?.id : undefined);

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
      patientId: effectivePatientId,
      patientName: patients.find(p => p.id === effectivePatientId)?.name || '',
      paymentMethod: 'Pay in Hospital',
    }
  });

  const watchDoctorId = watch('doctorId');
  const watchDate = watch('date');
  const selectedDoctor = doctors.find(d => d.id === watchDoctorId);
  const rawAvailableTimes = selectedDoctor?.availableTimes || [];

  const availableTimes = rawAvailableTimes.filter(t => {
    if (!watchDate) return true;
    const today = new Date().toISOString().split('T')[0];
    if (watchDate !== today) return true;
    
    // time format is expected to be 'HH:MM' (24-hour) or 'HH:MM AM/PM'
    // For simplicity assuming standard formats.
    const now = new Date();
    const [timeStr, modifier] = t.split(' ');
    let [hours, minutes] = timeStr.split(':').map(Number);
    
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    if (now.getHours() > hours) return false;
    if (now.getHours() === hours && now.getMinutes() >= minutes) return false;
    return true;
  });

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      setIsSubmitting(true);
      
      let finalPatientId = effectivePatientId;
      
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
            email: `${data.patientName.replace(/\\s+/g, '').toLowerCase() || 'unknown'}@Apollo Hospitals.local`,
            phone: 'N/A',
            dob: '2000-01-01',
            gender: 'Other',
            bloodGroup: 'Unknown',
            address: 'N/A',
            status: data.type === 'Emergency' ? 'Emergency' : data.type === 'Admitting' ? 'Admitted' : 'Outpatient',
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
      
      const appt = await AppointmentService.bookAppointment(appointmentData);
      
      // Update patient status based on appointment type so KPI stats refresh instantly
      const updatePatient = useHospitalStore.getState().updatePatient;
      if (data.type === 'Emergency') {
        updatePatient(finalPatientId, { status: 'Emergency' });
      } else if (data.type === 'Admitting') {
        updatePatient(finalPatientId, { status: 'Admitted' });
      }

      // Generate invoice
      const fee = selectedDoctor?.consultationFee || 100;
      addInvoice({
        id: `inv_${Date.now()}`,
        patientId: finalPatientId,
        date: new Date().toISOString().split('T')[0],
        amount: fee,
        status: data.paymentMethod === 'Pay in Hospital' ? 'Pending' : 'Paid',
        items: [
          { description: `${data.type} with Dr. ${selectedDoctor?.name || 'Doctor'}`, cost: fee }
        ]
      });
      
      setSuccessAppointment({
        ...appt,
        patientName: data.patientName || 'Patient'
      });
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
          <DialogTitle className="text-foreground">
            {successAppointment ? 'Appointment Confirmed' : 'Book Appointment'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {successAppointment ? 'Your appointment has been successfully booked.' : 'Schedule a new appointment for a patient.'}
          </DialogDescription>
        </DialogHeader>

        {successAppointment ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-foreground">Booking Successful!</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Please save this QR code. You can present it at the reception desk for a rapid self check-in.</p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-sm border border-border/50">
              <QRCodeSVG 
                value={`appointment:${successAppointment.id}`} 
                size={160}
                level="H"
              />
            </div>
            
            <div className="w-full bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Appt ID:</span>
                <span className="font-mono font-medium text-foreground">{successAppointment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-medium text-foreground">{successAppointment.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schedule:</span>
                <span className="font-medium text-foreground">{successAppointment.date} @ {successAppointment.time}</span>
              </div>
            </div>

            <Button 
              onClick={() => {
                reset();
                setSuccessAppointment(null);
                onOpenChange(false);
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 mt-4">
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
              {selectedDoctor && selectedDoctor.consultationFee && (
                <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Consultation Fee</span>
                  <span className="text-sm font-bold text-primary">${selectedDoctor.consultationFee}</span>
                </div>
              )}
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
                <SelectItem value="Admitting">Admitting (Hospital Stay)</SelectItem>
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

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-foreground/80">Payment Method</label>
            <Select onValueChange={(val) => setValue('paymentMethod', val as any)} defaultValue="Pay in Hospital">
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Select Payment Method" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="Pay in Hospital">Pay at Hospital Desk</SelectItem>
                <SelectItem value="Card">Credit/Debit Card (Pay Now)</SelectItem>
                <SelectItem value="PhonePe">PhonePe / UPI (Pay Now)</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMethod && <p className="text-xs text-destructive">{errors.paymentMethod.message}</p>}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
