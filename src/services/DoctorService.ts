import { useHospitalStore } from '../store/useHospitalStore';
import type { Doctor } from '../types/hospital';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class DoctorService {
  static async getDoctors(): Promise<Doctor[]> {
    await delay(300);
    return useHospitalStore.getState().doctors;
  }

  static async getDoctorById(id: string): Promise<Doctor | undefined> {
    await delay(300);
    return useHospitalStore.getState().doctors.find(d => d.id === id);
  }

  static async createDoctor(data: Omit<Doctor, 'id'>): Promise<Doctor> {
    await delay(800);
    const newDoctor: Doctor = {
      ...data,
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    useHospitalStore.getState().addDoctor(newDoctor);
    return newDoctor;
  }

  static async updateDoctor(id: string, data: Partial<Doctor>): Promise<void> {
    await delay(500);
    useHospitalStore.getState().updateDoctor(id, data);
  }

  static async deleteDoctor(id: string): Promise<void> {
    await delay(500);
    useHospitalStore.getState().deleteDoctor(id);
  }
}
