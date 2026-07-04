import { useHospitalStore } from '../store/useHospitalStore';
import type { Patient } from '../types/hospital';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class PatientService {
  static async getPatients(): Promise<Patient[]> {
    await delay(300);
    return useHospitalStore.getState().patients;
  }

  static async getPatientById(id: string): Promise<Patient | undefined> {
    await delay(300);
    return useHospitalStore.getState().patients.find(p => p.id === id);
  }

  static async createPatient(data: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
    await delay(800);
    const newPatient: Patient = {
      ...data,
      id: `pat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    useHospitalStore.getState().addPatient(newPatient);
    
    // Simulate real-time notification to admin/reception
    useHospitalStore.getState().addNotification({
      userId: 'usr_admin1',
      title: 'New Patient Registered',
      message: `${newPatient.name} has been successfully registered.`,
      type: 'info'
    });

    return newPatient;
  }

  static async updatePatient(id: string, data: Partial<Patient>): Promise<void> {
    await delay(500);
    useHospitalStore.getState().updatePatient(id, data);
  }

  static async deletePatient(id: string): Promise<void> {
    await delay(500);
    useHospitalStore.getState().deletePatient(id);
  }
}
