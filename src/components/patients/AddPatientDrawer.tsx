import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientService } from '../../services/PatientService';
import type { Gender, PatientStatus } from '../../types/hospital';

const patientSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other'] as const),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  address: z.string().optional(),
  status: z.enum(['Admitted', 'Discharged', 'Outpatient', 'Emergency'] as const),
  insuranceProvider: z.string().optional(),
  insuranceId: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface AddPatientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPatientDrawer({ open, onOpenChange }: AddPatientDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      gender: 'Male',
      status: 'Outpatient',
    }
  });

  const onSubmit = async (data: PatientFormValues) => {
    try {
      setIsSubmitting(true);
      await PatientService.createPatient({
        ...data,
        email: data.email || '',
        address: data.address || ''
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create patient', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-background border-border text-foreground w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">Register New Patient</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Enter the patient's details below to create a new medical record.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Full Name</label>
            <Input 
              {...register('name')} 
              placeholder="John Doe" 
              className="bg-muted border-border text-foreground placeholder:text-foreground/30"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Email (Optional)</label>
              <Input 
                {...register('email')} 
                type="email"
                placeholder="john@example.com" 
                className="bg-muted border-border text-foreground placeholder:text-foreground/30"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Phone</label>
              <Input 
                {...register('phone')} 
                placeholder="+1 234 567 8900" 
                className="bg-muted border-border text-foreground placeholder:text-foreground/30"
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Date of Birth</label>
              <Input 
                {...register('dob')} 
                type="date"
                className="bg-muted border-border text-foreground [&::-webkit-calendar-picker-indicator]:invert"
              />
              {errors.dob && <p className="text-xs text-destructive">{errors.dob.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Gender</label>
              <Select onValueChange={(value) => setValue('gender', value as Gender)} defaultValue="Male">
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Blood Group</label>
              <Input 
                {...register('bloodGroup')} 
                placeholder="O+" 
                className="bg-muted border-border text-foreground placeholder:text-foreground/30"
              />
              {errors.bloodGroup && <p className="text-xs text-destructive">{errors.bloodGroup.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Patient Status</label>
              <Select onValueChange={(value) => setValue('status', value as PatientStatus)} defaultValue="Outpatient">
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="Outpatient">Outpatient</SelectItem>
                  <SelectItem value="Admitted">Admitted</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Home Address (Optional)</label>
            <Input 
              {...register('address')} 
              placeholder="123 Street Name, City" 
              className="bg-muted border-border text-foreground placeholder:text-foreground/30"
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-border hover:bg-muted text-foreground"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Register Patient'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
