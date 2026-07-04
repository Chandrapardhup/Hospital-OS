import { useHospitalStore } from '../store/useHospitalStore';
import { useEnterpriseStore } from '../store/useEnterpriseStore';
import type { Recommendation, RecommendationPriority } from '../types/hospital';

export const brainService = {
  runDiagnostics: async () => {
    const { patients, appointments, doctors, medicalRecords } = useHospitalStore.getState();
    const { recommendations, addRecommendation } = useEnterpriseStore.getState();

    const newRecs: Omit<Recommendation, 'id' | 'createdAt' | 'status'>[] = [];

    // 1. Check ICU / Emergency Overload
    const emergencyPatients = patients.filter(p => p.status === 'Emergency');
    if (emergencyPatients.length > 5) {
      newRecs.push({
        title: 'High Emergency Volume',
        priority: 'Critical',
        confidenceScore: 95,
        reason: `${emergencyPatients.length} patients currently in Emergency status.`,
        department: 'Emergency',
        suggestedAction: 'Increase nurse allocation and reserve ICU beds.'
      });
    }

    // 2. Doctor Workload
    const docCounts: Record<string, number> = {};
    appointments.forEach(a => {
      if (a.status === 'Scheduled' || a.status === 'In Progress') {
        docCounts[a.doctorId] = (docCounts[a.doctorId] || 0) + 1;
      }
    });

    Object.entries(docCounts).forEach(([docId, count]) => {
      if (count > 10) {
        const doc = doctors.find(d => d.id === docId);
        if (doc) {
          newRecs.push({
            title: 'Doctor Overloaded',
            priority: 'High',
            confidenceScore: 88,
            reason: `Dr. ${doc.name} has ${count} pending appointments today.`,
            department: doc.department,
            suggestedAction: 'Reassign non-critical appointments to available doctors.'
          });
        }
      }
    });

    // 3. Lab Backlog
    // We simulate this by checking if there are many patients but few medical records
    if (patients.length > 0 && (medicalRecords.length / patients.length) < 0.5) {
      newRecs.push({
        title: 'Lab Backlog Detected',
        priority: 'Medium',
        confidenceScore: 72,
        reason: 'High ratio of patients without recent medical records or lab reports.',
        department: 'Laboratory',
        suggestedAction: 'Expedite pending lab results for recent admissions.'
      });
    }

    // Insert new ones if they don't already exist (to avoid spamming)
    for (const rec of newRecs) {
      const exists = recommendations.find(r => r.title === rec.title && r.status === 'Pending');
      if (!exists) {
        await addRecommendation({
          ...rec,
          id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          status: 'Pending',
          createdAt: new Date().toISOString()
        });
      }
    }
  }
};
