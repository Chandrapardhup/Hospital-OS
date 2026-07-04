import { useHospitalStore } from '../store/useHospitalStore';
import { useEnterpriseStore } from '../store/useEnterpriseStore';
import type { DailyBriefing } from '../types/hospital';

export const briefingService = {
  generateDailyBriefing: async () => {
    const { patients, appointments, medicalRecords, invoices } = useHospitalStore.getState();
    const { recommendations, addBriefing } = useEnterpriseStore.getState();

    // 1. Calculate Admissions & Discharges
    const admissions = patients.filter(p => p.status === 'Admitted').length;
    const discharges = patients.filter(p => p.status === 'Discharged').length;

    // 2. Critical Patients
    const criticalPatients = patients.filter(p => p.status === 'Emergency' || p.status === 'ICU').length;

    // 3. Revenue
    const revenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

    // 4. Pending Lab Reports
    const pendingLabReports = appointments.length - medicalRecords.length; // rough estimate

    // 5. Active Recommendations (summarize top 3)
    const activeRecs = recommendations
      .filter(r => r.status === 'Pending')
      .slice(0, 3)
      .map(r => r.title);

    // 6. Hospital Health Score (0-100)
    let healthScore = 100;
    if (criticalPatients > 10) healthScore -= 10;
    if (pendingLabReports > 20) healthScore -= 5;
    if (activeRecs.length > 0) healthScore -= (activeRecs.length * 2);

    const briefing: DailyBriefing = {
      id: `brf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      hospitalHealthScore: Math.max(0, healthScore),
      admissions,
      discharges,
      appointments: appointments.length,
      criticalPatients,
      revenue,
      pendingLabReports: Math.max(0, pendingLabReports),
      recommendations: activeRecs.length > 0 ? activeRecs : ['No active alerts.'],
      createdAt: new Date().toISOString()
    };

    await addBriefing(briefing);
  }
};
