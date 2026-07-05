import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { workflowService } from '../services/workflowService';
import { emailService } from '../services/emailService';
import type { HospitalState, Patient, Doctor, Appointment, Notification, Invoice, MedicalRecord, AiConsultation } from '../types/hospital';

// Extended state to include async actions and loading
interface ExtendedHospitalState extends HospitalState {
  aiConsultations: AiConsultation[];
  addAiConsultation: (consultation: AiConsultation) => void;
  isLoading: boolean;
  initializeData: () => Promise<void>;
}

export const useHospitalStore = create<ExtendedHospitalState>()(
  (set, get) => ({
    patients: [],
    doctors: [],
    appointments: [],
    notifications: [],
    medicalRecords: [],
    invoices: [],
    aiConsultations: [],
    isLoading: true,

    addAiConsultation: (consultation) => set((state) => ({ 
      aiConsultations: [consultation, ...state.aiConsultations] 
    })),

    initializeData: async () => {
      set({ isLoading: true });
      try {
        const [
          { data: patients },
          { data: doctors },
          { data: appointments },
          { data: notifications },
          { data: medicalRecords },
          { data: invoices }
        ] = await Promise.all([
          supabase.from('patients').select('*'),
          supabase.from('doctors').select('*'),
          supabase.from('appointments').select('*'),
          supabase.from('notifications').select('*'),
          supabase.from('medical_records').select('*'),
          supabase.from('invoices').select('*'),
        ]);

        const mapPatient = (p: any) => ({
          ...p,
          bloodGroup: p.blood_group,
          lastVisit: p.last_visit,
          assignedDoctorId: p.assigned_doctor_id,
          insuranceProvider: p.insurance_provider,
          insuranceId: p.insurance_id
        });

        const mapDoctor = (d: any) => {
          const rawDays = d.available_days || [];
          const days = rawDays.filter((x: string) => !x.startsWith('TIME:'));
          const times = rawDays
            .filter((x: string) => x.startsWith('TIME:'))
            .map((x: string) => x.replace('TIME:', ''));
            
          return {
            ...d,
            experienceYears: d.experience_years,
            consultationFee: d.consultation_fee,
            availableDays: days,
            availableTimes: times.length > 0 ? times : (d.available_times || [])
          };
        };

        const mapAppointment = (a: any) => {
          let parsedNotes = a.notes;
          let remarks = a.remarks;
          let prescription = a.prescription;
          
          if (a.notes && typeof a.notes === 'string' && a.notes.startsWith('{')) {
            try {
              const parsed = JSON.parse(a.notes);
              if (parsed.notes !== undefined) parsedNotes = parsed.notes;
              if (parsed.remarks !== undefined) remarks = parsed.remarks;
              if (parsed.prescription !== undefined) prescription = parsed.prescription;
            } catch (e) {
              // Not JSON, just use as regular notes
            }
          }

          return {
            ...a,
            patientId: a.patient_id,
            doctorId: a.doctor_id,
            notes: parsedNotes,
            remarks: remarks,
            prescription: prescription
          };
        };

        const mapNotification = (n: any) => ({
          ...n,
          userId: n.user_id,
          isRead: n.is_read
        });

        const mapInvoice = (i: any) => ({
          ...i,
          patientId: i.patient_id,
          doctorId: i.doctor_id
        });

        const mapRecord = (r: any) => ({
          ...r,
          patientId: r.patient_id,
          fileUrl: r.file_url
        });

        set({
          patients: patients?.map(mapPatient) || [],
          doctors: doctors?.map(mapDoctor) || [],
          appointments: appointments?.map(mapAppointment) || [],
          notifications: notifications?.map(mapNotification) || [],
          medicalRecords: medicalRecords?.map(mapRecord) || [],
          invoices: invoices?.map(mapInvoice) || [],
          isLoading: false
        });
      } catch (error) {
        console.error("Failed to load hospital data from Supabase", error);
        set({ isLoading: false });
      }
    },

    // Patients
    setPatients: (patients) => set({ patients }),
    addPatient: async (patient) => {
      set((state) => ({ patients: [...state.patients, patient] }));
      const { error } = await supabase.from('patients').insert({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dob: patient.dob,
        gender: patient.gender,
        blood_group: patient.bloodGroup,
        address: patient.address,
        status: patient.status,
        last_visit: patient.lastVisit,
        assigned_doctor_id: patient.assignedDoctorId,
        allergies: patient.allergies,
        insurance_provider: patient.insuranceProvider,
        insurance_id: patient.insuranceId
      });
      if (error) console.error('Error adding patient:', error);
    },
    updatePatient: async (id, data) => {
      set((state) => ({
        patients: state.patients.map(p => p.id === id ? { ...p, ...data } : p)
      }));
      const updateData: any = { ...data };
      if (data.bloodGroup) updateData.blood_group = data.bloodGroup;
      if (data.lastVisit) updateData.last_visit = data.lastVisit;
      if (data.assignedDoctorId) updateData.assigned_doctor_id = data.assignedDoctorId;
      if (data.insuranceProvider) updateData.insurance_provider = data.insuranceProvider;
      if (data.insuranceId) updateData.insurance_id = data.insuranceId;
      
      delete updateData.bloodGroup;
      delete updateData.lastVisit;
      delete updateData.assignedDoctorId;
      delete updateData.insuranceProvider;
      delete updateData.insuranceId;

      const { error } = await supabase.from('patients').update(updateData).eq('id', id);
      if (error) console.error('Error updating patient:', error);
    },
    deletePatient: async (id) => {
      set((state) => ({ patients: state.patients.filter(p => p.id !== id) }));
      await supabase.from('patients').delete().eq('id', id);
    },

    // Doctors
    setDoctors: (doctors) => set({ doctors }),
    addDoctor: async (doctor) => {
      set((state) => ({ doctors: [...state.doctors, doctor] }));
      const { error } = await supabase.from('doctors').insert({
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        department: doctor.department,
        specialization: doctor.specialization,
        experience_years: doctor.experienceYears,
        consultation_fee: doctor.consultationFee,
        available_days: doctor.availableDays,
        status: doctor.status,
        avatar: doctor.avatar
      });
      if (error) console.error('Error adding doctor:', error);
    },
    updateDoctor: async (id, data) => {
      set((state) => ({
        doctors: state.doctors.map(d => d.id === id ? { ...d, ...data } : d)
      }));
      
      const updateData: any = { ...data };
      if (data.experienceYears !== undefined) updateData.experience_years = data.experienceYears;
      if (data.consultationFee !== undefined) updateData.consultation_fee = data.consultationFee;
      
      // Since available_times might not exist in the DB schema, we package times into available_days
      const currentDoctor = get().doctors.find((d: Doctor) => d.id === id);
      let newAvailableDays = data.availableDays !== undefined ? data.availableDays : (currentDoctor?.availableDays || []);
      let newAvailableTimes = data.availableTimes !== undefined ? data.availableTimes : (currentDoctor?.availableTimes || []);
      
      if (data.availableDays !== undefined || data.availableTimes !== undefined) {
        updateData.available_days = [
          ...newAvailableDays,
          ...newAvailableTimes.map((t: string) => `TIME:${t}`)
        ];
      }
      
      delete updateData.experienceYears;
      delete updateData.consultationFee;
      delete updateData.availableDays;
      delete updateData.availableTimes;

      const { error } = await supabase.from('doctors').update(updateData).eq('id', id);
      if (error) console.error('Error updating doctor:', error);
    },
    deleteDoctor: async (id) => {
      set((state) => ({ doctors: state.doctors.filter(d => d.id !== id) }));
      await supabase.from('doctors').delete().eq('id', id);
    },

    // Appointments
    setAppointments: (appointments) => set({ appointments }),
    addAppointment: async (appointment) => {
      set((state) => ({ appointments: [...state.appointments, appointment] }));
      const { error } = await supabase.from('appointments').insert({
        id: appointment.id,
        patient_id: appointment.patientId,
        doctor_id: appointment.doctorId,
        date: appointment.date,
        time: appointment.time,
        type: appointment.type,
        status: appointment.status,
        symptoms: appointment.symptoms,
        notes: appointment.notes,
        remarks: appointment.remarks,
        prescription: appointment.prescription
      });
      if (error) {
        console.error('Error adding appointment:', error);
      } else {
        const doc = get().doctors.find(d => d.id === appointment.doctorId);
        const pat = get().patients.find(p => p.id === appointment.patientId);

        // AI ENTERPRISE TRIGGER: Trigger workflow
        workflowService.triggerWorkflow(
          'Appointment Booking Protocol',
          `New Appointment: ${pat?.name || 'Patient'} with Dr. ${doc?.name || 'Doctor'}`,
          [
            { name: 'Update Doctor Schedule', status: 'Completed', agent: 'Appointment Service' },
            { name: 'Notify Receptionist', status: 'Pending', agent: 'Reception Agent' },
            { name: 'Queue Email Confirmations', status: 'Completed', agent: 'Notification Agent' },
          ]
        );

        // Notify Patient (Email)
        emailService.queueEmail(
          pat?.email || 'patient@example.com',
          `Appointment Confirmed: Dr. ${doc?.name || 'Doctor'}`,
          'Appointment Confirmation',
          `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #8b5cf6; padding: 20px; color: white; text-align: center;">
              <h2 style="margin: 0;">Appointment Confirmed</h2>
            </div>
            <div style="padding: 24px;">
              <p>Dear <strong>${pat?.name || 'Patient'}</strong>,</p>
              <p>Your appointment has been successfully booked at HospitalOS.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Doctor:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Dr. ${doc?.name || 'Doctor'} (${doc?.specialization || 'Specialist'})</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${appointment.date}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${appointment.time}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Type:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${appointment.type}</td></tr>
              </table>
              <p style="color: #666; font-size: 14px;">Please arrive 15 minutes early and bring your ID.</p>
            </div>
          </div>
          `
        );

        // Notify Doctor (Email)
        emailService.queueEmail(
          doc?.email || 'doctor@hospitalos.local',
          `New Appointment Booking: ${pat?.name || 'Patient'}`,
          'Schedule Update',
          `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; border-left: 4px solid #8b5cf6; padding-left: 16px;">
            <h3>New Appointment Booked</h3>
            <p><strong>Patient:</strong> ${pat?.name || 'Patient'}</p>
            <p><strong>Date & Time:</strong> ${appointment.date} at ${appointment.time}</p>
            <p><strong>Type:</strong> ${appointment.type}</p>
            <p><strong>Reason:</strong> ${appointment.symptoms || appointment.notes || 'Routine check'}</p>
            <p>Please review the patient's medical records prior to the visit.</p>
          </div>
          `
        );

        // In-App Notifications
        get().addNotification({
          userId: appointment.patientId,
          title: 'Appointment Booked (Email Sent)',
          message: `Your appointment with Dr. ${doc?.name} is confirmed for ${appointment.date}.`,
          type: 'info'
        });
        
        get().addNotification({
          userId: appointment.doctorId,
          title: 'New Patient Appointment',
          message: `${pat?.name} booked an appointment for ${appointment.date} at ${appointment.time}.`,
          type: 'error'
        });
      }
    },
    updateAppointment: async (id, data) => {
      set((state) => ({
        appointments: state.appointments.map(a => a.id === id ? { ...a, ...data } : a)
      }));
      
      const updateData: any = { ...data };
      if (data.patientId !== undefined) updateData.patient_id = data.patientId;
      if (data.doctorId !== undefined) updateData.doctor_id = data.doctorId;
      
      delete updateData.patientId;
      delete updateData.doctorId;

      // Because Supabase 'appointments' table might not have 'remarks' and 'prescription' columns,
      // we serialize them into the 'notes' column to ensure they persist.
      const currentAppt = get().appointments.find(a => a.id === id);
      const combinedNotes = JSON.stringify({
        notes: data.notes ?? currentAppt?.notes,
        remarks: data.remarks ?? currentAppt?.remarks,
        prescription: data.prescription ?? currentAppt?.prescription
      });
      updateData.notes = combinedNotes;
      delete updateData.remarks;
      delete updateData.prescription;

      const { error } = await supabase.from('appointments').update(updateData).eq('id', id);
      if (error) console.error('Error updating appointment:', error);
    },
    deleteAppointment: async (id) => {
      set((state) => ({ appointments: state.appointments.filter(a => a.id !== id) }));
      await supabase.from('appointments').delete().eq('id', id);
    },

    // Notifications
    addNotification: async (notification) => {
      const newNotif = {
        ...notification,
        id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      set((state) => ({ notifications: [newNotif, ...state.notifications] }));
      
      // Native Browser Push Notification
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(newNotif.title, {
            body: newNotif.message,
            icon: '/vite.svg', // Assuming standard vite icon is available
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(newNotif.title, { body: newNotif.message });
            }
          });
        }
      }

      const { error } = await supabase.from('notifications').insert({
        id: newNotif.id,
        user_id: newNotif.userId,
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type,
        is_read: newNotif.isRead
      });
      if (error) console.error('Error adding notification:', error);
    },
    markNotificationRead: async (id) => {
      set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
      }));
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },

    // Invoices
    addInvoice: async (invoice) => {
      set((state) => ({ invoices: [...state.invoices, invoice] }));
      const { error } = await supabase.from('invoices').insert({
        id: invoice.id,
        patient_id: invoice.patientId,
        doctor_id: invoice.doctorId,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.date,
        items: invoice.items
      });
      if (error) console.error('Error adding invoice:', error);
    },
    updateInvoice: async (id, data) => {
      set((state) => ({
        invoices: state.invoices.map(i => i.id === id ? { ...i, ...data } : i)
      }));
      const updateData: any = { ...data };
      if (data.patientId) updateData.patient_id = data.patientId;
      if (data.doctorId) updateData.doctor_id = data.doctorId;
      delete updateData.patientId;
      delete updateData.doctorId;

      const { error } = await supabase.from('invoices').update(updateData).eq('id', id);
      if (error) console.error('Error updating invoice:', error);
    },

    // Medical Records
    addMedicalRecord: async (record) => {
      const newRecord = {
        ...record,
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString()
      };
      set((state) => ({ medicalRecords: [newRecord, ...state.medicalRecords] }));
      const { error } = await supabase.from('medical_records').insert({
        id: newRecord.id,
        patient_id: newRecord.patientId,
        title: newRecord.title,
        sub: newRecord.sub,
        file_url: newRecord.fileUrl
      });
      if (error) console.error('Error adding record:', error);
    }
  })
);
