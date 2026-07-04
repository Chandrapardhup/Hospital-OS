export type PatientStatus = "CRITICAL" | "OBSERVATION" | "STABLE" | "PRE-OP" | "RECOVERING" | "DISCHARGED";
export type DoctorStatus = "CONSULTING" | "AVAILABLE" | "IN OT-2" | "IN OT-1" | "ON LEAVE";

export interface Patient {
  mrn: string;
  name: string;
  age: number;
  sex: "M" | "F";
  ward: string;
  assignedDoctor: string;
  status: PatientStatus;
  vitals: { hr: number; bp: string; o2: number };
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  status: DoctorStatus;
  patientsCount: number;
  shift: string;
  avatarColor: string;
}

export interface Appointment {
  id: string;
  time: string;
  patient: string;
  doctor: string;
  department: string;
  room: string;
  status: "IN ROOM" | "WAITING" | "PRE-OP" | "CONFIRMED" | "NO-SHOW";
}

export const patients: Patient[] = [
  { mrn: "PT-40218", name: "Elena Vance", age: 58, sex: "F", ward: "ICU-3", assignedDoctor: "Dr. Thorne", status: "CRITICAL", vitals: { hr: 110, bp: "90/60", o2: 88 } },
  { mrn: "PT-40217", name: "Marcus Thorne", age: 44, sex: "M", ward: "ER-2", assignedDoctor: "Dr. Vale", status: "OBSERVATION", vitals: { hr: 85, bp: "120/80", o2: 96 } },
  { mrn: "PT-40216", name: "Priya Rao", age: 31, sex: "F", ward: "ER-5", assignedDoctor: "Dr. Adeyemi", status: "STABLE", vitals: { hr: 72, bp: "118/75", o2: 98 } },
  { mrn: "PT-40215", name: "Ryan Diaz", age: 27, sex: "M", ward: "Ward 2", assignedDoctor: "Dr. Chen", status: "PRE-OP", vitals: { hr: 68, bp: "125/82", o2: 99 } },
  { mrn: "PT-40214", name: "Ava Chen", age: 36, sex: "F", ward: "Ward 4", assignedDoctor: "Dr. Nakamura", status: "STABLE", vitals: { hr: 75, bp: "115/70", o2: 97 } },
  { mrn: "PT-40213", name: "Jacob Paul", age: 62, sex: "M", ward: "Ortho-1", assignedDoctor: "Dr. Fields", status: "RECOVERING", vitals: { hr: 82, bp: "130/85", o2: 95 } },
  { mrn: "PT-40212", name: "Sarah Lin", age: 41, sex: "F", ward: "ICU-1", assignedDoctor: "Dr. Thorne", status: "CRITICAL", vitals: { hr: 105, bp: "85/55", o2: 89 } },
];

export const doctors: Doctor[] = [
  { id: "D-01", name: "Dr. Elias Thorne", specialty: "CARDIOLOGY", status: "CONSULTING", patientsCount: 14, shift: "07:00-19:00", avatarColor: "bg-purple-500" },
  { id: "D-02", name: "Dr. Ada Adeyemi", specialty: "CARDIOLOGY", status: "CONSULTING", patientsCount: 12, shift: "07:00-19:00", avatarColor: "bg-purple-400" },
  { id: "D-03", name: "Dr. Kenji Nakamura", specialty: "INTERNAL MEDICINE", status: "AVAILABLE", patientsCount: 8, shift: "09:00-21:00", avatarColor: "bg-indigo-500" },
  { id: "D-04", name: "Dr. Isabela Vale", specialty: "EMERGENCY", status: "CONSULTING", patientsCount: 6, shift: "Nights", avatarColor: "bg-indigo-400" },
  { id: "D-05", name: "Dr. Michelle Chen", specialty: "SURGERY", status: "IN OT-2", patientsCount: 3, shift: "07:00-19:00", avatarColor: "bg-violet-500" },
  { id: "D-06", name: "Dr. Marcus Fields", specialty: "ORTHOPEDICS", status: "AVAILABLE", patientsCount: 5, shift: "11:00-23:00", avatarColor: "bg-violet-400" },
];

export const appointments: Appointment[] = [
  { id: "A-1", time: "09:00", patient: "Elias Vance", doctor: "Dr. Thorne", department: "Cardiology", room: "3B", status: "IN ROOM" },
  { id: "A-2", time: "09:30", patient: "Marcus Kane", doctor: "Dr. Thorne", department: "Cardiology", room: "3B", status: "WAITING" },
  { id: "A-3", time: "10:15", patient: "Sarah Lin", doctor: "Dr. Chen", department: "Surgery", room: "OT-2", status: "PRE-OP" },
  { id: "A-4", time: "11:00", patient: "Ava Chen", doctor: "Dr. Nakamura", department: "Internal Med.", room: "2A", status: "CONFIRMED" },
  { id: "A-5", time: "13:30", patient: "Ryan Diaz", doctor: "Dr. Chen", department: "Surgery", room: "OT-2", status: "CONFIRMED" },
  { id: "A-6", time: "14:00", patient: "Aiko Tanaka", doctor: "Dr. Vale", department: "Emergency", room: "ER-1", status: "CONFIRMED" },
];

export const dashboardStats = {
  hospitalHealth: 98,
  operationalScore: 92,
  performanceScore: 87,
  satisfactionScore: 94,
  activeAlerts: [
    { type: "CRITICAL", title: "ICU occupancy has reached 92%", desc: "Predicted overflow in 2h. Reroute non-trauma admits to Ward 6.", action: "Reroute now" },
    { type: "WARNING", title: "Cardiology is overloaded", desc: "Dr. Thorne + Dr. Adeyemi at 140% capacity. Shift 3 patients to Dr. Vale.", action: "Balance load" },
    { type: "CRITICAL", title: "3 patients require immediate review", desc: "Elena Vance, Marcus Thorne, Priya Rao — vitals trending unstable.", action: "Open triage" },
  ]
};
