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
    const today = new Date().toISOString().split('T')[0];
    let tokenNumber = undefined;
    if (data.date === today) {
      const prefix = String.fromCharCode(65 + Math.floor(Math.random() * 5)); // A to E
      const num = Math.floor(Math.random() * 99) + 1;
      tokenNumber = `${prefix}-${num.toString().padStart(2, '0')}`;
    }

    const shortId = `APT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newAppointment: Appointment = {
      ...data,
      id: shortId,
      status: 'Scheduled',
      tokenNumber
    };
    useHospitalStore.getState().addAppointment(newAppointment);

    // Notify the doctor
    const doctor = useHospitalStore.getState().doctors.find(d => d.id === data.doctorId);
    const patient = useHospitalStore.getState().patients.find(p => p.id === data.patientId);
    
    // Get the real auth user IDs for notifications
    let doctorUserId = data.doctorId;
    let patientUserId = data.patientId;
    
    // Dynamically import auth store to find the actual User UUIDs matching the emails
    import('../store/useAuthStore').then(({ useAuthStore }) => {
      const allUsers = useAuthStore.getState().users;
      const doctorAuthUser = allUsers.find(u => u.email === doctor?.email);
      const patientAuthUser = allUsers.find(u => u.email === patient?.email);
      
      if (doctorAuthUser) doctorUserId = doctorAuthUser.id;
      if (patientAuthUser) patientUserId = patientAuthUser.id;

      // Doctor notification & email
      if (doctor) {
        useHospitalStore.getState().addNotification({
          userId: doctorUserId,
          title: 'New Appointment Booked',
          message: `You have a new appointment with ${patient?.name || 'a patient'} on ${data.date} at ${data.time}.`,
          type: 'info'
        });
        import('./emailService').then(({ emailService }) => {
          emailService.queueEmail({
            to: doctor.email || 'doctor@hospital.com',
            subject: 'New Appointment Booked',
            body: `You have a new appointment with ${patient?.name || 'a patient'} on ${data.date} at ${data.time}.`
          });
        });
      }

      // Patient notification & email
      if (patient) {
        useHospitalStore.getState().addNotification({
          userId: patientUserId,
          title: 'Appointment Confirmed',
          message: `Your appointment with Dr. ${doctor?.name || 'Doctor'} on ${data.date} at ${data.time} has been confirmed.`,
          type: 'success'
        });
        import('./emailService').then(({ emailService }) => {
          emailService.queueEmail({
            to: patient.email,
            subject: 'Appointment Confirmed',
            body: `Your appointment with Dr. ${doctor?.name || 'Doctor'} on ${data.date} at ${data.time} has been confirmed.`
          });
        });
      }
    });

    return newAppointment;
  }

  static async updateAppointment(id: string, data: Partial<Appointment>): Promise<void> {
    await delay(400);
    useHospitalStore.getState().updateAppointment(id, data);
    
    // Check if we need to notify the patient about an update
    if (data.status || data.remarks || data.prescription) {
      const allAppointments = useHospitalStore.getState().appointments;
      const updatedAppt = allAppointments.find(a => a.id === id);
      
      if (updatedAppt) {
        // Automatically discharge patient if Admitting appointment is completed
        if (data.status === 'Completed' && (updatedAppt.type === 'Admitting' || updatedAppt.type === 'Emergency')) {
          useHospitalStore.getState().updatePatient(updatedAppt.patientId, { status: 'Discharged' });
        }

        const patient = useHospitalStore.getState().patients.find(p => p.id === updatedAppt.patientId);
        const doctor = useHospitalStore.getState().doctors.find(d => d.id === updatedAppt.doctorId);
        
        if (patient) {
          import('../store/useAuthStore').then(({ useAuthStore }) => {
            const allUsers = useAuthStore.getState().users;
            const patientAuthUser = allUsers.find(u => u.email === patient.email);
            
            // Notify via in-app
            useHospitalStore.getState().addNotification({
              userId: patientAuthUser ? patientAuthUser.id : patient.id,
              title: 'Appointment Updated',
              message: `Dr. ${doctor?.name || 'Doctor'} has updated your appointment status to ${data.status || updatedAppt.status}.`,
              type: 'info'
            });
            
            // Send Email
            import('./emailService').then(({ emailService }) => {
              emailService.queueEmail({
                to: patient.email,
                subject: 'Your Appointment has been Updated',
                body: `Hello ${patient.name},\n\nDr. ${doctor?.name || 'Doctor'} has updated your appointment.\nStatus: ${data.status || updatedAppt.status}\n\n${data.prescription ? 'A new prescription has been added.\n' : ''}\nPlease check your patient dashboard for full details.`
              });
            });
          });
        }
      }
    }
  }

  static async deleteAppointment(id: string): Promise<void> {
    await delay(500);
    useHospitalStore.getState().deleteAppointment(id);
  }
}
