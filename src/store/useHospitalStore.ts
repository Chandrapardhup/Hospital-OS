import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { workflowService } from '../services/workflowService';
import { emailService } from '../services/emailService';
import type { HospitalState, Patient, Doctor, Appointment, Notification, Invoice, MedicalRecord } from '../types/hospital';

// Extended state to include async actions and loading
interface ExtendedHospitalState extends HospitalState {
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
    isLoading: true,

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

        const mapDoctor = (d: any) => ({
          ...d,
          experienceYears: d.experience_years,
          consultationFee: d.consultation_fee,
          availableDays: d.available_days
        });

        const mapAppointment = (a: any) => ({
          ...a,
          patientId: a.patient_id,
          doctorId: a.doctor_id
        });

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
      if (data.availableDays !== undefined) updateData.available_days = data.availableDays;
      
      delete updateData.experienceYears;
      delete updateData.consultationFee;
      delete updateData.availableDays;

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
        notes: appointment.notes
      });
      if (error) {
        console.error('Error adding appointment:', error);
      } else {
        // AI ENTERPRISE TRIGGER: Trigger workflow and email
        workflowService.triggerWorkflow(
          'Appointment Booking Protocol',
          'Patient Booked Appointment',
          [
            { name: 'Update Doctor Schedule', status: 'Pending', agent: 'Appointment Service' },
            { name: 'Notify Receptionist', status: 'Pending', agent: 'Reception Agent' },
            { name: 'Update Patient Dashboard', status: 'Pending', agent: 'Patient Agent' },
            { name: 'Queue Email Confirmation', status: 'Pending', agent: 'Notification Agent' },
          ]
        );

        emailService.queueEmail(
          'patient@example.com',
          'Appointment Confirmed',
          'Appointment Confirmation',
          `Your appointment is confirmed for ${appointment.date} at ${appointment.time}.`
        );
      }
    },
    updateAppointment: async (id, data) => {
      set((state) => ({
        appointments: state.appointments.map(a => a.id === id ? { ...a, ...data } : a)
      }));
      
      const updateData: any = { ...data };
      if (data.patientId) updateData.patient_id = data.patientId;
      if (data.doctorId) updateData.doctor_id = data.doctorId;
      delete updateData.patientId;
      delete updateData.doctorId;

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
