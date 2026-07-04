export type Gender = 'Male' | 'Female' | 'Other';
export type AppointmentStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
export type PatientStatus = 'Admitted' | 'Discharged' | 'Outpatient' | 'Emergency';

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: Gender;
  bloodGroup: string;
  address: string;
  status: PatientStatus;
  lastVisit?: string;
  assignedDoctorId?: string;
  allergies?: string[];
  insuranceProvider?: string;
  insuranceId?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  experienceYears: number;
  consultationFee: number;
  availableDays: string[];
  status: 'Available' | 'On Leave' | 'In Surgery';
  avatar?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: 'Consultation' | 'Follow-up' | 'Checkup' | 'Emergency';
  status: AppointmentStatus;
  symptoms?: string;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string; // The user this is targeted to
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  title: string;
  sub: string;
  fileUrl?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  doctorId?: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  date: string;
  items: { description: string; cost: number }[];
}

// Store state interface
export interface HospitalState {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  notifications: Notification[];
  invoices: Invoice[];
  medicalRecords: MedicalRecord[];
  
  // Actions
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  
  setDoctors: (doctors: Doctor[]) => void;
  addDoctor: (doctor: Doctor) => void;
  updateDoctor: (id: string, data: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
  
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;

  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt'>) => void;
}
