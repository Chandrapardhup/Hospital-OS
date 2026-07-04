import { patients, doctors, appointments, dashboardStats } from "../mockDB/data";

// Simulates network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getDashboardStats = async () => {
  await delay(400);
  return dashboardStats;
};

export const getPatients = async () => {
  await delay(500);
  return patients;
};

export const getDoctors = async () => {
  await delay(500);
  return doctors;
};

export const getAppointments = async () => {
  await delay(500);
  return appointments;
};
