import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HospitalState, Patient, Doctor, Appointment, Notification } from '../types/hospital';
import { mockPatients, mockDoctors, mockAppointments, mockNotifications } from '../mockDB/hospitalData';

export const useHospitalStore = create<HospitalState>()(
  persist(
    (set) => ({
      patients: mockPatients,
      doctors: mockDoctors,
      appointments: mockAppointments,
      notifications: mockNotifications,
      medicalRecords: [],

      // Patients
      setPatients: (patients) => set({ patients }),
      addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),
      updatePatient: (id, data) => set((state) => ({
        patients: state.patients.map(p => p.id === id ? { ...p, ...data } : p)
      })),
      deletePatient: (id) => set((state) => ({
        patients: state.patients.filter(p => p.id !== id)
      })),

      // Doctors
      setDoctors: (doctors) => set({ doctors }),
      addDoctor: (doctor) => set((state) => ({ doctors: [...state.doctors, doctor] })),
      updateDoctor: (id, data) => set((state) => ({
        doctors: state.doctors.map(d => d.id === id ? { ...d, ...data } : d)
      })),
      deleteDoctor: (id) => set((state) => ({
        doctors: state.doctors.filter(d => d.id !== id)
      })),

      // Appointments
      setAppointments: (appointments) => set({ appointments }),
      addAppointment: (appointment) => set((state) => ({ appointments: [...state.appointments, appointment] })),
      updateAppointment: (id, data) => set((state) => ({
        appointments: state.appointments.map(a => a.id === id ? { ...a, ...data } : a)
      })),
      deleteAppointment: (id) => set((state) => ({
        appointments: state.appointments.filter(a => a.id !== id)
      })),

      // Notifications
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            isRead: false,
            createdAt: new Date().toISOString()
          },
          ...state.notifications
        ]
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
      })),

      // Invoices
      invoices: [],
      addInvoice: (invoice) => set((state) => ({ invoices: [...state.invoices, invoice] })),
      updateInvoice: (id, data) => set((state) => ({
        invoices: state.invoices.map(i => i.id === id ? { ...i, ...data } : i)
      })),

      // Medical Records
      addMedicalRecord: (record) => set((state) => ({
        medicalRecords: [
          {
            ...record,
            id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            createdAt: new Date().toISOString()
          },
          ...state.medicalRecords
        ]
      }))
    }),
    {
      name: 'hospitalos-data-v2',
    }
  )
);
