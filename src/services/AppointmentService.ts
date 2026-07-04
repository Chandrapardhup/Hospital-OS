import { useHospitalStore } from '../store/useHospitalStore';
import type { Appointment } from '../types/hospital';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class AppointmentService {
  static async getAppointments(): Promise<Appointment[]> {
    await delay(300);
    return useHospitalStore.getState().appointments;
  }

  static async bookAppointment(data: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> {
    await delay(800);
    const newAppointment: Appointment = {
      ...data,
      id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      status: 'Scheduled'
    };
    useHospitalStore.getState().addAppointment(newAppointment);

    // Notify the doctor
    const doctor = useHospitalStore.getState().doctors.find(d => d.id === data.doctorId);
    const patient = useHospitalStore.getState().patients.find(p => p.id === data.patientId);
    
    useHospitalStore.getState().addNotification({
      userId: `usr_doc${data.doctorId.replace('doc_', '')}`, // Mock matching user logic
      title: 'New Appointment Booked',
      message: `You have a new appointment with ${patient?.name || 'a patient'} on ${data.date} at ${data.time}.`,
      type: 'info'
    });

    return newAppointment;
  }

  static async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<void> {
    await delay(400);
    useHospitalStore.getState().updateAppointment(id, { status });
  }

  static async deleteAppointment(id: string): Promise<void> {
    await delay(500);
    useHospitalStore.getState().deleteAppointment(id);
  }
}
