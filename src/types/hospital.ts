export type Gender = 'Male' | 'Female' | 'Other';
export type AppointmentStatus = 'Scheduled' | 'Waiting' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
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
  emergencyInstructions?: { time: string; text: string; by: string }[];
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
  availableTimes?: string[];
  status: 'Available' | 'On Leave' | 'In Surgery';
  avatar?: string;
  patientsPerDay: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: 'Consultation' | 'Follow-up' | 'Checkup' | 'Emergency' | 'Admitting';
  status: AppointmentStatus;
  tokenNumber?: string;
  symptoms?: string;
  notes?: string;
  remarks?: string;
  prescription?: string;
  labRequest?: string;
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

export interface AiConsultation {
  id: string;
  patientId: string;
  invoiceId?: string;
  date: string;
  language: string;
  transcript: { speaker: 'User' | 'AI'; text: string; time: string }[];
  duration: number; // in seconds
}

// ==========================================
// ENTERPRISE AI FEATURES
// ==========================================

export type RecommendationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Ignored' | 'Completed';
export type RecommendationPriority = 'High' | 'Medium' | 'Low' | 'Critical';

export interface Recommendation {
  id: string;
  title: string;
  priority: RecommendationPriority;
  confidenceScore: number;
  reason: string;
  department: string;
  suggestedAction: string;
  status: RecommendationStatus;
  createdAt: string;
}

export type WorkflowStatus = 'Pending' | 'Running' | 'Completed' | 'Failed';

export interface WorkflowStep {
  id: string;
  name: string;
  status: WorkflowStatus;
  agent: string;
  executionTimeMs?: number;
  error?: string;
}

export interface Workflow {
  id: string;
  name: string;
  triggerEvent: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  executionTimeMs?: number;
  createdAt: string;
}

export type EmailStatus = 'Queued' | 'Sending' | 'Delivered' | 'Failed' | 'Retry';

export interface Email {
  id: string;
  recipient: string;
  subject: string;
  template: string;
  content: string;
  status: EmailStatus;
  createdAt: string;
}

export interface DailyBriefing {
  id: string;
  date: string;
  hospitalHealthScore: number;
  admissions: number;
  discharges: number;
  appointments: number;
  criticalPatients: number;
  revenue: number;
  pendingLabReports: number;
  recommendations: string[];
  createdAt: string;
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
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  
  setDoctors: (doctors: Doctor[]) => void;
  addDoctor: (doctor: Doctor) => Promise<void>;
  updateDoctor: (id: string, data: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => Promise<void>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;

  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt'>) => Promise<void>;
}
